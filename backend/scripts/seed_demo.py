"""DEMO SEED — clearly labelled development fixtures for local demos.

Run: python -m scripts.seed_demo   (from backend/)
Idempotent: skips if machine codes already exist.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, engine, Base
from app.models import Machine, MachineStatus, ProductionJob, ProductionJobStatus
from app.services.production import create_job, transition_job, update_progress


def seed() -> None:
    Base.metadata.create_all(bind=engine)  # no-op if migrated
    db = SessionLocal()
    try:
        if db.query(Machine).filter(Machine.code == "LOOM-01").first():
            print("Seed data already present — skipping (demo fixtures).")
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
        job = create_job(
            db, machine=machines["LOOM-01"], order_ref="ORD-DEMO-001", material_spec="COTTON RAW 40s",
            required_process="WEAVING", planned_quantity=2000,
            planned_start=now - timedelta(days=1), planned_end=now + timedelta(days=3), shift="A",
        )
        transition_job(db, job, ProductionJobStatus.IN_PROGRESS, "seed demo start")
        update_progress(db, job, 800)

        job2 = create_job(
            db, machine=machines["DYE-01"], order_ref="ORD-DEMO-002", material_spec="POLYESTER WHITE",
            required_process="DYEING", planned_quantity=1500,
            planned_start=now, planned_end=now + timedelta(days=4), shift="B",
        )
        transition_job(db, job2, ProductionJobStatus.IN_PROGRESS, "seed demo start")

        from app.models.production import MachineDowntime
        db.add(MachineDowntime(
            machine_id=machines["LOOM-01"].id, reason="Weft sensor calibration (DEMO)",
            started_at=now - timedelta(hours=3), ended_at=now - timedelta(hours=2),
        ))
        db.commit()
        print("Demo seed complete: 6 machines, 2 active jobs, 1 downtime event.")
        print("NOTE: all seeded rows are DEVELOPMENT FIXTURES for local demo use.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
