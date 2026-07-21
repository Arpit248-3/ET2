"""
Configuration loading for the UrjaNetra AI infrastructure.

Values are read from a .env file and validated before OpenRouterClient uses
them. API endpoints and agents should not read these values directly.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Mapping, Optional

from app.ai.exceptions import ConfigurationError
from app.ai.models.ai_models import ModelRole


REQUIRED_ENV_KEYS = (
    "OPENROUTER_BASE_URL",
    "OPENROUTER_API_KEY",
    "OPENROUTER_MODEL_COPILOT",
    "OPENROUTER_MODEL_EXPLAIN",
    "OPENROUTER_MODEL_REDTEAM",
    "OPENROUTER_MODEL_REPORT",
    "OPENROUTER_MODEL_SPR",
    "OPENROUTER_TIMEOUT",
    "OPENROUTER_MAX_RETRIES",
    "OPENROUTER_TEMPERATURE",
    "OPENROUTER_TOP_P",
)


@dataclass(frozen=True)
class AIConfig:
    """Validated OpenRouter configuration loaded from .env."""

    base_url: str
    api_key: str
    model_copilot: str
    model_explain: str
    model_redteam: str
    model_report: str
    model_spr: str
    timeout: float
    max_retries: int
    temperature: float
    top_p: float
    api_key_tencent: str = ""
    api_key_qwen: str = ""

    @classmethod
    def from_env_file(cls, env_path: Optional[str | Path] = None) -> "AIConfig":
        """Load and validate AI configuration from a .env file."""

        resolved_path = resolve_env_path(env_path)
        if resolved_path is None:
            raise ConfigurationError(
                "AI configuration .env file was not found.",
                details={"searched": [str(path) for path in default_env_candidates()]},
            )

        values = parse_env_file(resolved_path)
        missing = [key for key in REQUIRED_ENV_KEYS if not values.get(key)]
        if missing:
            raise ConfigurationError(
                "AI configuration is missing required values.",
                details={"missing": missing, "env_path": str(resolved_path)},
            )

        try:
            timeout = float(values["OPENROUTER_TIMEOUT"])
            max_retries = int(values["OPENROUTER_MAX_RETRIES"])
            temperature = float(values["OPENROUTER_TEMPERATURE"])
            top_p = float(values["OPENROUTER_TOP_P"])
        except ValueError as exc:
            raise ConfigurationError(
                "AI configuration contains invalid numeric values.",
                details={"env_path": str(resolved_path)},
            ) from exc

        if timeout <= 0:
            raise ConfigurationError("OPENROUTER_TIMEOUT must be greater than zero.")
        if max_retries < 0:
            raise ConfigurationError("OPENROUTER_MAX_RETRIES cannot be negative.")
        if not 0 <= temperature <= 2:
            raise ConfigurationError("OPENROUTER_TEMPERATURE must be between 0 and 2.")
        if not 0 < top_p <= 1:
            raise ConfigurationError("OPENROUTER_TOP_P must be greater than 0 and at most 1.")

        default_key = values["OPENROUTER_API_KEY"]
        api_key_tencent = values.get("OPENROUTER_API_KEY_TENCENT") or default_key
        api_key_qwen = values.get("OPENROUTER_API_KEY_QWEN") or default_key

        return cls(
            base_url=values["OPENROUTER_BASE_URL"].rstrip("/"),
            api_key=default_key,
            model_copilot=values["OPENROUTER_MODEL_COPILOT"],
            model_explain=values["OPENROUTER_MODEL_EXPLAIN"],
            model_redteam=values["OPENROUTER_MODEL_REDTEAM"],
            model_report=values["OPENROUTER_MODEL_REPORT"],
            model_spr=values["OPENROUTER_MODEL_SPR"],
            timeout=timeout,
            max_retries=max_retries,
            temperature=temperature,
            top_p=top_p,
            api_key_tencent=api_key_tencent,
            api_key_qwen=api_key_qwen,
        )

    def model_for_role(self, role: ModelRole | str) -> str:
        """Return the configured model name for an AI model role."""

        model_role = ModelRole(role)
        role_to_model = {
            ModelRole.COPILOT: self.model_copilot,
            ModelRole.EXPLAIN: self.model_explain,
            ModelRole.REDTEAM: self.model_redteam,
            ModelRole.REPORT: self.model_report,
            ModelRole.SPR: self.model_spr,
        }
        model = role_to_model.get(model_role)
        if not model:
            raise ConfigurationError(
                "No OpenRouter model configured for role.",
                details={"model_role": model_role.value},
            )
        return model

    def api_key_for_role(self, role: ModelRole | str) -> str:
        """Return the specific OpenRouter API key configured for an AI model role."""

        model_role = ModelRole(role)
        if model_role in (ModelRole.COPILOT, ModelRole.SPR, ModelRole.REDTEAM):
            return self.api_key_tencent or self.api_key
        elif model_role in (ModelRole.EXPLAIN, ModelRole.REPORT):
            return self.api_key_qwen or self.api_key
        return self.api_key



def parse_env_file(env_path: str | Path) -> Dict[str, str]:
    """Parse KEY=VALUE entries from a .env file without importing secrets into logs."""

    values: Dict[str, str] = {}
    path = Path(env_path)
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value
    return values


def resolve_env_path(env_path: Optional[str | Path] = None) -> Optional[Path]:
    """Resolve the .env file path using an explicit path or known backend locations."""

    if env_path is not None:
        candidate = Path(env_path).expanduser().resolve()
        return candidate if candidate.exists() else None

    for candidate in default_env_candidates():
        if candidate.exists():
            return candidate.resolve()
    return None


def default_env_candidates() -> Iterable[Path]:
    """Return the .env locations supported by the backend runtime."""

    cwd = Path.cwd()
    package_root = Path(__file__).resolve().parents[2]
    project_root = package_root.parent
    return (
        cwd / ".env",
        cwd / "backend" / ".env",
        package_root / ".env",
        project_root / ".env",
    )
