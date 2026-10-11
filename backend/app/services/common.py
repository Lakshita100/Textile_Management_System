"""Shared service helpers: stock rules, transactions, business identifiers."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.models import PurchaseRequest, Sequence, StockAlert, StockMovement, Supplier

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
    # Existing Supabase data may predate id_sequences (or its counter may have
    # been reset). Seed from the actual IDs before incrementing so the first
    # request cannot collide with an already-issued identifier.
    id_columns = {
        "MOV": StockMovement.movement_id,
        "ALT": StockAlert.alert_id,
        "PR": PurchaseRequest.request_id,
        "SUP": Supplier.supplier_id,
    }
    id_column = id_columns.get(prefix)
    highest_issued = 0
    if id_column is not None:
        for identifier in db.scalars(select(id_column).where(id_column.like(f"{prefix}-%"))):
            try:
                highest_issued = max(highest_issued, int(identifier.rsplit("-", 1)[1]))
            except (ValueError, IndexError):
                continue

    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
        statement = pg_insert(Sequence).values(name=sequence_name, value=highest_issued + 1)
        statement = statement.on_conflict_do_update(
            index_elements=[Sequence.name],
            set_={"value": func.greatest(Sequence.value, highest_issued) + 1},
        ).returning(Sequence.value)
    elif dialect == "sqlite":
        statement = sqlite_insert(Sequence).values(name=sequence_name, value=highest_issued + 1)
        statement = statement.on_conflict_do_update(
            index_elements=[Sequence.name],
            set_={"value": func.max(Sequence.value, highest_issued) + 1},
        ).returning(Sequence.value)
    else:
        row = db.get(Sequence, sequence_name, with_for_update=True)
        if row is None:
            row = Sequence(name=sequence_name, value=highest_issued)
            db.add(row)
            db.flush()
        row.value = max(row.value, highest_issued) + 1
        db.flush()
        return f"{prefix}-{row.value:0{width}d}"

    value = db.scalar(statement)
    if value is None:
        raise RuntimeError(f"Could not allocate an identifier for sequence {sequence_name}.")
    return f"{prefix}-{value:0{width}d}"


def like_pattern(query: str) -> str:
    """Escape LIKE wildcards in user input (case handled by lower())."""
    escaped = query.strip().lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def lower_like(column, pattern: str):  # noqa: ANN001, ANN201
    """Case-insensitive contains-match that works on SQLite and PostgreSQL."""
    from sqlalchemy import func

    return func.lower(column).like(pattern, escape="\\")
