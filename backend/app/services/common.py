"""Shared service helpers: stock rules, transactions, business identifiers."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models import Sequence

# Stock rules — identical to the frontend rules (one source of truth per tier).
STATUS_IN_STOCK = "In Stock"
STATUS_LOW_STOCK = "Low Stock"
STATUS_OUT_OF_STOCK = "Out of Stock"


def round_qty(value: float) -> float:
    """Round to 3 decimals to avoid float drift (10.000000000000002 → 10)."""
    return round(value, 3)


def resolve_status(current_stock: float, minimum_stock_level: float) -> str:
    if current_stock <= 0:
        return STATUS_OUT_OF_STOCK
    if current_stock < minimum_stock_level:
        return STATUS_LOW_STOCK
    return STATUS_IN_STOCK


def needs_alert(current_stock: float, minimum_stock_level: float) -> bool:
    """Alert when stock is at or below the threshold (covers out of stock)."""
    return current_stock <= minimum_stock_level


def shortage(current_stock: float, minimum_stock_level: float) -> float:
    return round_qty(max(0.0, minimum_stock_level - current_stock))


@contextmanager
def transaction(db: Session) -> Iterator[None]:
    """Commit on success, roll back on any error (incl. AppError)."""
    try:
        yield
        db.commit()
    except Exception:
        db.rollback()
        raise


def next_code(db: Session, sequence_name: str, prefix: str, width: int = 5) -> str:
    """Allocate the next business identifier, e.g. MOV-00042.

    The counter row is updated inside the caller's transaction so identifiers
    stay unique under concurrency (row lock on PostgreSQL).
    """
    row = db.get(Sequence, sequence_name, with_for_update=True)
    if row is None:
        row = Sequence(name=sequence_name, value=0)
        db.add(row)
        db.flush()
    row.value += 1
    db.flush()
    return f"{prefix}-{row.value:0{width}d}"


def like_pattern(query: str) -> str:
    """Escape LIKE wildcards in user input (case handled by lower())."""
    escaped = query.strip().lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def lower_like(column, pattern: str):  # noqa: ANN001, ANN201
    """Case-insensitive contains-match that works on SQLite and PostgreSQL."""
    from sqlalchemy import func

    return func.lower(column).like(pattern, escape="\\")
