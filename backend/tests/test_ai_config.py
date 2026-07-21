from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from app.ai.config import AIConfig, parse_env_file
from app.ai.exceptions import ConfigurationError
from app.ai.models.ai_models import ModelRole


ENV_TEXT = """
OPENROUTER_BASE_URL=https://openrouter.test/api/v1
OPENROUTER_API_KEY=test-secret
OPENROUTER_MODEL_COPILOT=model-from-env-copilot
OPENROUTER_MODEL_EXPLAIN=model-from-env-explain
OPENROUTER_MODEL_REDTEAM=model-from-env-redteam
OPENROUTER_MODEL_REPORT=model-from-env-report
OPENROUTER_MODEL_SPR=model-from-env-spr
OPENROUTER_TIMEOUT=12.5
OPENROUTER_MAX_RETRIES=2
OPENROUTER_TEMPERATURE=0.2
OPENROUTER_TOP_P=0.9
"""


class AIConfigTests(unittest.TestCase):
    def test_loads_required_values_from_env_file(self):
        with TemporaryDirectory() as tmp:
            env_path = Path(tmp) / ".env"
            env_path.write_text(ENV_TEXT, encoding="utf-8")

            config = AIConfig.from_env_file(env_path)

        self.assertEqual(config.base_url, "https://openrouter.test/api/v1")
        self.assertEqual(config.timeout, 12.5)
        self.assertEqual(config.max_retries, 2)
        self.assertEqual(config.model_for_role(ModelRole.EXPLAIN), "model-from-env-explain")

    def test_missing_required_value_raises_configuration_error(self):
        with TemporaryDirectory() as tmp:
            env_path = Path(tmp) / ".env"
            env_path.write_text("OPENROUTER_BASE_URL=https://openrouter.test\n", encoding="utf-8")

            with self.assertRaises(ConfigurationError):
                AIConfig.from_env_file(env_path)

    def test_parse_env_file_ignores_comments_and_strips_quotes(self):
        with TemporaryDirectory() as tmp:
            env_path = Path(tmp) / ".env"
            env_path.write_text('# comment\nOPENROUTER_API_KEY="quoted-secret"\n', encoding="utf-8")

            values = parse_env_file(env_path)

        self.assertEqual(values["OPENROUTER_API_KEY"], "quoted-secret")

    def test_api_key_for_role_resolution(self):
        env_with_keys = ENV_TEXT + "\nOPENROUTER_API_KEY_TENCENT=tencent-key\nOPENROUTER_API_KEY_QWEN=qwen-key\n"
        with TemporaryDirectory() as tmp:
            env_path = Path(tmp) / ".env"
            env_path.write_text(env_with_keys, encoding="utf-8")

            config = AIConfig.from_env_file(env_path)

        self.assertEqual(config.api_key_for_role(ModelRole.COPILOT), "tencent-key")
        self.assertEqual(config.api_key_for_role(ModelRole.SPR), "tencent-key")
        self.assertEqual(config.api_key_for_role(ModelRole.REDTEAM), "tencent-key")
        self.assertEqual(config.api_key_for_role(ModelRole.EXPLAIN), "qwen-key")
        self.assertEqual(config.api_key_for_role(ModelRole.REPORT), "qwen-key")


if __name__ == "__main__":
    unittest.main()
