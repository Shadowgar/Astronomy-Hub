/**
 * Regenerate `tests/fixtures/module0_replay_astrom_goldens.json` from Hub `deriveObserverGeometry`.
 *
 *   cd frontend && npm run parity:dump-module0-astrom-goldens
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  deriveObserverGeometry,
  exportModule0EraApcoParityInputs,
} from '../src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry'
import { MODULE0_REPLAY_CASES } from '../tests/module0ReplayCases'

const __dirname = dirname(fileURLToPath(import.meta.url))

function q(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  const rounded = Number(value.toFixed(14))
  return rounded === 0 ? 0 : rounded
}

function qApcoInputs(inp: ReturnType<typeof exportModule0EraApcoParityInputs>) {
  return {
    date1: q(inp.date1),
    date2: q(inp.date2),
    ebpv: [
      [q(inp.ebpv[0][0]), q(inp.ebpv[0][1]), q(inp.ebpv[0][2])],
      [q(inp.ebpv[1][0]), q(inp.ebpv[1][1]), q(inp.ebpv[1][2])],
    ],
    ehp: [q(inp.ehp[0]), q(inp.ehp[1]), q(inp.ehp[2])],
    x: q(inp.x),
    y: q(inp.y),
    s: q(inp.s),
    theta: q(inp.theta),
    elong: q(inp.elong),
    phi: q(inp.phi),
    hm: q(inp.hm),
    xp: q(inp.xp),
    yp: q(inp.yp),
    sp: q(inp.sp),
    refa: q(inp.refa),
    refb: q(inp.refb),
  }
}

const cases = MODULE0_REPLAY_CASES.map(({ id, observer, sceneTimestampIso }) => {
  const g = deriveObserverGeometry(observer, sceneTimestampIso, 'full', null)
  const a = g.astrom
  return {
    id,
    apcoInputs: qApcoInputs(exportModule0EraApcoParityInputs(observer, sceneTimestampIso)),
    astrom: {
      eral: q(a.eral),
      xpl: q(a.xpl),
      ypl: q(a.ypl),
      along: q(a.along),
      eb: [q(a.eb[0]), q(a.eb[1]), q(a.eb[2])],
      bpn00: q(a.bpn[0][0]),
      bpn01: q(a.bpn[0][1]),
      bpn02: q(a.bpn[0][2]),
    },
    ri2h00: q(g.matrices.ri2h[0][0]),
  }
})

const payload = {
  schema: 'module0-replay-astrom-v2',
  generator: 'npm run parity:dump-module0-astrom-goldens (Hub deriveObserverGeometry + exportModule0EraApcoParityInputs)',
  cases,
}

const outPath = join(__dirname, '..', 'tests', 'fixtures', 'module0_replay_astrom_goldens.json')
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
// eslint-disable-next-line no-console
console.log(`Wrote ${outPath}`)
