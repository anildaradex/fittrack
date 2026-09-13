import { useMemo, useState } from 'react'
import type { Entry, Food, Meal } from '../types'
import { MEALS, MEAL_LABEL } from '../types'
import { r0, r1 } from '../api'
import Sheet from './Sheet'

type Unit = { label: string; grams: number }

export type LogResult = { meal: Meal; quantity: number; unit_label: string; grams: number }

/** Bottom sheet to pick serving × quantity for a food. Used for both new entries and edits. */
export default function LogSheet({
  food, meal: initialMeal, entry, onClose, onSubmit, onDelete,
}: {
  food: Food; meal: Meal; entry?: Entry
  onClose: () => void; onSubmit: (r: LogResult) => Promise<void>; onDelete?: () => Promise<void>
}) {
  const units: Unit[] = useMemo(() => {
    const u: Unit[] = [{ label: food.serving_label, grams: food.serving_grams }]
    for (const s of food.servings) if (!u.some((x) => x.label === s.label)) u.push({ label: s.label, grams: s.grams })
    if (!u.some((x) => x.label === '1 g')) u.push({ label: '1 g', grams: 1 })
    if (entry && !u.some((x) => x.label === entry.unit_label)) u.unshift({ label: entry.unit_label, grams: entry.grams / entry.quantity })
    return u
  }, [food, entry])

  const [unitIdx, setUnitIdx] = useState(() => (entry ? Math.max(units.findIndex((u) => u.label === entry.unit_label), 0) : 0))
  const [qty, setQty] = useState(entry ? String(entry.quantity) : '1')
  const [meal, setMeal] = useState<Meal>(initialMeal)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const q = parseFloat(qty) || 0
  const grams = q * units[unitIdx].grams
  const f = grams / 100
  const kcal = food.kcal * f

  async function submit() {
    if (q <= 0) return setErr('Quantity must be more than 0')
    setBusy(true); setErr(null)
    try { await onSubmit({ meal, quantity: q, unit_label: units[unitIdx].label, grams: r1(grams) }) }
    catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{food.name}</h2>
      {food.brand && <div className="muted">{food.brand}</div>}
      <div className="grid2">
        <div className="field">
          <label>Quantity</label>
          <input type="number" inputMode="decimal" min="0" step="0.5" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Serving</label>
          <select value={unitIdx} onChange={(e) => setUnitIdx(Number(e.target.value))}>
            {units.map((u, i) => <option key={u.label} value={i}>{u.label} ({r0(u.grams)} g)</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Meal</label>
        <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
          {MEALS.map((m) => <option key={m} value={m}>{MEAL_LABEL[m]}</option>)}
        </select>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="row between"><span className="kcal-big">{r0(kcal)}</span><span className="muted">kcal · {r0(grams)} g</span></div>
        <div className="macro-line" style={{ marginTop: 6 }}>
          <span>P {r1(food.protein_g * f)} g</span><span>C {r1(food.carbs_g * f)} g</span>
          <span>F {r1(food.fat_g * f)} g</span><span>Fiber {r1(food.fiber_g * f)} g</span>
        </div>
      </div>
      {err && <div className="error">{err}</div>}
      <div className="row" style={{ marginTop: 14 }}>
        {onDelete && <button className="btn danger" disabled={busy} onClick={() => { setBusy(true); onDelete().catch((e) => { setErr(e.message); setBusy(false) }) }}>Delete</button>}
        <button className="btn primary grow" disabled={busy} onClick={submit}>{entry ? 'Save' : 'Log it'}</button>
      </div>
    </Sheet>
  )
}
