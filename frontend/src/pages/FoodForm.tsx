import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, r1 } from '../api'
import type { FoodIn, Serving } from '../types'

/** Nutrition is entered PER SERVING (as on labels) and stored per 100 g. */
type Form = {
  name: string; brand: string; serving_label: string; serving_grams: string
  kcal: string; protein_g: string; carbs_g: string; fat_g: string; fiber_g: string; sugar_g: string; sodium_mg: string
  notes: string; servings: { label: string; grams: string }[]
}
const empty: Form = { name: '', brand: '', serving_label: '1 serving', serving_grams: '100', kcal: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '', sugar_g: '', sodium_mg: '', notes: '', servings: [] }

export default function FoodForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [f, setF] = useState<Form>({ ...empty, name: params.get('name') ?? '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const back = id ? '/foods' : `/add?date=${params.get('date') ?? ''}&meal=${params.get('meal') ?? 'snack'}`

  useEffect(() => {
    if (!id) return
    api.food(Number(id)).then((food) => {
      const k = food.serving_grams / 100
      const per = (v: number | null) => (v == null ? '' : String(r1(v * k)))
      setF({
        name: food.name, brand: food.brand ?? '', serving_label: food.serving_label, serving_grams: String(food.serving_grams),
        kcal: per(food.kcal), protein_g: per(food.protein_g), carbs_g: per(food.carbs_g), fat_g: per(food.fat_g), fiber_g: per(food.fiber_g),
        sugar_g: per(food.sugar_g), sodium_mg: per(food.sodium_mg), notes: food.notes ?? '',
        servings: food.servings.map((s) => ({ label: s.label, grams: String(s.grams) })),
      })
    }).catch((e) => setErr(e.message))
  }, [id])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const num = (s: string) => (s.trim() === '' ? 0 : parseFloat(s) || 0)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const sg = num(f.serving_grams)
    if (!f.name.trim()) return setErr('Name is required')
    if (sg <= 0) return setErr('Serving grams must be more than 0')
    const k = 100 / sg  // per-serving → per-100 g
    const opt = (s: string) => (s.trim() === '' ? null : r1(num(s) * k))
    const servings: Serving[] = f.servings.filter((s) => s.label.trim() && num(s.grams) > 0).map((s) => ({ label: s.label.trim(), grams: num(s.grams) }))
    const body: FoodIn = {
      name: f.name.trim(), brand: f.brand.trim() || null, serving_label: f.serving_label.trim() || '1 serving', serving_grams: sg,
      kcal: r1(num(f.kcal) * k), protein_g: r1(num(f.protein_g) * k), carbs_g: r1(num(f.carbs_g) * k), fat_g: r1(num(f.fat_g) * k), fiber_g: r1(num(f.fiber_g) * k),
      sugar_g: opt(f.sugar_g), sodium_mg: opt(f.sodium_mg), notes: f.notes.trim() || null, servings,
    }
    setBusy(true); setErr(null)
    try { id ? await api.updateFood(Number(id), body) : await api.createFood(body); nav(back) }
    catch (ex) { setErr((ex as Error).message); setBusy(false) }
  }

  async function remove() {
    if (!id || !confirm('Delete this food? Past diary entries keep their numbers.')) return
    await api.deleteFood(Number(id)); nav('/foods')
  }

  return (
    <main>
      <div className="row between"><h1>{id ? 'Edit food' : 'New food'}</h1><button className="btn ghost" onClick={() => nav(back)}>Cancel</button></div>
      <form onSubmit={save}>
        <section className="card">
          <div className="field"><label>Name</label><input value={f.name} onChange={set('name')} autoFocus={!id} /></div>
          <div className="field"><label>Brand (optional)</label><input value={f.brand} onChange={set('brand')} /></div>
          <div className="grid2">
            <div className="field"><label>Serving label</label><input value={f.serving_label} onChange={set('serving_label')} placeholder="1 roti" /></div>
            <div className="field"><label>Serving weight (g)</label><input type="number" inputMode="decimal" value={f.serving_grams} onChange={set('serving_grams')} /></div>
          </div>
        </section>
        <section className="card">
          <div className="muted small">Nutrition <strong>per serving</strong> ({f.serving_grams || '?'} g), as printed on the label.</div>
          <div className="grid2">
            <div className="field"><label>Calories (kcal)</label><input type="number" inputMode="decimal" value={f.kcal} onChange={set('kcal')} /></div>
            <div className="field"><label>Protein (g)</label><input type="number" inputMode="decimal" value={f.protein_g} onChange={set('protein_g')} /></div>
            <div className="field"><label>Carbs (g)</label><input type="number" inputMode="decimal" value={f.carbs_g} onChange={set('carbs_g')} /></div>
            <div className="field"><label>Fat (g)</label><input type="number" inputMode="decimal" value={f.fat_g} onChange={set('fat_g')} /></div>
            <div className="field"><label>Fiber (g)</label><input type="number" inputMode="decimal" value={f.fiber_g} onChange={set('fiber_g')} /></div>
            <div className="field"><label>Sugar (g, optional)</label><input type="number" inputMode="decimal" value={f.sugar_g} onChange={set('sugar_g')} /></div>
            <div className="field"><label>Sodium (mg, optional)</label><input type="number" inputMode="decimal" value={f.sodium_mg} onChange={set('sodium_mg')} /></div>
          </div>
        </section>
        <section className="card">
          <div className="row between"><strong>Other servings</strong><button type="button" className="btn ghost" onClick={() => setF({ ...f, servings: [...f.servings, { label: '', grams: '' }] })}>+ Add</button></div>
          {f.servings.map((s, i) => (
            <div className="row" key={i}>
              <div className="field grow"><label>Label</label><input value={s.label} placeholder="1 cup" onChange={(e) => { const v = [...f.servings]; v[i] = { ...v[i], label: e.target.value }; setF({ ...f, servings: v }) }} /></div>
              <div className="field" style={{ width: 100 }}><label>Grams</label><input type="number" inputMode="decimal" value={s.grams} onChange={(e) => { const v = [...f.servings]; v[i] = { ...v[i], grams: e.target.value }; setF({ ...f, servings: v }) }} /></div>
              <button type="button" className="icon-btn" style={{ marginTop: 18 }} onClick={() => setF({ ...f, servings: f.servings.filter((_, j) => j !== i) })} aria-label="Remove">×</button>
            </div>
          ))}
          <div className="field"><label>Notes (optional)</label><input value={f.notes} onChange={set('notes')} /></div>
        </section>
        {err && <div className="error">{err}</div>}
        <div className="row" style={{ marginTop: 14 }}>
          {id && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
          <button className="btn primary grow" type="submit" disabled={busy}>{id ? 'Save changes' : 'Create food'}</button>
        </div>
      </form>
    </main>
  )
}
