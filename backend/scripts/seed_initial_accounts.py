"""Create initial local factory accounts with one-time passwords.

Run from ``backend/`` with the configured database available:
    python -m scripts.seed_initial_accounts

Safe to rerun: existing accounts are left unchanged. Passwords are random,
printed only for newly created accounts, and required to change at first login.
"""

from __future__ import annotations

import secrets

from app.database import SessionLocal
from app.models import User
from app.services.auth import hash_password, seed_user


EMPLOYEES = [
    "Aarav Sharma",
    "Diya Patel",
    "Rohan Verma",
    "Ananya Singh",
    "Vivaan Gupta",
    "Ishita Mehta",
    "Arjun Rao",
    "Kavya Nair",
    "Aditya Joshi",
    "Meera Iyer",
    "Reyansh Kapoor",
    "Saanvi Desai",
]
COMPANY = "Everest Textile Mills"


def _temporary_password() -> str:
    # URL-safe random value, well above the app's 12-character minimum.
    return secrets.token_urlsafe(18)


def seed_initial_accounts() -> None:
    db = SessionLocal()
    credentials: list[tuple[str, str, str]] = []
    try:
        admin = db.query(User).filter_by(role="admin", is_active=True).order_by(User.id).first()
        if admin is None:
            password = _temporary_password()
            admin = seed_user(
                db,
                email="factory-admin@everestmills.invalid",
                password=password,
                full_name="Factory Administrator",
                role="admin",
                company=COMPANY,
            )
            if admin is not None:
                admin.must_change_password = True
                admin.password_hash = hash_password(password)
                db.commit()
                credentials.append((admin.login_id or "", admin.full_name, password))

        for index, full_name in enumerate(EMPLOYEES, start=1):
            email = f"initial-employee-{index:02d}@everestmills.invalid"
            existing = db.query(User).filter_by(email=email).first()
            if existing is not None:
                continue
            password = _temporary_password()
            employee = seed_user(
                db,
                email=email,
                password=password,
                full_name=full_name,
                role="staff",
                company=COMPANY,
            )
            if employee is not None:
                employee.must_change_password = True
                employee.password_hash = hash_password(password)
                db.commit()
                credentials.append((employee.login_id or "", employee.full_name, password))

        print("New account credentials (temporary; change password at first sign-in):")
        if credentials:
            print("Login ID | Name | Temporary password")
            for login_id, full_name, password in credentials:
                print(f"{login_id} | {full_name} | {password}")
        else:
            print("No accounts were created; matching seeded accounts already exist.")
        active_admins = db.query(User).filter_by(role="admin", is_active=True).count()
        employee_count = db.query(User).filter_by(role="staff", is_active=True).count()
        print(f"Active administrators: {active_admins}; active employee accounts: {employee_count}.")
        if admin is not None:
            print(f"Administrator login ID: {admin.login_id}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_initial_accounts()
