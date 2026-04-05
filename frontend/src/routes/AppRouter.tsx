import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import App from '../App'
import Progress from '../pages/Progress'
import SkyEnginePage from '../pages/SkyEnginePage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/sky-engine" element={<SkyEnginePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
