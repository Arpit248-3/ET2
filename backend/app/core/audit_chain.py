"""
Tamper-Evident Cryptographic Audit Chaining for Aegis / UrjaNetra AI.
Implements verifiable SHA-256 hash chaining over sovereign operational events:
  current_hash = SHA256(previous_hash + ":" + canonical_event_json)
"""
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import AuditLog

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def canonical_json(data: Any) -> str:
    """Serializes payload into canonical deterministic JSON format."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)


def compute_audit_hash(previous_hash: str, payload_str: str) -> str:
    """Computes SHA-256 hash combining the previous block hash and canonical payload."""
    content = f"{previous_hash}:{payload_str}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def record_audit_event(
    db: Session,
    user: str,
    action: str,
    module: str,
    status: str = "COMPLETED",
    event_type: str = "SYSTEM",
    details: Optional[Dict[str, Any]] = None,
    event_id: Optional[str] = None
) -> AuditLog:
    """
    Creates and records a cryptographically chained audit log entry.
    """
    evt_id = event_id or f"EVT-{uuid.uuid4().hex[:8].upper()}"
    details_clean = details or {}

    # Find the most recent audit entry with a valid hash
    last_entry = db.query(AuditLog).filter(AuditLog.current_hash != None).order_by(desc(AuditLog.id)).first()
    previous_hash = last_entry.current_hash if last_entry else GENESIS_HASH

    # Canonicalize core payload for deterministic hashing
    canonical_payload = canonical_json({
        "event_id": evt_id,
        "user": user,
        "action": action,
        "module": module,
        "status": status,
        "event_type": event_type,
        "details": details_clean,
    })

    current_hash = compute_audit_hash(previous_hash, canonical_payload)

    entry = AuditLog(
        event_id=evt_id,
        user=user,
        action=action,
        module=module,
        status=status,
        event_type=event_type,
        details=details_clean,
        previous_hash=previous_hash,
        current_hash=current_hash,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_audit_chain(db: Session) -> Dict[str, Any]:
    """
    Verifies the complete cryptographic chain of audit logs from genesis to tip.
    Returns validation status, total records verified, and any tamper points detected.
    """
    records = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not records:
        return {
            "verified": True,
            "total_records": 0,
            "tampered": False,
            "broken_chain_at": None,
            "message": "Audit chain empty — 0 records.",
        }

    expected_previous = GENESIS_HASH
    for idx, rec in enumerate(records):
        # Verify link to previous
        if rec.previous_hash is None or rec.current_hash is None:
            # Legacy unhashed record (e.g. from seed before migration)
            # Re-establish anchor
            expected_previous = rec.current_hash or expected_previous
            continue

        if rec.previous_hash != expected_previous:
            return {
                "verified": False,
                "total_records": len(records),
                "tampered": True,
                "broken_chain_at": rec.event_id,
                "sequence_index": idx,
                "expected_previous_hash": expected_previous,
                "found_previous_hash": rec.previous_hash,
                "message": f"Cryptographic chain broken at event {rec.event_id}.",
            }

        # Verify content hash integrity
        canonical_payload = canonical_json({
            "event_id": rec.event_id,
            "user": rec.user,
            "action": rec.action,
            "module": rec.module,
            "status": rec.status,
            "event_type": rec.event_type,
            "details": rec.details or {},
        })
        computed = compute_audit_hash(rec.previous_hash, canonical_payload)
        if computed != rec.current_hash:
            return {
                "verified": False,
                "total_records": len(records),
                "tampered": True,
                "broken_chain_at": rec.event_id,
                "sequence_index": idx,
                "message": f"Payload tamper detected at event {rec.event_id}: hash mismatch.",
            }

        expected_previous = rec.current_hash

    return {
        "verified": True,
        "total_records": len(records),
        "tampered": False,
        "broken_chain_at": None,
        "latest_hash": records[-1].current_hash,
        "message": f"Audit chain verified successfully ({len(records)} events cryptographically validated).",
    }
