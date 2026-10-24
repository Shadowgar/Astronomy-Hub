import React,{lazy,Suspense} from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import WorkspaceShell from '../features/workspace/WorkspaceShell'
import OrasAppShell from '../components/shell/OrasAppShell'
import MirrorLiteProgressPage from '../features/sky-engine/MirrorLiteProgressPage'
import MirrorProgressPage from '../features/sky-engine/MirrorProgressPage'
import SkyOverOrasNowRedirect from '../features/sky-engine/SkyOverOrasNowRedirect'
import Progress from '../pages/Progress'
import TonightPage from '../features/tonight/TonightPage'
import ObservePage from '../features/observe/ObservePage'

const PlanetWorkspace=lazy(()=>import('../features/planet/PlanetWorkspace'))
const SolarWorkspace=lazy(()=>import('../features/solar/SolarWorkspace'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspaceShell mode="sky" />} />
        <Route path="/sky-engine" element={<WorkspaceShell mode="sky" />} />
        <Route path="/earth" element={<WorkspaceShell mode="earth" />} />
        <Route path="/planet-view/:body" element={<Suspense fallback={<p role="status">Opening Planet View…</p>}><PlanetWorkspace/></Suspense>} />
        <Route path="/solar-system" element={<Suspense fallback={<p role="status">Opening Solar System…</p>}><SolarWorkspace/></Suspense>} />
        <Route element={<OrasAppShell />}>
          <Route path="/observe" element={<ObservePage />} />
          <Route path="/tonight" element={<TonightPage />} />
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
