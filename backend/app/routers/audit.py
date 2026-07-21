"""
GET /api/audit-logs — Returns paginated audit log
Utility function create_audit_entry used by all other routers.
"""
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogsResponse, AuditLogEntry

router = APIRouter()


def create_audit_entry(
    db: Session,
    user: str,
    action: str,
    module: str,
    event_type: str,
    details: Optional[Dict[str, Any]] = None,
):
    """
    Create an immutable audit log entry.
    Called by all major routers after significant actions.
    """
    event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
    entry = AuditLog(
        event_id=event_id,
        user=user,
        action=action,
        module=module,
        status="COMPLETED",
        event_type=event_type,
        details=details,
    )
    db.add(entry)
    db.commit()
    return entry


@router.get("/audit-logs", response_model=AuditLogsResponse)
def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    total = db.query(AuditLog).count()
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    entries = [
        AuditLogEntry(
            id=log.event_id,
            time=log.timestamp.strftime("%H:%M:%S") if log.timestamp else "--:--:--",
            user=log.user,
            action=log.action,
            module=log.module,
            status=log.status,
            type=log.event_type,
            details=log.details,
        )
        for log in logs
    ]

    return AuditLogsResponse(logs=entries, total=total)
