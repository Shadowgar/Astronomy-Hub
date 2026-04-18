import { describe, expect, it } from 'vitest'
import { deflateSync } from 'node:zlib'

import {
  buildHipsTilePath,
  convertEphFloat,
  decodeEphTile,
  decodeEphTileNuniq,
  EPH_UNIT_ARCSEC,
  EPH_UNIT_DEG,
  EPH_UNIT_RAD,
  encodeEphTileNuniq,
  parseSurveyProperties,
  shuffleEphTableBytes,
} from '../src/features/sky-engine/engine/sky/adapters/ephCodec'

function encodeAscii(text, size) {
  const bytes = new Uint8Array(size)

  for (let index = 0; index < Math.min(text.length, size); index += 1) {
    bytes[index] = text.codePointAt(index) ?? 0
  }

  return bytes
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true)
}

function writeInt32(view, offset, value) {
  view.setInt32(offset, value, true)
}

function writeFloat32(view, offset, value) {
  view.setFloat32(offset, value, true)
}

function writeUint64(view, offset, value) {
  view.setBigUint64(offset, BigInt(value), true)
}

function buildSampleEphTile() {
  const order = 3
  const pix = 42
  const nuniq = BigInt(pix + 4 * (1 << (2 * order)))
  const columns = [
    { name: 'type', type: 's', unit: 0, size: 4 },
    { name: 'gaia', type: 'Q', unit: 0, size: 8 },
    { name: 'hip', type: 'i', unit: 0, size: 4 },
    { name: 'vmag', type: 'f', unit: 0, size: 4 },
    { name: 'gmag', type: 'f', unit: 0, size: 4 },
    { name: 'ra', type: 'f', unit: 1 << 16, size: 4 },
    { name: 'de', type: 'f', unit: 1 << 16, size: 4 },
    { name: 'plx', type: 'f', unit: (1 << 16) | 1 | 2 | 4, size: 4 },
    { name: 'pra', type: 'f', unit: ((1 << 16) | 1 | 2 | 4) | 8, size: 4 },
    { name: 'pde', type: 'f', unit: ((1 << 16) | 1 | 2 | 4) | 8, size: 4 },
    { name: 'epoc', type: 'f', unit: 0, size: 4 },
    { name: 'ids', type: 's', unit: 0, size: 256 },
    { name: 'sp', type: 's', unit: 0, size: 32 },
    { name: 'bv', type: 'f', unit: 0, size: 4 },
  ]
  let startOffset = 0
  const resolvedColumns = columns.map((column) => {
    const resolved = { ...column, start: startOffset }
    startOffset += column.size
    return resolved
  })
  const rowSize = startOffset
  const rowCount = 1
  let tableData = new Uint8Array(rowSize * rowCount)
  const tableView = new DataView(tableData.buffer)
  const gaiaId = 219547565555375488n

  tableData.set(encodeAscii('STAR', 4), resolvedColumns[0].start)
  writeUint64(tableView, resolvedColumns[1].start, gaiaId)
  writeInt32(tableView, resolvedColumns[2].start, 0)
  writeFloat32(tableView, resolvedColumns[3].start, 9.7)
  writeFloat32(tableView, resolvedColumns[4].start, 9.7)
  writeFloat32(tableView, resolvedColumns[5].start, Math.PI)
  writeFloat32(tableView, resolvedColumns[6].start, (10 * Math.PI) / 180)
  writeFloat32(tableView, resolvedColumns[7].start, 0.01)
  writeFloat32(tableView, resolvedColumns[8].start, 0.005)
  writeFloat32(tableView, resolvedColumns[9].start, -0.004)
  writeFloat32(tableView, resolvedColumns[10].start, 2016.0)
  tableData.set(encodeAscii('NAME Sample Star|GAIA 219547565555375488', 256), resolvedColumns[11].start)
  tableData.set(encodeAscii('G2V', 32), resolvedColumns[12].start)
  writeFloat32(tableView, resolvedColumns[13].start, 0.42)

  tableData = shuffleEphTableBytes(tableData, rowCount, rowSize)
  const compressed = deflateSync(tableData)
  const tableHeaderSize = 16 + resolvedColumns.length * 20
  const chunkSize = 12 + tableHeaderSize + 8 + compressed.byteLength
  const chunkData = new Uint8Array(chunkSize)
  const chunkView = new DataView(chunkData.buffer)

  writeUint32(chunkView, 0, 3)
  writeUint64(chunkView, 4, nuniq)
  writeUint32(chunkView, 12, 1)
  writeUint32(chunkView, 16, rowSize)
  writeUint32(chunkView, 20, resolvedColumns.length)
  writeUint32(chunkView, 24, rowCount)

  resolvedColumns.forEach((column, index) => {
    const baseOffset = 28 + index * 20
    chunkData.set(encodeAscii(column.name, 4), baseOffset)
    chunkData.set(encodeAscii(column.type, 4), baseOffset + 4)
    writeUint32(chunkView, baseOffset + 8, column.unit)
    writeUint32(chunkView, baseOffset + 12, column.start)
    writeUint32(chunkView, baseOffset + 16, column.size)
  })

  const compressedOffset = 28 + resolvedColumns.length * 20
  writeUint32(chunkView, compressedOffset, tableData.byteLength)
  writeUint32(chunkView, compressedOffset + 4, compressed.byteLength)
  chunkData.set(compressed, compressedOffset + 8)

  const fileData = new Uint8Array(8 + 8 + chunkData.byteLength + 4)
  const fileView = new DataView(fileData.buffer)
  fileData.set(encodeAscii('EPHE', 4), 0)
  writeUint32(fileView, 4, 2)
  fileData.set(encodeAscii('GAIA', 4), 8)
  writeUint32(fileView, 12, chunkData.byteLength)
  fileData.set(chunkData, 16)
  writeUint32(fileView, 16 + chunkData.byteLength, 0)

  return fileData.buffer
}

