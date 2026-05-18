import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import App from '../App'
import MirrorProgressPage from '../features/sky-engine/MirrorProgressPage'
import SkyOverOrasNowRedirect from '../features/sky-engine/SkyOverOrasNowRedirect'
import SkyEnginePage from '../features/sky-engine/SkyEnginePage'
import Progress from '../pages/Progress'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/sky-engine" element={<SkyEnginePage />} />
        <Route path="/sky-engine/oras-now" element={<SkyOverOrasNowRedirect />} />
        <Route path="/sky-over-oras-now" element={<SkyOverOrasNowRedirect />} />
        <Route path="/sky-engine/mirror-progress" element={<MirrorProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
