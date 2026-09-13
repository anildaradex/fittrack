from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth import current_user
from app.db import get_db
from app.models import DiaryEntry, Food, FoodServing, User
from app.schemas import FoodIn, FoodOut

router = APIRouter(prefix="/api/foods", tags=["foods"])


def _visible(user: User):
    return or_(Food.owner_user_id == user.id, Food.owner_user_id.is_(None))


@router.get("", response_model=list[FoodOut])
def search_foods(
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=25, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[Food]:
    stmt = (
        select(Food)
        .options(selectinload(Food.servings))
        .where(_visible(user), Food.deleted_at.is_(None))
    )
    if q.strip():
        for word in q.strip().split():
            stmt = stmt.where(or_(Food.name.ilike(f"%{word}%"), Food.brand.ilike(f"%{word}%")))
    stmt = stmt.order_by(Food.name).limit(limit)
    return list(db.scalars(stmt))


@router.get("/recent", response_model=list[FoodOut])
def recent_foods(
    limit: int = Query(default=20, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[Food]:
    """Foods ordered by most recently logged, then most frequently logged."""
    sub = (
        select(
            DiaryEntry.food_id,
            func.max(DiaryEntry.logged_at).label("last"),
            func.count().label("n"),
        )
        .where(DiaryEntry.user_id == user.id)
        .group_by(DiaryEntry.food_id)
        .subquery()
    )
    stmt = (
        select(Food)
        .join(sub, sub.c.food_id == Food.id)
        .options(selectinload(Food.servings))
        .where(Food.deleted_at.is_(None))
        .order_by(sub.c.last.desc(), sub.c.n.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


@router.post("", response_model=FoodOut, status_code=201)
def create_food(body: FoodIn, db: Session = Depends(get_db), user: User = Depends(current_user)) -> Food:
    data = body.model_dump(exclude={"servings"})
    food = Food(owner_user_id=user.id, source="custom", **data)
    food.servings = [FoodServing(label=s.label, grams=s.grams) for s in body.servings]
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


def _owned_food(food_id: int, db: Session, user: User) -> Food:
    food = db.scalar(
        select(Food).options(selectinload(Food.servings)).where(Food.id == food_id, Food.deleted_at.is_(None))
    )
    if food is None:
        raise HTTPException(404, "Food not found")
    if food.owner_user_id not in (None, user.id):
        raise HTTPException(403, "Not your food")
    return food


@router.get("/{food_id}", response_model=FoodOut)
def get_food(food_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> Food:
    return _owned_food(food_id, db, user)


@router.put("/{food_id}", response_model=FoodOut)
def update_food(
    food_id: int, body: FoodIn, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> Food:
    food = _owned_food(food_id, db, user)
    if food.owner_user_id != user.id:
        raise HTTPException(403, "Shared foods are read-only; create a copy instead")
    for k, v in body.model_dump(exclude={"servings"}).items():
        setattr(food, k, v)
    food.servings = [FoodServing(label=s.label, grams=s.grams) for s in body.servings]
    db.commit()
    db.refresh(food)
    return food


@router.delete("/{food_id}", status_code=204)
def delete_food(food_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> None:
    """Soft delete so historical diary entries keep their nutrition."""
    from app.models import utcnow

    food = _owned_food(food_id, db, user)
    if food.owner_user_id != user.id:
        raise HTTPException(403, "Shared foods cannot be deleted")
    food.deleted_at = utcnow()
    db.commit()
