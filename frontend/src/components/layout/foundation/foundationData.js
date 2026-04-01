export const topBar = {
  scope: 'Above Me',
  engine: 'Unified Main',
  filter: 'visible_now',
  time: 'Now',
  location: 'ORAS',
  mode: 'light',
  commands: ['What\'s above me now?', 'Show satellites', 'Show planets', 'Earth events', 'Solar'],
}

export const sceneItems = [
  { name: 'ISS', reason: 'Overhead and very bright in the next window.' },
  { name: 'Jupiter', reason: 'High altitude and clear line-of-sight.' },
  { name: 'M13', reason: 'Dark-window target with strong visibility score.' },
]

export const rightContextSections = [
  {
    title: 'Observing Conditions',
    items: [
      { name: 'Observing score', reason: 'GOOD (stable transparency and seeing).' },
      { name: 'Moon impact', reason: 'Moderate brightness impact in current window.' },
    ],
  },
  {
    title: 'Alerts',
    items: [
      { name: 'ISS pass window', reason: 'Starts in 12 minutes toward NW.' },
      { name: 'Solar activity', reason: 'Quiet baseline with no major active warning.' },
    ],
  },
  {
    title: 'Summary',
    items: [
      { name: 'Best target now', reason: 'Jupiter has highest confidence score.' },
      { name: 'Quick recommendation', reason: 'Start with bright-object capture workflow.' },
    ],
  },
]

export const nowAboveMeItems = [
  { name: 'ISS', reason: 'Overhead in short window, very bright track.' },
  { name: 'Jupiter', reason: 'High in SE with stable visibility.' },
  { name: 'M13', reason: 'Excellent contrast in current dark sector.' },
  { name: 'UAL 2401', reason: 'Above-horizon pass with low visual interference.' },
  { name: 'Mars', reason: 'Visible low east; useful comparison target.' },
]

export const engineModules = [
  {
    name: 'Solar System',
    items: [
      { name: 'Jupiter', reason: 'High altitude and strong clarity.' },
      { name: 'Mars', reason: 'Visible with improving elevation window.' },
      { name: 'Moon', reason: 'Primary reference object for quick alignment.' },
    ],
  },
  {
    name: 'Deep Sky',
    items: [
      { name: 'M13', reason: 'Top ranked under current darkness profile.' },
      { name: 'M31', reason: 'Wide target with reliable framing.' },
      { name: 'M57', reason: 'Compact object with clear detection path.' },
    ],
  },
  {
    name: 'Satellites',
    items: [
      { name: 'ISS', reason: 'Bright pass expected soon.' },
      { name: 'NOAA-19', reason: 'Predictable track in visible arc.' },
      { name: 'HST', reason: 'Short but clear above-horizon segment.' },
    ],
  },
  {
    name: 'Sun',
    items: [
      { name: 'Activity baseline', reason: 'Quiet status with low event risk.' },
      { name: 'Daylight constraint', reason: 'Night observing remains unaffected.' },
      { name: 'Solar context', reason: 'No immediate disruption signal.' },
    ],
  },
  {
    name: 'Flights',
    items: [
      { name: 'UAL 2401', reason: 'Above-horizon track during observing window.' },
      { name: 'DAL 118', reason: 'Low interference route on western edge.' },
      { name: 'AAL 902', reason: 'Transient visual crossing, monitor briefly.' },
    ],
  },
  {
    name: 'Conditions',
    items: [
      { name: 'Transparency', reason: 'Stable and suitable for faint targets.' },
      { name: 'Seeing', reason: 'Moderate with acceptable distortion.' },
      { name: 'Cloud cover', reason: 'Low probability in active interval.' },
    ],
  },
  {
    name: 'Events',
    items: [
      { name: 'Meteor activity', reason: 'Minor peak in late window.' },
      { name: 'Satellite flare chance', reason: 'Possible bright glint event.' },
      { name: 'Local sky alert', reason: 'No high-priority disruption present.' },
    ],
  },
]

export const detailPanel = {
  objectName: 'Jupiter',
  objectMeta: 'Type: Planet · Status: Visible now',
  whyItMatters: 'High-confidence target with strong visibility and immediate observing value.',
  sections: [
    {
      name: 'Overview',
      items: [
        { name: 'Summary', reason: 'Bright, stable target for quick acquisition.' },
        { name: 'Observing note', reason: 'Good starter target before deep-sky sequence.' },
      ],
    },
    {
      name: 'Sky Position',
      items: [
        { name: 'Azimuth', reason: 'SE orientation in current time window.' },
        { name: 'Elevation', reason: 'High enough for clear atmospheric path.' },
      ],
    },
    {
      name: 'Images',
      items: [
        { name: 'Primary image', reason: 'Placeholder image slot for object view.' },
        { name: 'Secondary image', reason: 'Placeholder reference image slot.' },
      ],
    },
    {
      name: 'Data',
      items: [
        { name: 'Contract fields', reason: 'Structured object contract placeholder.' },
        { name: 'Trace metadata', reason: 'Provider/source trace placeholder.' },
      ],
    },
  ],
}
