import threading
import logging
from typing import Dict, List, Callable, Any

logger = logging.getLogger("urjanetra.pipeline.event_bus")

class EventBus:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(EventBus, cls).__new__(cls)
                cls._instance._listeners = {}
                cls._instance._global_lock = threading.Lock()
        return cls._instance

    def subscribe(self, event_type: str, callback: Callable[[Any], None]):
        """Subscribe to a specific event type."""
        with self._global_lock:
            if event_type not in self._listeners:
                self._listeners[event_type] = []
            if callback not in self._listeners[event_type]:
                self._listeners[event_type].append(callback)
                logger.debug(f"Subscribed {callback.__name__} to event: {event_type}")

    def unsubscribe(self, event_type: str, callback: Callable[[Any], None]):
        """Unsubscribe from a specific event type."""
        with self._global_lock:
            if event_type in self._listeners and callback in self._listeners[event_type]:
                self._listeners[event_type].remove(callback)
                logger.debug(f"Unsubscribed {callback.__name__} from event: {event_type}")

    def publish(self, event_type: str, payload: Any):
        """Publish an event with its payload. Invokes all registered listeners."""
        listeners = []
        with self._global_lock:
            if event_type in self._listeners:
                listeners = list(self._listeners[event_type])

        logger.debug(f"Publishing event {event_type} with payload type {type(payload).__name__}")
        for listener in listeners:
            try:
                listener(payload)
            except Exception as e:
                logger.error(f"Error executing listener {listener.__name__} for event {event_type}: {e}", exc_info=True)


# Global Event Bus instance
event_bus = EventBus()
