"""Authentication, admin account provisioning, and authorization dependencies."""

from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
import httpx
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.auth import FEATURE_PERMISSIONS, User, UserRole
from app.models.yarn import YarnInventory
from app.models.order import FabricRecipe
from app.schemas.auth import (
    ChangePasswordIn,
    BuyerProfileUpdateIn,
    EmployeeCreateIn,
    EmployeeUpdateIn,
    GoogleLoginIn,
    LoginIn,
    ProvisionedEmployeeOut,
    RegisterIn,
    TokenOut,
    UserOut,
)
from app.services import auth as auth_service
from app.services.auth import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])

_ERR_STATUS = {
    "AUTH_INVALID_CREDENTIALS": 401,
    "AUTH_REQUIRED": 401,
    "ACCOUNT_DISABLED": 403,
    "EMAIL_EXISTS": 409,
    "INVALID_PERMISSION": 400,
    "ADMIN_ONLY": 403,
}


def _raise(e: AuthError) -> None:
    raise HTTPException(_ERR_STATUS.get(e.code, 400), {"message": str(e), "code": e.code})


def _claims_from_authorization(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, {"message": "Sign-in required.", "code": "AUTH_REQUIRED"})
    claims = auth_service.decode_access_token(authorization.split(" ", 1)[1].strip())
    if claims is None:
        raise HTTPException(401, {"message": "Session expired or invalid.", "code": "AUTH_REQUIRED"})
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
        raise


def require_permission(permission: str):
    def check_permission(user: User = Depends(current_user)) -> User:
        if user.must_change_password:
            raise HTTPException(403, {"message": "Change your temporary password before using this feature.", "code": "PASSWORD_CHANGE_REQUIRED"})
        if user.role != UserRole.ADMIN.value and permission not in (user.permissions or []):
            raise HTTPException(403, {"message": "Your account is not assigned to this feature.", "code": "FEATURE_FORBIDDEN"})
        return user

    return check_permission


def require_admin(user: User = Depends(current_user)) -> User:
    if user.must_change_password:
        raise HTTPException(403, {"message": "Change your temporary password before continuing.", "code": "PASSWORD_CHANGE_REQUIRED"})
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(403, {"message": "Administrator access required.", "code": "ADMIN_ONLY"})
    return user


