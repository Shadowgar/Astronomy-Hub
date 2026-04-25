#!/usr/bin/env node
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const PINNED_SOURCE_REVISION = '63fb3279e85782158a6df63649f1c8a1837b7846'

function roundProbe(value) {
  return Number(value.toFixed(6))
}

function buildBvProbes() {
  const values = new Set([
    -0.33,
    -0.2,
    0,
    0.35,
    0.58,
    0.9,
    1.2,
    1.6,
    2,
    2.4,
  ])

  // Dense sampling across Stellarium's typical B-V operating range.
  for (let value = -0.5; value <= 2.5; value += 0.02) {
    values.add(roundProbe(value))
  }

  return Array.from(values).sort((left, right) => left - right)
}

function buildHipProbes() {
  const values = new Set([0, 1, 11767, 91262, 120415, 999999, 118347, 119344, 120341])

  // Broad contiguous sampling over low HIP ids.
  for (let hip = 1; hip <= 5000; hip += 1) {
    values.add(hip)
  }

  // Sparse sampling over wider catalog space up through Stellarium's high ids.
  for (let hip = 5001; hip <= 120415; hip += 211) {
    values.add(hip)
  }

  return Array.from(values).sort((left, right) => left - right)
}

const BV_PROBES = buildBvProbes()
const HIP_PROBES = buildHipProbes()
const HIP_ORDERS = Array.from({ length: 13 }, (_, index) => index)

function buildNuniqProbes() {
  const probes = []
  for (let order = 0; order <= 13; order += 1) {
    const maxPix = 12 * (1 << (2 * order)) - 1
    const candidates = new Set([0, 1, 2, 3, 4, 5, 6, 7, maxPix])

    for (let step = 1; step <= 96; step += 1) {
      const ratio = step / 97
      candidates.add(Math.max(0, Math.min(maxPix, Math.floor(maxPix * ratio))))
    }

    const sorted = Array.from(candidates)
      .filter((pix) => Number.isFinite(pix) && pix >= 0 && pix <= maxPix)
      .sort((left, right) => left - right)

    for (const pix of sorted) {
      probes.push({ order, pix })
    }
  }
  return probes
}

const NUNIQ_PROBES = buildNuniqProbes()

function resolveRepoRoot() {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
}

function resolveSourceRoot(repoRoot) {
  const fromEnv = process.env.STELLARIUM_SOURCE_ROOT
  if (fromEnv?.trim()) {
    return path.resolve(fromEnv.trim())
  }
  return path.resolve(
    repoRoot,
    'study/stellarium-web-engine/source/stellarium-web-engine-master',
  )
}

async function getSourceRevision(sourceRoot) {
  try {
    const { stdout } = await execFile('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'])
    return stdout.trim()
  } catch {
    return PINNED_SOURCE_REVISION
  }
}

function buildHelperProgram() {
  const bvProbeInitializers = BV_PROBES.map((value) => `${value}`).join(', ')
  const hipProbeInitializers = HIP_PROBES.map((value) => `${value}`).join(', ')
  const hipOrderInitializers = HIP_ORDERS.map((value) => `${value}`).join(', ')
  const nuniqOrderInitializers = NUNIQ_PROBES.map((probe) => `${probe.order}`).join(', ')
  const nuniqPixInitializers = NUNIQ_PROBES.map((probe) => `${probe.pix}`).join(', ')

  return String.raw`#include <math.h>
#include <stdio.h>
#include <stdint.h>

void bv_to_rgb(double bv, double rgb[3]);
int hip_get_pix(int hip, int order);

int main(void) {
    const double bv_probes[] = { ${bvProbeInitializers} };
    const int hip_probes[] = { ${hipProbeInitializers} };
    const int hip_orders[] = { ${hipOrderInitializers} };
    const int bv_count = sizeof(bv_probes) / sizeof(bv_probes[0]);
    const int hip_count = sizeof(hip_probes) / sizeof(hip_probes[0]);
    const int hip_order_count = sizeof(hip_orders) / sizeof(hip_orders[0]);
    const int nuniq_orders[] = { ${nuniqOrderInitializers} };
    const int nuniq_pix[] = { ${nuniqPixInitializers} };
    const int nuniq_count = sizeof(nuniq_orders) / sizeof(nuniq_orders[0]);

    for (int i = 0; i < bv_count; i++) {
        double rgb[3] = {0.0, 0.0, 0.0};
        bv_to_rgb(bv_probes[i], rgb);
        printf("BV %.6f %.6f %.6f %.6f\n", bv_probes[i], rgb[0], rgb[1], rgb[2]);
    }

    for (int i = 0; i < hip_count; i++) {
        const int hip = hip_probes[i];
        printf("HIP %d", hip);
        for (int j = 0; j < hip_order_count; j++) {
            const int order = hip_orders[j];
            const int pix = hip_get_pix(hip, order);
            printf(" %d", pix);
        }
        printf("\n");
    }

      // Matches Stellarium formulas in stars.c / eph-file.c for NUNIQ decomposition.
      for (int i = 0; i < nuniq_count; i++) {
        const int order = nuniq_orders[i];
        const int pix = nuniq_pix[i];
        const uint64_t nuniq = (uint64_t)pix + 4ULL * (1ULL << (2 * order));
        const int decoded_order = (int)(log2((double)(nuniq / 4ULL)) / 2.0);
        const int decoded_pix = (int)(nuniq - 4ULL * (1ULL << (2 * decoded_order)));
        printf("NUNIQ %d %d %llu %d %d\n",
             order,
             pix,
             (unsigned long long)nuniq,
             decoded_order,
             decoded_pix);
      }
    return 0;
}
`
}

