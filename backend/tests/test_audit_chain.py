"""
Cryptographic Tamper-Evident Audit Chain Tests.
Verifies SHA-256 hash chaining, verification, and tamper detection.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, AuditLog
from app.core.audit_chain import record_audit_event, verify_audit_chain


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()


def test_audit_chain_record_and_verification(test_db):
    """Verify that recording audit events chains SHA-256 hashes and passes verification."""
    # Record new audit event
    entry = record_audit_event(
        db=test_db,
        user="audit_tester",
        action="Test Sovereign Security Probe",
        module="SecurityAudit",
        event_type="SECURITY",
        details={"probe_type": "integrity_check", "status": "nominal"}
    )

    assert entry.id is not None
    assert entry.current_hash is not None
    assert entry.previous_hash is not None

    # Run verification on entire chain
    verify_res = verify_audit_chain(test_db)
    assert verify_res["verified"] is True
    assert verify_res["tampered"] is False
    assert verify_res["total_records"] == 1


def test_audit_chain_tamper_detection(test_db):
    """Verify that modifying a historical audit log breaks the chain and triggers tamper alarm."""
    # Seed 3 chained entries
    for i in range(3):
        record_audit_event(
            db=test_db,
            user=f"officer_{i}",
            action=f"Operational Action {i}",
            module="CommandCenter",
            details={"step": i}
        )

    # Fetch latest entry
    latest = test_db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    assert latest is not None
    original_action = latest.action

    try:
        # Intentionally tamper with the record action
        latest.action = "TAMPERED ILLEGAL ACTION MODIFIED BY ADVERSARY"
        test_db.commit()

        # Chain verification must detect the tampering
        verify_tampered = verify_audit_chain(test_db)
        assert verify_tampered["verified"] is False
        assert verify_tampered["tampered"] is True
        assert verify_tampered["broken_chain_at"] == latest.event_id
    finally:
        # Revert tampering to restore database integrity
        latest.action = original_action
        test_db.commit()

    # Verify chain is restored
    verify_restored = verify_audit_chain(test_db)
    assert verify_restored["verified"] is True
    assert verify_restored["tampered"] is False
