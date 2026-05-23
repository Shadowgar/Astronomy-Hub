import React from 'react'
import EngineModuleCard from './EngineModuleCard'
import { engineModules } from './foundationData'

export default function EngineGrid() {
  return (
    <section className="section">
      <div className="section-grid one-col">
        <div className="module panel">
          <h2>Engine Module Grid</h2>
          <div className="foundation-module-grid">
            {engineModules.map((moduleItem) => (
              <EngineModuleCard key={moduleItem.name} title={moduleItem.name} items={moduleItem.items} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
