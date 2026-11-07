// Real React workspace/router. The browser test explicitly stubs only science
// responses and the heavy scene, so these checks cannot qualify science or GPU.
import React from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter,Route,Routes,useLocation} from 'react-router-dom'
import MissionWorkspace from '../../src/features/missions/MissionWorkspace'

function LocationProbe(){const location=useLocation();return <output data-testid="location">{location.pathname+location.search}</output>}
const initial=new URLSearchParams(location.search).get('route')||'/missions/voyager1'
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={[initial]}><LocationProbe/><Routes><Route path="/missions/:mission" element={<MissionWorkspace/>}/><Route path="*" element={<p>Returned to another mode</p>}/></Routes></MemoryRouter>)
