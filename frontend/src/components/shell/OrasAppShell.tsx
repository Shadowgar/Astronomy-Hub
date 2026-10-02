import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router-dom'
import { getObservePath } from '../../features/observe/model'
import './publicShell.css'

/** The host owns navigation and landmarks; the contained sky owns its renderer. */
export default function OrasAppShell() {
  const location = useLocation()
  const observe = useMatch('/observe')
  const tonight = useMatch('/tonight')
  const sky = useMatch('/sky-engine')
  const earth = useMatch('/earth')
  const runtime=sky || earth
  const observePath = observe ? getObservePath(location.search) : '/observe'
  const date = tonight ? new URLSearchParams(location.search).get('date') : null
  const tonightPath = date ? `/tonight?date=${encodeURIComponent(date)}` : '/tonight'
  return <div className={`oras-app${runtime ? ' oras-app--sky' : ''}`}>
    <a className="oras-skip" href="#main-content">Skip to content</a>
    <header className="oras-header">
      <div className="oras-header-inner">
        <Link className="oras-brand" to="/" aria-label="ORAS Astronomy Hub home"><span>ORAS</span><span>Astronomy Hub</span></Link>
        <nav className="oras-nav" aria-label="Primary navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to={observePath}>Observe</NavLink>
          <NavLink to={tonightPath}>Tonight</NavLink>
          <NavLink to="/sky-engine">Sky</NavLink>
          <NavLink to="/earth">Earth</NavLink>
        </nav>
      </div>
    </header>
    <main id="main-content" tabIndex={-1} className="oras-main"><Outlet/></main>
    {!runtime ? <footer className="oras-footer"><span>ORAS Astronomy Hub</span><span>A sky worth getting to know.</span></footer> : null}
  </div>
}
