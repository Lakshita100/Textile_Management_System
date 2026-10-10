"""Auth API — register / login / me / logout (Bearer JWT)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth import User
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut
from app.services import auth as auth_service
from app.services.auth import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])

_ERR_STATUS = {
    "AUTH_INVALID_CREDENTIALS": 401,
    "AUTH_REQUIRED": 401,
    "ACCOUNT_DISABLED": 403,
    "EMAIL_EXISTS": 409,
}


def _raise(e: AuthError) -> None:
    raise HTTPException(
        _ERR_STATUS.get(e.code, 400),
        {"message": str(e), "code": e.code},
    )


def _claims_from_authorization(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            401, {"message": "Sign-in required.", "code": "AUTH_REQUIRED"}
        )
    claims = auth_service.decode_access_token(authorization.split(" ", 1)[1].strip())
    if claims is None:
        raise HTTPException(
            401,
            {"message": "Session expired or invalid — sign in again.", "code": "AUTH_REQUIRED"},
        )
    return claims


def current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    claims = _claims_from_authorization(authorization)
    try:
        return auth_service.user_from_claims(db, claims)
    except AuthError as e:
        _raise(e)
        raise  # unreachable — satisfies control-flow analysis


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    try:
        user = auth_service.register_user(db, payload)
    except AuthError as e:
        _raise(e)
        raise
    return TokenOut(
        token=auth_service.create_access_token(user),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    try:
        user = auth_service.authenticate(db, payload.email, payload.password)
    except AuthError as e:
        _raise(e)
        raise
    return TokenOut(
        token=auth_service.create_access_token(user),
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)) -> dict:
    """Stateless logout — the client discards its token; nothing to revoke server-side."""
    _claims_from_authorization(authorization)
    return {"detail": "Signed out.", "code": "SIGNED_OUT"}
