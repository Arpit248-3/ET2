import logging
from app.config import settings

logger = logging.getLogger("urjanetra.mail")

try:
    from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
    HAS_FASTMAIL = True
except ImportError:
    HAS_FASTMAIL = False
    logger.warning("fastapi_mail package not found. Mail delivery will run in simulated log mode.")

fastmail_instance = None
if HAS_FASTMAIL:
    try:
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
            MAIL_STARTTLS=settings.MAIL_STARTTLS,
            MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=False
        )
        fastmail_instance = FastMail(conf)
    except Exception as err:
        logger.warning(f"FastMail ConnectionConfig note: {err}")
        fastmail_instance = None


async def send_email_safe(subject: str, recipients: list[str], body: str):
    """
    Sends email via FastMail with robust try/except error handling.
    If SMTP server connection fails or package is missing,
    falls back cleanly to log output without raising exceptions.
    """
    logger.info(f"[MAIL OUTBOX] Sending to {recipients} | Subject: {subject}\nBody: {body}")
    
    if not HAS_FASTMAIL or not fastmail_instance:
        logger.info(f"[MAIL SIMULATION LOG] Outgoing mail to {recipients} preserved in DB audit trail.")
        return False

    try:
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=MessageType.plain
        )
        await fastmail_instance.send_message(message)
        logger.info(f"[MAIL DISPATCH SUCCESS] Sent email to {recipients}")
        return True
    except Exception as exc:
        logger.warning(f"[MAIL DISPATCH FALLBACK] SMTP delivery skipped ({exc}). Ticket update preserved in DB.")
        return False
