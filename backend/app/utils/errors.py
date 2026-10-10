"""Application-specific exceptions and FastAPI error handlers."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base class for expected business errors (never a 500)."""

    status_code = 400
    code = "bad_request"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    """Duplicate identifiers, insufficient stock, unsafe deletes, ..."""

    status_code = 409
    code = "conflict"


class PayloadError(AppError):
    """Request that passes schema validation but breaks a business rule."""

    status_code = 400
    code = "invalid_payload"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )
