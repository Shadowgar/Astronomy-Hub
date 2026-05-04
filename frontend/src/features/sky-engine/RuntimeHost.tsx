import React, { useEffect, useState } from 'react'

import { getRuntimeFrameUrl, probeRuntime } from './stellarium/stellariumRuntimeBridge'
import { discoverRuntime, type RuntimeDiscovery } from './stellarium/stellariumRuntimeDiscovery'

const RECHECK_RUNTIME_MESSAGE = 'oras-sky-engine:recheck-runtime'
const OPEN_STANDALONE_RUNTIME_MESSAGE = 'oras-sky-engine:open-standalone-runtime'

type RuntimeStatus = 'checking' | 'ready' | 'missing'

type RuntimeState = {
  discovery: RuntimeDiscovery
  status: RuntimeStatus
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  height: '100vh',
  position: 'relative',
  overflow: 'hidden',
  background: 'radial-gradient(circle at top, #17304f 0%, #09111c 52%, #04070d 100%)',
  color: '#f3f7fb',
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

const buttonStyle: React.CSSProperties = {
  border: '1px solid rgba(142, 184, 234, 0.4)',
  borderRadius: '999px',
  background: 'rgba(4, 7, 13, 0.72)',
  backdropFilter: 'blur(18px)',
  color: '#f3f7fb',
  padding: '8px 14px',
  fontSize: '0.88rem',
  cursor: 'pointer',
}

const linkStyle: React.CSSProperties = {
  ...buttonStyle,
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
}

const frameWrapStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  padding: '0',
}

const frameStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 0,
  display: 'block',
  background: '#000',
}

const panelWrapStyle: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  minHeight: '100vh',
  padding: '48px 24px',
}

const panelStyle: React.CSSProperties = {
  width: 'min(900px, 100%)',
  padding: '32px',
  borderRadius: '24px',
  border: '1px solid rgba(243, 247, 251, 0.12)',
  background: 'rgba(8, 14, 24, 0.82)',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: '#8eb8ea',
}

const copyStyle: React.CSSProperties = {
  margin: '0 0 16px',
  lineHeight: 1.7,
  color: 'rgba(243, 247, 251, 0.86)',
}

const codeStyle: React.CSSProperties = {
  margin: '0 0 14px',
  padding: '14px 16px',
  borderRadius: '16px',
  background: '#050b13',
  border: '1px solid rgba(243, 247, 251, 0.08)',
  overflowX: 'auto',
  fontSize: '0.92rem',
  lineHeight: 1.6,
}

const detailListStyle: React.CSSProperties = {
  margin: '0',
  paddingLeft: '1.2rem',
  lineHeight: 1.8,
  color: 'rgba(243, 247, 251, 0.86)',
}

function createDiscovery() {
  const hostname = typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname
  return discoverRuntime(hostname)
}

function isRuntimeMessage(message: unknown): message is string {
  return message === RECHECK_RUNTIME_MESSAGE || message === OPEN_STANDALONE_RUNTIME_MESSAGE
}

export default function RuntimeHost() {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    discovery: createDiscovery(),
    status: 'checking',
  })

  useEffect(() => {
    let cancelled = false
    const discovery = createDiscovery()

    setRuntimeState({ discovery, status: 'checking' })

    probeRuntime(discovery).then((isAvailable) => {
      if (cancelled) {
        return
      }
      setRuntimeState({ discovery, status: isAvailable ? 'ready' : 'missing' })
    })

    return () => {
      cancelled = true
    }
  }, [])

  const retryDiscovery = () => {
    const discovery = createDiscovery()
    setRuntimeState({ discovery, status: 'checking' })
    void probeRuntime(discovery).then((isAvailable) => {
      setRuntimeState({ discovery, status: isAvailable ? 'ready' : 'missing' })
    })
  }

  const openStandaloneRuntime = () => {
    const discovery = createDiscovery()
    window.open(getRuntimeFrameUrl(discovery), '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    const handleRuntimeMessage = (event: MessageEvent) => {
      const discovery = createDiscovery()
      const runtimeOrigin = new URL(discovery.runtimeUrl).origin

      if (event.origin !== runtimeOrigin || !isRuntimeMessage(event.data)) {
        return
      }

      if (event.data === RECHECK_RUNTIME_MESSAGE) {
        retryDiscovery()
        return
      }

      openStandaloneRuntime()
    }

    window.addEventListener('message', handleRuntimeMessage)

    return () => {
      window.removeEventListener('message', handleRuntimeMessage)
    }
  }, [])

  const frameUrl = getRuntimeFrameUrl(runtimeState.discovery)

  if (runtimeState.status === 'ready') {
    return (
      <main style={shellStyle}>
        <section style={frameWrapStyle} aria-label="ORAS Sky-Engine runtime viewport">
          <iframe src={frameUrl} title="ORAS Sky-Engine Runtime" style={frameStyle} />
        </section>
      </main>
    )
  }

  return (
    <main style={shellStyle}>
      <section style={panelWrapStyle}>
        <div style={panelStyle}>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05 }}>ORAS Sky-Engine unavailable</h1>
          <p style={copyStyle}>
            {runtimeState.status === 'checking'
              ? 'Checking the vendored ORAS Sky-Engine runtime.'
              : 'The vendored runtime is not responding. Start it with the command below, then retry.'}
          </p>

          <h2 style={sectionTitleStyle}>Next Launch Command</h2>
          <pre style={codeStyle}>{runtimeState.discovery.launchCommand}</pre>

          <h2 style={sectionTitleStyle}>If First Launch Fails</h2>
          <pre style={codeStyle}>{runtimeState.discovery.installCommand}</pre>
          <pre style={codeStyle}>{runtimeState.discovery.buildCommand}</pre>

          <div style={{ ...actionRowStyle, marginBottom: '20px' }}>
            <button style={buttonStyle} type="button" onClick={retryDiscovery}>
              {runtimeState.status === 'checking' ? 'Checking Runtime...' : 'Recheck Runtime'}
            </button>
            <a href={frameUrl} target="_blank" rel="noreferrer" style={linkStyle}>
              Open Standalone Runtime
            </a>
          </div>

          <h2 style={sectionTitleStyle}>Moved Runtime Paths</h2>
          <ul style={detailListStyle}>
            <li>Source root: {runtimeState.discovery.sourceRoot}</li>
            <li>Working directory: {runtimeState.discovery.workingDirectory}</li>
            <li>Build output: {runtimeState.discovery.buildDirectory}</li>
            <li>Sky data: {runtimeState.discovery.skyDataDirectory}</li>
          </ul>
        </div>
      </section>
    </main>
  )
}