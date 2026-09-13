from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import current_user
from app.db import get_db
from app.models import Goal, User
from app.schemas import GoalIn, GoalOut

router = APIRouter(prefix="/api/goals", tags=["goals"])


def goal_for(db: Session, user: User, on: date) -> Goal | None:
    return db.scalar(
        select(Goal)
        .where(Goal.user_id == user.id, Goal.effective_from <= on)
        .order_by(Goal.effective_from.desc(), Goal.id.desc())
        .limit(1)
    )


def to_out(g: Goal) -> GoalOut:
    return GoalOut(
        id=g.id, effective_from=g.effective_from, kcal=g.kcal, protein_g=g.protein_g,
        carbs_g=g.carbs_g, fat_g=g.fat_g, fiber_g=g.fiber_g, net_carb_mode=bool(g.net_carb_mode),
    )


@router.get("/current", response_model=GoalOut | None)
def current_goal(db: Session = Depends(get_db), user: User = Depends(current_user)) -> GoalOut | None:
    g = goal_for(db, user, date.today())
    return to_out(g) if g else None


@router.put("/current", response_model=GoalOut)
def set_goal(body: GoalIn, db: Session = Depends(get_db), user: User = Depends(current_user)) -> GoalOut:
    """Creates a new goal row (history is kept); effective today unless given."""
    g = Goal(
        user_id=user.id,
        effective_from=body.effective_from or date.today(),
        kcal=body.kcal, protein_g=body.protein_g, carbs_g=body.carbs_g, fat_g=body.fat_g,
        fiber_g=body.fiber_g, net_carb_mode=int(body.net_carb_mode),
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return to_out(g)
