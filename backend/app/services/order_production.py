"""Material reservation and machine scheduling for approved buyer orders."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime, time, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.machine import Machine
from app.models.order import BuyerOrder, FabricRecipe, FabricRecipeIngredient
from app.models.production import ProductionJob
from app.models.yarn import YarnInventory
from app.schemas.movement import MovementCreate
from app.services import recommendation as recommendation_service
from app.services import production as production_service
from app.services.machines import MachineRuleError
from app.services.production import detect_schedule_conflict
from app.services.movements import record_movement
from app.utils.errors import ConflictError


class OrderWorkflowError(Exception):
    def __init__(self, message: str, code: str = "ORDER_WORKFLOW_ERROR") -> None:
        super().__init__(message)
        self.code = code


@dataclass
class StockNeed:
    key: str
    label: str
    quantity: float
    rows: list[YarnInventory]


def _normal_spec(value: str) -> str:
    value = re.sub(r"\b(DTY|FDY)\b", "", value or "", flags=re.IGNORECASE)
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def _unit_key(value: str) -> str:
    unit = (value or "").strip().lower()
    if unit in {"kg", "kgs", "kilogram", "kilograms"}:
        return "kg"
    if unit in {"m", "meter", "meters", "metre", "metres"}:
        return "m"
    return unit


def _fiber_name(value: str) -> str | None:
    known = ("POLYESTER", "COTTON", "VISCOSE", "NYLON", "WOOL", "LINEN")
    upper = value.upper()
    return next((fiber for fiber in known if fiber in upper), None)


def _fabric_recipe(db: Session, order: BuyerOrder) -> FabricRecipe:
    recipe = db.get(FabricRecipe, order.product_code or "")
    if recipe is None or not recipe.active:
        raise OrderWorkflowError("The selected fabric recipe is missing or inactive.", "FABRIC_RECIPE_NOT_FOUND")
    if order.unit.strip().lower() not in {"kg", "kgs", "kilogram", "kilograms"}:
        raise OrderWorkflowError(
            "This fabric recipe is defined in kilograms. Change the order quantity to kg before approval.",
            "FABRIC_ORDER_UNIT_UNSUPPORTED",
        )
    return recipe


def _recipe_stock_rows(db: Session, ingredient: FabricRecipeIngredient) -> list[YarnInventory]:
    if ingredient.yarn_id:
        row = db.get(YarnInventory, ingredient.yarn_id)
        return [row] if row is not None else []

    fiber = _fiber_name(ingredient.yarn_type)
    specification = _normal_spec(ingredient.specification)
    if not fiber or not specification:
        return []
    rows = db.scalars(
        select(YarnInventory)
        .where(
            func.lower(YarnInventory.material_composition).contains(fiber.lower()),
            func.lower(YarnInventory.denier_specification).contains(
                re.sub(r"\b(DTY|FDY)\b", "", ingredient.specification, flags=re.IGNORECASE).strip().lower()
            ),
            func.lower(YarnInventory.unit).in_(["kg", "kgs", "kilogram", "kilograms"]),
        )
        .order_by(YarnInventory.current_stock.desc(), YarnInventory.yarn_id)
    ).all()
    return [row for row in rows if _normal_spec(row.denier_specification) == specification]


def _material_needs(db: Session, order: BuyerOrder) -> list[StockNeed]:
    if order.yarn_id:
        row = db.get(YarnInventory, order.yarn_id)
        if row is None:
            raise OrderWorkflowError("The order's yarn inventory row no longer exists.", "YARN_NOT_FOUND")
        if _unit_key(row.unit) != _unit_key(order.unit):
            raise OrderWorkflowError("Order and yarn inventory units do not match.", "UNIT_MISMATCH")
        return [StockNeed(row.yarn_id, row.yarn_name, order.quantity, [row])]

    if (order.product_category or "").strip().lower() != "fabric":
        raise OrderWorkflowError(
            "This order is not linked to a stock item or fabric recipe. Select a catalog item before approval.",
            "MATERIAL_ROW_REQUIRED",
        )

    recipe = _fabric_recipe(db, order)
    ingredients = db.scalars(
        select(FabricRecipeIngredient)
        .where(FabricRecipeIngredient.recipe_code == recipe.recipe_code)
        .order_by(FabricRecipeIngredient.line_no)
    ).all()
    if not ingredients:
        raise OrderWorkflowError("The fabric recipe has no yarn ingredient rows.", "EMPTY_FABRIC_RECIPE")

    scale = order.quantity / recipe.finished_weight_kg
    needs_by_key: dict[str, StockNeed] = {}
    for ingredient in ingredients:
        rows = _recipe_stock_rows(db, ingredient)
        fiber = _fiber_name(ingredient.yarn_type) or ingredient.yarn_type.strip().upper()
        spec = _normal_spec(ingredient.specification)
        key = f"{ingredient.yarn_id or fiber + ':' + spec}"
        need = needs_by_key.get(key)
        amount = ingredient.quantity_kg * scale
        if need is None:
            needs_by_key[key] = StockNeed(
                key=key,
                label=f"{ingredient.yarn_type} · {ingredient.specification}",
                quantity=amount,
                rows=rows,
            )
        else:
            need.quantity += amount
            # Keep the resolved stock rows from the first identical recipe line.
    return list(needs_by_key.values())


def material_snapshot(db: Session, order: BuyerOrder) -> dict:
    needs = _material_needs(db, order)
    components: list[dict] = []
    total_required = 0.0
    total_available = 0.0
    total_shortage = 0.0
    for need in needs:
        required = round(need.quantity, 3)
        available = round(sum(float(row.current_stock) for row in need.rows), 3)
        shortage = round(max(0.0, required - available), 3)
        total_required += required
        total_available += available
        total_shortage += shortage
        components.append({
            "material": need.label,
            "yarnId": need.rows[0].yarn_id if need.rows else None,
            "requiredQuantity": required,
            "availableQuantity": available,
            "shortageQuantity": shortage,
            "unit": need.rows[0].unit if need.rows else "kg",
            "status": "Available" if shortage == 0 else "Partially Available" if available > 0 else "Insufficient Stock",
        })

    status = "Available" if total_shortage == 0 else "Partially Available" if total_available > 0 else "Insufficient Stock"
    return {
        "orderId": order.id,
        "status": status,
        "availableQuantity": round(total_available, 3),
        "requiredQuantity": round(total_required, 3),
        "shortageQuantity": round(total_shortage, 3),
        "unit": "kg" if (order.product_category or "").lower() == "fabric" else (needs[0].rows[0].unit if needs and needs[0].rows else order.unit),
        "notes": "Live check against yarn inventory and the selected fabric recipe." if (order.product_category or "").lower() == "fabric" else "Live check against yarn inventory.",
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "source": "Fabric recipe inventory" if (order.product_category or "").lower() == "fabric" else "Raw material inventory",
        "components": components,
    }


def _process_route(db: Session, order: BuyerOrder) -> list[str]:
    category = (order.product_category or "").strip().lower()
    if category == "yarn":
        stock = db.get(YarnInventory, order.yarn_id) if order.yarn_id else None
        stage = (stock.inventory_stage if stock else "").strip().lower()
        available_processes = {
            process
            for machine in db.scalars(select(Machine)).all()
            for process in machine.process_list
        }
        yarn_detail = " ".join((order.product_name, order.yarn_type or "", order.yarn_subtype or "", stock.category if stock else "")).lower()
        if stage == "finished yarn":
            route = []
        elif any(term in yarn_detail for term in ("aty", "air-textured", "false-twist", "dty", "textured", "mechanical stretch")):
            route = ["TEXTURING"]
        elif any(term in yarn_detail for term in ("fdy", "spun", "worsted", "melange")):
            route = ["SPINNING"]
        else:
            route = []
        # Yarn orders still receive a production job. Prefer the process implied
        # by the yarn specification; when the factory has no such machine, use
        # its configured finishing line to prepare the allocated yarn for dispatch.
        if route and route[0] not in available_processes:
            route = []
        if not route:
            if "FINISHING" not in available_processes:
                raise OrderWorkflowError(
                    "No compatible yarn process or finishing machine is configured for this order.",
                    "PROCESS_MACHINE_UNAVAILABLE",
                )
            route = ["FINISHING"]
        shade = (order.shade or (stock.colour_shade if stock else "")).strip().lower()
        if shade and shade not in {"natural", "undyed", "raw", "ecru", "white"}:
            if "DYEING" not in available_processes:
                raise OrderWorkflowError(
                    "This yarn order specifies a colour, but no dyeing machine is configured.",
                    "PROCESS_MACHINE_UNAVAILABLE",
                )
            route.insert(0, "DYEING")
        missing = [process for process in route if process not in available_processes]
        if missing:
            raise OrderWorkflowError(
                f"No machine is configured for required process: {', '.join(missing)}. Add a compatible machine before scheduling this yarn order.",
                "PROCESS_MACHINE_UNAVAILABLE",
            )
        return route

    available_processes = {
        process
        for machine in db.scalars(select(Machine)).all()
        for process in machine.process_list
    }
    detail = " ".join((order.product_name, order.yarn_type or "", order.technical_specifications or "", order.special_requirements or "")).lower()

    if category == "fabric":
        recipe = _fabric_recipe(db, order)
        fabric_kind = recipe.fabric_category.strip().upper()
        if fabric_kind == "WOVEN":
            route = ["WEAVING"]
        elif fabric_kind in {"KNIT", "KNITTED"}:
            route = ["KNITTING"]
        else:
            raise OrderWorkflowError(f"No production route is defined for fabric category {fabric_kind}.", "NO_PROCESS_ROUTE")
        shade = (order.shade or "").strip().lower()
        if shade and shade not in {"natural", "undyed", "raw", "ecru"}:
            route.append("DYEING")
        if re.search(r"\b(print|printed|printing|pattern)\b", detail):
            route.append("PRINTING")
        route.append("FINISHING")
    else:
        keywords = {
            "WEAVING": ("weav", "loom"),
            "KNITTING": ("knit",),
            "DYEING": ("dye", "dyed"),
            "PRINTING": ("print", "printed", "pattern"),
            "FINISHING": ("finish", "finished"),
        }
        route = [process for process, terms in keywords.items() if any(term in detail for term in terms)]
        if not route:
            raise OrderWorkflowError(
                "Could not infer a machine process from this order. Add a process in the technical requirements.",
                "NO_PROCESS_ROUTE",
            )

    missing = [process for process in route if process not in available_processes]
    if missing:
        raise OrderWorkflowError(
            f"No machine is configured for required process: {', '.join(missing)}. Add a compatible machine before approving this order.",
            "PROCESS_MACHINE_UNAVAILABLE",
        )
    return route


def _material_family(order: BuyerOrder) -> str:
    fibers = {fiber for fiber in ("COTTON", "POLYESTER", "VISCOSE", "NYLON", "WOOL", "LINEN") if fiber in order.material_composition.upper()}
    if len(fibers) == 1:
        return next(iter(fibers))
    if len(fibers) > 1:
        return "BLENDED"
    return "BLENDED"


def _deadline(order: BuyerOrder) -> datetime | None:
    if not order.requested_delivery_date:
        return None
    try:
        day = date.fromisoformat(order.requested_delivery_date[:10])
    except ValueError:
        return None
    return datetime.combine(day, time.max, tzinfo=timezone.utc)


def schedule_order_jobs(db: Session, order: BuyerOrder) -> list[ProductionJob]:
    route = _process_route(db, order)
    if not route:
        return []

    jobs: list[ProductionJob] = []
    deadline = _deadline(order)
    family = _material_family(order)
    previous_end: datetime | None = None
    for process in route:
        candidates, _, _, _ = recommendation_service.rank_machines(
            db,
            required_process=process,
            required_material=family,
            required_quantity=order.quantity,
            deadline=deadline,
            quantity_unit=order.unit,
            material_verified=True,
            material_note="Order materials verified against live inventory.",
        )
        eligible = [candidate for candidate in candidates if candidate.eligible and candidate.schedule is not None]
        if not eligible:
            raise OrderWorkflowError(
                f"No available machine can schedule {process} for this order by the requested delivery date.",
                "NO_ELIGIBLE_MACHINE",
            )

        job: ProductionJob | None = None
        last_reason = "No compatible machine has a clear schedule."
        for selected in eligible:
            estimate = selected.schedule
            assert estimate is not None
            duration = estimate.completion_at - estimate.earliest_start_at
            start = max(estimate.earliest_start_at, previous_end) if previous_end else estimate.earliest_start_at
            end = start + duration
            # Schedule after any committed future window on this machine.
            clear_window = True
            for _ in range(100):
                conflict = detect_schedule_conflict(db, selected.machine.id, start, end)
                if conflict is None:
                    break
                if conflict.planned_start is None or conflict.planned_end is None:
                    clear_window = False
                    last_reason = f"Machine {selected.machine.code} has a committed job with no complete schedule window."
                    break
                start = max(start, conflict.planned_end)
                end = start + duration
            else:
                clear_window = False
            if not clear_window:
                continue
            if deadline is not None and end > deadline:
                last_reason = f"Machine {selected.machine.code} cannot finish {process} by the requested delivery date."
                continue
            try:
                job = production_service.create_job(
                    db,
                    machine=selected.machine,
                    order_ref=order.id,
                    material_spec=order.material_composition[:255],
                    required_process=process,
                    planned_quantity=order.quantity,
                    quantity_unit=order.unit,
                    planned_start=start,
                    planned_end=end,
                    commit=False,
                )
                break
            except MachineRuleError as exc:
                last_reason = str(exc)
        if job is None:
            raise OrderWorkflowError(last_reason, "NO_ELIGIBLE_MACHINE")
        jobs.append(job)
        previous_end = end
    return jobs


def consume_order_materials(db: Session, order: BuyerOrder) -> list[dict]:
    needs = _material_needs(db, order)
    snapshot = material_snapshot(db, order)
    if snapshot["status"] != "Available":
        raise OrderWorkflowError(
            f"Insufficient stock to fulfill this order. Total shortage: {snapshot['shortageQuantity']} {snapshot['unit']}.",
            "INSUFFICIENT_STOCK",
        )

    consumed: list[dict] = []
    today = date.today()
    for need in needs:
        remaining = round(need.quantity, 3)
        for row in need.rows:
            amount = min(remaining, round(float(row.current_stock), 3))
            if amount <= 0:
                continue
            try:
                movement = record_movement(
                    db,
                    MovementCreate(
                        yarnId=row.yarn_id,
                        movementType="Consumption",
                        quantity=amount,
                        date=today,
                        reference=f"Order {order.id}",
                        reason=f"Production allocation for order {order.id}",
                    ),
                    today=today,
                )
            except ConflictError as exc:
                raise OrderWorkflowError(str(exc), "INSUFFICIENT_STOCK") from exc
            consumed.append({"yarnId": row.yarn_id, "quantity": amount, "unit": row.unit, "movementId": movement.movementId})
            remaining = round(remaining - amount, 3)
            if remaining <= 0:
                break
        if remaining > 0:
            raise OrderWorkflowError(
                f"Inventory changed during approval; {remaining} kg of {need.label} is no longer available.",
                "INSUFFICIENT_STOCK",
            )
    return consumed
