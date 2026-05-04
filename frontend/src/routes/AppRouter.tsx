import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import App from '../App'
import StellariumSkyPage from '../features/stellarium-sky/StellariumSkyPage'
import Progress from '../pages/Progress'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/sky-engine" element={<StellariumSkyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
