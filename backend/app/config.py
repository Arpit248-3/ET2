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
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@urjanetra.gov.in")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")
    MAX_AGENT_ITERATIONS: int = int(os.getenv("MAX_AGENT_ITERATIONS", "3"))
    MAX_TOOL_CALLS_PER_RUN: int = int(os.getenv("MAX_TOOL_CALLS_PER_RUN", "20"))
    AGENT_TIMEOUT_SECONDS: int = int(os.getenv("AGENT_TIMEOUT_SECONDS", "45"))
    SAFE_MODE_FALLBACK: bool = os.getenv("SAFE_MODE_FALLBACK", "true").lower() in ("true", "1", "yes")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL_COPILOT", os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct"))
    OPENROUTER_TIMEOUT: int = int(os.getenv("OPENROUTER_TIMEOUT", "20"))

settings = Settings()

