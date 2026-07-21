# UrjaNetra AI — Backend

FastAPI scenario-driven backend for the National Energy Resilience Command Platform.

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- **API Base:** http://localhost:8000/api
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Architecture

```
backend/
  app/
    main.py          # FastAPI app, CORS, router registration
    database.py      # SQLAlchemy engine + session
    models.py        # ORM models (ScenarioState, AuditLog, Decision, ThresholdConfig)
    schemas.py       # Pydantic request/response schemas
    seed.py          # DB seeder (auto-runs on startup)
    core/
      scenario_engine.py   # Loads + caches JSON scenario packs
      risk_engine.py       # Deterministic composite risk scoring
      economic_engine.py   # Scenario-driven economic metrics
      procurement_engine.py # Supplier composite scoring
      spr_engine.py        # SPR drawdown planning
      compliance_engine.py # Sanctions/insurance/route checks
      redteam_engine.py    # Adversarial AI critique
      brief_engine.py      # Executive action brief generator
    routers/
      state.py             # GET /api/state
      scenarios.py         # GET /api/scenarios, POST /api/scenarios/{id}/activate
      demo.py              # GET /api/demo, POST /api/demo/next, /reset
      risk.py              # GET /api/risk
      simulation.py        # POST /api/simulate
      economic.py          # GET /api/economic-impact
      procurement.py       # POST /api/procurement/optimize
      spr.py               # POST /api/spr/plan
      compliance.py        # POST /api/compliance/check
      redteam.py           # POST /api/redteam/validate
      brief.py             # POST /api/brief/generate
      decisions.py         # POST /api/decisions
      timeline.py          # GET /api/timeline
      notifications.py     # GET /api/notifications
      audit.py             # GET /api/audit-logs
      settings.py          # GET/PUT /api/settings/thresholds
    data/
      scenarios/           # 4 JSON scenario packs
      reference/           # suppliers, refineries, SPR sites, thresholds
```

## Scenario Packs

| ID | Name | Severity |
|----|------|----------|
| `hormuz_closure` | Strait of Hormuz Disruption | CRITICAL |
| `opec_cut` | OPEC+ Production Cut 2M bbl/day | HIGH |
| `russia_sanctions` | Russia Sanctions Escalation | HIGH |
| `port_disruption` | Port Disruption — Cyclone & Strike | MEDIUM |

## Demo Workflow

1. **Activate scenario:** `POST /api/scenarios/hormuz_closure/activate`
2. **Check state:** `GET /api/state` — returns live KPIs
3. **Step through demo:** `POST /api/demo/next` (repeat to advance timeline)
4. **Run procurement:** `POST /api/procurement/optimize`
5. **SPR plan:** `POST /api/spr/plan`
6. **Compliance check:** `POST /api/compliance/check` with `{"supplier_ids": ["sup-001","sup-003"]}`
7. **Red team:** `POST /api/redteam/validate`
8. **Brief:** `POST /api/brief/generate`
9. **Approve decision:** `POST /api/decisions`
10. **Audit trail:** `GET /api/audit-logs`

## Key Design Decisions

- **Deterministic outputs:** All engine values are calculated from scenario JSON — no random numbers on refresh
- **Step-scaled values:** Economic and risk metrics scale with the demo step (0 → full impact)
- **Single source of truth:** `ScenarioState` table (id=1) holds active scenario + demo step
- **Immutable audit log:** Every major action writes to `AuditLog` table automatically
- **No external APIs:** Fully self-contained — works offline
