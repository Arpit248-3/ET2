"""
Database seeder -- populates initial ScenarioState, audit log entries, admin user, and sample tickets.
Run: python -m app.seed
"""
from app.database import engine, SessionLocal
from app import models
from app.models import (
    ScenarioState, AuditLog, DBUser, DBUserAuth, DBReport, DBDataSource,
    DBCollaborationRoom, DBCollaborationMessage, DBProfilePreference, HelpTicket
)
from app.routers.auth import hash_password
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

        # Seed initial users (including Admin arpitjham1@gmail.com / admin@123)
        admin_email = "arpitjham1@gmail.com"
        admin_user = db.query(DBUser).filter(DBUser.email == admin_email).first()
        if not admin_user:
            admin_user = DBUser(
                id="admin_arpit",
                name="Arpit Jham (System Admin)",
                email=admin_email,
                role="National Energy Commander",
                phone="+91 98100 99999",
                designation="Platform Administrator & Commander",
                department="NEMC Command HQ",
                clearance_level="LEVEL-5 COSMIC TOP SECRET",
                status="ACTIVE",
                avatar="AJ",
                joined_at=datetime.now(timezone.utc),
            )
            db.add(admin_user)
            db.commit()

            admin_auth = DBUserAuth(
                user_id="admin_arpit",
                email=admin_email,
                hashed_password=hash_password("admin@123"),
            )
            db.add(admin_auth)
            db.commit()
            print("[OK] Admin account arpitjham1@gmail.com seeded")
        else:
            admin_auth = db.query(DBUserAuth).filter(DBUserAuth.email == admin_email).first()
            if admin_auth:
                admin_auth.hashed_password = hash_password("admin@123")
                db.commit()
                print("[OK] Admin password for arpitjham1@gmail.com set to admin@123")

        if db.query(DBUser).count() <= 1:
            users = [
                DBUser(
                    id="arjun_mehta", name="Arjun Mehta",
                    email="arjun.mehta@nemc.gov.in",
                    role="National Energy Commander",
                    phone="+91 98100 00001",
                    designation="Commander, NEMC",
                    department="NEMC Command",
                    clearance_level="LEVEL-5 COSMIC TOP SECRET",
                    status="ACTIVE", avatar="AM"
                ),
                DBUser(
                    id="sneha_sharma", name="Sneha Sharma",
                    email="sneha.sharma@nemc.gov.in",
                    role="Risk Intelligence Analyst",
                    phone="+91 98200 00002",
                    designation="Senior Analyst",
                    department="Risk Intelligence Division",
                    clearance_level="LEVEL-3 CONFIDENTIAL",
                    status="ACTIVE", avatar="SS"
                ),
            ]
            for u in users:
                db.add(u)
            db.commit()
            print("[OK] Standard users seeded")

        # Seed initial help tickets if empty
        if db.query(HelpTicket).count() == 0:
            sample_tickets = [
                HelpTicket(
                    user_email="arjun.mehta@nemc.gov.in",
                    subject="Request for Strategic Petroleum Reserve Capacity Expansion",
                    message="We need assistance verifying the Visakhapatnam SPR drawdown rates under high severity scenarios.",
                    status="OPEN",
                ),
                HelpTicket(
                    user_email="sneha.sharma@nemc.gov.in",
                    subject="Sanction Compliance Verification Query for West Africa Tankers",
                    message="Could the admin confirm if OFAC sanctions validation checks vessel IMO numbers automatically?",
                    status="OPEN",
                ),
            ]
            for t in sample_tickets:
                db.add(t)
            db.commit()
            print("[OK] Sample help tickets seeded")

        print("[READY] Seed complete. UrjaNetra AI backend is ready.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
