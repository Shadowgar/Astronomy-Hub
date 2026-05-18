import React from 'react'
import { Navigate } from 'react-router-dom'

import { buildSkyOverOrasNowPath } from './skyOverOrasNow'

export default function SkyOverOrasNowRedirect() {
  return <Navigate to={buildSkyOverOrasNowPath()} replace />
}