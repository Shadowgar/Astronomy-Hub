import React, { useEffect, useState } from 'react'

import { getRuntimeFrameUrl, probeRuntime } from './stellarium/stellariumRuntimeBridge'
import { discoverRuntime, type RuntimeDiscovery, type RuntimeKind } from './stellarium/stellariumRuntimeDiscovery'

const RECHECK_RUNTIME_MESSAGE = 'oras-sky-engine:recheck-runtime'
const OPEN_STANDALONE_RUNTIME_MESSAGE = 'oras-sky-engine:open-standalone-runtime'

type RuntimeStatus = 'checking' | 'ready' | 'missing'

type RuntimeState = {
  discovery: RuntimeDiscovery
  status: RuntimeStatus
  runtimeKind: RuntimeKind | null
  frameUrl: string
}

function createDiscovery() {
  const hostname = typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname
  const browserOrigin = typeof window === 'undefined' ? 'http://127.0.0.1:4173' : window.location.origin
  return discoverRuntime(hostname, browserOrigin)
}

function isRuntimeMessage(message: unknown): message is string {
  return message === RECHECK_RUNTIME_MESSAGE || message === OPEN_STANDALONE_RUNTIME_MESSAGE
}

export default function RuntimeHost() {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    discovery: createDiscovery(),
    status: 'checking',
    runtimeKind: null,
    frameUrl: createDiscovery().sameOriginRuntimeUrl,
  })

  useEffect(() => {
    let cancelled = false
    const discovery = createDiscovery()

    setRuntimeState({ discovery, status: 'checking', runtimeKind: null, frameUrl: discovery.sameOriginRuntimeUrl })

    probeRuntime(discovery).then((probeResult) => {
      if (cancelled) {
        return
      }
      setRuntimeState({
        discovery,
        status: probeResult.isAvailable ? 'ready' : 'missing',
        runtimeKind: probeResult.runtimeKind,
        frameUrl: probeResult.runtimeUrl,
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  const retryDiscovery = () => {
    const discovery = createDiscovery()
    setRuntimeState({ discovery, status: 'checking', runtimeKind: null, frameUrl: discovery.sameOriginRuntimeUrl })
    void probeRuntime(discovery).then((probeResult) => {
      setRuntimeState({
        discovery,
        status: probeResult.isAvailable ? 'ready' : 'missing',
        runtimeKind: probeResult.runtimeKind,
        frameUrl: probeResult.runtimeUrl,
      })
    })
  }

  const openStandaloneRuntime = () => {
    const discovery = createDiscovery()
    const runtimeKind = runtimeState.status === 'ready' && runtimeState.runtimeKind ? runtimeState.runtimeKind : 'same-origin'
    window.open(getRuntimeFrameUrl(discovery, runtimeKind), '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    const handleRuntimeMessage = (event: MessageEvent) => {
      const discovery = createDiscovery()
      const sameOriginRuntimeOrigin = new URL(discovery.sameOriginRuntimeUrl).origin
      const legacyRuntimeOrigin = new URL(discovery.legacyRuntimeUrl).origin

      if ((event.origin !== sameOriginRuntimeOrigin && event.origin !== legacyRuntimeOrigin) || !isRuntimeMessage(event.data)) {
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

  const frameUrl = runtimeState.frameUrl

  return <div className="oras-runtime-host">
    <h1 className="oras-sky-title">Interactive sky</h1>
    {runtimeState.status === 'ready' ? <iframe src={frameUrl} title="ORAS Sky-Engine Runtime" allowFullScreen/> :
      <section className="oras-runtime-message" aria-label="Sky availability">
        <h2>{runtimeState.status === 'checking' ? 'Opening the interactive sky…' : 'The interactive sky is unavailable'}</h2>
        <p className="oras-caption" role="status">{runtimeState.status === 'checking' ? 'Checking the ORAS planetarium.' : 'The planetarium could not be reached. Please try again shortly.'}</p>
        <div className="oras-actions">
          <button className="oras-button oras-button--quiet" type="button" onClick={retryDiscovery} disabled={runtimeState.status === 'checking'}>Retry Sky</button>
          <a className="oras-text-link" href={frameUrl} target="_blank" rel="noreferrer">Open Sky in a new tab ↗</a>
        </div>
      </section>}
  </div>
}
