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
  { id: 'iss', name: 'ISS', reason: 'Overhead and very bright in the next window.' },
  { id: 'jupiter', name: 'Jupiter', reason: 'High altitude and clear line-of-sight.' },
  { id: 'm13', name: 'M13', reason: 'Dark-window target with strong visibility score.' },
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

export const liveBriefingItems = [
  { name: 'Observing score', reason: 'GOOD' },
  { name: 'Best target now', reason: 'M13' },
  { name: 'Next satellite pass', reason: 'ISS in 12 min' },
  { name: 'Moon impact', reason: 'Moderate' },
  { name: 'Active solar status', reason: 'Quiet' },
  { name: 'Above-horizon flights', reason: '2' },
]

export const liveBriefingActions = ['Open full briefing', 'Open news digest']

export const nowAboveMeItems = [
  { id: 'iss', name: '[Sat] ISS', reason: 'Overhead in short window, very bright track.' },
  { id: 'jupiter', name: '[Planet] Jupiter', reason: 'High in SE with stable visibility.' },
  { id: 'm13', name: '[DSO] M13', reason: 'Excellent contrast in current dark sector.' },
  { id: 'ual2401', name: '[Flight] UAL 2401', reason: 'Above-horizon pass with low visual interference.' },
]

export const eventsAlertsItems = [
  { name: '[Event] Meteor shower peak', reason: 'High activity expected in late window.' },
  { name: '[Event] ISS bright pass', reason: 'Visible path with strong brightness score.' },
  { name: '[Solar] Geomagnetic activity', reason: 'Minor activity; monitor aurora chance.' },
]

export const newsDigestItems = [
  { name: '[Solar] New active solar region', reason: 'Sun engine flagged elevated watch region.' },
  { name: '[Launch] Falcon 9 launch', reason: 'New payload impacts satellite tracking lists.' },
  { name: '[Planetary] New Mars image', reason: 'Solar-system context media update available.' },
  { name: '[Research] New exoplanet research', reason: 'Deep-sky knowledge stream updated.' },
]

export const engineQuickEntryItems = [
  { name: 'Earth Engine', reason: 'Earth-context surface and event context.' },
  { name: 'Solar Engine', reason: 'Solar region and activity context.' },
  { name: 'Satellite Engine', reason: 'Visible passes and satellite tracks.' },
  { name: 'Flight Engine', reason: 'Above-horizon air traffic context.' },
  { name: 'Solar System Engine', reason: 'Planets and moon context.' },
  { name: 'Deep Sky Engine', reason: 'Ranked deep-sky target context.' },
  { name: 'News & Knowledge Engine', reason: 'Cross-engine news and research context.' },
]

export const activeFiltersItems = [
  { name: 'visible satellites', reason: 'Only above-horizon satellite passes.' },
  { name: 'visible planets', reason: 'Planets with active sky visibility.' },
  { name: 'visible deep sky', reason: 'Targets within observing viability window.' },
  { name: 'above-horizon flights', reason: 'Flights intersecting current sky view.' },
  { name: 'active events', reason: 'Current relevance-window event subset.' },
]

export const quickToolsItems = [
  { name: 'Identify object in sky', reason: 'Resolve selected object context quickly.' },
  { name: 'Point telescope helper', reason: 'Use direction guidance placeholders.' },
  { name: 'Switch to red mode', reason: 'Night-adapted visual mode placeholder.' },
  { name: 'Track this object', reason: 'Save object follow-up placeholder.' },
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
  id: 'jupiter',
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

const ISS_DETAIL = {
  id: 'iss',
  objectName: 'ISS',
  objectMeta: 'Type: Satellite · Status: Next bright pass in 12 min',
  whyItMatters: 'High visibility and short lead-time make this a priority above-me target.',
  sections: [
    {
      name: 'Overview',
      items: [
        { name: 'Summary', reason: 'Bright, reliable pass candidate in current window.' },
        { name: 'Mission', reason: 'Crewed low-earth orbit station with frequent visibility passes.' },
      ],
    },
    {
      name: 'Sky Position',
      items: [
        { name: 'Track', reason: 'NW to SE traversal expected in local sky.' },
        { name: 'Peak', reason: 'High elevation segment available near mid-pass.' },
      ],
    },
    {
      name: 'Images',
      items: [
        { name: 'Live imagery', reason: 'Placeholder slot for latest station visuals.' },
        { name: 'Pass overlay', reason: 'Placeholder slot for pass-path preview.' },
      ],
    },
    {
      name: 'Data',
      items: [
        { name: 'Pass window', reason: 'Provider pass timing placeholder.' },
        { name: 'Ownership', reason: 'Agency/operator metadata placeholder.' },
      ],
    },
  ],
}

const M13_DETAIL = {
  id: 'm13',
  objectName: 'M13',
  objectMeta: 'Type: Deep Sky · Status: High-contrast window active',
  whyItMatters: 'One of the strongest deep-sky candidates under current darkness conditions.',
  sections: [
    {
      name: 'Overview',
      items: [
        { name: 'Summary', reason: 'Globular cluster with high confidence under current sky state.' },
        { name: 'Observing note', reason: 'Good candidate after bright-object calibration pass.' },
      ],
    },
    {
      name: 'Sky Position',
      items: [
        { name: 'Direction', reason: 'Hercules sector in active observing field.' },
        { name: 'Elevation', reason: 'Sufficient altitude for stable visual acquisition.' },
      ],
    },
    {
      name: 'Images',
      items: [
        { name: 'Reference image', reason: 'Placeholder deep-sky image tile.' },
        { name: 'Finder chart', reason: 'Placeholder locator chart for quick framing.' },
      ],
    },
    {
      name: 'Data',
      items: [
        { name: 'Classification', reason: 'Globular cluster contract metadata placeholder.' },
        { name: 'Recommended optics', reason: 'Suggested aperture and magnification placeholder.' },
      ],
    },
  ],
}

const UAL2401_DETAIL = {
  id: 'ual2401',
  objectName: 'UAL 2401',
  objectMeta: 'Type: Flight · Status: Above-horizon crossing active',
  whyItMatters: 'Short-term air-traffic visibility can affect observing and imaging decisions.',
  sections: [
    {
      name: 'Overview',
      items: [
        { name: 'Summary', reason: 'Live crossing in current sky sector.' },
        { name: 'Route relevance', reason: 'Potential visual interference near active target lane.' },
      ],
    },
    {
      name: 'Sky Position',
      items: [
        { name: 'Direction', reason: 'West-to-east crossing with moderate elevation.' },
        { name: 'Altitude', reason: 'High-altitude pass likely visible in dark sky.' },
      ],
    },
    {
      name: 'Images',
      items: [
        { name: 'Track preview', reason: 'Placeholder route overlay tile.' },
        { name: 'Context map', reason: 'Placeholder sky-track map image.' },
      ],
    },
    {
      name: 'Data',
      items: [
        { name: 'Aircraft type', reason: 'Flight registry metadata placeholder.' },
        { name: 'Speed', reason: 'Live telemetry placeholder for current segment.' },
      ],
    },
  ],
}

export const detailPanelProfiles = {
  jupiter: detailPanel,
  iss: ISS_DETAIL,
  m13: M13_DETAIL,
  ual2401: UAL2401_DETAIL,
}

export function resolveDetailPanelProfile(selectedObjectId) {
  if (typeof selectedObjectId !== 'string' || !selectedObjectId.trim()) return null
  const key = selectedObjectId.trim().toLowerCase()
  return detailPanelProfiles[key] || null
}
