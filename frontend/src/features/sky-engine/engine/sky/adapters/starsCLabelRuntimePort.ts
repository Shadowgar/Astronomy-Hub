/*
 * Source parity seam for Stellarium Web Engine `src/modules/stars.c`
 * label/name behavior.
 *
 * Covered source surface from pinned commit 63fb3279e85782158a6df63649f1c8a1837b7846:
 * - `parse_json_names` lines 139-154: string arrays become NUL-separated name entries.
 * - `star_get_skycultural_name` lines 246-270: HIP-only skyculture lookup.
 * - `name_is_bayer` lines 273-275: Bayer / variable-star prefix test.
 * - `star_get_bayer_name` lines 277-308: first Bayer-like name wins.
 * - `star_render_name` lines 311-372: magnitude gates, fallback order, selected override,
 *   label spacing, effects, alpha, multiline split, and label priority.
 * - `star_get_designations` lines 408-424: names first, then GAIA designation.
 */

export const LABEL_SPACING = 4

export const DSGN_TRANSLATE = 1 << 0
export const BAYER_LATIN_LONG = 1 << 1
export const BAYER_CONST_LONG = 1 << 2

export const TEXT_FLOAT = 1 << 0
export const TEXT_BOLD = 1 << 1
export const TEXT_MULTILINES = 1 << 2

export type StarsCLabelSource =
  | 'skyculture'
  | 'international'
  | 'bayer'
  | 'none'

export type StarsCLabelHiddenReason =
  | 'below-label-limit'
  | 'missing-skyculture-label'
  | 'missing-name'

export type StarsCLabelStar = {
  readonly hip: number
  readonly gaia?: number | string | null
  readonly vmag: number
  readonly names?: readonly string[] | null
}

export type StarsCLabelRuntimeInput = {
  readonly star: StarsCLabelStar
  readonly selected: boolean
  readonly painterHintsLimitMag: number
  readonly starsHintsMagOffset: number
  readonly coreHintsMagOffset: number
  readonly radiusPx?: number
  readonly colorRgb?: readonly [number, number, number]
  readonly skycultureLabelForHip?: (hip: number) => string | null | undefined
  readonly fallbackToInternationalNames?: boolean
  readonly designationCleanup?: (name: string, flags: number) => string
  readonly splitLineWidth?: number
}

export type StarsCLabelLimits = {
  readonly hintsMagOffset: number
  readonly limMag: number
  readonly limMag2: number
  readonly limMag3: number
}

export type StarsCVisibleLabelDecision = {
  readonly visible: true
  readonly source: Exclude<StarsCLabelSource, 'none'>
  readonly text: string
  readonly rawText: string
  readonly selected: boolean
  readonly labelRadiusPx: number
  readonly baseRadiusPx: number
  readonly fontSizeBase: true
  readonly colorRgb: readonly [number, number, number]
  readonly colorAlpha: number
  readonly effects: number
  readonly sortKey: number
  readonly flags: number
  readonly limits: StarsCLabelLimits
}

export type StarsCHiddenLabelDecision = {
  readonly visible: false
  readonly source: 'none'
  readonly reason: StarsCLabelHiddenReason
  readonly selected: boolean
  readonly limits: StarsCLabelLimits
}

export type StarsCLabelRuntimeDecision =
  | StarsCVisibleLabelDecision
  | StarsCHiddenLabelDecision

export type StarsCDesignationEntry = {
  readonly catalog: string | null
  readonly value: string
}