describe('eph codec', () => {
  it('matches eph-file.c eph_convert_f for representative unit paths', () => {
    expect(convertEphFloat(EPH_UNIT_DEG, EPH_UNIT_RAD, 45)).toBeCloseTo((45 * Math.PI) / 180, 12)
    expect(convertEphFloat(EPH_UNIT_ARCSEC, EPH_UNIT_DEG, 3600)).toBeCloseTo(1, 12)
    expect(convertEphFloat(EPH_UNIT_ARCSEC | 8, EPH_UNIT_ARCSEC, 2)).toBeCloseTo(2 * 365.25, 12)
    expect(convertEphFloat((5 << 16) | 1 | 2 | 4, EPH_UNIT_DEG, 3600)).toBeCloseTo(1, 12)
  })

  it('inverts shuffleEphTableBytes to row-major (eph_shuffle_bytes ↔ decode unshuffle)', () => {
    const rowCount = 5
    const rowSize = 11
    const rowMajor = new Uint8Array(rowCount * rowSize)
    for (let i = 0; i < rowMajor.length; i += 1) {
      rowMajor[i] = (i * 31 + 7) % 256
    }
    const shuffled = shuffleEphTableBytes(rowMajor, rowCount, rowSize)
    const restored = new Uint8Array(rowMajor.length)
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      for (let byteIndex = 0; byteIndex < rowSize; byteIndex += 1) {
        restored[rowIndex * rowSize + byteIndex] = shuffled[byteIndex * rowCount + rowIndex]
      }
    }
    expect(restored).toEqual(rowMajor)
  })

  it('round-trips EPH tile nuniq order/pix like eph-file.c eph_read_tile_header', () => {
    const cases = [
      { order: 0, pix: 0 },
      { order: 0, pix: 11 },
      { order: 3, pix: 42 },
      { order: 6, pix: 12345 },
    ]

    for (const { order, pix } of cases) {
      const nuniq = encodeEphTileNuniq(order, pix)
      expect(decodeEphTileNuniq(nuniq)).toEqual({ order, pix })
      expect(decodeEphTileNuniq(Number(nuniq))).toEqual({ order, pix })
    }
  })

  it('parses Gaia survey properties with missing max_vmag as an open range', () => {
    const properties = parseSurveyProperties([
      'hips_order_min = 3',
      'hips_release_date = 2018-08-28T08:10Z',
      'hips_tile_format = eph',
    ].join('\n'))

    expect(properties.minOrder).toBe(3)
    expect(properties.minVmag).toBe(-2)
    expect(properties.maxVmag).toBe(Number.POSITIVE_INFINITY)
    expect(properties.tileFormat).toBe('eph')
  })

  it('builds the canonical HiPS tile path', () => {
    expect(buildHipsTilePath('/sky-engine-assets/catalog/gaia', 6, 12345, 'eph')).toBe(
      '/sky-engine-assets/catalog/gaia/Norder6/Dir10000/Npix12345.eph',
    )
  })

  it('decodes a Gaia EPH tile into runtime stars', async () => {
    const decodedTile = await decodeEphTile(buildSampleEphTile(), {
      catalog: 'gaia',
      minVmag: 8.5,
    })

    expect(decodedTile.order).toBe(3)
    expect(decodedTile.pix).toBe(42)
    expect(decodedTile.stars).toHaveLength(1)
    expect(decodedTile.stars[0]?.id).toBe('gaia-219547565555375488')
    expect(decodedTile.stars[0]?.sourceId).toBe('GAIA 219547565555375488')
    expect(decodedTile.stars[0]?.properName).toBe('Sample Star')
    expect(decodedTile.stars[0]?.catalog).toBe('gaia')
    expect(decodedTile.stars[0]?.raDeg).toBeCloseTo(180, 3)
    expect(decodedTile.stars[0]?.decDeg).toBeCloseTo(10, 3)
    expect(decodedTile.stars[0]?.mag).toBeCloseTo(9.7, 3)
    expect(decodedTile.stars[0]?.parallaxMas).toBeCloseTo(10, 3)
    expect(decodedTile.stars[0]?.pmRaMasYr).toBeCloseTo(5, 3)
    expect(decodedTile.stars[0]?.pmDecMasYr).toBeCloseTo(-4, 3)
  })
})