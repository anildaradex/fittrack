from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import current_user
from app.db import get_db
from app.models import DiaryEntry, Food, User
from app.routers.goals import goal_for, to_out
from app.schemas import MEALS, DayOut, EntryIn, EntryOut, EntryPatch, Macros, MealOut

router = APIRouter(prefix="/api/diary", tags=["diary"])


def food_macros(food: Food) -> Macros:
    return Macros(kcal=food.kcal, protein_g=food.protein_g, carbs_g=food.carbs_g, fat_g=food.fat_g, fiber_g=food.fiber_g)


def entry_out(e: DiaryEntry) -> EntryOut:
    return EntryOut(
        id=e.id, date=e.date, meal=e.meal, food=e.food, quantity=e.quantity, unit_label=e.unit_label,
        grams=e.grams, macros=food_macros(e.food).scaled(e.grams / 100), logged_at=e.logged_at,
    )


def _check_meal(meal: str) -> None:
    if meal not in MEALS:
        raise HTTPException(422, f"meal must be one of {MEALS}")


@router.get("/{day}", response_model=DayOut)
def get_day(day: date_type, db: Session = Depends(get_db), user: User = Depends(current_user)) -> DayOut:
    entries = list(
        db.scalars(
            select(DiaryEntry)
            .options(selectinload(DiaryEntry.food).selectinload(Food.servings))
            .where(DiaryEntry.user_id == user.id, DiaryEntry.date == day)
            .order_by(DiaryEntry.logged_at)
        )
    )
    meals: list[MealOut] = []
    day_total = Macros()
    for meal in MEALS:
        outs = [entry_out(e) for e in entries if e.meal == meal]
        total = Macros()
        for o in outs:
            total = total.add(o.macros)
        meals.append(MealOut(meal=meal, entries=outs, totals=total))
        day_total = day_total.add(total)
    goal = goal_for(db, user, day)
    return DayOut(
        date=day, meals=meals, totals=day_total,
        goal=to_out(goal) if goal else None,
        remaining_kcal=round(goal.kcal - day_total.kcal, 1) if goal else None,
        net_carbs_g=round(day_total.net_carbs_g, 1),
    )


@router.post("/entries", response_model=EntryOut, status_code=201)
def add_entry(body: EntryIn, db: Session = Depends(get_db), user: User = Depends(current_user)) -> EntryOut:
    _check_meal(body.meal)
    food = db.scalar(
        select(Food).options(selectinload(Food.servings)).where(Food.id == body.food_id, Food.deleted_at.is_(None))
    )
    if food is None or food.owner_user_id not in (None, user.id):
        raise HTTPException(404, "Food not found")
    e = DiaryEntry(user_id=user.id, **body.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    e.food = food
    return entry_out(e)


def _owned_entry(entry_id: int, db: Session, user: User) -> DiaryEntry:
    e = db.scalar(
        select(DiaryEntry)
        .options(selectinload(DiaryEntry.food).selectinload(Food.servings))
        .where(DiaryEntry.id == entry_id, DiaryEntry.user_id == user.id)
    )
    if e is None:
        raise HTTPException(404, "Entry not found")
    return e


@router.patch("/entries/{entry_id}", response_model=EntryOut)
def edit_entry(
    entry_id: int, body: EntryPatch, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> EntryOut:
    e = _owned_entry(entry_id, db, user)
    changes = body.model_dump(exclude_none=True)
    if "meal" in changes:
        _check_meal(changes["meal"])
    for k, v in changes.items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    return entry_out(e)


@router.delete("/entries/{entry_id}", status_code=204)
def delete_entry(entry_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> None:
    db.delete(_owned_entry(entry_id, db, user))
    db.commit()
