import unittest

from app.ai.services.response_validator import ResponseValidator


class ResponseValidatorTests(unittest.TestCase):
    def test_validation_pipeline_accepts_valid_response(self):
        validator = ResponseValidator()
        schema = {
            "type": "object",
            "required": ["answer", "next_actions"],
            "properties": {
                "answer": {"type": "string"},
                "next_actions": {"type": "array", "items": {"type": "string"}},
            },
        }

        result = validator.validate(
            {"answer": "Risk increased.", "next_actions": ["Review SPR."]},
            output_schema=schema,
        )

        self.assertTrue(result.is_valid)
        self.assertEqual(result.normalized_response["answer"], "Risk increased.")

    def test_validation_pipeline_returns_structured_error(self):
        validator = ResponseValidator()
        schema = {
            "type": "object",
            "required": ["answer"],
            "properties": {"answer": {"type": "string"}},
        }

        result = validator.validate({"answer": 42}, output_schema=schema)

        self.assertFalse(result.is_valid)
        self.assertEqual(result.errors[0].stage, "schema")
        self.assertEqual(result.errors[0].code, "type_mismatch")


if __name__ == "__main__":
    unittest.main()
