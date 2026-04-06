export const SKY_ENGINE_CONSTELLATION_SEGMENTS = [
  {
    id: 'summer-triangle',
    label: 'Summer Triangle',
    pairs: [
      ['sky-real-deneb', 'sky-real-vega'],
      ['sky-real-vega', 'sky-real-altair'],
      ['sky-real-altair', 'sky-real-deneb'],
    ],
  },
  {
    id: 'cygnus-stem',
    label: 'Cygnus',
    pairs: [['sky-real-deneb', 'sky-real-albireo']],
  },
  {
    id: 'lyra-core',
    label: 'Lyra',
    pairs: [
      ['sky-real-vega', 'sky-real-sheliak'],
      ['sky-real-sheliak', 'sky-real-sulafat'],
    ],
  },
  {
    id: 'aquila-wing',
    label: 'Aquila',
    pairs: [['sky-real-altair', 'sky-real-tarazed']],
  },
] as const