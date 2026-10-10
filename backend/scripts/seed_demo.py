"""DEMO SEED — clearly labelled development fixtures for local demos.

Run: python -m scripts.seed_demo   (from backend/)
Idempotent: skips machine codes / inspection codes that already exist.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, engine, Base
from app.models import (
    InspectionOutcome,
    Machine,
    MachineDowntime,
    MachineStatus,
    ProductionJob,
    ProductionJobStatus,
    QualityInspection,
)
from app.services.production import create_job, transition_job, update_progress


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
            outcome=outcome.value,
            remarks=None,
            source="demo-seed",
        ))
    db.commit()
    print(f"Demo quality seed complete: {len(INSPECTION_FIXTURES)} inspections (DEVELOPMENT FIXTURES).")


def seed() -> None:
    Base.metadata.create_all(bind=engine)  # no-op if migrated
    db = SessionLocal()
    try:
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
                return
            print("Demo jobs missing — run against an empty database instead.")
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
        print("Demo seed complete: 6 machines, 5 jobs, quality inspections.")
        print("NOTE: all seeded rows are DEVELOPMENT FIXTURES for local demo use.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
