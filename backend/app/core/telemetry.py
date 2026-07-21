"""
Structured Telemetry, JSON Logging, Metrics Tracking, and Secret Masking.
"""
import re
import logging
import json
import time
from typing import Dict, Any, Optional

logger = logging.getLogger("urjanetra.telemetry")


def mask_secrets(text: str) -> str:
    """Mask sensitive tokens or API keys matching sk-***."""
    if not isinstance(text, str):
        return text
    return re.sub(r'sk-[a-zA-Z0-9\-_]{10,}', 'sk-***MASKED***', text)


class MetricsTracker:
    """
    In-memory metrics tracker for request latency, counts, and cache hits.
    """

    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.pipeline_runs = 0
        self.cache_hits = 0
        self.total_latency_ms = 0.0
        self.start_time = time.time()

    def record_request(self, latency_ms: float, is_error: bool = False, is_cache_hit: bool = False):
        self.request_count += 1
        self.total_latency_ms += latency_ms
        if is_error:
            self.error_count += 1
        if is_cache_hit:
            self.cache_hits += 1

    def record_pipeline_run(self):
        self.pipeline_runs += 1

    def get_summary(self) -> Dict[str, Any]:
        uptime_sec = round(time.time() - self.start_time, 2)
        avg_latency = round(self.total_latency_ms / max(1, self.request_count), 2)
        hit_ratio = round((self.cache_hits / max(1, self.request_count)) * 100.0, 2)

        return {
            "uptime_seconds": uptime_sec,
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "pipeline_runs": self.pipeline_runs,
            "average_latency_ms": avg_latency,
            "cache_hit_ratio_pct": hit_ratio,
        }


metrics = MetricsTracker()
