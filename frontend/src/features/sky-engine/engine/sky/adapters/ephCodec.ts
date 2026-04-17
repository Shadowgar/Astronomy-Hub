import type { RuntimeStar, RuntimeStarCatalog } from '../contracts/stars'
import { resolveSkyRuntimeTierForMagnitude } from '../core/magnitudePolicy'

const EPH_MAGIC = 'EPHE'
const EPH_FILE_VERSION = 2
const EPH_UNIT_RAD = 1 << 16
const EPH_UNIT_DEG = EPH_UNIT_RAD | 1
const EPH_UNIT_ARCMIN = EPH_UNIT_DEG | 2
const EPH_UNIT_ARCSEC = EPH_UNIT_ARCMIN | 4
const EPH_UNIT_ARCSEC_LEGACY = (5 << 16) | 1 | 2 | 4

type SupportedColumnType = 'f' | 'i' | 'Q' | 's'

type ColumnDefinition = {
  name: string
  type: SupportedColumnType
  unit?: number
  size?: number
}

type DecodedColumn = ColumnDefinition & {
  got: boolean
  srcUnit: number
  start: number
  size: number
  rowSize: number
}

export type DecodedEphTile = {
  order: number
  pix: number
  stars: RuntimeStar[]
}

export type SurveyProperties = {
  minOrder: number
  minVmag: number
  maxVmag: number
  releaseDate?: string
  tileFormat: string
}

function createColumn(name: string, type: SupportedColumnType, options?: { unit?: number; size?: number }): DecodedColumn {
  return {
    name,
    type,
    unit: options?.unit,
    size: options?.size ?? 0,
    got: false,
    srcUnit: 0,
    start: 0,
    rowSize: 0,
  }
}

function decodeAscii(view: DataView, offset: number, size: number) {
  let value = ''

  for (let index = 0; index < size; index += 1) {
    const code = view.getUint8(offset + index)

    if (code === 0) {
      break
    }

    value += String.fromCodePoint(code)
  }

  return value
}

function readUint64(view: DataView, offset: number) {
  if (typeof view.getBigUint64 === 'function') {
    return view.getBigUint64(offset, true)
  }

  const low = BigInt(view.getUint32(offset, true))
  const high = BigInt(view.getUint32(offset + 4, true))
  return low | (high << BigInt(32))
}

function normalizeUnit(unit: number) {
  return unit === EPH_UNIT_ARCSEC_LEGACY ? EPH_UNIT_ARCSEC : unit
}

function convertUnit(sourceUnit: number, targetUnit: number | undefined, value: number) {
  if (!targetUnit || !sourceUnit || sourceUnit === targetUnit || Number.isNaN(value)) {
    return value
  }

  let converted = value

  if ((sourceUnit & 1) && !(targetUnit & 1)) {
    converted *= Math.PI / 180
  }

  if (!(sourceUnit & 1) && (targetUnit & 1)) {
    converted *= 180 / Math.PI
  }

  if ((sourceUnit & 2) && !(targetUnit & 2)) {
    converted /= 60
  }

  if (!(sourceUnit & 2) && (targetUnit & 2)) {
    converted *= 60
  }

  if ((sourceUnit & 4) && !(targetUnit & 4)) {
    converted /= 60
  }

  if (!(sourceUnit & 4) && (targetUnit & 4)) {
    converted *= 60
  }

  // Stellarium EPH unit bit 8 encodes per-year quantities (e.g. arcsec/year).
  // Convert between "per year" and absolute units using the same 365.25 factor.
  if ((sourceUnit & 8) && !(targetUnit & 8)) {
    converted *= 365.25
  }

  if (!(sourceUnit & 8) && (targetUnit & 8)) {
    converted /= 365.25
  }

  return converted
}

function unshuffleBytes(data: Uint8Array, rowSize: number, rowCount: number) {
  const restored = new Uint8Array(data.length)

  for (let byteIndex = 0; byteIndex < rowSize; byteIndex += 1) {
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      restored[rowIndex * rowSize + byteIndex] = data[byteIndex * rowCount + rowIndex]
    }
  }

  return restored
}

async function inflateBlock(data: Uint8Array) {
  if (typeof DecompressionStream !== 'function') {
    throw new TypeError('DecompressionStream is not available in this runtime')
  }

  const stream = new DecompressionStream('deflate')
  const writer = stream.writable.getWriter()
  const payload = new Uint8Array(data.byteLength)
  payload.set(data)
  await writer.write(payload)
  await writer.close()
  const buffer = await new Response(stream.readable).arrayBuffer()
  return new Uint8Array(buffer)
}

function selectProperName(ids: string[]) {
  const nameId = ids.find((value) => value.startsWith('NAME '))
  return nameId ? nameId.slice(5).trim() : undefined
}

