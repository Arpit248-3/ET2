"""
Circuit Breaker Pattern implementation for external AI client calls (OpenRouter).
Protects backend systems from cascading failures during API outages or rate limits.
"""
import time
import logging
from enum import Enum
from typing import Callable, Any, Dict, Optional

logger = logging.getLogger("urjanetra.ai.circuit_breaker")


class CircuitState(str, Enum):
    CLOSED = "CLOSED"        # Normal operation
    OPEN = "OPEN"            # Tripped — short-circuiting calls to fallback
    HALF_OPEN = "HALF_OPEN"  # Testing recovery with single trial call


class CircuitBreaker:
    """
    Circuit Breaker pattern manager.
    Tracks failure counts, reset timeouts, and state transitions.
    """

    def __init__(
        self,
        name: str = "OpenRouter",
        failure_threshold: int = 3,
        recovery_timeout_sec: float = 30.0
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.last_success_time = time.time()
        self.total_calls = 0
        self.successful_calls = 0
        self.failed_calls = 0

    def allow_execution(self) -> bool:
        """Check if call is allowed to proceed or should be short-circuited."""
        now = time.time()

        if self.state == CircuitState.OPEN:
            if now - self.last_failure_time > self.recovery_timeout_sec:
                logger.info(f"[{self.name}] CircuitBreaker transition: OPEN -> HALF_OPEN (Trialing call)")
                self.state = CircuitState.HALF_OPEN
                return True
            return False

        return True

    def record_success(self):
        """Record successful execution."""
        self.total_calls += 1
        self.successful_calls += 1
        self.last_success_time = time.time()

        if self.state == CircuitState.HALF_OPEN:
            logger.info(f"[{self.name}] CircuitBreaker transition: HALF_OPEN -> CLOSED (Recovery verified)")
            self.state = CircuitState.CLOSED
            self.failure_count = 0

    def record_failure(self, error: Exception):
        """Record failed execution and trip circuit if threshold reached."""
        self.total_calls += 1
        self.failed_calls += 1
        self.failure_count += 1
        self.last_failure_time = time.time()

        logger.warning(f"[{self.name}] CircuitBreaker recorded failure ({self.failure_count}/{self.failure_threshold}): {error}")

        if self.failure_count >= self.failure_threshold or self.state == CircuitState.HALF_OPEN:
            logger.error(f"[{self.name}] CircuitBreaker transition: {self.state} -> OPEN (Failure threshold exceeded)")
            self.state = CircuitState.OPEN

    def get_stats(self) -> Dict[str, Any]:
        """Return diagnostic circuit breaker statistics."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "last_success_time": self.last_success_time,
            "last_failure_time": self.last_failure_time,
        }


# Global CircuitBreaker instance for OpenRouter API
circuit_breaker = CircuitBreaker(name="OpenRouterAPI", failure_threshold=3, recovery_timeout_sec=30.0)
