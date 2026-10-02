import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import HomePage from '../features/home/HomePage'
import OrasAppShell from '../components/shell/OrasAppShell'
import MirrorLiteProgressPage from '../features/sky-engine/MirrorLiteProgressPage'
import MirrorProgressPage from '../features/sky-engine/MirrorProgressPage'
import SkyOverOrasNowRedirect from '../features/sky-engine/SkyOverOrasNowRedirect'
import SkyEnginePage from '../features/sky-engine/SkyEnginePage'
import Progress from '../pages/Progress'
import TonightPage from '../features/tonight/TonightPage'
import ObservePage from '../features/observe/ObservePage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<OrasAppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/observe" element={<ObservePage />} />
          <Route path="/tonight" element={<TonightPage />} />
          <Route path="/sky-engine" element={<SkyEnginePage />} />
        </Route>
        <Route path="/progress" element={<Progress />} />
        <Route path="/sky-engine/oras-now" element={<SkyOverOrasNowRedirect />} />
        <Route path="/sky-over-oras-now" element={<SkyOverOrasNowRedirect />} />
        <Route path="/sky-engine/download-progress" element={<MirrorLiteProgressPage />} />
        <Route path="/sky-engine/mirror-progress" element={<MirrorProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
