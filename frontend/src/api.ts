import type { Day, Entry, Food, FoodIn, Goal, GoalIn, Meal } from './types'

const TOKEN_KEY = 'fittrack.token'

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(t: string | null) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
  window.dispatchEvent(new Event('fittrack:auth'))
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (init.body) headers['Content-Type'] = 'application/json'
  const r = await fetch(path, { ...init, headers })
  if (r.status === 401) setToken(null)
  if (!r.ok) {
    let msg = `HTTP ${r.status}`
    try { const j = await r.json(); msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail) } catch { /* ignore */ }
    throw new ApiError(r.status, msg)
  }
  return r.status === 204 ? (undefined as T) : r.json()
}

export const api = {
  health: () => request<{ status: string; env: string; version: string }>('/api/health'),
  // auth check = any authed call
  whoami: () => request<Goal | null>('/api/goals/current'),

  day: (date: string) => request<Day>(`/api/diary/${date}`),
  addEntry: (body: { date: string; meal: Meal; food_id: number; quantity: number; unit_label: string; grams: number }) =>
    request<Entry>('/api/diary/entries', { method: 'POST', body: JSON.stringify(body) }),
  editEntry: (id: number, body: Partial<{ meal: Meal; quantity: number; unit_label: string; grams: number }>) =>
    request<Entry>(`/api/diary/entries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEntry: (id: number) => request<void>(`/api/diary/entries/${id}`, { method: 'DELETE' }),

  foods: (q: string) => request<Food[]>(`/api/foods?q=${encodeURIComponent(q)}`),
  recentFoods: () => request<Food[]>('/api/foods/recent'),
  food: (id: number) => request<Food>(`/api/foods/${id}`),
  createFood: (body: FoodIn) => request<Food>('/api/foods', { method: 'POST', body: JSON.stringify(body) }),
  updateFood: (id: number, body: FoodIn) => request<Food>(`/api/foods/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFood: (id: number) => request<void>(`/api/foods/${id}`, { method: 'DELETE' }),

  goal: () => request<Goal | null>('/api/goals/current'),
  setGoal: (body: GoalIn) => request<Goal>('/api/goals/current', { method: 'PUT', body: JSON.stringify(body) }),
}

// ---- helpers ----
export const todayStr = () => toDateStr(new Date())
export function toDateStr(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function shiftDate(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number)
  return toDateStr(new Date(y, m - 1, d + days))
}
export function prettyDate(date: string) {
  if (date === todayStr()) return 'Today'
  if (date === shiftDate(todayStr(), -1)) return 'Yesterday'
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
export const r0 = (n: number) => Math.round(n)
export const r1 = (n: number) => Math.round(n * 10) / 10
