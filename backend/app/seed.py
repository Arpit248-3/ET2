"""
Database seeder -- populates initial ScenarioState, audit log entries, and dashboard components.
Run: python -m app.seed
"""
from app.database import engine, SessionLocal
from app import models
from app.models import (
    ScenarioState, AuditLog, DBUser, DBReport, DBDataSource,
    DBCollaborationRoom, DBCollaborationMessage, DBProfilePreference
)
from datetime import datetime, timezone
import uuid


def seed():
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Create singleton state if not exists
        existing = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
        if not existing:
            state = ScenarioState(id=1, active_scenario_id=None, demo_step=0)
            db.add(state)
            db.commit()
            print("[OK] ScenarioState initialized")
        else:
            print("[OK] ScenarioState already exists")

        # Seed initial audit log entries (system boot entries)
        existing_logs = db.query(AuditLog).count()
        if existing_logs == 0:
            seed_entries = [
                AuditLog(event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}", user="System", action="UrjaNetra AI Backend Started", module="System", status="COMPLETED", event_type="SYSTEM", details={"version": "1.0.0"}),
                AuditLog(event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}", user="System", action="Scenario Engine Initialized - 4 scenarios loaded", module="Scenario Simulator", status="COMPLETED", event_type="SYSTEM"),
                AuditLog(event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}", user="System", action="Reference data loaded - suppliers, refineries, SPR sites", module="System", status="COMPLETED", event_type="SYSTEM"),
                AuditLog(event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}", user="System", action="Risk Engine calibrated - baseline risk: 32/100", module="Risk Intelligence", status="COMPLETED", event_type="AI"),
                AuditLog(event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}", user="System", action="Compliance Engine ready - OFAC/EU sanctions DB loaded", module="Compliance Shield", status="COMPLETED", event_type="SYSTEM"),
                AuditLog(event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}", user="System", action="SPR Sites loaded - Visakhapatnam, Mangaluru, Padur", module="SPR Planner", status="COMPLETED", event_type="SYSTEM"),
            ]
            for entry in seed_entries:
                db.add(entry)
            db.commit()
            print(f"[OK] {len(seed_entries)} audit seed entries created")
        else:
            print(f"[OK] Audit logs already seeded ({existing_logs} entries)")

        # Seed initial users
        if db.query(DBUser).count() == 0:
            users = [
                DBUser(id="arjun_mehta", name="Arjun Mehta", email="arjun.mehta@nemc.gov.in", role="Commander", status="ACTIVE", avatar="AM"),
                DBUser(id="sneha_sharma", name="Sneha Sharma", email="sneha.sharma@nemc.gov.in", role="Resilience Analyst", status="ACTIVE", avatar="SS"),
                DBUser(id="vikram_singh", name="Vikram Singh", email="vikram.singh@nemc.gov.in", role="Security Director", status="ACTIVE", avatar="VS"),
            ]
            for u in users:
                db.add(u)
            db.commit()
            print("[OK] Users seeded")

        # Seed initial reports
        if db.query(DBReport).count() == 0:
            reports = [
                DBReport(id="REP-001", title="Q2 National Energy Security Overview", format="PDF", generated_by="UrjaNetra AI", size="2.4 MB"),
                DBReport(id="REP-002", title="Hormuz Crisis Response Simulation Report", format="PDF", generated_by="Arjun Mehta", size="1.8 MB"),
                DBReport(id="REP-003", title="SPR Allocation Advisory", format="CSV", generated_by="UrjaNetra AI", size="420 KB"),
            ]
            for r in reports:
                db.add(r)
            db.commit()
            print("[OK] Reports seeded")

        # Seed initial data sources
        if db.query(DBDataSource).count() == 0:
            sources = [
                DBDataSource(id="DS-001", name="IOCL Telemetry Feed", type="API Feed", connection_status="CONNECTED", last_sync_time="Just now", sync_frequency="REAL-TIME", records_count=184000),
                DBDataSource(id="DS-002", name="AIS Ship Tracker (Indian Ocean)", type="Live Stream", connection_status="CONNECTED", last_sync_time="2 mins ago", sync_frequency="REAL-TIME", records_count=450),
                DBDataSource(id="DS-003", name="OPEC Supply Tracker", type="Database", connection_status="CONNECTED", last_sync_time="1 hour ago", sync_frequency="HOURLY", records_count=1200),
                DBDataSource(id="DS-004", name="S&P Platts Crude Indices", type="FTP Sync", connection_status="CONNECTED", last_sync_time="12 hours ago", sync_frequency="DAILY", records_count=35400),
            ]
            for s in sources:
                db.add(s)
            db.commit()
            print("[OK] Data sources seeded")

        # Seed initial collaboration rooms
        if db.query(DBCollaborationRoom).count() == 0:
            rooms = [
                DBCollaborationRoom(id="room-crisis", name="Crisis Response Room", description="Active coordination room for national energy supply gaps."),
                DBCollaborationRoom(id="room-procurement", name="Procurement & Logistics Coordination", description="Negotiating alternative crude cargo options."),
            ]
            for rm in rooms:
                db.add(rm)
            db.commit()
            print("[OK] Collaboration rooms seeded")

        # Seed initial collaboration messages
        if db.query(DBCollaborationMessage).count() == 0:
            messages = [
                DBCollaborationMessage(room_id="room-crisis", sender="System Bot", sender_role="AI Assistant", message="Alert: Red Team simulation completed. High assumption vulnerability flagged in Hormuz route.", timestamp="08:45 AM", avatar="AI"),
                DBCollaborationMessage(room_id="room-crisis", sender="Arjun Mehta", sender_role="Commander", message="Noted. Advise on alternate routes via West Africa and US spot crude availability.", timestamp="08:47 AM", avatar="AM"),
                DBCollaborationMessage(room_id="room-crisis", sender="Sneha Sharma", sender_role="Resilience Analyst", message="Checking refinery compatibility parameters for Bonny Light. Looks promising.", timestamp="08:52 AM", avatar="SS"),
            ]
            for msg in messages:
                db.add(msg)
            db.commit()
            print("[OK] Collaboration messages seeded")

        # Seed initial profile preference
        if db.query(DBProfilePreference).count() == 0:
            pref = DBProfilePreference(id=1, user_id="arjun_mehta", theme="dark", notifications_enabled=True, high_contrast=False, refresh_interval_seconds=30)
            db.add(pref)
            db.commit()
            print("[OK] Profile preferences seeded")

        print("[READY] Seed complete. UrjaNetra AI backend is ready.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
