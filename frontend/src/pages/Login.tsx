import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../api'

export default function Login() {
  const [token, setTok] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function go(e: React.FormEvent) {
    e.preventDefault()
    setToken(token.trim())
    try { await api.whoami(); nav('/', { replace: true }) }
    catch { setToken(null); setErr('That token was not accepted.') }
  }

  return (
    <main>
      <h1>FitTrack</h1>
      <p className="muted">Personal tracker. Paste your access token once; it stays on this device.</p>
      <form className="card" onSubmit={go}>
        <div className="field">
          <label>Access token</label>
          <input type="password" value={token} onChange={(e) => setTok(e.target.value)} autoComplete="off" autoFocus />
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn primary block" style={{ marginTop: 12 }} type="submit" disabled={!token.trim()}>Sign in</button>
      </form>
    </main>
  )
}
