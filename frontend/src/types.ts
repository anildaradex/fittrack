export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']
export const MEAL_LABEL: Record<Meal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

export type Macros = { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }

export type Serving = { id?: number; label: string; grams: number }

export type Food = {
  id: number
  source: string
  barcode: string | null
  name: string
  brand: string | null
  serving_label: string
  serving_grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number | null
  sodium_mg: number | null
  notes: string | null
  servings: Serving[]
}

export type FoodIn = Omit<Food, 'id' | 'source' | 'barcode' | 'servings'> & { servings: Serving[] }

export type Goal = {
  id: number
  effective_from: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  net_carb_mode: boolean
}
export type GoalIn = Omit<Goal, 'id' | 'effective_from'>

export type Entry = {
  id: number
  date: string
  meal: Meal
  food: Food
  quantity: number
  unit_label: string
  grams: number
  macros: Macros
  logged_at: string
}

export type Day = {
  date: string
  meals: { meal: Meal; entries: Entry[]; totals: Macros }[]
  totals: Macros
  goal: Goal | null
  remaining_kcal: number | null
  net_carbs_g: number
}
