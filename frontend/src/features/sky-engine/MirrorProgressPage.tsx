import React from 'react'
import { useSearchParams } from 'react-router-dom'

type MirrorClassRow = {
  class: string
  display_name: string
  status: string
  metadata_only: boolean
  expected_files: number
  expected_files_known: boolean
  existing_files: number
  runtime_file_count: number
  runtime_size: number
  runtime_path_exists: boolean
  missing_files_before: number
  downloaded_files: number
  downloaded_this_run: number
  failed_files: number
  sparse_missing_files: number
  failure_breakdown: Record<string, number>
  remaining_files: number
  percent_complete: number
  bytes_downloaded: number
  total_size: number
  speed_files_per_sec: number
  speed_mb_per_sec: number
  eta_seconds: number | null
  workers: number
  active_workers: number
  current_order: number | null
  source_root: string
  runtime_target_path: string
  vendor_target_path: string
  last_updated: string
  last_completed: string | null
  failed_files_path: string | null
  checksum_path: string | null
  log_path: string | null
  blocker: string | null
}

type MirrorStatusPayload = {
  warning: string
  global: {
    total_classes: number
    active_jobs: number
    completed_classes: number
    partial_classes: number
    blocked_classes: number
    total_downloaded_size: number
    total_runtime_size: number
    total_failed_files: number
    runtime_readiness_summary: string
    scanner_status: string
    scanner_runtime_forbidden_count: number | null
    last_updated: string
  }
  classes: MirrorClassRow[]
}

type VerifyCheck = {
  class: string
  status: string
  ok: boolean
  issues: string[]
  expected_files: number
  existing_files: number
  runtime_file_count: number
  failed_files: number
  remaining_files: number
}

type VerifyPayload = {
  ok: boolean
  checked_classes: number
  checks: VerifyCheck[]
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
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: { message: text } }
    }
  }
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ||
      `Request failed with ${res.status}`
    throw new Error(message)
  }
  return data
}

