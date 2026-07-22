import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env file automatically
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class Settings(BaseModel):
    PROJECT_NAME: str = "UrjaNetra AI"
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "admin@urjanetra.gov.in")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "secret")
    MAIL_FROM: str = os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME", "noreply@urjanetra.gov.in"))
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() in ("true", "1", "yes")
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() in ("true", "1", "yes")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "UrjaNetra AI Support Command")

settings = Settings()
