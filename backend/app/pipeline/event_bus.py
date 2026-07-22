"""
EventBus — in-memory pub/sub with SSE fan-out support.

Responsibilities:
  - Python-to-Python callback subscriptions (used by pipeline internals)
  - SSE client queue registration / fan-out (used by /api/events/stream)
  - Thread-safe, no external dependencies
"""
import threading
import queue
import json
import logging
import time
from typing import Callable, Any, Dict, List, Iterator, Optional

logger = logging.getLogger("urjanetra.pipeline.event_bus")

# Events that are considered "significant" enough to push to browser clients.
BROADCAST_EVENTS = {
    "RiskUpdated",
    "ProcurementUpdated",
    "SPRUpdated",
    "EconomicUpdated",
    "ComplianceUpdated",
    "ScenarioActivated",
    "PipelineCompleted",
}


class EventBus:
    """
    Singleton in-memory event bus.

    Two fan-out modes:
      1. Python callbacks  — subscribe(event_type, fn)  (internal pipeline use)
      2. SSE queues        — register_sse_client() / unregister_sse_client()
                            (used by the /api/events/stream endpoint)
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(EventBus, cls).__new__(cls)
                cls._instance._listeners: Dict[str, List[Callable]] = {}
                cls._instance._sse_clients: List[queue.Queue] = []
                cls._instance._global_lock = threading.Lock()
        return cls._instance

    # ─── Python-callback subscriptions ────────────────────────────────────────

    def subscribe(self, event_type: str, callback: Callable[[Any], None]) -> None:
        """Subscribe a Python callable to a specific event type."""
        with self._global_lock:
            if event_type not in self._listeners:
                self._listeners[event_type] = []
            if callback not in self._listeners[event_type]:
                self._listeners[event_type].append(callback)
                logger.debug(f"Subscribed {callback.__name__} to event: {event_type}")

    def unsubscribe(self, event_type: str, callback: Callable[[Any], None]) -> None:
        """Unsubscribe a Python callable from a specific event type."""
        with self._global_lock:
            if event_type in self._listeners and callback in self._listeners[event_type]:
                self._listeners[event_type].remove(callback)
                logger.debug(f"Unsubscribed {callback.__name__} from event: {event_type}")

    # ─── SSE client management ─────────────────────────────────────────────────

    def register_sse_client(self) -> queue.Queue:
        """
        Register a new SSE client.
        Returns a queue the caller reads from to stream events.
        """
        q: queue.Queue = queue.Queue(maxsize=64)
        with self._global_lock:
            self._sse_clients.append(q)
        logger.debug(f"SSE client registered. Total clients: {len(self._sse_clients)}")
        return q

    def unregister_sse_client(self, q: queue.Queue) -> None:
        """Remove a disconnected SSE client queue."""
        with self._global_lock:
            if q in self._sse_clients:
                self._sse_clients.remove(q)
        logger.debug(f"SSE client removed. Total clients: {len(self._sse_clients)}")

    def _push_to_sse_clients(self, event_type: str, payload: Any) -> None:
        """Fan-out an event to all registered SSE queues (non-blocking put)."""
        message = json.dumps({
            "event": event_type,
            "payload": payload,
            "ts": int(time.time() * 1000),
        }, default=str)

        dead: List[queue.Queue] = []
        with self._global_lock:
            clients = list(self._sse_clients)

        for q in clients:
            try:
                q.put_nowait(message)
            except queue.Full:
                # Client is too slow — mark for removal
                dead.append(q)

        for q in dead:
            self.unregister_sse_client(q)

    # ─── Publish ──────────────────────────────────────────────────────────────

    def publish(self, event_type: str, payload: Any) -> None:
        """
        Publish an event:
          1. Invoke all registered Python callbacks.
          2. If the event is a broadcast event, push to all SSE client queues.
        """
        # Python callbacks
        with self._global_lock:
            listeners = list(self._listeners.get(event_type, []))

        for callback in listeners:
            try:
                callback(payload)
            except Exception as e:
                logger.error(
                    f"Listener {callback.__name__} raised for {event_type}: {e}",
                    exc_info=True,
                )

        # SSE fan-out (only for significant events)
        if event_type in BROADCAST_EVENTS:
            self._push_to_sse_clients(event_type, payload)
            logger.debug(f"Broadcast {event_type} → {len(self._sse_clients)} SSE clients")

    # ─── Heartbeat helper (used by SSE endpoint) ──────────────────────────────

    def sse_stream(self, client_queue: queue.Queue,
                   heartbeat_interval: int = 25) -> Iterator[str]:
        """
        Generator that yields Server-Sent Events for a single HTTP client.
        Blocks on the queue; emits a heartbeat comment every heartbeat_interval seconds.

        Yields SSE-formatted strings: 'data: {...}\\n\\n'
        """
        last_heartbeat = time.time()
        while True:
            now = time.time()
            timeout = max(0.1, heartbeat_interval - (now - last_heartbeat))

            try:
                message = client_queue.get(timeout=timeout)
                yield f"data: {message}\n\n"
            except queue.Empty:
                # Emit keepalive comment so connection doesn't time out
                yield ": keepalive\n\n"
                last_heartbeat = time.time()


# ─── Singleton ────────────────────────────────────────────────────────────────
event_bus = EventBus()
