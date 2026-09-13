import { useEffect, useState } from 'react'
import { api, r0 } from '../api'

const PRESETS: Record<string, { p: number; c: number; f: number }> = {
  'Balanced (30/40/30)': { p: 0.30, c: 0.40, f: 0.30 },
  'High protein (40/30/30)': { p: 0.40, c: 0.30, f: 0.30 },
  'Low carb (35/20/45)': { p: 0.35, c: 0.20, f: 0.45 },
  'Keto (25/5/70)': { p: 0.25, c: 0.05, f: 0.70 },
}

export default function Goals() {
  const [kcal, setKcal] = useState('2000'); const [p, setP] = useState('150'); const [c, setC] = useState('200'); const [f, setF] = useState('65'); const [fiber, setFiber] = useState('30')
  const [net, setNet] = useState(false)
  const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.goal().then((g) => { if (g) { setKcal(String(g.kcal)); setP(String(g.protein_g)); setC(String(g.carbs_g)); setF(String(g.fat_g)); setFiber(String(g.fiber_g)); setNet(g.net_carb_mode) } }).catch((e) => setErr(e.message))
  }, [])

  const K = parseInt(kcal) || 0
  const macroKcal = (parseInt(p) || 0) * 4 + (parseInt(c) || 0) * 4 + (parseInt(f) || 0) * 9
  const applyPreset = (name: string) => { const r = PRESETS[name]; setP(String(r0(K * r.p / 4))); setC(String(r0(K * r.c / 4))); setF(String(r0(K * r.f / 9))) }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null)
    try {
      await api.setGoal({ kcal: K, protein_g: parseInt(p) || 0, carbs_g: parseInt(c) || 0, fat_g: parseInt(f) || 0, fiber_g: parseInt(fiber) || 0, net_carb_mode: net })
      setMsg('Saved. Applies from today.')
    } catch (ex) { setErr((ex as Error).message) }
  }

  return (
    <main>
      <h1>Goals</h1>
      <form onSubmit={save}>
        <section className="card">
          <div className="field"><label>Daily calories (kcal)</label><input type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} /></div>
          <div className="field"><label>Macro preset</label>
            <select defaultValue="" onChange={(e) => e.target.value && applyPreset(e.target.value)}>
              <option value="">Choose to fill macros…</option>
              {Object.keys(PRESETS).map((n) => <option key={n} value={n}>{n}</option>)}
            </select></div>
          <div className="grid3">
            <div className="field"><label>Protein (g)</label><input type="number" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} /></div>
            <div className="field"><label>{net ? 'Net carbs (g)' : 'Carbs (g)'}</label><input type="number" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} /></div>
            <div className="field"><label>Fat (g)</label><input type="number" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} /></div>
          </div>
          <div className="muted small" style={{ marginTop: 8 }}>Macros add up to {macroKcal} kcal{K ? ` (${r0(macroKcal / K * 100)}% of target)` : ''}.</div>
          <div className="field"><label>Fiber target (g)</label><input type="number" inputMode="numeric" value={fiber} onChange={(e) => setFiber(e.target.value)} /></div>
          <label className="row" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={net} onChange={(e) => setNet(e.target.checked)} />
            <span>Track <strong>net carbs</strong> (carbs − fiber) instead of total carbs</span>
          </label>
        </section>
        {err && <div className="error">{err}</div>}
        {msg && <div className="ok small" style={{ marginTop: 8 }}>{msg}</div>}
        <button className="btn primary block" type="submit" style={{ marginTop: 14 }}>Save goals</button>
      </form>
    </main>
  )
}
