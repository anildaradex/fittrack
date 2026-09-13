"""Phase 1 tables. All nutrition on `foods` is PER 100 g; entries store grams."""
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Goal(Base):
    """One row per change; the latest `effective_from <= today` wins."""
    __tablename__ = "goals"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    effective_from: Mapped[date] = mapped_column(Date, default=date.today)
    kcal: Mapped[int] = mapped_column(Integer, default=2000)
    protein_g: Mapped[int] = mapped_column(Integer, default=150)
    carbs_g: Mapped[int] = mapped_column(Integer, default=200)
    fat_g: Mapped[int] = mapped_column(Integer, default=65)
    fiber_g: Mapped[int] = mapped_column(Integer, default=30)
    net_carb_mode: Mapped[int] = mapped_column(Integer, default=0)  # bool; int for sqlite/pg parity
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Food(Base):
    __tablename__ = "foods"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)  # null = shared/cached
    source: Mapped[str] = mapped_column(String(16), default="custom")  # custom | usda | off
    source_id: Mapped[str | None] = mapped_column(String(64), index=True)
    barcode: Mapped[str | None] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    brand: Mapped[str | None] = mapped_column(String(120))
    # default serving shown in the UI
    serving_label: Mapped[str] = mapped_column(String(60), default="100 g")
    serving_grams: Mapped[float] = mapped_column(Float, default=100.0)
    # per 100 g
    kcal: Mapped[float] = mapped_column(Float, default=0)
    protein_g: Mapped[float] = mapped_column(Float, default=0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0)
    fat_g: Mapped[float] = mapped_column(Float, default=0)
    fiber_g: Mapped[float] = mapped_column(Float, default=0)
    sugar_g: Mapped[float | None] = mapped_column(Float)
    sodium_mg: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    servings: Mapped[list["FoodServing"]] = relationship(back_populates="food", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("source", "source_id", name="uq_food_source"),)


class FoodServing(Base):
    """Extra household measures for a food, e.g. '1 roti' = 40 g."""
    __tablename__ = "food_servings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    food_id: Mapped[int] = mapped_column(ForeignKey("foods.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(60))
    grams: Mapped[float] = mapped_column(Float)

    food: Mapped[Food] = relationship(back_populates="servings")


class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    meal: Mapped[str] = mapped_column(String(16))  # breakfast | lunch | dinner | snack
    food_id: Mapped[int] = mapped_column(ForeignKey("foods.id"), index=True)
    grams: Mapped[float] = mapped_column(Float)
    quantity: Mapped[float] = mapped_column(Float, default=1)  # display: 2 × "1 roti"
    unit_label: Mapped[str] = mapped_column(String(60), default="100 g")
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    food: Mapped[Food] = relationship()