function buildStarIdentifier(catalog: RuntimeStarCatalog, gaiaId: bigint, hipId: number, ids: string[]) {
  if (catalog === 'gaia' && gaiaId > BigInt(0)) {
    return {
      id: `gaia-${gaiaId.toString()}`,
      sourceId: `GAIA ${gaiaId.toString()}`,
    }
  }

  if (hipId > 0) {
    return {
      id: `hip-${hipId}`,
      sourceId: `HIP ${hipId}`,
    }
  }

  const firstId = ids[0]?.trim() || `${catalog}-unknown`
  return {
    id: `${catalog}-${firstId.replace(/\s+/g, '-').toLowerCase()}`,
    sourceId: firstId,
  }
}

function validateEphHeader(view: DataView) {
  if (decodeAscii(view, 0, 4) !== EPH_MAGIC) {
    throw new Error('Invalid EPH magic header')
  }

  const version = view.getUint32(4, true)

  if (version !== EPH_FILE_VERSION) {
    throw new Error(`Unsupported EPH file version: ${version}`)
  }
}

function createStarColumns() {
  return [
    createColumn('type', 's', { size: 4 }),
    createColumn('gaia', 'Q'),
    createColumn('hip', 'i'),
    createColumn('vmag', 'f'),
    createColumn('gmag', 'f'),
    createColumn('ra', 'f', { unit: EPH_UNIT_DEG }),
    createColumn('de', 'f', { unit: EPH_UNIT_DEG }),
    createColumn('plx', 'f', { unit: EPH_UNIT_ARCSEC }),
    createColumn('pra', 'f', { unit: EPH_UNIT_ARCSEC | 8 }),
    createColumn('pde', 'f', { unit: EPH_UNIT_ARCSEC | 8 }),
    createColumn('epoc', 'f'),
    createColumn('ids', 's', { size: 256 }),
    createColumn('sp', 's', { size: 32 }),
    createColumn('bv', 'f'),
  ]
}

async function readChunkTable(chunkView: DataView, buffer: ArrayBuffer, chunkStart: number) {
  const columns = createStarColumns()
  const header = readTableHeader(chunkView, 12, columns)
  const uncompressedSize = chunkView.getUint32(header.nextOffset, true)
  const compressedSize = chunkView.getUint32(header.nextOffset + 4, true)
  const compressedData = new Uint8Array(buffer, chunkStart + header.nextOffset + 8, compressedSize)
  let tableData = await inflateBlock(compressedData)

  if (tableData.byteLength !== uncompressedSize) {
    throw new Error('EPH table decompression size mismatch')
  }

  if ((header.flags & 1) === 1) {
    tableData = unshuffleBytes(tableData, header.rowSize, header.rowCount)
  }

  return {
    columns,
    rowCount: header.rowCount,
    rowSize: header.rowSize,
    tableView: new DataView(tableData.buffer, tableData.byteOffset, tableData.byteLength),
  }
}

function decodeRuntimeStar(row: Map<string, string | number | bigint>, options: { catalog: RuntimeStarCatalog; minVmag: number }) {
  const gaiaId = (row.get('gaia') as bigint | undefined) ?? BigInt(0)
  const hipId = Number(row.get('hip') ?? 0)
  const vmagValue = Number(row.get('vmag'))
  const gmagValue = Number(row.get('gmag'))
  const raDeg = Number(row.get('ra'))
  const decDeg = Number(row.get('de'))
  const magnitude = Number.isFinite(vmagValue) ? vmagValue : gmagValue

  if (!Number.isFinite(raDeg) || !Number.isFinite(decDeg) || !Number.isFinite(magnitude)) {
    return null
  }

  if (options.catalog === 'gaia' && magnitude < options.minVmag) {
    return null
  }

  const ids = String(row.get('ids') ?? '')
    .split('|')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
  const identifier = buildStarIdentifier(options.catalog, gaiaId, hipId, ids)

  return {
    id: identifier.id,
    sourceId: identifier.sourceId,
    raDeg,
    decDeg,
    mag: magnitude,
    colorIndex: Number.isFinite(Number(row.get('bv'))) ? Number(row.get('bv')) : undefined,
    pmRaMasYr: Number.isFinite(Number(row.get('pra'))) ? Number(row.get('pra')) * 1000 : undefined,
    pmDecMasYr: Number.isFinite(Number(row.get('pde'))) ? Number(row.get('pde')) * 1000 : undefined,
    parallaxMas: Number.isFinite(Number(row.get('plx'))) ? Number(row.get('plx')) * 1000 : undefined,
    tier: resolveSkyRuntimeTierForMagnitude(magnitude),
    properName: selectProperName(ids),
    catalog: options.catalog,
  } satisfies RuntimeStar
}

