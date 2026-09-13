from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

MEALS = ("breakfast", "lunch", "dinner", "snack")


class Macros(BaseModel):
    kcal: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0

    @property
    def net_carbs_g(self) -> float:
        return max(self.carbs_g - self.fiber_g, 0)

    def add(self, other: "Macros") -> "Macros":
        return Macros(**{k: getattr(self, k) + getattr(other, k) for k in Macros.model_fields})

    def scaled(self, factor: float) -> "Macros":
        return Macros(**{k: round(getattr(self, k) * factor, 1) for k in Macros.model_fields})


# ---------- foods ----------
class ServingIn(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    grams: float = Field(gt=0)


class ServingOut(ServingIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class FoodIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    brand: str | None = None
    serving_label: str = "100 g"
    serving_grams: float = Field(default=100, gt=0)
    # per 100 g
    kcal: float = Field(ge=0)
    protein_g: float = Field(default=0, ge=0)
    carbs_g: float = Field(default=0, ge=0)
    fat_g: float = Field(default=0, ge=0)
    fiber_g: float = Field(default=0, ge=0)
    sugar_g: float | None = None
    sodium_mg: float | None = None
    notes: str | None = None
    servings: list[ServingIn] = []


class FoodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source: str
    barcode: str | None
    name: str
    brand: str | None
    serving_label: str
    serving_grams: float
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float | None
    sodium_mg: float | None
    notes: str | None
    servings: list[ServingOut] = []


# ---------- goals ----------
class GoalIn(BaseModel):
    kcal: int = Field(gt=0)
    protein_g: int = Field(ge=0)
    carbs_g: int = Field(ge=0)
    fat_g: int = Field(ge=0)
    fiber_g: int = Field(default=30, ge=0)
    net_carb_mode: bool = False
    effective_from: date | None = None


class GoalOut(BaseModel):
    id: int
    effective_from: date
    kcal: int
    protein_g: int
    carbs_g: int
    fat_g: int
    fiber_g: int
    net_carb_mode: bool


# ---------- diary ----------
class EntryIn(BaseModel):
    date: date
    meal: str
    food_id: int
    quantity: float = Field(default=1, gt=0)
    unit_label: str = "100 g"
    grams: float = Field(gt=0)  # total grams = quantity × grams-per-unit, computed by the client


class EntryPatch(BaseModel):
    meal: str | None = None
    quantity: float | None = Field(default=None, gt=0)
    unit_label: str | None = None
    grams: float | None = Field(default=None, gt=0)


class EntryOut(BaseModel):
    id: int
    date: date
    meal: str
    food: FoodOut
    quantity: float
    unit_label: str
    grams: float
    macros: Macros
    logged_at: datetime


class MealOut(BaseModel):
    meal: str
    entries: list[EntryOut]
    totals: Macros


class DayOut(BaseModel):
    date: date
    meals: list[MealOut]
    totals: Macros
    goal: GoalOut | None
    remaining_kcal: float | None
    net_carbs_g: float
