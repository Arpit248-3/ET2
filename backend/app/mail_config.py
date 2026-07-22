import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger("urjanetra.mail")

async def send_email_safe(subject: str, recipients: list[str], body: str):
    """
    Sends real email via SMTP (using standard smtplib for maximum reliability).
    Supports Gmail (smtp.gmail.com:587) with App Password.
    """
    logger.info(f"[MAIL OUTBOX] Preparing email to {recipients} | Subject: {subject}")

    username = settings.MAIL_USERNAME
    password = settings.MAIL_PASSWORD
    sender = settings.MAIL_FROM or username

    # Check if real credentials are set (not default placeholders)
    is_configured = (
        username and 
        password and 
        "admin@urjanetra" not in username and 
        password != "secret"
    )

    if not is_configured:
        logger.info(
            f"[MAIL SIMULATION] Real SMTP not configured in .env. "
            f"OTP for {recipients} logged below:\n--- BODY ---\n{body}\n------------"
        )
        return False

    try:
        # Build MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{sender}>"
        msg["To"] = ", ".join(recipients)

        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Connect via SMTP TLS
        server_host = settings.MAIL_SERVER or "smtp.gmail.com"
        server_port = int(settings.MAIL_PORT or 587)

        if settings.MAIL_SSL_TLS:
            with smtplib.SMTP_SSL(server_host, server_port, timeout=10) as server:
                server.login(username, password)
                server.sendmail(sender, recipients, msg.as_string())
        else:
            with smtplib.SMTP(server_host, server_port, timeout=10) as server:
                server.ehlo()
                if settings.MAIL_STARTTLS:
                    server.starttls()
                    server.ehlo()
                server.login(username, password)
                server.sendmail(sender, recipients, msg.as_string())

        logger.info(f"[MAIL DISPATCH SUCCESS] Real OTP email sent to {recipients}")
        return True
    except Exception as exc:
        logger.warning(f"[MAIL DISPATCH ERROR] Failed to send email via SMTP ({exc}). Check credentials in .env.")
        return False
