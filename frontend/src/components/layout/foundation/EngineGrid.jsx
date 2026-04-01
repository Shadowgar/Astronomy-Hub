import React from 'react'
import EngineModuleCard from './EngineModuleCard'

const ENGINE_MODULES = [
  {
    name: 'Conditions',
    rows: ['Sky quality summary placeholder', 'Seeing/transparency placeholder'],
  },
  {
    name: 'Satellites',
    rows: ['Visible pass window placeholder', 'Tracking candidate placeholder'],
  },
  {
    name: 'Solar System',
    rows: ['Top planet visibility placeholder', 'Moon/planet context placeholder'],
  },
  {
    name: 'Deep Sky',
    rows: ['Target shortlist placeholder', 'Magnitude window placeholder'],
  },
  {
    name: 'Sun',
    rows: ['Solar activity placeholder', 'Daylight constraint placeholder'],
  },
  {
    name: 'Flights',
    rows: ['Overflight candidate placeholder', 'Altitude track placeholder'],
  },
  {
    name: 'Events',
    rows: ['Transient event placeholder', 'Priority timing placeholder'],
  },
]

export default function EngineGrid() {
  return (
    <section className="section">
      <div className="section-grid one-col">
        <div className="module panel">
          <h2>Engine Module Grid</h2>
          <div className="foundation-module-grid">
            {ENGINE_MODULES.map((moduleItem) => (
              <EngineModuleCard key={moduleItem.name} title={moduleItem.name} rows={moduleItem.rows} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
