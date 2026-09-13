import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, prettyDate, r0, shiftDate, todayStr } from '../api'
import type { Day, Entry } from '../types'
import { MEAL_LABEL } from '../types'
import MacroBars from '../components/MacroBars'
import LogSheet from '../components/LogSheet'

export default function Today() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? todayStr()
  const [day, setDay] = useState<Day | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const nav = useNavigate()

  const load = useCallback(() => api.day(date).then(setDay).catch((e) => setErr(e.message)), [date])
  useEffect(() => { setDay(null); load() }, [load])

  const setDate = (d: string) => setParams(d === todayStr() ? {} : { date: d })
  const goal = day?.goal ?? null
  const eaten = day?.totals.kcal ?? 0
  const pct = goal ? Math.min((eaten / goal.kcal) * 100, 100) : 0
  const over = goal ? eaten > goal.kcal : false

  return (
    <main>
      <div className="date-nav">
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day">‹</button>
        <strong onClick={() => setDate(todayStr())}>{prettyDate(date)}</strong>
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, 1))} aria-label="Next day">›</button>
      </div>

      <section className="card">
        {goal ? (
          <>
            <div className="row between">
              <div><span className="kcal-big">{r0(eaten)}</span> <span className="muted">of {goal.kcal} kcal</span></div>
              <div className="right">
                <div className={over ? 'error' : ''} style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{r0(Math.abs(goal.kcal - eaten))}</div>
                <div className="muted small">{over ? 'over' : 'remaining'}</div>
              </div>
            </div>
            <div className="bar"><i className={over ? 'over' : ''} style={{ width: `${pct}%` }} /></div>
          </>
        ) : (
          <div className="row between">
            <div><span className="kcal-big">{r0(eaten)}</span> <span className="muted">kcal</span></div>
            <Link to="/goals" className="btn ghost">Set a goal ›</Link>
          </div>
        )}
        {day && <MacroBars totals={day.totals} goal={goal} netCarbs={day.net_carbs_g} />}
        {day && goal?.net_carb_mode && <div className="muted small" style={{ marginTop: 6 }}>Fiber {r0(day.totals.fiber_g)} g · total carbs {r0(day.totals.carbs_g)} g</div>}
      </section>

      {err && <div className="error">{err}</div>}
      {!day && !err && <div className="empty">Loading…</div>}

      {day?.meals.map((m) => (
        <section className="card tight" key={m.meal}>
          <div className="card-head">
            <div><h2>{MEAL_LABEL[m.meal]}</h2><div className="muted small">{r0(m.totals.kcal)} kcal</div></div>
            <button className="btn ghost" onClick={() => nav(`/add?date=${date}&meal=${m.meal}`)}>+ Add</button>
          </div>
          {m.entries.length === 0 && <div className="empty">Nothing logged</div>}
          {m.entries.map((e) => (
            <button className="list-item" key={e.id} onClick={() => setEditing(e)}>
              <div className="grow">
                <div className="ellipsis">{e.food.name}</div>
                <div className="muted small">{e.quantity} × {e.unit_label}{e.food.brand ? ` · ${e.food.brand}` : ''}</div>
              </div>
              <div className="right">
                <div>{r0(e.macros.kcal)}</div>
                <div className="muted small">P{r0(e.macros.protein_g)} C{r0(e.macros.carbs_g)} F{r0(e.macros.fat_g)}</div>
              </div>
            </button>
          ))}
        </section>
      ))}

      {editing && (
        <LogSheet
          food={editing.food} meal={editing.meal} entry={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (r) => { await api.editEntry(editing.id, r); setEditing(null); load() }}
          onDelete={async () => { await api.deleteEntry(editing.id); setEditing(null); load() }}
        />
      )}
    </main>
  )
}
