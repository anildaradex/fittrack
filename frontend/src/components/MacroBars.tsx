import type { Goal, Macros } from '../types'
import { r0 } from '../api'

function Bar({ label, value, goal, cls }: { label: string; value: number; goal?: number; cls: string }) {
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div className="grow">
      <div className="macro-line between">
        <span>{label}</span>
        <span>{r0(value)}{goal ? ` / ${goal}` : ''} g</span>
      </div>
      <div className="bar"><i className={cls} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function MacroBars({ totals, goal, netCarbs }: { totals: Macros; goal: Goal | null; netCarbs: number }) {
  const carbsLabel = goal?.net_carb_mode ? 'Net carbs' : 'Carbs'
  const carbsVal = goal?.net_carb_mode ? netCarbs : totals.carbs_g
  return (
    <div className="row" style={{ gap: 12, marginTop: 10 }}>
      <Bar label="Protein" value={totals.protein_g} goal={goal?.protein_g} cls="protein" />
      <Bar label={carbsLabel} value={carbsVal} goal={goal?.carbs_g} cls="carbs" />
      <Bar label="Fat" value={totals.fat_g} goal={goal?.fat_g} cls="fat" />
    </div>
  )
}
