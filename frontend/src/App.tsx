import { useEffect, useState } from 'react'

type Health = { status: string; env: string; version: string }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setHealth)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <main>
      <h1>FitTrack</h1>
      <p className="muted">Personal calorie, macro and weight tracker.</p>
      <section className="card">
        <strong>Phase 0 — pipeline check</strong>
        <p>
          API:{' '}
          {health ? (
            <span className="ok">ok</span>
          ) : error ? (
            <span className="err">{error}</span>
          ) : (
            <span className="muted">checking…</span>
          )}
        </p>
        {health && (
          <p className="muted">
            env <code>{health.env}</code> · version <code>{health.version}</code>
          </p>
        )}
      </section>
    </main>
  )
}
