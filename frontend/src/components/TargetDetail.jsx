/* eslint-disable react/prop-types */
import React from 'react'

export default function TargetDetail({ target }) {
  return (
    <div className="target-detail">
      <div className="small">
        <span>elevation_band: {target.elevation_band}</span> · <span>best_time: {target.best_time}</span>
      </div>
      <div className="small">
        <span>difficulty: {target.difficulty}</span>
      </div>
      <p>{target.reason}</p>
    </div>
  )
}
