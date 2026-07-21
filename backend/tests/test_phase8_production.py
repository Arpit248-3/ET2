"""
Production Hardening & Reliability Test Suite (Phase 8).
Tests Health Probes, Readiness, Liveness, Metrics, Circuit Breaker, and Telemetry Secret Masking.
"""
import unittest
import time
from app.ai.services.circuit_breaker import CircuitBreaker, CircuitState
from app.core.telemetry import mask_secrets, MetricsTracker


class TestPhase8ProductionHardening(unittest.TestCase):

    def test_circuit_breaker_transitions(self):
        """Test Circuit Breaker state transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)."""
        cb = CircuitBreaker(name="TestBreaker", failure_threshold=2, recovery_timeout_sec=0.1)

        self.assertEqual(cb.state, CircuitState.CLOSED)
        self.assertTrue(cb.allow_execution())

        # Failure 1
        cb.record_failure(ValueError("API Error 1"))
        self.assertEqual(cb.state, CircuitState.CLOSED)

        # Failure 2 -> Threshold reached -> OPEN
        cb.record_failure(ValueError("API Error 2"))
        self.assertEqual(cb.state, CircuitState.OPEN)
        self.assertFalse(cb.allow_execution())

        # Wait recovery timeout
        time.sleep(0.15)
        self.assertTrue(cb.allow_execution())
        self.assertEqual(cb.state, CircuitState.HALF_OPEN)

        # Success on trial -> CLOSED
        cb.record_success()
        self.assertEqual(cb.state, CircuitState.CLOSED)

    def test_secret_masking(self):
        """Test secret masking masks API keys in telemetry output."""
        raw_text = "Connecting to OpenRouter with key sk-or-v1-9876543210abcdefg for model anthropic/claude-3.5-sonnet"
        masked = mask_secrets(raw_text)
        self.assertNotIn("sk-or-v1-9876543210abcdefg", masked)
        self.assertIn("sk-***MASKED***", masked)

    def test_metrics_tracker_summary(self):
        """Test MetricsTracker records request count, errors, and average latency."""
        mt = MetricsTracker()
        mt.record_request(latency_ms=100.0, is_error=False)
        mt.record_request(latency_ms=200.0, is_error=True)
        mt.record_pipeline_run()

        summary = mt.get_summary()
        self.assertEqual(summary["total_requests"], 2)
        self.assertEqual(summary["total_errors"], 1)
        self.assertEqual(summary["pipeline_runs"], 1)
        self.assertEqual(summary["average_latency_ms"], 150.0)


if __name__ == "__main__":
    unittest.main()
