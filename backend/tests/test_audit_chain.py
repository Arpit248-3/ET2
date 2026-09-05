"""
Cryptographic Tamper-Evident Audit Chain Tests.
Verifies SHA-256 hash chaining, verification, and tamper detection.
"""
import pytest
from app.database import SessionLocal
from app.models import AuditLog
from app.core.audit_chain import record_audit_event, verify_audit_chain


def test_audit_chain_record_and_verification():
    """Verify that recording audit events chains SHA-256 hashes and passes verification."""
    db = SessionLocal()
    try:
        # Record new audit event
        entry = record_audit_event(
            db=db,
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
        verify_res = verify_audit_chain(db)
        assert verify_res["verified"] is True
        assert verify_res["tampered"] is False
        assert verify_res["total_records"] > 0
    finally:
        db.close()


def test_audit_chain_tamper_detection():
    """Verify that modifying a historical audit log breaks the chain and triggers tamper alarm."""
    db = SessionLocal()
    try:
        # Fetch latest entry
        latest = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
        assert latest is not None
        original_action = latest.action

        try:
            # Intentionally tamper with the record action
            latest.action = "TAMPERED ILLEGAL ACTION MODIFIED BY ADVERSARY"
            db.commit()

            # Chain verification must detect the tampering
            verify_tampered = verify_audit_chain(db)
            assert verify_tampered["verified"] is False
            assert verify_tampered["tampered"] is True
            assert verify_tampered["broken_chain_at"] == latest.event_id
        finally:
            # Revert tampering to restore database integrity
            latest.action = original_action
            db.commit()

        # Verify chain is restored
        verify_restored = verify_audit_chain(db)
        assert verify_restored["verified"] is True
        assert verify_restored["tampered"] is False
    finally:
        db.close()
