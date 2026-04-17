/**
 * ERFA `eraNut00a` — IAU 2000A nutation (MHB2000), transcribed from `erfa.c`.
 */

import { ERFA_D2PI, ERFA_DAS2R, ERFA_DJC, ERFA_DJ00, ERFA_TURNAS } from './erfaConstants'
import {
  eraFae03,
  eraFaf03,
  eraFaju03,
  eraFal03,
  eraFama03,
  eraFame03,
  eraFaom03,
  eraFapa03,
  eraFasa03,
  eraFaur03,
  eraFave03,
} from './erfaFundamentalArguments'
import { ERFA_NUT00A_XLS, ERFA_NUT00A_XPL } from './erfaNut00aTables.generated'

const U2R = ERFA_DAS2R / 1e7

function cFmod(x: number, y: number): number {
  return x - y * Math.trunc(x / y)
}

export function eraNut00a(date1: number, date2: number): { dpsi: number; deps: number } {
  const t = (date1 - ERFA_DJ00 + date2) / ERFA_DJC

  const el = eraFal03(t)
  const elp =
    cFmod(
      1287104.79305 + t * (129596581.0481 + t * (-0.5532 + t * (0.000136 + t * -0.00001149))),
      ERFA_TURNAS,
    ) * ERFA_DAS2R
  const f = eraFaf03(t)
  const d =
    cFmod(
      1072260.70369 + t * (1602961601.209 + t * (-6.3706 + t * (0.006593 + t * -0.00003169))),
      ERFA_TURNAS,
    ) * ERFA_DAS2R
  const om = eraFaom03(t)

  let dp = 0
  let de = 0
  for (let i = ERFA_NUT00A_XLS.length - 1; i >= 0; i -= 1) {
    const row = ERFA_NUT00A_XLS[i]
    const [nl, nlp, nf, nd, nom, sp, spt, cp, ce, cet, se] = row
    const arg = cFmod(nl * el + nlp * elp + nf * f + nd * d + nom * om, ERFA_D2PI)
    const sarg = Math.sin(arg)
    const carg = Math.cos(arg)
    dp += (sp + spt * t) * sarg + cp * carg
    de += (ce + cet * t) * carg + se * sarg
  }
  const dpsils = dp * U2R
  const depsls = de * U2R

  const al = cFmod(2.35555598 + 8328.6914269554 * t, ERFA_D2PI)
  const af = cFmod(1.627905234 + 8433.466158131 * t, ERFA_D2PI)
  const ad = cFmod(5.198466741 + 7771.3771468121 * t, ERFA_D2PI)
  const aom = cFmod(2.1824392 - 33.757045 * t, ERFA_D2PI)
  const apa = eraFapa03(t)
  const alme = eraFame03(t)
  const alve = eraFave03(t)
  const alea = eraFae03(t)
  const alma = eraFama03(t)
  const alju = eraFaju03(t)
  const alsa = eraFasa03(t)
  const alur = eraFaur03(t)
  const alne = cFmod(5.321159 + 3.8127774 * t, ERFA_D2PI)

  dp = 0
  de = 0
  for (let i = ERFA_NUT00A_XPL.length - 1; i >= 0; i -= 1) {
    const row = ERFA_NUT00A_XPL[i]
    const [
      nl,
      nf,
      nd,
      nom,
      nme,
      nve,
      nea,
      nma,
      nju,
      nsa,
      nur,
      nne,
      npa,
      sp,
      cp,
      se,
      ce,
    ] = row
    const arg = cFmod(
      nl * al +
        nf * af +
        nd * ad +
        nom * aom +
        nme * alme +
        nve * alve +
        nea * alea +
        nma * alma +
        nju * alju +
        nsa * alsa +
        nur * alur +
        nne * alne +
        npa * apa,
      ERFA_D2PI,
    )
    const sarg = Math.sin(arg)
    const carg = Math.cos(arg)
    dp += sp * sarg + cp * carg
    de += se * sarg + ce * carg
  }
  const dpsipl = dp * U2R
  const depspl = de * U2R

  return { dpsi: dpsils + dpsipl, deps: depsls + depspl }
}
