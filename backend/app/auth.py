"""Single-user bearer-token auth. The token lives in Secret Manager in prod, `.env` locally.
Google sign-in replaces this in a later phase; the `current_user` dependency stays the same."""
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import User


def _check_token(authorization: str | None) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    if authorization.removeprefix("Bearer ").strip() != settings.app_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")


def current_user(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> User:
    _check_token(authorization)
    user = db.scalar(select(User).where(User.email == settings.owner_email))
    if user is None:
        user = User(email=settings.owner_email, display_name="Owner")
        db.add(user)
        db.commit()
    return user
