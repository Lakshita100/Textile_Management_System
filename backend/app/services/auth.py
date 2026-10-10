"""Auth service — PBKDF2 password hashing + HS256 JWT sessions.

Security notes:
- Passwords: passlib pbkdf2_sha256 with a per-user salt (never stored raw).
- Tokens: PyJWT HS256 signed with settings.SECRET_KEY; claims are
  sub (user id), role, name, iat, exp. No PII beyond id/role/name in claims.
- Admin accounts cannot be created through the API (only seeded/provisioned).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import secrets

import jwt
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session

from app.config import settings
from app.models.auth import FEATURE_PERMISSIONS, User, UserRole
from app.schemas.auth import EmployeeCreateIn, RegisterIn

# ~120k iterations: interactive-login cost without slowing the test suite.
PBKDF2_ROUNDS = 120_000


class AuthError(Exception):
    """Coded auth failure — translated to HTTPException by the API layer."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def hash_password(password: str) -> str:
    return pbkdf2_sha256.using(rounds=PBKDF2_ROUNDS).hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return pbkdf2_sha256.verify(password, password_hash)
    except (ValueError, TypeError):
        return False


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "name": user.full_name,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Return claims or None for expired/invalid/tampered tokens."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None


def register_user(db: Session, payload: RegisterIn) -> User:
    """Create a public buyer account. Staff/admin provisioning is admin-only."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise AuthError("EMAIL_EXISTS", "An account already exists for this email address.")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=UserRole.BUYER.value,
        company=payload.company.strip() if payload.company else None,
        phone=payload.phone.strip() if payload.phone else None,
        is_active=True,
        permissions=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, identifier: str, password: str) -> User:
    """Verify credentials. Wrong email and wrong password share one error."""
    normalized = identifier.strip().lower()
    user = db.query(User).filter(
        (User.email == normalized) | (User.login_id == identifier.strip().upper())
    ).first()
    if user is None or not verify_password(password, user.password_hash):
        raise AuthError("AUTH_INVALID_CREDENTIALS", "Incorrect email or password.")
    if user.role == UserRole.BUYER.value and "@" not in identifier:
        raise AuthError("AUTH_INVALID_CREDENTIALS", "Incorrect email or password.")
    if user.role != UserRole.BUYER.value:
        if "@" in identifier:
            if user.email != normalized:
                raise AuthError("AUTH_INVALID_CREDENTIALS", "Incorrect email or password.")
        else:
            if not user.login_id or identifier.strip().upper() != user.login_id:
                raise AuthError("AUTH_INVALID_CREDENTIALS", "Incorrect employee or administrator ID or password.")
    if not user.is_active:
        raise AuthError("ACCOUNT_DISABLED", "This account has been disabled.")
    return user


def provision_employee(db: Session, payload: EmployeeCreateIn) -> tuple[User, str]:
    """Create staff with a unique employee ID and one-time password."""
    email = payload.email
    if email and db.query(User).filter(User.email == email).first() is not None:
        raise AuthError("EMAIL_EXISTS", "An account already exists for this email address.")
    invalid = sorted(set(payload.permissions) - set(FEATURE_PERMISSIONS))
    if invalid:
        raise AuthError("INVALID_PERMISSION", f"Unknown feature permission: {', '.join(invalid)}")

    temporary_password = secrets.token_urlsafe(18)
    user = User(
        email=email,
        password_hash=hash_password(temporary_password),
        full_name=payload.full_name.strip(),
        role=UserRole.STAFF.value,
        phone=payload.phone.strip() if payload.phone else None,
        is_active=True,
        permissions=sorted(set(payload.permissions)),
        must_change_password=True,
    )
    db.add(user)
    db.flush()
    user.login_id = f"EMP-{user.id:06d}"
    db.commit()
    db.refresh(user)
    return user, temporary_password


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def user_from_claims(db: Session, claims: dict) -> User:
    """Resolve a decoded token to an active user (401 AUTH_REQUIRED otherwise)."""
    try:
        user_id = int(claims.get("sub", ""))
    except (TypeError, ValueError):
        raise AuthError("AUTH_REQUIRED", "Sign-in required.")
    user = get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise AuthError("AUTH_REQUIRED", "Sign-in required.")
    return user


def seed_user(
    db: Session,
    *,
    email: str,
    password: str,
    full_name: str,
    role: UserRole | str,
    company: str | None = None,
    phone: str | None = None,
) -> User | None:
    """Idempotent demo/provisioning helper — returns None if the email exists."""
    normalized = email.strip().lower()
    if db.query(User).filter(User.email == normalized).first() is not None:
        return None
    role_value = role.value if isinstance(role, UserRole) else role
    user = User(
        email=normalized,
        password_hash=hash_password(password),
        full_name=full_name,
        role=role_value,
        company=company,
        phone=phone,
        is_active=True,
        permissions=[],
    )
    db.add(user)
    db.flush()
    if role_value == UserRole.ADMIN.value:
        user.login_id = f"ADM-{user.id:06d}"
    elif role_value == UserRole.STAFF.value:
        user.login_id = f"EMP-{user.id:06d}"
    db.commit()
    db.refresh(user)
    return user
