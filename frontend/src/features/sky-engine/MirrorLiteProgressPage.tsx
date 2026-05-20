import React from 'react'

type MirrorLiteRow = {
  class: string
  display_name: string
  status: string
  percent_complete: number
  runtime_file_count: number
  downloaded_this_run: number
  failed_files: number
  remaining_files: number
  bytes_downloaded: number
  speed_mb_per_sec: number
  eta_seconds: number | null
}

type MirrorLitePayload = {
  global: {
    active_jobs: number
    completed_classes: number
    total_failed_files: number
    total_downloaded_size: number
    runtime_readiness_summary: string
    last_updated: string
  }
  classes: MirrorLiteRow[]
}

const API = '/api/sky/mirror'

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatEta(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '--:--:--'
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

async function post(path: string, body: unknown = {}) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }
}

export default function MirrorLiteProgressPage() {
  const [payload, setPayload] = React.useState<MirrorLitePayload | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}/status`)
      if (!res.ok) {
        throw new Error(`Status request failed with ${res.status}`)
      }
      const json = await res.json()
      setPayload((json?.data || null) as MirrorLitePayload)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    const id = setInterval(() => {
      void refresh()
    }, 2000)
    return () => clearInterval(id)
  }, [refresh])

  const startLiveStream = async () => {
    try {
      setBusy(true)
      await post('/start-all', { autostart: true, profile: 'live_stream' })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start live stream')
    } finally {
      setBusy(false)
    }
  }

  const resumeAll = async () => {
    try {
      setBusy(true)
      for (const row of payload?.classes || []) {
        await post('/resume', { class: row.class })
      }
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume all')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={{ padding: 16, background: '#0b1422', color: '#e5ecff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>ORAS Download Progress (Lite)</h1>
      <p style={{ marginTop: 4, opacity: 0.85 }}>
        Lightweight page for long-running mirror downloads. Safe to stop today and resume tomorrow.
      </p>

      {error ? <p style={{ color: '#ff9e9e' }}>{error}</p> : null}

      <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button disabled={busy} onClick={() => void startLiveStream()}>Start Live Stream</button>
        <button disabled={busy} onClick={() => void resumeAll()}>Resume All</button>
        <button disabled={busy} onClick={() => void refresh()}>Refresh</button>
        <a href="/sky-engine/mirror-progress" style={{ color: '#9fc2ff', padding: '8px 0' }}>Open Full Manager</a>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(140px,1fr))', gap: 8, marginBottom: 12 }}>
        <div style={{ background: '#121d31', borderRadius: 6, padding: 10 }}>Active: {payload?.global.active_jobs || 0}</div>
        <div style={{ background: '#121d31', borderRadius: 6, padding: 10 }}>Completed: {payload?.global.completed_classes || 0}</div>
        <div style={{ background: '#121d31', borderRadius: 6, padding: 10 }}>Failed: {payload?.global.total_failed_files || 0}</div>
        <div style={{ background: '#121d31', borderRadius: 6, padding: 10 }}>Downloaded: {formatBytes(payload?.global.total_downloaded_size || 0)}</div>
      </section>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
          <thead>
            <tr>
              {['Dataset', 'Status', 'Progress', 'This Run', 'Failed', 'Remaining', 'Speed', 'ETA'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #294063' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(payload?.classes || []).map((row) => {
              const pct = Math.max(0, Math.min(100, row.percent_complete || 0))
              return (
                <tr key={row.class}>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>
                    <strong>{row.display_name}</strong>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{row.class}</div>
                  </td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>{row.status}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>
                    <div style={{ background: '#1c2f4d', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#36d399' }} />
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{pct.toFixed(2)}%</div>
                  </td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>{row.downloaded_this_run} / {formatBytes(row.bytes_downloaded || 0)}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>{row.failed_files}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>{row.remaining_files}</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>{(row.speed_mb_per_sec || 0).toFixed(2)} MB/s</td>
                  <td style={{ padding: '8px 6px', borderBottom: '1px solid #1a2b45' }}>{formatEta(row.eta_seconds)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}
