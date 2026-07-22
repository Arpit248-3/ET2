"""
UrjaNetra AI — National Energy Resilience Command Platform
FastAPI Backend — main.py

Run with:
    uvicorn app.main:app --reload --port 8000

API base: http://localhost:8000/api
Docs:     http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from app.database import engine
from app import models

# Import all routers
from app.routers import (
    state, scenarios, demo, risk, simulation,
    economic, procurement, spr, compliance,
    redteam, brief, decisions, timeline,
    notifications, audit, settings, extra_pages,
    pipeline, copilot, collaboration, crisis, help, auth, events, admin
)



# Create DB tables on startup
models.Base.metadata.create_all(bind=engine)

# Run seeder on startup
from app.seed import seed
seed()

app = FastAPI(
    title="UrjaNetra AI — National Energy Resilience Platform",
    description=(
        "Scenario-driven decision intelligence backend for India's national energy resilience system. "
        "Powers real-time risk assessment, procurement optimization, SPR planning, compliance checks, "
        "red-team validation, and executive action briefs."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Root & Observability Probes ────────────────────────────────────────────────
@app.get("/")
def root_index():
    return {
        "status": "online",
        "service": "UrjaNetra AI — National Energy Resilience Command Platform",
        "version": "1.0.0",
        "documentation": "http://127.0.0.1:8000/docs",
        "redoc": "http://127.0.0.1:8000/redoc",
        "api_base": "http://127.0.0.1:8000/api",
        "health_check": "http://127.0.0.1:8000/api/health",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/health")
def health_check():
    from app.database import SessionLocal
    from app.models import ScenarioState
    from app.ai.rag.knowledge_docs import KNOWLEDGE_DOCUMENTS
    from app.ai.services.circuit_breaker import circuit_breaker

    db = SessionLocal()
    try:
        state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
        active_scenario = state.active_scenario_id if state else None
        demo_step = state.demo_step if state else 0
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    finally:
        db.close()

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "active_scenario": active_scenario,
        "demo_step": demo_step,
        "database": db_status,
        "rag_knowledge_docs": len(KNOWLEDGE_DOCUMENTS),
        "circuit_breaker": circuit_breaker.get_stats(),
        "engines": {
            "scenario_engine": "ready",
            "risk_engine": "ready",
            "economic_engine": "ready",
            "procurement_engine": "ready",
            "spr_engine": "ready",
            "compliance_engine": "ready",
            "redteam_engine": "ready",
            "brief_engine": "ready",
        },
    }


@app.get("/api/readiness")
def readiness_check():
    """Kubernetes / Cloud Readiness Probe."""
    from app.database import SessionLocal
    from app.models import ScenarioState
    db = SessionLocal()
    try:
        state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
        if not state:
            return {"status": "not_ready", "reason": "ScenarioState uninitialized"}
    except Exception as e:
        return {"status": "not_ready", "reason": f"Database query failed: {str(e)}"}
    finally:
        db.close()

    return {"status": "ready", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/liveness")
def liveness_check():
    """Kubernetes / Cloud Liveness Probe."""
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/metrics")
def metrics_check():
    """System Observability Metrics Endpoint."""
    from app.core.telemetry import metrics
    from app.ai.services.circuit_breaker import circuit_breaker
    return {
        "telemetry": metrics.get_summary(),
        "circuit_breaker": circuit_breaker.get_stats(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─── Register Routers ─────────────────────────────────────────────────────────
app.include_router(state.router, prefix="/api", tags=["State"])
app.include_router(scenarios.router, prefix="/api", tags=["Scenarios"])
app.include_router(demo.router, prefix="/api", tags=["Demo"])
app.include_router(risk.router, prefix="/api", tags=["Risk"])
app.include_router(simulation.router, prefix="/api", tags=["Simulation"])
app.include_router(economic.router, prefix="/api", tags=["Economic"])
app.include_router(procurement.router, prefix="/api", tags=["Procurement"])
app.include_router(spr.router, prefix="/api", tags=["SPR"])
app.include_router(compliance.router, prefix="/api", tags=["Compliance"])
app.include_router(redteam.router, prefix="/api", tags=["Red Team"])
app.include_router(brief.router, prefix="/api", tags=["Brief"])
app.include_router(decisions.router, prefix="/api", tags=["Decisions"])
app.include_router(timeline.router, prefix="/api", tags=["Timeline"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])
app.include_router(audit.router, prefix="/api", tags=["Audit"])
app.include_router(copilot.router, prefix="/api", tags=["Copilot"])
app.include_router(extra_pages.router, prefix="/api", tags=["Extra Pages"])
app.include_router(pipeline.router, prefix="/api", tags=["Pipeline"])
# Collaboration: WebSocket at root level (no prefix needed — ws:// connects to /ws/*)
# REST API routes under /api
app.include_router(collaboration.ws_router, tags=["Collaboration WS"])
app.include_router(collaboration.router, prefix="/api", tags=["Collaboration"])
app.include_router(crisis.router, prefix="/api", tags=["Crisis"])
app.include_router(help.router, prefix="/api", tags=["Help Center"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(events.router, prefix="/api", tags=["Events"])
app.include_router(admin.router, prefix="/api", tags=["Admin Portal"])