async function decodeTileChunk(buffer: ArrayBuffer, chunkStart: number, chunkSize: number, options: { catalog: RuntimeStarCatalog; minVmag: number }) {
  const chunkView = new DataView(buffer, chunkStart, chunkSize)
  const tileVersion = chunkView.getUint32(0, true)
  const nuniq = Number(readUint64(chunkView, 4))
  const order = Math.floor(Math.log2(Math.floor(nuniq / 4)) / 2)
  const pix = nuniq - 4 * (1 << (2 * order))

  if (tileVersion < 3) {
    throw new Error(`Unsupported EPH tile version: ${tileVersion}`)
  }

  const table = await readChunkTable(chunkView, buffer, chunkStart)
  const stars: RuntimeStar[] = []

  for (let rowIndex = 0; rowIndex < table.rowCount; rowIndex += 1) {
    const row = readChunkColumns(table.tableView, rowIndex * table.rowSize, table.columns)
    const runtimeStar = decodeRuntimeStar(row, options)

    if (runtimeStar) {
      stars.push(runtimeStar)
    }
  }

  return { order, pix, stars }
}

function readTableHeader(view: DataView, offset: number, columns: DecodedColumn[]) {
  const flags = view.getUint32(offset, true)
  const rowSize = view.getUint32(offset + 4, true)
  const columnCount = view.getUint32(offset + 8, true)
  const rowCount = view.getUint32(offset + 12, true)

  for (let index = 0; index < columnCount; index += 1) {
    const entryOffset = offset + 16 + index * 20
    const name = decodeAscii(view, entryOffset, 4)
    const type = decodeAscii(view, entryOffset + 4, 4)[0] as SupportedColumnType | undefined
    const matchedColumn = columns.find((column) => column.name === name)

    if (!matchedColumn || !type || matchedColumn.type !== type) {
      continue
    }

    matchedColumn.got = true
    matchedColumn.srcUnit = normalizeUnit(view.getUint32(entryOffset + 8, true))
    matchedColumn.start = view.getUint32(entryOffset + 12, true)
    matchedColumn.size = view.getUint32(entryOffset + 16, true)
    matchedColumn.rowSize = rowSize
  }

  columns.forEach((column) => {
    column.rowSize = rowSize
  })

  return {
    nextOffset: offset + 16 + columnCount * 20,
    flags,
    rowCount,
    rowSize,
  }
}

function readChunkColumns(view: DataView, rowOffset: number, columns: readonly DecodedColumn[]) {
  const values = new Map<string, string | number | bigint>()

  columns.forEach((column) => {
    if (!column.got) {
      return
    }

    const start = rowOffset + column.start

    if (column.type === 'i') {
      values.set(column.name, view.getInt32(start, true))
      return
    }

    if (column.type === 'Q') {
      values.set(column.name, readUint64(view, start))
      return
    }

    if (column.type === 'f') {
      values.set(column.name, convertUnit(column.srcUnit, column.unit, view.getFloat32(start, true)))
      return
    }

    values.set(column.name, decodeAscii(view, start, column.size))
  })

  return values
}

export function parseSurveyProperties(text: string): SurveyProperties {
  const entries = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .reduce<Record<string, string>>((properties, line) => {
      const separatorIndex = line.indexOf('=')

      if (separatorIndex < 0) {
        return properties
      }

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      properties[key] = value
      return properties
    }, {})

  return {
    minOrder: Number.parseInt(entries.hips_order_min ?? '0', 10),
    minVmag: Number.parseFloat(entries.min_vmag ?? '-2'),
    maxVmag: Number.isFinite(Number.parseFloat(entries.max_vmag ?? '')) ? Number.parseFloat(entries.max_vmag) : Number.POSITIVE_INFINITY,
    releaseDate: entries.hips_release_date,
    tileFormat: entries.hips_tile_format ?? '',
  }
}

export function buildHipsTilePath(basePath: string, order: number, pix: number, extension: string) {
  const dir = Math.floor(pix / 10000) * 10000
  return `${basePath}/Norder${order}/Dir${dir}/Npix${pix}.${extension}`
}

export async function decodeEphTile(buffer: ArrayBuffer, options: {
  catalog: RuntimeStarCatalog
  minVmag: number
}): Promise<DecodedEphTile> {
  const view = new DataView(buffer)
  validateEphHeader(view)

  let offset = 8

  while (offset < view.byteLength) {
    const chunkType = decodeAscii(view, offset, 4)
    const chunkSize = view.getUint32(offset + 4, true)
    const chunkStart = offset + 8
    offset = chunkStart + chunkSize + 4

    if (chunkType !== 'STAR' && chunkType !== 'GAIA') {
      continue
    }

    return decodeTileChunk(buffer, chunkStart, chunkSize, options)
  }

  throw new Error('No STAR or GAIA chunk was found in the EPH tile')
}
