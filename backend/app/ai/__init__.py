"""
Reusable AI infrastructure for UrjaNetra AI.

The package is intentionally isolated from existing deterministic engines and
routers so future AI features can plug into one service boundary without
changing current business logic.
"""

from app.ai.services.ai_service import AIService

__all__ = ["AIService"]
