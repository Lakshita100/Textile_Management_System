"""Sequence counters used to generate business identifiers (MOV-, ALT-, ...)."""

from __future__ import annotations

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Sequence(Base):
    """Monotonic counter per identifier family, incremented inside transactions."""

    __tablename__ = "id_sequences"

    name: Mapped[str] = mapped_column(String(32), primary_key=True)
    value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
