"""DEMO SEED — clearly labelled development fixtures for local demos.

Run: python -m scripts.seed_demo   (from backend/)
Idempotent: skips machine codes / inspection codes that already exist.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.config import settings
from app.database import SessionLocal, engine, Base
from app.models import (
    BuyerOrder,
    InspectionOutcome,
    Machine,
    MachineDowntime,
    MachineStatus,
    PackingLot,
    ProductionJob,
    ProductionJobStatus,
    QualityInspection,
    Shipment,
    User,
)
from app.services.auth import hash_password, seed_user
from app.services.production import create_job, transition_job, update_progress


def _seed_accounts(db) -> None:
    """Idempotent demo accounts for the real auth module (JWT sign-in).

    Admin accounts can never be self-registered — they are provisioned here.
    """
    accounts = []
    initial_admin_password = settings.INITIAL_ADMIN_PASSWORD.strip()
    if initial_admin_password:
        if len(initial_admin_password) < 12:
            raise RuntimeError("INITIAL_ADMIN_PASSWORD must be at least 12 characters.")
        accounts.insert(0, dict(
            email=settings.INITIAL_ADMIN_EMAIL.strip().lower(),
            password=initial_admin_password,
            full_name=settings.INITIAL_ADMIN_NAME.strip(),
            role="admin",
            company="Everest Textile Mills",
        ))
    created = [seed_user(db, **account) for account in accounts]
    if any(created):
        print("Seeded the configured administrator account.")
    if initial_admin_password:
        administrator_by_email = db.query(User).filter_by(
            email=settings.INITIAL_ADMIN_EMAIL.strip().lower(),
            role="admin",
            must_change_password=True,
        ).first()
        if administrator_by_email:
            administrator_by_email.password_hash = hash_password(initial_admin_password)
            administrator_by_email.must_change_password = False
            db.commit()
    administrator = db.query(User).filter_by(role="admin", is_active=True).order_by(User.id).first()
    if administrator:
        print(f"Administrator login ID: {administrator.login_id}")
    elif not initial_admin_password:
        print("No administrator provisioned. Set INITIAL_ADMIN_PASSWORD in backend/.env, then rerun the seed script.")


def _create_jobs(db) -> dict[str, ProductionJob]:
    now = datetime.now(timezone.utc)
    jobs: dict[str, ProductionJob] = {}

    jobs["loom01"] = create_job(
        db, machine=db.query(Machine).filter_by(code="LOOM-01").one(), order_ref="ORD-DEMO-001",
        material_spec="COTTON RAW 40s", required_process="WEAVING", planned_quantity=2000,
        planned_start=now - timedelta(days=1), planned_end=now + timedelta(days=3), shift="A",
    )
    transition_job(db, jobs["loom01"], ProductionJobStatus.IN_PROGRESS, "seed demo start")
    update_progress(db, jobs["loom01"], 800)

    jobs["dye01"] = create_job(
        db, machine=db.query(Machine).filter_by(code="DYE-01").one(), order_ref="ORD-DEMO-002",
        material_spec="POLYESTER WHITE", required_process="DYEING", planned_quantity=1500,
        planned_start=now, planned_end=now + timedelta(days=4), shift="B",
    )
    transition_job(db, jobs["dye01"], ProductionJobStatus.IN_PROGRESS, "seed demo start")
    update_progress(db, jobs["dye01"], 1200)

    # Finished jobs (disjoint past windows) so quality has real batches to inspect.
    past_specs = [
        ("loom02", "LOOM-02", "ORD-DEMO-003", "COTTON 30s", "WEAVING", 1800, 1750, 12, 8, "A"),
        ("loom03", "LOOM-03", "ORD-DEMO-004", "WOOL BLEND 20s", "WEAVING", 1500, 1320, 11, 7, "B"),
        ("print01", "PRINT-01", "ORD-DEMO-005", "COTTON KNIT", "PRINTING", 2400, 2300, 9, 5, "A"),
    ]
    for key, code, order_ref, material, process, planned, actual, start_days, end_days, shift in past_specs:
        job = create_job(
            db, machine=db.query(Machine).filter_by(code=code).one(), order_ref=order_ref,
            material_spec=material, required_process=process, planned_quantity=planned,
            planned_start=now - timedelta(days=start_days), planned_end=now - timedelta(days=end_days),
            shift=shift,
        )
        transition_job(db, job, ProductionJobStatus.IN_PROGRESS, "seed demo start")
        update_progress(db, job, actual)
        transition_job(db, job, ProductionJobStatus.COMPLETED, "seed demo complete")
        jobs[key] = job
    return jobs


# (job_key, days_ago, inspector, inspected_meters, defects, outcome_override)
# defects: (type, count, severity) — types match the frontend defect list.
INSPECTION_FIXTURES = [
    ("loom01", 13, "Meera P.", 400, [], None),
    ("dye01", 12, "Anita K.", 240, [], None),
    ("loom02", 12, "Rahul S.", 350, [], None),
    ("print01", 12, "Meera P.", 575, [], None),
    ("loom02", 11, "Meera P.", 350, [], None),
    ("loom03", 11, "Anita K.", 440, [], None),
    ("dye01", 10, "Meera P.", 240, [], None),
    ("print01", 10, "Rahul S.", 575, [("Holes", 8, "High")], "Rejected"),
    ("loom02", 9, "Anita K.", 350, [], None),
    ("dye01", 8, "Rahul S.", 240, [], None),
    ("loom03", 8, "Meera P.", 440, [], None),
    ("loom02", 7, "Rahul S.", 350, [("Uneven weaving", 3, "Medium")], None),
    ("print01", 6, "Anita K.", 575, [], None),
    ("loom01", 6, "Rahul S.", 400, [("Holes", 4, "High")], None),
    ("dye01", 5, "Anita K.", 240, [("Colour mismatch", 1, "Low")], None),
    ("loom02", 4, "Meera P.", 350, [], None),
    ("dye01", 3, "Meera P.", 240, [], None),
    ("loom03", 2, "Rahul S.", 440, [], None),
    ("print01", 1, "Meera P.", 575, [("Weft bar", 7, "Medium")], None),
]

EMPLOYEE_IDS = {"Meera P.": "EMP-001", "Rahul S.": "EMP-002", "Anita K.": "EMP-003"}


def _seed_quality(db, jobs: dict[str, ProductionJob]) -> None:
    if db.query(QualityInspection).first() is not None:
        print("Quality inspections already present — skipping.")
        return

    today = datetime.now(timezone.utc).date()
    roll_seq: dict[int, int] = {}
    for job_key, days_ago, inspector, inspected, defects, override in INSPECTION_FIXTURES:
        job = jobs[job_key]
        batch_no = f"BATCH-{job.id}"
        roll_seq[job.id] = roll_seq.get(job.id, 0) + 1
        parsed = [{"type": t, "count": c, "severity": s} for t, c, s in defects]
        total = sum(p["count"] for p in parsed)
        outcome = override or (InspectionOutcome.APPROVED if total == 0 else InspectionOutcome.REWORK)
        outcome_value = outcome.value if isinstance(outcome, InspectionOutcome) else outcome
        db.add(QualityInspection(
            job_id=job.id,
            roll_id=f"{batch_no}-R{roll_seq[job.id]}",
            batch_no=batch_no,
            order_ref=job.order_ref,
            machine_id=job.machine_id,
            employee_id=EMPLOYEE_IDS[inspector],
            inspector_name=inspector,
            inspected_at=today - timedelta(days=days_ago),
            inspected_qty_meters=float(inspected),
            accepted_qty_meters=float(max(0, inspected - total)),
            total_defect_count=total,
            defects=parsed,
            outcome=outcome_value,
            remarks=None,
            source="demo-seed",
        ))
    db.commit()
    print(f"Demo quality seed complete: {len(INSPECTION_FIXTURES)} inspections (DEVELOPMENT FIXTURES).")


def _seed_fulfillment(db, jobs: dict[str, ProductionJob]) -> None:
    """Create labelled packing and dispatch fixtures for the operations screens."""
    if db.query(PackingLot).filter(PackingLot.id.like("DEMO-PACK-%")).first() is not None:
        print("Demo fulfillment data already present — skipping.")
        return

    locations = [
        ("India", "Gujarat", "Surat"),
        ("India", "Tamil Nadu", "Tiruppur"),
        ("India", "Maharashtra", "Mumbai"),
        ("Bangladesh", "Dhaka", "Dhaka"),
        ("Vietnam", "Ho Chi Minh City", "Ho Chi Minh City"),
    ]
    customers = [
        "Everest Apparel House", "Summit Fashion Co", "Riverloom Textiles",
        "Northstar Garments", "Bluebay Fabrics",
    ]
    job_list = [job for job in jobs.values() if job is not None]
    if not job_list:
        job_list = db.query(ProductionJob).order_by(ProductionJob.id).all()
    if not job_list:
        print("No production jobs available — skipping demo fulfillment data.")
        return
    now = datetime.now(timezone.utc)
    orders: list[BuyerOrder] = []

    for index in range(40):
        country, state, city = locations[index % len(locations)]
        buyer = db.query(User).filter_by(email=f"demo-buyer-{index + 1}@example.test").first()
        if buyer is None:
            buyer = User(
                email=f"demo-buyer-{index + 1}@example.test",
                login_id=f"DEMO-BUYER-{index + 1:03d}",
                password_hash="demo-seed-account-not-for-login",
                full_name=f"Demo Buyer {index + 1}",
                role="buyer",
                company=customers[index % len(customers)],
                address=f"{100 + index} Textile Park Road",
                city=city,
                country=country,
                postal_code=f"{395000 + index}",
                is_active=True,
                permissions=[],
                must_change_password=False,
            )
            db.add(buyer)
            db.flush()

        order = BuyerOrder(
            id=f"DEMO-FULFILL-{index + 1:03d}",
            buyer_id=f"user-{buyer.id}",
            buyer_name=buyer.full_name,
            company_name=buyer.company or customers[index % len(customers)],
            buyer_email=buyer.email,
            buyer_phone=None,
            source="demo-seed",
            product_category="Finished fabric",
            product_name=f"Performance Fabric Batch {index + 1:03d}",
            product_code=f"FAB-DEMO-{index + 1:03d}",
            yarn_type="Polyester",
            yarn_subtype="Recycled blend",
            material_composition="Recycled polyester blend",
            technical_specifications="150D, 180 GSM, export finish",
            denier_count="150D",
            shade=["Navy", "White", "Black", "Sea Green"][index % 4],
            quantity=3000 + (index % 8) * 250,
            unit="meters",
            priority="Normal",
            requested_delivery_date=(now.date() + timedelta(days=14 + index % 10)).isoformat(),
            delivery_address=buyer.address,
            delivery_instructions="Keep cartons dry; attach batch documentation.",
            status="Dispatched" if index < 20 else "Ready to Dispatch",
            material_availability={},
            review_history=[],
            buyer_visible_updates=[],
            status_history=[],
            created_at=now.replace(tzinfo=None),
            updated_at=now.replace(tzinfo=None),
            submitted_at=now.replace(tzinfo=None),
        )
        db.add(order)
        orders.append(order)
    db.flush()

    lots: list[PackingLot] = []
    for index, order in enumerate(orders):
        for part in range(3):
            job = job_list[(index + part) % len(job_list)]
            inspected_at = (now - timedelta(days=30 - (index % 20))).date()
            inspection = QualityInspection(
                job_id=job.id,
                roll_id=f"DEMO-FULFILL-{index + 1:03d}-R{part + 1}",
                batch_no=f"DEMO-FULFILL-B{index + 1:03d}",
                order_ref=order.id,
                machine_id=job.machine_id,
                employee_id="EMP-DEMO-001",
                inspector_name="Demo Quality Inspector",
                inspected_at=inspected_at,
                inspected_qty_meters=float(850 + (index + part) % 6 * 50),
                accepted_qty_meters=float(830 + (index + part) % 6 * 50),
                defects=[{"type": "Colour mismatch", "count": 1, "severity": "Low"}]
                if part == 2 and index % 5 == 0 else [],
                total_defect_count=1 if part == 2 and index % 5 == 0 else 0,
                outcome=InspectionOutcome.APPROVED,
                remarks="DEMO fulfillment fixture",
                source="demo-seed",
            )
            db.add(inspection)
            db.flush()

            is_dispatched = index < 20
            status = "Dispatched" if is_dispatched else (
                "In warehouse" if index < 27 else "Packed" if index < 34 else "Pending packing"
            )
            packed = status != "Pending packing"
            lots.append(PackingLot(
                id=f"DEMO-PACK-{index + 1:03d}-{part + 1}",
                inspection_id=inspection.id,
                order_id=order.id,
                roll_id=inspection.roll_id,
                batch_no=inspection.batch_no,
                machine_code=job.machine.code if job.machine else f"DEMO-MACHINE-{job.machine_id}",
                quality_outcome="Approved",
                quantity_meters=inspection.accepted_qty_meters,
                status=status,
                pack_type=["Roll", "Bale", "Box"][part],
                cartons=8 + (index + part) % 7,
                packed_by="Demo Packing Team" if packed else None,
                packed_at=now - timedelta(days=index % 15) if packed else None,
            ))
    db.add_all(lots)
    db.flush()

    for index, order in enumerate(orders[:20]):
        shipment = Shipment(
            id=f"DEMO-SHIP-{index + 1:03d}",
            order_id=order.id,
            courier=["BlueDart", "Delhivery", "DHL", "FedEx"][index % 4],
            tracking_number=f"DEMO-TRK-{index + 1:06d}",
            destination=order.delivery_address,
            status="Delivered" if index < 8 else "In transit" if index < 16 else "Delayed",
            dispatched_at=now - timedelta(days=18 - index % 12),
            delivered_at=now - timedelta(days=4) if index < 8 else None,
        )
        db.add(shipment)
        for lot in lots[index * 3:index * 3 + 3]:
            lot.shipment_id = shipment.id

    db.commit()
    print("Demo fulfillment seed complete: 120 packing lots and 20 shipments (DEVELOPMENT FIXTURES).")


def seed() -> None:
    Base.metadata.create_all(bind=engine)  # no-op if migrated
    db = SessionLocal()
    try:
        _seed_accounts(db)
        jobs: dict[str, ProductionJob] = {}
        existing = db.query(Machine).filter(Machine.code == "LOOM-01").first()
        if existing:
            print("Seed data already present — skipping machines/jobs.")
            by_order = {j.order_ref: j for j in db.query(ProductionJob).all()}
            jobs = {
                "loom01": by_order.get("ORD-DEMO-001"),
                "dye01": by_order.get("ORD-DEMO-002"),
                "loom02": by_order.get("ORD-DEMO-003"),
                "loom03": by_order.get("ORD-DEMO-004"),
                "print01": by_order.get("ORD-DEMO-005"),
            }
            if all(jobs.values()):
                _seed_quality(db, jobs)
            else:
                print("Some demo jobs are missing — reusing available production jobs for fulfillment.")
            _seed_fulfillment(db, jobs)
            return

        specs = [
            ("LOOM-01", "Auto Loom 1", "LOOM", "WEAVING", "COTTON,POLYESTER", 500, MachineStatus.RUNNING),
            ("LOOM-02", "Auto Loom 2", "LOOM", "WEAVING", "COTTON", 400, MachineStatus.IDLE),
            ("LOOM-03", "Rapier Loom 3", "LOOM", "WEAVING", "COTTON,POLYESTER,WOOL", 350, MachineStatus.IDLE),
            ("DYE-01", "Dye Jet 1", "DYER", "DYEING", "POLYESTER,COTTON", 300, MachineStatus.RUNNING),
            ("DYE-02", "Dye Jet 2", "DYER", "DYEING", "COTTON", 250, MachineStatus.MAINTENANCE),
            ("PRINT-01", "Rotary Printer 1", "PRINTER", "PRINTING", "COTTON,POLYESTER", 600, MachineStatus.IDLE),
        ]
        machines: dict[str, Machine] = {}
        for code, name, mtype, procs, mats, cap, status in specs:
            m = Machine(
                code=code, name=name, machine_type=mtype, supported_processes=procs,
                compatible_materials=mats, capacity_value=cap, capacity_unit="meters/day",
                status=status, status_reason="seed: initial demo state" if status == MachineStatus.MAINTENANCE else None,
            )
            db.add(m)
            machines[code] = m
        db.flush()
        db.commit()

        now = datetime.now(timezone.utc)
        db.add(MachineDowntime(
            machine_id=machines["LOOM-01"].id, reason="Weft sensor calibration (DEMO)",
            started_at=now - timedelta(hours=3), ended_at=now - timedelta(hours=2),
        ))
        db.commit()

        jobs = _create_jobs(db)
        _seed_quality(db, jobs)
        _seed_fulfillment(db, jobs)
        print("Demo seed complete: 6 machines, 5 jobs, quality inspections.")
        print("NOTE: all seeded rows are DEVELOPMENT FIXTURES for local demo use.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
