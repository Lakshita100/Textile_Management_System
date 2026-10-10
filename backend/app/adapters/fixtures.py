"""Development adapters for teammate-owned modules (Ram orders, Maahi inventory, Anand quality).

IMPORTANT: The data served here is clearly labelled DEVELOPMENT FIXTURES.
It is NOT live integration. Each adapter is behind a small interface so the
real teammate API client can be swapped in without touching the recommender.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone


@dataclass
class OrderInfo:
    """Subset of Ram's order contract needed by Feature 02 (PROPOSED)."""

    order_ref: str
    material: str
    process: str
    quantity: float
    unit: str
    deadline: datetime | None = None
    source: str = "FIXTURE"


@dataclass
class MaterialAvailability:
    """Subset of Maahi's inventory contract needed by Feature 02 (PROPOSED)."""

    material: str
    on_hand: float
    reserved: float
    unit: str
    source: str = "FIXTURE"

    @property
    def available(self) -> float:
        return max(0.0, self.on_hand - self.reserved)


@dataclass
class QualitySummary:
    """Subset of Anand's quality contract needed by Feature 02 (PROPOSED)."""

    machine_id: int | None
    inspected_count: int
    approved_count: int
    source: str = "FIXTURE"

    @property
    def pass_rate(self) -> float | None:
        if self.inspected_count <= 0:
            return None
        return 100.0 * self.approved_count / self.inspected_count


# ---------------------------------------------------------------------------
# FIXTURE DATA — development only, replace with real API clients in Phase 6
# ---------------------------------------------------------------------------

_FIXTURE_ORDERS: dict[str, OrderInfo] = {}


def _ensure_demo_fixtures() -> None:
    if not _FIXTURE_ORDERS:
        deadline = datetime.now(timezone.utc) + timedelta(days=7)
        _FIXTURE_ORDERS["ORD-DEMO-001"] = OrderInfo(
            order_ref="ORD-DEMO-001",
            material="COTTON",
            process="WEAVING",
            quantity=1200.0,
            unit="meters",
            deadline=deadline,
        )
        _FIXTURE_ORDERS["ORD-DEMO-002"] = OrderInfo(
            order_ref="ORD-DEMO-002",
            material="POLYESTER",
            process="DYEING",
            quantity=800.0,
            unit="meters",
            deadline=datetime.now(timezone.utc) + timedelta(days=5),
        )


_FIXTURE_MATERIALS: dict[str, MaterialAvailability] = {
    "COTTON": MaterialAvailability(material="COTTON", on_hand=5000.0, reserved=400.0, unit="meters"),
    "POLYESTER": MaterialAvailability(material="POLYESTER", on_hand=300.0, reserved=100.0, unit="meters"),
}


# machine_id -> (inspected, approved) — used when no real quality history exists
_FIXTURE_QUALITY: dict[int, tuple[int, int]] = {
    # 1: (90, 85) -> 94.4%; 2: (40, 30) -> 75%; machine 3 has no history (unknown)
}


class OrdersAdapter:
    """PROPOSED contract: Ram's Order module will replace this fixture."""

    def get_order(self, order_ref: str) -> OrderInfo | None:
        _ensure_demo_fixtures()
        return _FIXTURE_ORDERS.get(order_ref)


class InventoryAdapter:
    """PROPOSED contract: Maahi's Inventory module will replace this fixture."""

    def get_availability(self, material: str) -> MaterialAvailability | None:
        return _FIXTURE_MATERIALS.get(material.strip().upper())


class QualityAdapter:
    """PROPOSED contract: Anand's Quality module will replace this fixture."""

    def get_machine_quality(self, machine_id: int) -> QualitySummary:
        inspected, approved = _FIXTURE_QUALITY.get(machine_id, (0, 0))
        return QualitySummary(
            machine_id=machine_id, inspected_count=inspected, approved_count=approved
        )


orders_adapter = OrdersAdapter()
inventory_adapter = InventoryAdapter()
quality_adapter = QualityAdapter()
