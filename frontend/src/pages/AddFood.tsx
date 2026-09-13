import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, r0, todayStr } from '../api'
import type { Food, Meal } from '../types'
import { MEAL_LABEL } from '../types'
import LogSheet from '../components/LogSheet'

export default function AddFood() {
  const [params] = useSearchParams()
  const date = params.get('date') ?? todayStr()
  const meal = (params.get('meal') ?? 'snack') as Meal
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [recent, setRecent] = useState<Food[]>([])
  const [picked, setPicked] = useState<Food | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  useEffect(() => { api.recentFoods().then(setRecent).catch(() => {}) }, [])
  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) return setResults([])
      api.foods(q).then(setResults).catch((e) => setErr(e.message))
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const list = q.trim() ? results : recent
  const title = q.trim() ? `Results (${results.length})` : 'Recent'

  return (
    <main>
      <div className="row between">
        <h1>Add to {MEAL_LABEL[meal]}</h1>
        <Link to={`/?date=${date}`} className="btn ghost">Done</Link>
      </div>
      <input className="search" placeholder="Search your foods…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {err && <div className="error">{err}</div>}
      <section className="card tight">
        <div className="card-head">
          <h2>{title}</h2>
          <Link to={`/foods/new?date=${date}&meal=${meal}${q ? `&name=${encodeURIComponent(q)}` : ''}`} className="btn ghost">+ New food</Link>
        </div>
        {list.length === 0 && <div className="empty">{q.trim() ? 'No matches. Create it with “+ New food”.' : 'Foods you log will show up here.'}</div>}
        {list.map((f) => (
          <button className="list-item" key={f.id} onClick={() => setPicked(f)}>
            <div className="grow">
              <div className="ellipsis">{f.name}</div>
              <div className="muted small">{f.serving_label} · {r0(f.kcal * f.serving_grams / 100)} kcal{f.brand ? ` · ${f.brand}` : ''}</div>
            </div>
            <span className="muted">›</span>
          </button>
        ))}
      </section>
      {picked && (
        <LogSheet
          food={picked} meal={meal}
          onClose={() => setPicked(null)}
          onSubmit={async (r) => { await api.addEntry({ date, food_id: picked.id, ...r }); nav(`/?date=${date}`) }}
        />
      )}
    </main>
  )
}
