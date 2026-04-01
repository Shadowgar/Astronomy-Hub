import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'

const SCENE_ROWS = ['Scene frame placeholder', 'Object layer placeholder', 'Visibility cues placeholder']

export default function ScenePanel() {
  return (
    <section className="module scene-module panel">
      <h2>Main Scene Area</h2>
      <div className="foundation-scene-body">
        <p>Static scene foundation placeholder.</p>
        <ul className="foundation-list">
          {SCENE_ROWS.map((row) => (
            <PlaceholderItemRow key={row} text={row} />
          ))}
        </ul>
      </div>
      <div className="above-me-scene__sky" role="img" aria-label="Main scene placeholder" />
    </section>
  )
}
