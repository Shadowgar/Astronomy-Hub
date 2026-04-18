import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  deriveObserverGeometry,
  exportModule0EraApcoParityInputs,
} from '../src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts'
import { MODULE0_REPLAY_CASES } from './module0ReplayCases.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GOLDENS = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'module0_replay_astrom_goldens.json'), 'utf8'),
)

function q(value) {
  if (!Number.isFinite(value)) {
    return 0
  }
  const rounded = Number(value.toFixed(14))
  return rounded === 0 ? 0 : rounded
}

function qApcoInputs(inp) {
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

describe('Module 0 replay astrom golden contract (G4 / BLK-000 tier-1)', () => {
  it('fixture lists the same five case ids as MODULE0_REPLAY_CASES', () => {
    expect(GOLDENS.schema).toBe('module0-replay-astrom-v2')
    expect(GOLDENS.cases.map((c) => c.id)).toEqual(MODULE0_REPLAY_CASES.map((c) => c.id))
  })

  it.each(MODULE0_REPLAY_CASES)('Hub matches committed astrom slice: $id', ({ id, observer, sceneTimestampIso }) => {
    const golden = GOLDENS.cases.find((c) => c.id === id)
    expect(golden).toBeTruthy()
    const g = deriveObserverGeometry(observer, sceneTimestampIso, 'full', null)
    const a = g.astrom
    const expected = golden.astrom
    expect(q(a.eral)).toBe(expected.eral)
    expect(q(a.xpl)).toBe(expected.xpl)
    expect(q(a.ypl)).toBe(expected.ypl)
    expect(q(a.along)).toBe(expected.along)
    expect([q(a.eb[0]), q(a.eb[1]), q(a.eb[2])]).toEqual(expected.eb)
    expect(q(a.bpn[0][0])).toBe(expected.bpn00)
    expect(q(a.bpn[0][1])).toBe(expected.bpn01)
    expect(q(a.bpn[0][2])).toBe(expected.bpn02)
    expect(q(g.matrices.ri2h[0][0])).toBe(golden.ri2h00)
    expect(qApcoInputs(exportModule0EraApcoParityInputs(observer, sceneTimestampIso))).toEqual(golden.apcoInputs)
  })
})