export type StarsCLabelFixtureCase = {
  readonly name: string
  readonly input: StarsCLabelRuntimeInput
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sanitizeNameEntry(value: string) {
  return value.replace(/\0/g, '').trim()
}

function normalizeNames(names: readonly string[] | null | undefined): readonly string[] {
  if (!names) {
    return []
  }

  const normalized: string[] = []
  for (const name of names) {
    const entry = sanitizeNameEntry(name)
    if (entry) {
      normalized.push(entry)
    }
  }
  return normalized
}

function visibleColor(input: StarsCLabelRuntimeInput): readonly [number, number, number] {
  const color = input.colorRgb ?? [1, 1, 1]
  return [
    finiteOr(color[0], 1),
    finiteOr(color[1], 1),
    finiteOr(color[2], 1),
  ] as const
}

function hiddenDecision(
  input: StarsCLabelRuntimeInput,
  reason: StarsCLabelHiddenReason,
  limits: StarsCLabelLimits,
): StarsCHiddenLabelDecision {
  return {
    visible: false,
    source: 'none',
    reason,
    selected: input.selected,
    limits,
  }
}

function normalizeGaiaId(gaia: number | string | null | undefined) {
  if (gaia === null || gaia === undefined) {
    return null
  }
  if (typeof gaia === 'number') {
    return Number.isFinite(gaia) && gaia !== 0 ? String(Math.trunc(gaia)) : null
  }
  const value = gaia.trim()
  return value && value !== '0' ? value : null
}

function formatFlags(flags: number) {
  const parts: string[] = []
  if (flags & DSGN_TRANSLATE) parts.push('translate')
  if (flags & BAYER_LATIN_LONG) parts.push('latin-long')
  if (flags & BAYER_CONST_LONG) parts.push('const-long')
  return parts.join('+') || 'none'
}

function digestDecision(caseName: string, decision: StarsCLabelRuntimeDecision) {
  if (!decision.visible) {
    return [
      caseName,
      'hidden',
      decision.reason,
      `sel:${decision.selected ? '1' : '0'}`,
      `lim:${decision.limits.limMag.toFixed(3)}`,
    ].join(':')
  }

  return [
    caseName,
    decision.source,
    decision.text.replace(/\n/g, '/'),
    `sel:${decision.selected ? '1' : '0'}`,
    `fx:${decision.effects}`,
    `flags:${formatFlags(decision.flags)}`,
    `r:${decision.labelRadiusPx.toFixed(3)}`,
    `sort:${decision.sortKey.toFixed(3)}`,
  ].join(':')
}

export function starsCNamesFromDelimitedIds(ids: string): readonly string[] {
  if (!ids) {
    return []
  }
  return ids
    .split('|')
    .map((entry) => sanitizeNameEntry(entry))
    .filter(Boolean)
}

export function starsCNamesFromJsonArray(names: readonly unknown[]): readonly string[] {
  const result: string[] = []
  for (const name of names) {
    if (typeof name === 'string') {
      const entry = sanitizeNameEntry(name)
      if (entry) {
        result.push(entry)
      }
    }
  }
  return result
}

export function starsCNamesToNullSeparatedString(names: readonly string[]): string {
  const normalized = normalizeNames(names)
  return normalized.length ? `${normalized.join('\0')}\0\0` : '\0'
}

export function starsCNamesFromNullSeparatedString(names: string): readonly string[] {
  if (!names) {
    return []
  }
  return names
    .split('\0')
    .map((entry) => sanitizeNameEntry(entry))
    .filter(Boolean)
}

export function isStarsCBayerDesignation(name: string): boolean {
  return name.startsWith('* ') || name.startsWith('V* ')
}

export function findStarsCBayerDesignation(names: readonly string[] | null | undefined): string | null {
  for (const name of normalizeNames(names)) {
    if (isStarsCBayerDesignation(name)) {
      return name
    }
  }
  return null
}

export function defaultStarsCDesignationCleanup(name: string, _flags: number): string {
  const compact = compactWhitespace(name)
  if (compact.startsWith('V* ')) {
    return compact.slice(3).trim()
  }
  if (compact.startsWith('* ')) {
    return compact.slice(2).trim()
  }
  return compact
}

export function computeStarsCLabelLimits(params: {
  readonly painterHintsLimitMag: number
  readonly starsHintsMagOffset: number
  readonly coreHintsMagOffset: number
}): StarsCLabelLimits {
  const hintsMagOffset =
    finiteOr(params.starsHintsMagOffset, 0) +
    finiteOr(params.coreHintsMagOffset, 0)
  const painterHintsLimitMag = finiteOr(params.painterHintsLimitMag, Number.POSITIVE_INFINITY)

  return {
    hintsMagOffset,
    limMag: painterHintsLimitMag - 5 + hintsMagOffset,
    limMag2: painterHintsLimitMag - 7.5 + hintsMagOffset,
    limMag3: painterHintsLimitMag - 9.0 + hintsMagOffset,
  }
}

export function resolveStarsCSkycultureLabel(params: {
  readonly hip: number
  readonly skycultureLabelForHip?: (hip: number) => string | null | undefined
}): string | null {
  if (!params.hip) {
    return null
  }
  const label = params.skycultureLabelForHip?.(params.hip)
  return label ? sanitizeNameEntry(label) || null : null
}

export function resolveStarsCInternationalLabel(params: {
  readonly names: readonly string[]
  readonly selected: boolean
  readonly vmag: number
  readonly limMag2: number
  readonly limMag3: number
  readonly designationCleanup: (name: string, flags: number) => string
}): {
  readonly source: 'international' | 'bayer'
  readonly rawText: string
  readonly text: string
  readonly flags: number
} | null {
  const firstName = params.names[0] || null
  if (!firstName) {
    return null
  }

  let flags = DSGN_TRANSLATE

  if (params.selected || params.vmag < Math.max(3, params.limMag2)) {
    if (params.selected || params.vmag < Math.max(3, params.limMag3)) {
      flags |= BAYER_LATIN_LONG | BAYER_CONST_LONG
    }
    return {
      source: 'international',
      rawText: firstName,
      text: params.designationCleanup(firstName, flags),
      flags,
    }
  }

  const bayer = findStarsCBayerDesignation(params.names)
  if (!bayer) {
    return null
  }

  return {
    source: 'bayer',
    rawText: bayer,
    text: params.designationCleanup(bayer, flags),
    flags,
  }
}

export function splitStarsCLabelLine(text: string, width = 16): string {
  const normalizedWidth = Math.max(1, Math.trunc(width))
  const words = compactWhitespace(text).split(' ').filter(Boolean)
  if (words.length === 0) {
    return ''
  }

  const lines: string[] = []
  let line = ''

  for (const word of words) {
    if (!line) {
      if (word.length <= normalizedWidth) {
        line = word
      } else {
        lines.push(...chunkLongWord(word, normalizedWidth).slice(0, -1))
        line = chunkLongWord(word, normalizedWidth).slice(-1)[0] ?? ''
      }
      continue
    }

    if (line.length + 1 + word.length <= normalizedWidth) {
      line = `${line} ${word}`
      continue
    }

    lines.push(line)
    if (word.length <= normalizedWidth) {
      line = word
    } else {
      const chunks = chunkLongWord(word, normalizedWidth)
      lines.push(...chunks.slice(0, -1))
      line = chunks.slice(-1)[0] ?? ''
    }
  }

  if (line) {
    lines.push(line)
  }

  return lines.join('\n')
}

function chunkLongWord(word: string, width: number): readonly string[] {
  const chunks: string[] = []
  for (let index = 0; index < word.length; index += width) {
    chunks.push(word.slice(index, index + width))
  }
  return chunks
}

export function selectStarsCLabelRuntimeDecision(
  input: StarsCLabelRuntimeInput,
): StarsCLabelRuntimeDecision {
  const limits = computeStarsCLabelLimits(input)
  const vmag = finiteOr(input.star.vmag, Number.POSITIVE_INFINITY)
  const selected = input.selected

  if (!selected && vmag > limits.limMag) {
    return hiddenDecision(input, 'below-label-limit', limits)
  }

  const names = normalizeNames(input.star.names)
  const fallbackToInternationalNames = input.fallbackToInternationalNames ?? true
  const designationCleanup = input.designationCleanup ?? defaultStarsCDesignationCleanup

  const skycultureText = resolveStarsCSkycultureLabel({
    hip: input.star.hip,
    skycultureLabelForHip: input.skycultureLabelForHip,
  })

  let source: Exclude<StarsCLabelSource, 'none'> | null = null
  let rawText = ''
  let text = ''
  let flags = DSGN_TRANSLATE

  if (skycultureText) {
    source = 'skyculture'
    rawText = skycultureText
    text = skycultureText
  } else if (!fallbackToInternationalNames) {
    return hiddenDecision(input, 'missing-skyculture-label', limits)
  } else {
    const international = resolveStarsCInternationalLabel({
      names,
      selected,
      vmag,
      limMag2: limits.limMag2,
      limMag3: limits.limMag3,
      designationCleanup,
    })

    if (international) {
      source = international.source
      rawText = international.rawText
      text = international.text
      flags = international.flags
    }
  }

  if (!source || !text) {
    return hiddenDecision(input, 'missing-name', limits)
  }

  const splitText = splitStarsCLabelLine(text, input.splitLineWidth ?? 16)
  const baseRadiusPx = finiteOr(input.radiusPx ?? 0, 0)

  return {
    visible: true,
    source,
    text: splitText,
    rawText,
    selected,
    labelRadiusPx: baseRadiusPx + LABEL_SPACING,
    baseRadiusPx,
    fontSizeBase: true,
    colorRgb: selected ? [1, 1, 1] : visibleColor(input),
    colorAlpha: selected ? 1 : 0.8,
    effects: selected ? TEXT_BOLD | TEXT_MULTILINES : TEXT_FLOAT | TEXT_MULTILINES,
    sortKey: -vmag,
    flags,
    limits,
  }
}

export function listStarsCDesignations(star: StarsCLabelStar): readonly StarsCDesignationEntry[] {
  const designations: StarsCDesignationEntry[] = []
  for (const name of normalizeNames(star.names)) {
    designations.push({
      catalog: null,
      value: name,
    })
  }

  const gaia = normalizeGaiaId(star.gaia)
  if (gaia) {
    designations.push({
      catalog: 'GAIA',
      value: gaia,
    })
  }

  return designations
}

export function addHipFallbackNameIfMissing(params: {
  readonly names?: readonly string[] | null
  readonly hip: number
  readonly vmag: number
}): readonly string[] {
  const names = normalizeNames(params.names)
  if (names.length || !params.hip) {
    return names
  }
  return [`HIP ${params.hip}`]
}

export function buildStarsCLabelRuntimeFixtureCases(): readonly StarsCLabelFixtureCase[] {
  return [
    {
      name: 'skyculture-bright',
      input: {
        star: {
          hip: 32349,
          gaia: '2947050466531873024',
          vmag: -1.46,
          names: starsCNamesFromDelimitedIds('Sirius|* alf CMa|V* V337 Car'),
        },
        selected: false,
        painterHintsLimitMag: 6,
        starsHintsMagOffset: 0,
        coreHintsMagOffset: 0.2,
        radiusPx: 3,
        colorRgb: [0.7, 0.8, 1],
        skycultureLabelForHip: (hip) => (hip === 32349 ? 'Dog Star' : null),
        fallbackToInternationalNames: true,
      },
    },
    {
      name: 'no-fallback-hidden',
      input: {
        star: {
          hip: 24436,
          vmag: 0.42,
          names: ['Rigel', '* bet Ori'],
        },
        selected: false,
        painterHintsLimitMag: 6,
        starsHintsMagOffset: 0,
        coreHintsMagOffset: 0,
        skycultureLabelForHip: () => null,
        fallbackToInternationalNames: false,
      },
    },
    {
      name: 'selected-faint',
      input: {
        star: {
          hip: 999,
          vmag: 8.8,
          names: ['Selected Faint', '* eps Test'],
        },
        selected: true,
        painterHintsLimitMag: 6,
        starsHintsMagOffset: 0,
        coreHintsMagOffset: 0,
        skycultureLabelForHip: () => null,
        fallbackToInternationalNames: true,
      },
    },
    {
      name: 'compact-bayer',
      input: {
        star: {
          hip: 1024,
          vmag: 2.9,
          names: ['Decorative Name', '* gam Cyg'],
        },
        selected: false,
        painterHintsLimitMag: 8,
        starsHintsMagOffset: 0,
        coreHintsMagOffset: 0,
        skycultureLabelForHip: () => null,
        fallbackToInternationalNames: true,
      },
    },
    {
      name: 'below-limit',
      input: {
        star: {
          hip: 2048,
          vmag: 7.2,
          names: ['Too Dim'],
        },
        selected: false,
        painterHintsLimitMag: 6,
        starsHintsMagOffset: 0,
        coreHintsMagOffset: 0,
        skycultureLabelForHip: () => null,
        fallbackToInternationalNames: true,
      },
    },
  ]
}

export function computeStarsCLabelRuntimeFixtureDigest(
  cases = buildStarsCLabelRuntimeFixtureCases(),
): string {
  return cases
    .map((fixture) => {
      const decision = selectStarsCLabelRuntimeDecision(fixture.input)
      const designations = listStarsCDesignations(fixture.input.star)
        .map((entry) => `${entry.catalog ?? 'name'}=${entry.value}`)
        .join(',')
      return `${digestDecision(fixture.name, decision)}|desig:${designations || 'none'}`
    })
    .join('||')
}

export function explainStarsCLabelRuntimeDecision(
  decision: StarsCLabelRuntimeDecision,
): readonly string[] {
  if (!decision.visible) {
    return [
      'visible:0',
      `reason:${decision.reason}`,
      `selected:${decision.selected ? '1' : '0'}`,
      `lim:${decision.limits.limMag.toFixed(3)}`,
    ]
  }

  return [
    'visible:1',
    `source:${decision.source}`,
    `selected:${decision.selected ? '1' : '0'}`,
    `effects:${decision.effects}`,
    `flags:${formatFlags(decision.flags)}`,
    `radius:${decision.labelRadiusPx.toFixed(3)}`,
    `sort:${decision.sortKey.toFixed(3)}`,
    `text:${decision.text.replace(/\n/g, '/')}`,
  ]
}
