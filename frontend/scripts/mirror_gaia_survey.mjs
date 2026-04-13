import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SOURCE_URL = 'https://data.stellarium.org/surveys/gaia'
const DEFAULT_MIN_ORDER = 3
const DEFAULT_MAX_ORDER = 5
const DEFAULT_CONCURRENCY = 24

function parseArgs(argv) {
  const options = {
    sourceUrl: DEFAULT_SOURCE_URL,
    minOrder: DEFAULT_MIN_ORDER,
    maxOrder: DEFAULT_MAX_ORDER,
    concurrency: DEFAULT_CONCURRENCY,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const nextValue = argv[index + 1]

    if (argument === '--source-url' && nextValue) {
      options.sourceUrl = nextValue
      index += 1
      continue
    }

    if (argument === '--min-order' && nextValue) {
      options.minOrder = Number.parseInt(nextValue, 10)
      index += 1
      continue
    }

    if (argument === '--max-order' && nextValue) {
      options.maxOrder = Number.parseInt(nextValue, 10)
      index += 1
      continue
    }

    if (argument === '--concurrency' && nextValue) {
      options.concurrency = Number.parseInt(nextValue, 10)
      index += 1
    }
  }

  if (!Number.isFinite(options.minOrder) || !Number.isFinite(options.maxOrder) || options.minOrder < 0 || options.maxOrder < options.minOrder) {
    throw new Error('Invalid order range. Use --min-order N --max-order M with M >= N >= 0.')
  }

  if (!Number.isFinite(options.concurrency) || options.concurrency < 1) {
    throw new Error('Invalid concurrency. Use --concurrency N with N >= 1.')
  }

  return options
}

function buildTileRelativePath(order, pix) {
  const dir = Math.floor(pix / 10000) * 10000
  return `Norder${order}/Dir${dir}/Npix${pix}.eph`
}

async function ensureDirectory(filePath) {
  await mkdir(dirname(filePath), { recursive: true })
}

async function downloadBinary(url) {
  const response = await fetch(url)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

async function runWorker(taskFactory, workerCount) {
  let nextIndex = 0

  async function worker() {
    while (true) {
      const currentIndex = nextIndex

      if (currentIndex >= taskFactory.length) {
        return
      }

      nextIndex += 1
      await taskFactory[currentIndex]()
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  const outputRoot = resolve(scriptDirectory, '../public/sky-engine-assets/catalog/gaia')
  const propertiesPath = resolve(outputRoot, 'properties')
  const propertiesUrl = `${options.sourceUrl}/properties`

  console.log(`Mirroring Gaia survey from ${options.sourceUrl}`)
  console.log(`Orders: ${options.minOrder}..${options.maxOrder}`)
  console.log(`Concurrency: ${options.concurrency}`)
  console.log(`Output root: ${outputRoot}`)

  const propertiesResponse = await fetch(propertiesUrl)

  if (!propertiesResponse.ok) {
    throw new Error(`Failed to download Gaia properties: ${propertiesResponse.status} ${propertiesResponse.statusText}`)
  }

  const propertiesText = await propertiesResponse.text()
  await ensureDirectory(propertiesPath)
  await writeFile(propertiesPath, propertiesText, 'utf8')

  const tileCountByOrder = {}
  const tasks = []

  for (let order = options.minOrder; order <= options.maxOrder; order += 1) {
    const pixelCount = 12 * (1 << (2 * order))
    tileCountByOrder[String(order)] = 0

    for (let pix = 0; pix < pixelCount; pix += 1) {
      tasks.push(async () => {
        const relativePath = buildTileRelativePath(order, pix)
        const filePath = resolve(outputRoot, relativePath)
        const buffer = await downloadBinary(`${options.sourceUrl}/${relativePath}`)

        if (buffer == null) {
          return
        }

        await ensureDirectory(filePath)
        await writeFile(filePath, buffer)
        tileCountByOrder[String(order)] += 1
      })
    }
  }

  await runWorker(tasks, options.concurrency)

  const totalTileCount = Object.values(tileCountByOrder).reduce((count, value) => count + value, 0)
  const mirrorManifest = {
    minOrder: options.minOrder,
    maxOrder: options.maxOrder,
    mirroredAt: new Date().toISOString(),
    sourceUrl: options.sourceUrl,
    totalTileCount,
    tileCountByOrder,
  }
  const mirrorManifestPath = resolve(outputRoot, 'mirror-manifest.json')

  await writeFile(mirrorManifestPath, JSON.stringify(mirrorManifest, null, 2))

  console.log(`Mirrored ${totalTileCount} Gaia HiPS tiles.`)
  console.log(`Mirror manifest written to ${mirrorManifestPath}`)
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}