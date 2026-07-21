import unittest

from app.ai.logging import AIRequestLogger


class AIRequestLoggerTests(unittest.TestCase):
    def test_sanitize_redacts_secret_fields(self):
        logger = AIRequestLogger()

        sanitized = logger._sanitize(
            {
                "api_key": "secret",
                "Authorization": "Bearer secret",
                "nested": {"refresh_token": "secret", "value": "safe"},
            }
        )

        self.assertEqual(sanitized["api_key"], "[REDACTED]")
        self.assertEqual(sanitized["Authorization"], "[REDACTED]")
        self.assertEqual(sanitized["nested"]["refresh_token"], "[REDACTED]")
        self.assertEqual(sanitized["nested"]["value"], "safe")


if __name__ == "__main__":
    unittest.main()
