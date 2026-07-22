"""
Admin Router — Help Dashboard Support Ticket System & Admin Response Dispatch.
Supports admin user arpitjham1@gmail.com responding to user queries and dispatching real email notifications.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from app.database import get_db
from app.models import HelpTicket, DBUser
from app.mail_config import send_email_safe
from app.routers.audit import create_audit_entry

router = APIRouter()

ADMIN_EMAIL = "arpitjham1@gmail.com"


class HelpTicketCreateRequest(BaseModel):
    user_email: str
    subject: str
    message: str


class AdminReplyRequest(BaseModel):
    reply_text: str
    admin_email: Optional[str] = ADMIN_EMAIL


@router.get("/help-tickets")
def get_help_tickets(db: Session = Depends(get_db)):
    """Fetch all submitted help tickets for Admin review."""
    tickets = db.query(HelpTicket).order_by(HelpTicket.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "user_email": t.user_email,
            "subject": t.subject,
            "message": t.message,
            "admin_reply": t.admin_reply,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }
        for t in tickets
    ]


@router.post("/help-tickets")
def create_help_ticket(req: HelpTicketCreateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Submits a user support inquiry.
    Saves ticket to DB and sends email notification to Admin (arpitjham1@gmail.com).
    """
    if not req.user_email or "@" not in req.user_email:
        raise HTTPException(status_code=400, detail="Invalid email format.")
    if not req.subject.strip() or not req.message.strip():
        raise HTTPException(status_code=400, detail="Subject and message are required.")

    ticket = HelpTicket(
        user_email=req.user_email.strip(),
        subject=req.subject.strip(),
        message=req.message.strip(),
        status="OPEN",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # 1. Send Email Notification to Admin (arpitjham1@gmail.com)
    admin_subject = f"[UrjaNetra Support Alert] New Query from {req.user_email}: {req.subject}"
    admin_body = (
        f"UrjaNetra AI — National Energy Resilience Platform Support\n"
        f"New Support Inquiry Received (Ticket #{ticket.id})\n\n"
        f"User Email: {req.user_email}\n"
        f"Subject: {req.subject}\n"
        f"Timestamp: {ticket.created_at.isoformat() if ticket.created_at else 'Just now'}\n\n"
        f"---------------- MESSAGE TEXT ----------------\n"
        f"{req.message}\n"
        f"----------------------------------------------\n\n"
        f"Log into the UrjaNetra Admin Portal to post your response."
    )
    background_tasks.add_task(send_email_safe, admin_subject, [ADMIN_EMAIL], admin_body)

    create_audit_entry(
        db=db,
        user=req.user_email,
        action=f"Posted Support Query: {req.subject}",
        module="Help Dashboard",
        event_type="USER",
        details={"ticket_id": ticket.id, "subject": req.subject},
    )

    return {
        "success": True,
        "message": f"Your inquiry (Ticket #{ticket.id}) has been submitted and forwarded to Admin ({ADMIN_EMAIL}).",
        "ticket": {
            "id": ticket.id,
            "user_email": ticket.user_email,
            "subject": ticket.subject,
            "message": ticket.message,
            "status": ticket.status,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        }
    }


@router.post("/help-tickets/{ticket_id}/reply")
def reply_to_help_ticket(ticket_id: int, req: AdminReplyRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Admin posts a reply to a user query.
    Updates ticket status to RESOLVED and dispatches email notification with reply to the user!
    """
    ticket = db.query(HelpTicket).filter(HelpTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Help ticket not found.")

    if not req.reply_text.strip():
        raise HTTPException(status_code=400, detail="Reply message cannot be empty.")

    ticket.admin_reply = req.reply_text.strip()
    ticket.status = "RESOLVED"
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Dispatch email response directly to the user who posted the query
    user_subject = f"[UrjaNetra AI Support Response] Reply to: {ticket.subject}"
    user_body = (
        f"UrjaNetra AI — National Energy Resilience Support Command\n"
        f"Support Ticket #{ticket.id} Resolution\n\n"
        f"Dear Operator ({ticket.user_email}),\n\n"
        f"An Administrator ({req.admin_email or ADMIN_EMAIL}) has responded to your inquiry:\n\n"
        f"================ ADMIN RESPONSE ================\n"
        f"{req.reply_text.strip()}\n"
        f"===============================================\n\n"
        f"Original Query:\n"
        f"Subject: {ticket.subject}\n"
        f"Message: {ticket.message}\n\n"
        f"If you have further questions, feel free to reply or submit another request on the Help Dashboard.\n\n"
        f"UrjaNetra Support Command HQ"
    )
    background_tasks.add_task(send_email_safe, user_subject, [ticket.user_email], user_body)

    create_audit_entry(
        db=db,
        user=req.admin_email or ADMIN_EMAIL,
        action=f"Resolved Help Ticket #{ticket.id} for {ticket.user_email}",
        module="Admin Portal",
        event_type="SYSTEM",
        details={"ticket_id": ticket.id, "user_email": ticket.user_email},
    )

    return {
        "success": True,
        "message": f"Response sent to {ticket.user_email} and ticket #{ticket.id} marked RESOLVED.",
        "ticket": {
            "id": ticket.id,
            "user_email": ticket.user_email,
            "subject": ticket.subject,
            "message": ticket.message,
            "admin_reply": ticket.admin_reply,
            "status": ticket.status,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        }
    }