function parseHelperOutput(stdout) {
  const bvProbes = []
  const hipProbes = []
  const nuniqProbes = []

  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    const parts = line.split(/\s+/)
    if (parts[0] === 'BV' && parts.length === 5) {
      bvProbes.push({
        bv: Number(parts[1]),
        expectedRgb: [
          Number(parts[2]),
          Number(parts[3]),
          Number(parts[4]),
        ],
      })
      continue
    }

    if (parts[0] === 'HIP' && parts.length === HIP_ORDERS.length + 2) {
      const expectedByOrder = HIP_ORDERS.map((order, index) => ({
        order,
        pix: Number(parts[index + 2]),
      }))
      hipProbes.push({
        hip: Number(parts[1]),
        expectedByOrder,
      })
      continue
    }

    if (parts[0] === 'NUNIQ' && parts.length === 6) {
      nuniqProbes.push({
        order: Number(parts[1]),
        pix: Number(parts[2]),
        nuniq: parts[3],
        decodedOrder: Number(parts[4]),
        decodedPix: Number(parts[5]),
      })
    }
  }

  return { bvProbes, hipProbes, nuniqProbes }
}

function formatGeneratedFile({ sourceRevision, bvProbes, hipProbes, nuniqProbes }) {
  const renderedBv = bvProbes
    .map((probe) => {
      const [r, g, b] = probe.expectedRgb
      return `  { bv: ${probe.bv}, expectedRgb: [${r}, ${g}, ${b}] },`
    })
    .join('\n')

  const renderedHip = hipProbes
    .map((probe) => {
      const renderedOrders = probe.expectedByOrder
        .map((entry) => `{ order: ${entry.order}, pix: ${entry.pix} }`)
        .join(', ')
      return (
        '  { hip: ' +
        `${probe.hip}, expectedByOrder: [${renderedOrders}] },`
      )
    })
    .join('\n')

  const renderedNuniq = nuniqProbes
    .map((probe) => {
      return (
        '  { order: ' +
        `${probe.order}, pix: ${probe.pix}, nuniq: '${probe.nuniq}', decodedOrder: ${probe.decodedOrder}, decodedPix: ${probe.decodedPix} },`
      )
    })
    .join('\n')

  return `// This file is generated by frontend/scripts/generate_module2_side_by_side_reference.mjs\n// Source: study/stellarium-web-engine/source/stellarium-web-engine-master\n\nexport const MODULE2_SIDE_BY_SIDE_SOURCE_REVISION =\n  '${sourceRevision}' as const\n\nexport const MODULE2_SIDE_BY_SIDE_BV_PROBES: ReadonlyArray<{\n  bv: number\n  expectedRgb: readonly [number, number, number]\n}> = [\n${renderedBv}\n]\n\nexport const MODULE2_SIDE_BY_SIDE_HIP_PROBES: ReadonlyArray<{\n  hip: number\n  expectedByOrder: ReadonlyArray<{ order: number; pix: number }>\n}> = [\n${renderedHip}\n]\n\nexport const MODULE2_SIDE_BY_SIDE_NUNIQ_PROBES: ReadonlyArray<{\n  order: number\n  pix: number\n  nuniq: string\n  decodedOrder: number\n  decodedPix: number\n}> = [\n${renderedNuniq}\n]\n`
}

async function main() {
  const repoRoot = resolveRepoRoot()
  const sourceRoot = resolveSourceRoot(repoRoot)

  const helperProgramPath = path.join(os.tmpdir(), `module2-side-by-side-${Date.now()}.c`)
  const helperBinaryPath = path.join(os.tmpdir(), `module2-side-by-side-${Date.now()}`)

  try {
    await fs.writeFile(helperProgramPath, buildHelperProgram(), 'utf8')

    await execFile('gcc', [
      '-std=c99',
      '-O2',
      '-I',
      path.join(sourceRoot, 'src'),
      helperProgramPath,
      path.join(sourceRoot, 'src/algos/bv_to_rgb.c'),
      path.join(sourceRoot, 'src/hip.c'),
      '-lm',
      '-o',
      helperBinaryPath,
    ])

    const { stdout } = await execFile(helperBinaryPath, [])
    const helperOutput = parseHelperOutput(stdout)

    const sourceRevision = await getSourceRevision(sourceRoot)
    if (sourceRevision !== PINNED_SOURCE_REVISION) {
      console.warn(
        `[generate_module2_side_by_side_reference] warning: source revision ${sourceRevision} differs from pinned ${PINNED_SOURCE_REVISION}`,
      )
    }

    const generatedPath = path.resolve(
      repoRoot,
      'frontend/src/features/sky-engine/engine/sky/runtime/module2SideBySideReference.generated.ts',
    )

    const generatedContent = formatGeneratedFile({
      sourceRevision,
      bvProbes: helperOutput.bvProbes,
      hipProbes: helperOutput.hipProbes,
      nuniqProbes: helperOutput.nuniqProbes,
    })

    await fs.writeFile(generatedPath, generatedContent, 'utf8')
    console.log(`[generate_module2_side_by_side_reference] wrote ${generatedPath}`)
  } finally {
    await Promise.allSettled([
      fs.unlink(helperProgramPath),
      fs.unlink(helperBinaryPath),
    ])
  }
}

try {
  await main()
} catch (error) {
  console.error('[generate_module2_side_by_side_reference] failed')
  console.error(error)
  process.exit(1)
}
