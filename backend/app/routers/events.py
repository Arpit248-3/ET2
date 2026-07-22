"""
Server-Sent Events (SSE) router.

Provides:
  GET /api/events/stream   — streams pipeline engine events to browser clients
  GET /api/events/status   — returns current SSE client count and bus stats

The frontend subscribes with:
  const es = new EventSource('/api/events/stream');
  es.onmessage = (e) => { const { event, payload, ts } = JSON.parse(e.data); ... }

Events streamed (subset of BROADCAST_EVENTS in event_bus.py):
  RiskUpdated, ProcurementUpdated, SPRUpdated, EconomicUpdated,
  ComplianceUpdated, ScenarioActivated, PipelineCompleted
"""
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.pipeline.event_bus import event_bus

logger = logging.getLogger("urjanetra.routers.events")
router = APIRouter()


@router.get("/events/stream")
def sse_stream():
    """
    Subscribe to the live engine event stream.

    HTTP/1.1 persistent connection using text/event-stream.
    Sends a keepalive comment every ~25 seconds.
    The client should reconnect automatically (EventSource does this natively).
    """
    client_queue = event_bus.register_sse_client()
    logger.info("New SSE client connected.")

    def generator():
        try:
            yield ": connected\n\n"   # initial handshake comment
            for chunk in event_bus.sse_stream(client_queue, heartbeat_interval=25):
                yield chunk
        finally:
            event_bus.unregister_sse_client(client_queue)
            logger.info("SSE client disconnected.")

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",    # disable nginx buffering
            "Connection":        "keep-alive",
        },
    )


@router.get("/events/status")
def sse_status():
    """Returns the current number of connected SSE clients."""
    with event_bus._global_lock:
        client_count = len(event_bus._sse_clients)
    return {
        "sse_clients_connected": client_count,
        "broadcast_events": sorted(list(event_bus.BROADCAST_EVENTS
                                        if hasattr(event_bus, "BROADCAST_EVENTS")
                                        else [])),
    }
