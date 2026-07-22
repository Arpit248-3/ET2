"""
Help Center & Admin Support Ticket Router
Endpoints:
- POST /api/help/tickets — Submit support inquiry (notifies Admin arpitjham1@gmail.com)
- GET /api/help/admin/tickets — Retrieve all support tickets for admin inbox
- POST /api/help/admin/tickets/{ticket_id}/reply — Send reply & mark ticket resolved (notifies user via email)
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import HelpTicket
from app.mail_config import send_email_safe
from app.routers.audit import create_audit_entry

logger = logging.getLogger("urjanetra.help")

router = APIRouter()

ADMIN_EMAIL = "arpitjham1@gmail.com"


@router.post("/help/tickets")
def create_ticket(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user_email = payload.get("user_email", "").strip()
    subject = payload.get("subject", "").strip()
    message = payload.get("message", "").strip()

    if not user_email or not subject or not message:
        raise HTTPException(status_code=400, detail="Missing required fields: user_email, subject, message")

    ticket = HelpTicket(
        user_email=user_email,
        subject=subject,
        message=message,
        status="OPEN",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Dispatch email alert to Admin arpitjham1@gmail.com
    admin_body = (
        f"UrjaNetra AI — National Energy Resilience Platform Support\n"
        f"New Support Inquiry Received [Ticket #{ticket.id}]\n\n"
        f"From User Email: {user_email}\n"
        f"Subject: {subject}\n"
        f"Timestamp: {ticket.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if ticket.created_at else 'Just now'}\n\n"
        f"================ MESSAGE CONTENT ================\n"
        f"{message}\n"
        f"=================================================\n\n"
        f"Log into the UrjaNetra Admin Portal to review and reply to this ticket."
    )
    background_tasks.add_task(
        send_email_safe,
        f"[UrjaNetra Support Alert] New Query from {user_email}: {subject}",
        [ADMIN_EMAIL],
        admin_body
    )

    create_audit_entry(
        db=db,
        user=user_email,
        action=f"Support Ticket Created #{ticket.id}: {subject}",
        module="Help Center",
        event_type="USER",
        details={"ticket_id": ticket.id, "subject": subject}
    )

    return {
        "success": True,
        "ticket_id": ticket.id,
        "message": f"Support ticket #{ticket.id} submitted successfully and sent to Admin ({ADMIN_EMAIL}).",
        "status": "OPEN",
        "timestamp": ticket.created_at.isoformat()
    }


@router.get("/help/admin/tickets")
def get_admin_tickets(db: Session = Depends(get_db)):
    tickets = db.query(HelpTicket).order_by(HelpTicket.id.desc()).all()
    return {
        "success": True,
        "count": len(tickets),
        "tickets": [
            {
                "id": t.id,
                "user_email": t.user_email,
                "subject": t.subject,
                "message": t.message,
                "admin_reply": t.admin_reply,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None
            }
            for t in tickets
        ]
    }


@router.post("/help/admin/tickets/{ticket_id}/reply")
def reply_ticket(
    ticket_id: int,
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    reply_text = payload.get("reply", payload.get("admin_reply", payload.get("reply_text", ""))).strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="Reply message cannot be empty")

    ticket = db.query(HelpTicket).filter(HelpTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket #{ticket_id} not found")

    ticket.admin_reply = reply_text
    ticket.status = "RESOLVED"
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)

    # Queue response email directly to the user's registered inbox
    user_body = (
        f"Dear Operator ({ticket.user_email}),\n\n"
        f"An administrator ({ADMIN_EMAIL}) has responded to your support ticket #{ticket.id}.\n\n"
        f"================ ADMIN RESPONSE ================\n"
        f"{reply_text}\n"
        f"===============================================\n\n"
        f"Original Query Details:\n"
        f"Subject: {ticket.subject}\n"
        f"Message:\n{ticket.message}\n\n"
        f"Status: RESOLVED\n\n"
        f"Thank you,\n"
        f"UrjaNetra AI National Command Support"
    )
    background_tasks.add_task(
        send_email_safe,
        f"[UrjaNetra Support Response] Reply to Ticket #{ticket.id}: {ticket.subject}",
        [ticket.user_email],
        user_body
    )

    create_audit_entry(
        db=db,
        user=ADMIN_EMAIL,
        action=f"Replied & Resolved Ticket #{ticket.id} for {ticket.user_email}",
        module="Help Center Admin",
        event_type="USER",
        details={"ticket_id": ticket.id, "user_email": ticket.user_email}
    )

    return {
        "success": True,
        "ticket_id": ticket.id,
        "status": "RESOLVED",
        "message": f"Reply dispatched to {ticket.user_email} and Ticket #{ticket.id} marked as RESOLVED."
    }
