import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import App from '../App'
import Progress from '../pages/Progress'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
