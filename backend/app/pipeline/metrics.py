"""
Pipeline Observability Metrics Collector.
Tracks execution time, engine timings, failures, cache hits/misses, and memory usage.
Thread-safe. In-memory only.
"""
import threading
import time
import sys
import logging
from typing import Dict, List, Any
from datetime import datetime, timezone

logger = logging.getLogger("urjanetra.pipeline.metrics")


class PipelineMetricsCollector:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._rw_lock = threading.RLock()
                cls._instance._reset()
        return cls._instance

    def _reset(self):
        self.total_executions: int = 0
        self.total_failures: int = 0
        self.total_cache_hits: int = 0
        self.total_cache_misses: int = 0
        self.skipped_engines: List[str] = []
        self.engine_times: Dict[str, List[float]] = {}
        self.last_execution_ms: float = 0.0
        self.last_execution_id: str = ""
        self.last_execution_at: str = ""
        self.recent_errors: List[str] = []

    def record_execution_start(self, execution_id: str) -> float:
        with self._rw_lock:
            self.last_execution_id = execution_id
            return time.perf_counter()

    def record_execution_end(self, start: float) -> None:
        with self._rw_lock:
            elapsed_ms = (time.perf_counter() - start) * 1000
            self.last_execution_ms = round(elapsed_ms, 2)
            self.last_execution_at = datetime.now(timezone.utc).isoformat()
            self.total_executions += 1
            logger.debug(f"Pipeline execution completed in {elapsed_ms:.2f}ms")

    def record_engine_time(self, engine_name: str, elapsed_ms: float) -> None:
        with self._rw_lock:
            if engine_name not in self.engine_times:
                self.engine_times[engine_name] = []
            self.engine_times[engine_name].append(round(elapsed_ms, 2))
            # Keep last 20 timings per engine
            if len(self.engine_times[engine_name]) > 20:
                self.engine_times[engine_name].pop(0)

    def record_cache_hit(self, engine_name: str) -> None:
        with self._rw_lock:
            self.total_cache_hits += 1
            logger.debug(f"Cache hit for engine: {engine_name}")

    def record_cache_miss(self, engine_name: str) -> None:
        with self._rw_lock:
            self.total_cache_misses += 1
            logger.debug(f"Cache miss for engine: {engine_name}")

    def record_skip(self, engine_name: str) -> None:
        with self._rw_lock:
            self.skipped_engines.append(engine_name)
            logger.debug(f"Engine skipped: {engine_name}")

    def record_failure(self, engine_name: str, error: str) -> None:
        with self._rw_lock:
            self.total_failures += 1
            entry = f"[{engine_name}] {error}"
            self.recent_errors.append(entry)
            # Keep last 50 errors
            if len(self.recent_errors) > 50:
                self.recent_errors.pop(0)
            logger.error(f"Pipeline failure — {entry}")

    def snapshot(self) -> Dict[str, Any]:
        """Return current metrics as a plain dict for the /api/pipeline/metrics endpoint."""
        with self._rw_lock:
            avg_engine_times = {
                engine: round(sum(times) / len(times), 2)
                for engine, times in self.engine_times.items()
                if times
            }
            return {
                "total_executions": self.total_executions,
                "total_failures": self.total_failures,
                "total_cache_hits": self.total_cache_hits,
                "total_cache_misses": self.total_cache_misses,
                "last_execution_ms": self.last_execution_ms,
                "last_execution_id": self.last_execution_id,
                "last_execution_at": self.last_execution_at,
                "skipped_engines_last_run": list(self.skipped_engines[-10:]),
                "avg_engine_times_ms": avg_engine_times,
                "recent_errors": list(self.recent_errors[-10:]),
                "memory_usage_bytes": sys.getsizeof(self),
            }

    def reset(self) -> None:
        with self._rw_lock:
            self._reset()
            logger.info("Metrics reset.")


# Singleton instance
metrics = PipelineMetricsCollector()