export default function MirrorProgressPage() {
  const [search] = useSearchParams()
  const [payload, setPayload] = React.useState<MirrorStatusPayload | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null)
  const [logPanel, setLogPanel] = React.useState<{ logs: string[]; failures: unknown[] } | null>(null)
  const [verifyPanel, setVerifyPanel] = React.useState<{ className: string; payload: VerifyPayload } | null>(null)
  const autostartDone = React.useRef(false)

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}/status`)
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      setPayload(data.data as MirrorStatusPayload)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  React.useEffect(() => {
    const source = new EventSource(`${API}/stream`)
    source.onmessage = (event) => {
      try {
        setPayload(JSON.parse(event.data) as MirrorStatusPayload)
      } catch {
        // fallback polling handles bad frames
      }
    }
    source.onerror = () => {
      source.close()
      const id = setInterval(() => {
        void refresh()
      }, 2000)
      return () => clearInterval(id)
    }
    return () => source.close()
  }, [refresh])

  const startClass = async (className: string) => {
    try {
      setBusy(true)
      await post('/start', { class: className })
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job')
    } finally {
      setBusy(false)
    }
  }
  const resumeClass = async (className: string) => {
    try {
      setBusy(true)
      await post('/resume', { class: className })
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume job')
    } finally {
      setBusy(false)
    }
  }
  const cancelClass = async (className: string) => {
    try {
      setBusy(true)
      await post('/cancel', { class: className })
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job')
    } finally {
      setBusy(false)
    }
  }
  const startRequired = async (autostart = false) => {
    try {
      setBusy(true)
      await post('/start-all', { autostart })
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start required jobs')
    } finally {
      setBusy(false)
    }
  }
  const startProfile = async (profile: 'required' | 'all_fast' | 'all_full', autostart = false) => {
    try {
      setBusy(true)
      await post('/start-all', { autostart, profile })
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to start profile: ${profile}`)
    } finally {
      setBusy(false)
    }
  }
  const resumeAll = async () => {
    try {
      setBusy(true)
      for (const row of payload?.classes || []) await post('/resume', { class: row.class })
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume all jobs')
    } finally {
      setBusy(false)
    }
  }
  const cancelAll = async () => {
    try {
      setBusy(true)
      await post('/cancel-all')
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel all jobs')
    } finally {
      setBusy(false)
    }
  }
  const runScanner = async () => {
    try {
      setBusy(true)
      await post('/scan')
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run scanner')
    } finally {
      setBusy(false)
    }
  }
  const verifyClass = async (className: string) => {
    try {
      setBusy(true)
      const response = await post(`/verify/${className}`)
      const payload = (response as { data?: VerifyPayload })?.data
      if (payload) {
        setVerifyPanel({ className, payload })
      }
      await refresh()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify class')
    } finally {
      setBusy(false)
    }
  }
  const openLogs = async (className: string) => {
    try {
      setSelectedClass(className)
      const logsRes = await fetch(`${API}/logs/${className}`)
      const logsText = await logsRes.text()
      const logs = logsText ? JSON.parse(logsText) : {}
      const failRes = await fetch(`${API}/failures/${className}`)
      const failText = await failRes.text()
      const fails = failText ? JSON.parse(failText) : {}
      setLogPanel({ logs: logs.data?.job?.stdout_tail || [], failures: fails.data?.failed_files || [] })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    }
  }

  React.useEffect(() => {
    if (autostartDone.current) return
    if (search.get('autostart') !== '1') return
    autostartDone.current = true
    void startRequired(true)
  }, [search])

  return (
    <main style={{ padding: 20, background: '#0a1220', minHeight: '100vh', color: '#d8e4ff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ margin: 0 }}>ORAS Skydata Mirror Manager</h1>
      <div style={{ marginTop: 8, padding: 10, background: '#1b2233', borderRadius: 8, color: '#b3c4e5' }}>
        Admin mirror jobs may fetch external sources. User runtime remains ORAS-hosted only.
      </div>
      {error ? <p style={{ color: '#ff8888' }}>{error}</p> : null}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(140px,1fr))', gap: 10, marginTop: 14 }}>
        <Metric label="Active Jobs" value={String(payload?.global.active_jobs || 0)} />
        <Metric label="Completed" value={String(payload?.global.completed_classes || 0)} />
        <Metric label="Partial" value={String(payload?.global.partial_classes || 0)} />
        <Metric label="Blocked" value={String(payload?.global.blocked_classes || 0)} />
        <Metric label="Downloaded" value={formatBytes(payload?.global.total_downloaded_size || 0)} />
        <Metric label="Failed Files" value={String(payload?.global.total_failed_files || 0)} />
      </section>

      <section style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button disabled={busy} onClick={() => void startRequired(false)}>Start Required</button>
        <button disabled={busy} onClick={() => void startProfile('all_fast', true)}>Start All Fast</button>
        <button disabled={busy} onClick={() => void startProfile('all_full', true)}>Start All Full</button>
        <button disabled={busy} onClick={() => void resumeAll()}>Resume All</button>
        <button disabled={busy} onClick={() => void cancelAll()}>Cancel All</button>
        <button disabled={busy} onClick={() => void refresh()}>Refresh</button>
        <button disabled={busy} onClick={() => void runScanner()}>Run Scanner</button>
        <a href="/sky-engine" style={{ color: '#88b4ff', padding: '8px 10px' }}>Open Runtime</a>
      </section>

      <div style={{ marginTop: 14, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1450 }}>
          <thead>
            <tr>
              {['Dataset', 'Status', 'Progress', 'Files', 'Speed', 'ETA', 'Workers', 'Source', 'Runtime Path', 'Updated', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(payload?.classes || []).map((row) => {
              const pct = Math.max(0, Math.min(100, row.percent_complete || 0))
              return (
                <tr key={row.class}>
                  <td style={tdStyle}><strong>{row.display_name}</strong><div style={smallStyle}>{row.class}</div></td>
                  <td style={tdStyle}><StatusBadge status={row.status} /></td>
                  <td style={tdStyle}>
                    <div style={{ background: '#1b2c45', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#34d399' }} />
                    </div>
                    <div style={smallStyle}>{pct.toFixed(2)}%</div>
                  </td>
                  <td style={tdStyle}>
                    <div>runtime {row.runtime_file_count} / {formatBytes(row.runtime_size || 0)}</div>
                    <div style={smallStyle}>expected {row.expected_files_known ? row.expected_files : 'unknown'} / cached {row.existing_files}</div>
                    <div style={smallStyle}>downloaded this run {row.downloaded_this_run}</div>
                    <div style={smallStyle}>failed {row.failed_files} / sparse {row.sparse_missing_files} / remaining {row.remaining_files}</div>
                    {Object.keys(row.failure_breakdown || {}).length > 0 ? (
                      <div style={smallStyle}>failures {Object.entries(row.failure_breakdown).map(([k, v]) => `${k}:${v}`).join(', ')}</div>
                    ) : null}
                  </td>
                  <td style={tdStyle}>
                    <div>{(row.speed_files_per_sec || 0).toFixed(2)} files/s</div>
                    <div style={smallStyle}>{(row.speed_mb_per_sec || 0).toFixed(2)} MB/s</div>
                  </td>
                  <td style={tdStyle}>{formatEta(row.eta_seconds)}</td>
                  <td style={tdStyle}>{row.workers} / {row.active_workers || 0}</td>
                  <td style={tdStyle}><code style={codeStyle}>{row.source_root || '--'}</code></td>
                  <td style={tdStyle}><code style={codeStyle}>{row.runtime_target_path || '--'}</code><div style={smallStyle}>{formatBytes(row.bytes_downloaded || 0)}</div></td>
                  <td style={tdStyle}><div style={smallStyle}>{row.last_updated || '--'}</div><div style={smallStyle}>{row.last_completed || ''}</div>{row.blocker ? <div style={{ color: '#ff9d9d', fontSize: 11 }}>{row.blocker}</div> : null}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button disabled={busy} onClick={() => void startClass(row.class)}>Start</button>
                      <button disabled={busy} onClick={() => void resumeClass(row.class)}>Resume</button>
                      <button disabled={busy} onClick={() => void cancelClass(row.class)}>Cancel</button>
                      <button disabled={busy} onClick={() => void openLogs(row.class)}>View Logs</button>
                      <button disabled={busy} onClick={() => void verifyClass(row.class)}>Verify</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {logPanel && (
        <section style={{ marginTop: 16, background: '#111c30', border: '1px solid #223858', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Logs / Failures — {selectedClass}</strong>
            <button onClick={() => setLogPanel(null)}>Close</button>
          </div>
          <h4>Recent logs</h4>
          <pre style={{ maxHeight: 220, overflow: 'auto', background: '#0a1322', padding: 10 }}>{(logPanel.logs || []).slice(-40).join('\n')}</pre>
          <h4>Failed entries</h4>
          <pre style={{ maxHeight: 220, overflow: 'auto', background: '#0a1322', padding: 10 }}>{JSON.stringify((logPanel.failures || []).slice(0, 100), null, 2)}</pre>
        </section>
      )}

      {verifyPanel && (
        <section style={{ marginTop: 16, background: '#101a2b', border: '1px solid #27415f', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Verify Results — {verifyPanel.className}</strong>
            <button onClick={() => setVerifyPanel(null)}>Close</button>
          </div>
          <div style={{ marginTop: 6, ...smallStyle }}>
            overall: {verifyPanel.payload.ok ? 'ok' : 'issues found'} / checked classes: {verifyPanel.payload.checked_classes}
          </div>
          <pre style={{ maxHeight: 260, overflow: 'auto', background: '#0a1322', padding: 10, marginTop: 8 }}>
            {JSON.stringify(verifyPanel.payload, null, 2)}
          </pre>
        </section>
      )}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 10, background: '#142036', border: '1px solid #243f62', borderRadius: 8 }}>
      <div style={smallStyle}>{label}</div>
      <div style={{ marginTop: 4, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: '#16a34a',
    complete: '#2563eb',
    partial: '#7c3aed',
    blocked: '#7f1d1d',
    failed: '#dc2626',
    interrupted: '#d97706',
    paused: '#d97706',
    unknown: '#a16207',
    missing: '#334155',
    queued: '#475569',
    not_started: '#475569',
    cancelled: '#6b7280',
  }
  return <span style={{ background: colors[status] || '#334155', borderRadius: 6, padding: '3px 8px', fontSize: 11 }}>{status}</span>
}

const thStyle: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #223554', padding: '8px 6px', fontSize: 12, color: '#a6bbdf' }
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #1c2e4a', padding: '8px 6px', verticalAlign: 'top', fontSize: 13 }
const smallStyle: React.CSSProperties = { color: '#9fb6da', fontSize: 11 }
const codeStyle: React.CSSProperties = { color: '#9fb6da', fontSize: 11, wordBreak: 'break-all', whiteSpace: 'normal' }