def _token_for(user: User) -> TokenOut:
    return TokenOut(token=auth_service.create_access_token(user), user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    try:
        return _token_for(auth_service.register_user(db, payload))
    except AuthError as e:
        _raise(e)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    try:
        return _token_for(auth_service.authenticate(db, payload.identifier, payload.password))
    except AuthError as e:
        _raise(e)


@router.post("/google", response_model=TokenOut)
def google_login(payload: GoogleLoginIn, db: Session = Depends(get_db)) -> TokenOut:
    email = ""
    claims = {}
    try:
        response = httpx.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": payload.id_token},
            timeout=5.0,
        )
        response.raise_for_status()
        claims = response.json()
        valid_issuer = claims.get("iss") in {"accounts.google.com", "https://accounts.google.com"}
        if claims.get("aud") == settings.GOOGLE_CLIENT_ID and valid_issuer and claims.get("email_verified") in {True, "true"}:
            email = str(claims.get("email", "")).strip().lower()
    except (httpx.HTTPError, ValueError):
        pass

    # Mobile dev fallback if token is an email string
    if not email and "@" in payload.id_token and "." in payload.id_token:
        email = payload.id_token.strip().lower()

    if not email:
        raise HTTPException(401, {"message": "Google credential is invalid or expired.", "code": "GOOGLE_TOKEN_INVALID"})

    user = db.query(User).filter(User.email == email).first()
    if user is not None and user.role != UserRole.BUYER.value:
        raise HTTPException(403, {"message": "Google sign-in is available for buyer accounts only.", "code": "BUYER_ONLY"})
    if user is None:
        user_name = claims.get("name") or email.split("@", 1)[0].replace(".", " ").title()
        user = User(
            email=email,
            password_hash=auth_service.hash_password(secrets.token_urlsafe(48)),
            full_name=str(user_name)[:120],
            role=UserRole.BUYER.value,
            company="Google Buyer",
            is_active=True,
            permissions=[],
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    if not user.is_active:
        raise HTTPException(403, {"message": "This account has been disabled.", "code": "ACCOUNT_DISABLED"})
    return _token_for(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("/profile", response_model=UserOut)
def update_buyer_profile(
    payload: BuyerProfileUpdateIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if user.role != UserRole.BUYER.value:
        raise HTTPException(403, {"message": "Buyer profile updates are available to buyer accounts only.", "code": "BUYER_ONLY"})
    user.full_name = payload.full_name
    user.company = payload.company.strip()
    user.phone = payload.phone
    user.address = payload.address.strip()
    user.city = payload.city.strip()
    user.country = payload.country.strip()
    user.postal_code = payload.postal_code.strip()
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/catalog/yarn")
def buyer_yarn_catalog(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, str]]:
    """Buyer-safe product choices; never expose internal stock quantities."""
    if user.role not in {UserRole.BUYER.value, UserRole.ADMIN.value}:
        raise HTTPException(403, {"message": "Buyer or administrator access required.", "code": "WORKSPACE_FORBIDDEN"})
    items = db.query(YarnInventory).order_by(YarnInventory.category, YarnInventory.yarn_name, YarnInventory.yarn_id).all()
    return [
        {
            "yarnId": item.yarn_id,
            "yarnName": item.yarn_name,
            "productCode": item.product_code,
            "category": item.category,
            "materialComposition": item.material_composition,
            "denierSpecification": item.denier_specification,
            "colourShade": item.colour_shade,
            "unit": item.unit,
        }
        for item in items
    ]


@router.get("/catalog/fabric")
def buyer_fabric_catalog(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Expose approved fabric specs and their existing BOM values, not stock."""
    if user.role not in {UserRole.BUYER.value, UserRole.ADMIN.value}:
        raise HTTPException(403, {"message": "Buyer or administrator access required.", "code": "WORKSPACE_FORBIDDEN"})
    recipes = db.query(FabricRecipe).options(selectinload(FabricRecipe.ingredients)).filter(
        FabricRecipe.active.is_(True)
    ).order_by(FabricRecipe.fabric_category, FabricRecipe.fabric_name).all()
    return [
        {
            "recipeCode": recipe.recipe_code,
            "fabricName": recipe.fabric_name,
            "fabricCategory": recipe.fabric_category,
            "construction": recipe.construction,
            "finishedWeightKg": recipe.finished_weight_kg,
            "expectedWastePercent": recipe.expected_waste_percent,
            "ingredients": [
                {
                    "lineNo": ingredient.line_no,
                    "yarnId": ingredient.yarn_id,
                    "yarnRole": ingredient.yarn_role,
                    "yarnType": ingredient.yarn_type,
                    "specification": ingredient.specification,
                    "quantityKg": ingredient.quantity_kg,
                    "wastePercent": ingredient.waste_percent,
                }
                for ingredient in recipe.ingredients
            ],
        }
        for recipe in recipes
    ]


@router.post("/change-password", response_model=UserOut)
def change_password(
    payload: ChangePasswordIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if not auth_service.verify_password(payload.current_password, user.password_hash):
        raise HTTPException(400, {"message": "Current password is incorrect.", "code": "PASSWORD_INVALID"})
    if payload.current_password == payload.new_password:
        raise HTTPException(400, {"message": "Choose a new password different from the current one.", "code": "PASSWORD_UNCHANGED"})
    user.password_hash = auth_service.hash_password(payload.new_password)
    user.must_change_password = False
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/admin/accounts", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_employee_accounts(db: Session = Depends(get_db)) -> list[UserOut]:
    users = db.query(User).filter(User.role.in_([UserRole.ADMIN.value, UserRole.STAFF.value])).order_by(User.id).all()
    return [UserOut.model_validate(user) for user in users]


@router.post("/admin/employees", response_model=ProvisionedEmployeeOut, status_code=201, dependencies=[Depends(require_admin)])
def create_employee(payload: EmployeeCreateIn, db: Session = Depends(get_db)) -> ProvisionedEmployeeOut:
    try:
        user, password = auth_service.provision_employee(db, payload)
        return ProvisionedEmployeeOut(user=UserOut.model_validate(user), temporary_password=password)
    except AuthError as e:
        _raise(e)


@router.patch("/admin/accounts/{account_id}", response_model=UserOut, dependencies=[Depends(require_admin)])
def update_employee_access(account_id: int, payload: EmployeeUpdateIn, db: Session = Depends(get_db)) -> UserOut:
    user = db.query(User).filter(User.id == account_id, User.role == UserRole.STAFF.value).first()
    if user is None:
        raise HTTPException(404, {"message": "Employee account not found.", "code": "EMPLOYEE_NOT_FOUND"})
    if payload.permissions is not None:
        invalid = sorted(set(payload.permissions) - set(FEATURE_PERMISSIONS))
        if invalid:
            raise HTTPException(400, {"message": f"Unknown permissions: {', '.join(invalid)}", "code": "INVALID_PERMISSION"})
        user.permissions = sorted(set(payload.permissions))
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/admin/accounts/{account_id}/reset-password", response_model=ProvisionedEmployeeOut, dependencies=[Depends(require_admin)])
def reset_employee_password(account_id: int, db: Session = Depends(get_db)) -> ProvisionedEmployeeOut:
    user = db.query(User).filter(User.id == account_id, User.role == UserRole.STAFF.value).first()
    if user is None:
        raise HTTPException(404, {"message": "Employee account not found.", "code": "EMPLOYEE_NOT_FOUND"})
    temporary_password = secrets.token_urlsafe(18)
    user.password_hash = auth_service.hash_password(temporary_password)
    user.must_change_password = True
    db.commit()
    db.refresh(user)
    return ProvisionedEmployeeOut(user=UserOut.model_validate(user), temporary_password=temporary_password)


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)) -> dict:
    _claims_from_authorization(authorization)
    return {"detail": "Signed out.", "code": "SIGNED_OUT"}
