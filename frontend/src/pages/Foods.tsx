import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, r0 } from '../api'
import type { Food } from '../types'

export default function Foods() {
  const [q, setQ] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => api.foods(q).then(setFoods).catch((e) => setErr(e.message)), 150)
    return () => clearTimeout(t)
  }, [q])
  return (
    <main>
      <div className="row between"><h1>My foods</h1><Link to="/foods/new" className="btn ghost">+ New</Link></div>
      <input className="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <div className="error">{err}</div>}
      <section className="card tight">
        {foods.length === 0 && <div className="empty">No foods yet. Create one, then log it from Today.</div>}
        {foods.map((f) => (
          <Link className="list-item" to={`/foods/${f.id}`} key={f.id}>
            <div className="grow">
              <div className="ellipsis">{f.name}</div>
              <div className="muted small">{f.serving_label} ({r0(f.serving_grams)} g) · {r0(f.kcal * f.serving_grams / 100)} kcal · P{r0(f.protein_g * f.serving_grams / 100)} C{r0(f.carbs_g * f.serving_grams / 100)} F{r0(f.fat_g * f.serving_grams / 100)}</div>
            </div>
            <span className="muted">›</span>
          </Link>
        ))}
      </section>
    </main>
  )
}
