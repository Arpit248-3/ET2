# UrjaNetra AI — API Contract Specification

This document reflects the **actual** response shapes produced by the FastAPI backend. All schemas are derived directly from `backend/app/schemas.py` and the router implementations. Do not confuse this with any previously imagined shape.

**Base URL:** `http://localhost:8000/api` (configurable via `VITE_API_BASE`)

---

## 1. Health

### `GET /api/health`

**Frontend Usage:** `ScenarioContext.jsx` (health probe to determine `backendOnline`)

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-09-12T09:00:00Z",
  "active_scenario": "hormuz_closure",
  "demo_step": 3
}
```

| Field | Type | Notes |
|---|---|---|
| `status` | `string` | Always `"ok"` |
| `version` | `string` | Backend version |
| `timestamp` | `string` | ISO-8601 UTC |
| `active_scenario` | `string \| null` | Active scenario ID or null |
| `demo_step` | `int` | Current demo step index |

**Fallback:** Sets `backendOnline = false` in context.

---

## 2. System State

### `GET /api/state`

**Frontend Usage:** `ScenarioContext.jsx` (polled every 30s), `CommandCenter.jsx`

**Response:**
```json
{
  "kpi": {
    "risk_score": 74,
    "crisis_level": "ELEVATED",
    "active_incidents": 5,
    "supply_gap": "2.4M bbl/day",
    "spr_coverage": 34,
    "active_sanctions": 3
  },
  "incident_feed": [
    {
      "id": 1,
      "time": "09:15",
      "type": "CRITICAL",
      "title": "Strait of Hormuz tension escalates",
      "detail": "Iranian naval exercises causing 18% shipping delay",
      "region": "Middle East",
      "color": "red"
    }
  ],
  "risk_signals": [
    {
      "id": 1,
      "source": "Maritime AIS",
      "signal": "Hormuz shipping delay +18%",
      "score": 74,
      "confidence": 87,
      "trend": "UP",
      "category": "Geopolitical"
    }
  ],
  "active_scenario": "hormuz_closure",
  "demo_step": 3,
  "brent_price": 96.4,
  "timestamp": "2024-09-12T09:15:00Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `kpi` | `KPIData` | Key operational metrics |
| `kpi.risk_score` | `int` | 0–100 |
| `kpi.crisis_level` | `string` | `NORMAL`, `MODERATE`, `ELEVATED`, `CRITICAL` |
| `kpi.active_incidents` | `int` | Count of live incidents |
| `kpi.supply_gap` | `string` | Formatted string e.g. `"2.4M bbl/day"` |
| `kpi.spr_coverage` | `int` | Days of strategic reserve coverage |
| `kpi.active_sanctions` | `int` | Number of sanctioned suppliers |
| `incident_feed` | `IncidentItem[]` | Scenario-specific incident list |
| `incident_feed[].color` | `string` | `"red"`, `"amber"`, `"blue"`, `"green"` |
| `risk_signals` | `RiskSignal[]` | Live intelligence signals |
| `risk_signals[].trend` | `string` | `"UP"`, `"DOWN"`, `"STABLE"` |
| `active_scenario` | `string \| null` | Active scenario ID |
| `demo_step` | `int` | Current step index |
| `brent_price` | `float` | Computed Brent price for current scenario/step |
| `timestamp` | `string` | ISO-8601 UTC |

**Fallback:** `CommandCenter.jsx` falls back to `mockData.js` KPI constants.

> **Note:** There is NO `time_series` field in `/api/state`. The time series for price charts comes from `GET /api/economic-impact` → `time_series`.

---

## 3. Scenarios

### `GET /api/scenarios`

**Frontend Usage:** `ScenarioContext.jsx`, `Scenarios.jsx`, `DemoMode.jsx`

**Response:** Array of scenario objects.

```json
[
  {
    "id": "hormuz_closure",
    "name": "Strait of Hormuz Closure",
    "description": "Iranian naval blockade disrupts 35% of global seaborne oil",
    "severity": "CRITICAL",
    "probability": 74,
    "region": "Middle East",
    "is_active": true
  }
]
```

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Scenario identifier |
| `name` | `string` | Display name |
| `description` | `string` | Summary |
| `severity` | `string` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `probability` | `int` | Probability percentage 0–100 |
| `region` | `string` | Geographic region |
| `is_active` | `bool` | Whether this scenario is currently active |

---

### `POST /api/scenarios/{scenario_id}/activate`

**Frontend Usage:** `ScenarioContext.activateScenario()`, `Scenarios.jsx`

**Response:**
```json
{
  "success": true,
  "scenario_id": "hormuz_closure",
  "message": "Scenario 'Strait of Hormuz Closure' activated. Demo reset to step 0.",
  "activated_at": "2024-09-12T09:00:00Z"
}
```

> **Note:** `/api/scenarios/active` does **NOT exist**. The active scenario is read from `GET /api/state` → `active_scenario` field. The `fetchActiveScenario()` function in `api.js` is a dead route and should be removed.

---

## 4. Risk Intelligence

### `GET /api/risk`

**Frontend Usage:** `RiskIntelligence.jsx`

**Response:**
```json
{
  "overall_score": 74,
  "crisis_level": "ELEVATED",
  "components": [
    {
      "name": "Geopolitical Risk",
      "value": 82.0,
      "weight": 0.35,
      "weighted_score": 28.7,
      "label": "HIGH"
    }
  ],
  "trend": "UP",
  "signals": [
    {
      "id": 1,
      "source": "Maritime AIS",
      "signal": "Hormuz shipping delay +18%",
      "score": 74,
      "confidence": 87,
      "trend": "UP",
      "category": "Geopolitical"
    }
  ],
  "recommendation": "Activate West Africa procurement. Initiate SPR drawdown planning.",
  "timestamp": "2024-09-12T09:00:00Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `overall_score` | `int` | 0–100 composite risk score |
| `crisis_level` | `string` | Same levels as `/api/state` |
| `components` | `RiskComponent[]` | Weighted factor breakdown |
| `components[].label` | `string` | `"LOW"`, `"MODERATE"`, `"HIGH"`, `"CRITICAL"` |
| `trend` | `string` | `"UP"`, `"DOWN"`, `"STABLE"` |
| `signals` | `RiskSignal[]` | Same shape as in `/api/state` |
| `recommendation` | `string` | AI recommended action string |

---

## 5. Scenario Simulator

### `POST /api/simulate`

**Frontend Usage:** `ScenarioSimulator.jsx`

**Request:**
```json
{
  "scenario_id": "hormuz_closure",
  "duration_days": 30,
  "severity_multiplier": 1.0
}
```

**Response:**
```json
{
  "scenario_id": "hormuz_closure",
  "duration_days": 30,
  "summary": {
    "peak_brent": 104.2,
    "peak_risk": 83,
    "min_spr_pct": 41.3,
    "total_supply_gap_mbbl": 48.0,
    "scenario": "Strait of Hormuz Closure",
    "severity": "CRITICAL"
  },
  "daily_projection": [
    {
      "day": 1,
      "brent_price": 90.4,
      "risk_score": 45,
      "spr_level_pct": 64.0,
      "supply_gap_mbbl": 0.48,
      "action": "Risk signal detected — monitoring elevated"
    }
  ],
  "recommended_action": "Activate procurement alternate and SPR drawdown within 48 hours.",
  "timestamp": "2024-09-12T09:00:00Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `summary` | `dict` | `peak_brent`, `peak_risk`, `min_spr_pct`, `total_supply_gap_mbbl`, `scenario`, `severity` |
| `daily_projection` | `SimulationDayPoint[]` | 30 entries, one per day |
| `daily_projection[].action` | `string \| null` | Key event annotation for that day |

---

## 6. Economic Impact

### `GET /api/economic-impact`

**Frontend Usage:** `EconomicImpact.jsx`, `CommandCenter.jsx` (for time series chart)

**Response:**
```json
{
  "metrics": {
    "inflation": {
      "value": 1.8,
      "unit": "%",
      "trend": "UP",
      "label": "Inflation Increase"
    },
    "fiscal_burden": {
      "value": 240000.0,
      "unit": "Cr",
      "trend": "UP",
      "label": "Fiscal Burden"
    }
  },
  "state_impact": [
    {
      "state": "Maharashtra",
      "impact": 82,
      "population": 125000000,
      "gdp_exposure": "₹4.2L Cr"
    }
  ],
  "sector_impact": [
    {
      "sector": "Transport",
      "impact": 88,
      "fill": "#ef4444"
    }
  ],
  "time_series": [
    {
      "month": "Apr",
      "brent": 88.0,
      "indianBasket": 85.0,
      "wti": 84.0
    }
  ],
  "scenario_id": "hormuz_closure",
  "timestamp": "2024-09-12T09:00:00Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `metrics` | `dict[str, EconomicMetric]` | Keys vary by scenario: `"inflation"`, `"fiscal_burden"`, `"gdp_impact"`, etc. |
| `state_impact` | `StateImpact[]` | Per-state exposure |
| `sector_impact` | `SectorImpact[]` | Sector breakdown for bar chart |
| `sector_impact[].fill` | `string` | Hex color for chart bar |
| `time_series` | `dict[]` | Price series for `CommandCenter` price chart; keys: `month`, `brent`, `indianBasket`, `wti` |

---

## 7. Procurement Optimizer

### `POST /api/procurement/optimize`

**Frontend Usage:** `ProcurementOptimizer.jsx`

**Request:**
```json
{
  "target_volume_mbbl": 2.4,
  "duration_days": 30,
  "exclude_routes": [],
  "max_risk_score": 60
}
```

**Response:**
```json
{
  "recommended_mix": [
    {
      "supplier_id": "WA-001",
      "name": "Nigeria NLNG",
      "country": "Nigeria",
      "crude_type": "Bonny Light",
      "route": "West Africa → Cape → India",
      "landed_cost_usd_bbl": 91.2,
      "eta_days": 21,
      "risk_score": 28,
      "composite_score": 84.5,
      "sanctions_status": "CLEAR",
      "insurance_status": "COVERED",
      "availability": "HIGH",
      "refinery_compatibility": 88,
      "reliability_score": 91,
      "verdict": "RECOMMENDED",
      "recommended_volume_mbbl": 1.2,
      "score_breakdown": {
        "cost": 22.1,
        "risk": 25.3,
        "compatibility": 18.8,
        "reliability": 18.3
      }
    }
  ],
  "total_cost_estimate_cr": 84200,
  "coverage_days": 30,
  "risk_summary": "Low geopolitical exposure. Route via Cape of Good Hope adds 6 days transit.",
  "optimized_for": "COST_RISK_BALANCE",
  "timestamp": "2024-09-12T09:00:00Z"
}
```

---

## 8. SPR Planner

### `POST /api/spr/plan`

**Frontend Usage:** `SPRPlanner.jsx`

**Request:**
```json
{
  "daily_gap_mbbl": 2.4,
  "days_until_cargo": 22,
  "target_coverage_days": 30
}
```

**Response:**
```json
{
  "daily_supply_gap_mbbl": 2.4,
  "days_until_cargo_arrival": 22,
  "total_drawdown_required_mbbl": 52.8,
  "reserve_after_action_mbbl": 311.8,
  "reserve_after_action_pct": 85.2,
  "coverage_days": 34,
  "sites": [
    {
      "name": "Visakhapatnam",
      "capacity_mbbl": 83.0,
      "current_stock_mbbl": 68.5,
      "drawdown_allocated_mbbl": 22.4,
      "status": "ACTIVE"
    }
  ],
  "feasible": true,
  "warning": null,
  "timestamp": "2024-09-12T09:00:00Z"
}
```

---

## 9. Compliance Shield

### `POST /api/compliance/check`

**Frontend Usage:** `ComplianceShield.jsx`

**Request:**
```json
{
  "supplier_ids": ["RU-001", "SA-002"],
  "route": "Hormuz"
}
```

**Response:**
```json
{
  "results": [
    {
      "supplier_id": "RU-001",
      "supplier_name": "Rosneft",
      "sanctions": "FLAGGED",
      "insurance": "NOT COVERED",
      "legal_status": "RESTRICTED",
      "policy_alignment": "NON-COMPLIANT",
      "route_restriction": "BLOCKED",
      "overall": "BLOCKED",
      "flags": ["OFAC SDN", "P&I Coverage Withdrawn"]
    }
  ],
  "all_clear": false,
  "flagged_count": 1,
  "timestamp": "2024-09-12T09:00:00Z"
}
```

---

## 10. Red Team Validator

### `POST /api/redteam/validate`

**Frontend Usage:** `RedTeamValidator.jsx`

**Request:**
```json
{
  "recommendation": "Reroute via Cape of Good Hope and initiate SPR drawdown",
  "scenario_id": "hormuz_closure",
  "confidence": 0.85
}
```

**Response:**
```json
{
  "original_recommendation": "Reroute via Cape of Good Hope...",
  "critique": "Plan underestimates 6-day Cape transit lag during peak demand season.",
  "weak_assumptions": [
    "Assumes West Africa cargo immediately available",
    "Ignores port congestion at Vadinar"
  ],
  "ignored_risks": [
    "Russian shadow fleet may fill Hormuz gap at lower compliance risk",
    "SPR drawdown triggers IEA reporting obligations"
  ],
  "findings": [
    {
      "category": "Logistics",
      "finding": "Cape of Good Hope adds 6–8 days to VLCC transit",
      "severity": "HIGH"
    }
  ],
  "confidence_original": 0.85,
  "confidence_adjusted": 0.71,
  "final_recommendation": "Proceed with West Africa reroute. Pre-position SPR drawdown authorization. Activate insurance waiver.",
  "timestamp": "2024-09-12T09:00:00Z"
}
```

---

## 11. AI Action Brief

### `POST /api/brief/generate`

**Frontend Usage:** `ActionBrief.jsx`

**Request:**
```json
{
  "scenario_id": "hormuz_closure",
  "classification": "TOP SECRET",
  "prepared_for": "Hon. Minister of Petroleum"
}
```

**Response:**
```json
{
  "brief_id": "AB-20240912-0912",
  "classification": "TOP SECRET",
  "prepared_for": "Hon. Minister of Petroleum",
  "prepared_by": "UrjaNetra AI — NEMC Engine v1.0",
  "date": "September 12, 2024",
  "subject": "URGENT: Hormuz Closure — National Energy Response Brief",
  "sections": [
    {
      "heading": "Situation Summary",
      "content": "Iranian naval exercises have elevated disruption probability to 74%..."
    }
  ],
  "decision_required": "Authorize SPR drawdown and West Africa procurement reroute",
  "timestamp": "2024-09-12T09:00:00Z"
}
```

---

## 12. Decisions

### `POST /api/decisions`

**Frontend Usage:** `ExecutiveDecisionBoard.jsx`, `CrisisMode.jsx`, `CommandCenter.jsx`

**Request:**
```json
{
  "action_type": "APPROVE - Authorize 3.2 MT SPR Release",
  "approved_by": "Commander Arjun Mehta",
  "scenario_id": "hormuz_closure",
  "details": {
    "motion_id": "MOT-2024-031",
    "decision": "APPROVE"
  }
}
```

**Response:**
```json
{
  "decision_id": "DEC-202409121145-A3F2",
  "action_type": "APPROVE - Authorize 3.2 MT SPR Release",
  "approved_by": "Commander Arjun Mehta",
  "scenario_id": "hormuz_closure",
  "status": "APPROVED",
  "timestamp": "2024-09-12T11:45:00Z"
}
```

> **Note:** There is no `GET /api/decisions` endpoint. The decision board motions list is currently static on the frontend.

---

## 13. Timeline

### `GET /api/timeline`

**Frontend Usage:** `TimelineReplay.jsx`

**Response:**
```json
{
  "scenario_id": "hormuz_closure",
  "scenario_name": "Strait of Hormuz Closure",
  "events": [
    {
      "time": "09:00",
      "event": "Normal operations — baseline monitoring active",
      "type": "INFO",
      "risk": 24,
      "step": 0,
      "is_current": false
    },
    {
      "time": "09:15",
      "event": "Hormuz shipping delay detected — 18% disruption",
      "type": "WARNING",
      "risk": 41,
      "step": 1,
      "is_current": true
    }
  ],
  "current_step": 1
}
```

| Field | Type | Notes |
|---|---|---|
| `scenario_id` | `string \| null` | Null if no scenario active |
| `scenario_name` | `string \| null` | Null if no scenario active |
| `events` | `TimelineEvent[]` | Full scenario timeline |
| `events[].type` | `string` | `"INFO"`, `"WARNING"`, `"CRITICAL"`, `"SUCCESS"` |
| `events[].is_current` | `bool` | Whether this is the active demo step |
| `current_step` | `int` | Active step index |

---

## 14. Demo Mode

### `GET /api/demo`

**Frontend Usage:** `DemoMode.jsx` (currently not called — should be connected)

**Response:**
```json
{
  "current_step": 3,
  "total_steps": 11,
  "current_event": {
    "step": 3,
    "time": "10:00",
    "event": "Crude price shock begins — Brent +$8.4/bbl",
    "type": "CRITICAL",
    "risk": 74
  },
  "scenario_name": "Strait of Hormuz Closure",
  "elapsed_time": "04:32",
  "is_complete": false
}
```

| Field | Type | Notes |
|---|---|---|
| `current_step` | `int` | Zero-indexed |
| `total_steps` | `int` | Total steps in active scenario timeline |
| `current_event` | `DemoTimelineStep` | The step object at `current_step` |
| `current_event.step` | `int` | Step index |
| `current_event.time` | `string` | Formatted time `"HH:MM"` |
| `current_event.event` | `string` | Narrative description |
| `current_event.type` | `string` | `"INFO"`, `"WARNING"`, `"CRITICAL"` |
| `current_event.risk` | `int` | Risk score at this step |
| `elapsed_time` | `string` | `"MM:SS"` since scenario activation |
| `is_complete` | `bool` | True when at final step |

---

### `POST /api/demo/next`

**Frontend Usage:** `DemoMode.jsx`

**Response:**
```json
{
  "success": true,
  "current_step": 4,
  "total_steps": 11,
  "event": {
    "step": 4,
    "time": "10:15",
    "event": "30-day disruption scenario simulation running",
    "type": "CRITICAL",
    "risk": 83
  },
  "is_complete": false
}
```

---

### `POST /api/demo/reset`

**Frontend Usage:** `DemoMode.jsx`

**Response:**
```json
{
  "success": true,
  "message": "Demo reset to step 0.",
  "current_step": 0
}
```

---

### `POST /api/demo/step/{step_idx}`

**Frontend Usage:** `DemoMode.jsx`, `TimelineReplay.jsx`

**Response:**
```json
{
  "success": true,
  "current_step": 2,
  "total_steps": 11,
  "event": {
    "step": 2,
    "time": "09:30",
    "event": "Risk score rises — maritime and insurance correlation confirmed",
    "type": "WARNING",
    "risk": 62
  },
  "is_complete": false
}
```

---

## 15. Notifications

### `GET /api/notifications`

**Frontend Usage:** `Notifications.jsx`

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "time": "09:15",
      "type": "CRITICAL",
      "title": "Hormuz tension escalates",
      "detail": "Risk score elevated to 74/100. West Africa procurement recommended.",
      "read": false
    }
  ],
  "unread_count": 2
}
```

| Field | Type | Notes |
|---|---|---|
| `notifications[].type` | `string` | `"CRITICAL"`, `"WARNING"`, `"INFO"`, `"SUCCESS"` |
| `notifications[].read` | `bool` | Whether the notification has been read |
| `unread_count` | `int` | Count of unread notifications |

---

## 16. Audit Logs

### `GET /api/audit-logs`

**Frontend Usage:** `AuditLogs.jsx`

**Query Params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `offset` | `int` | `0` | Pagination offset (NOT `skip`) |
| `limit` | `int` | `50` | Max records to return (1–200) |

> ⚠️ **Bug:** `api.js` sends `skip` instead of `offset`. The correct parameter is `offset`.

**Response:**
```json
{
  "logs": [
    {
      "id": "EVT-A3F29B1C",
      "time": "09:12:34",
      "user": "Arjun Mehta",
      "action": "Decision Approved: APPROVE - Authorize 3.2 MT SPR Release",
      "module": "Executive Decision Board",
      "status": "COMPLETED",
      "type": "USER",
      "details": {
        "decision_id": "DEC-202409121145-A3F2"
      }
    }
  ],
  "total": 142
}
```

| Field | Type | Notes |
|---|---|---|
| `logs[].id` | `string` | Format: `"EVT-{8 hex chars uppercase}"` |
| `logs[].time` | `string` | `"HH:MM:SS"` (time portion only) |
| `logs[].type` | `string` | `"USER"`, `"AI"`, `"SYSTEM"` |
| `logs[].status` | `string` | Always `"COMPLETED"` |
| `total` | `int` | Total record count (for pagination) |

---

## 17. Thresholds & Alerts

### `GET /api/settings/thresholds`

**Frontend Usage:** `ThresholdsAlerts.jsx`

**Response:**
```json
{
  "thresholds": {
    "risk": {
      "critical_threshold": 75,
      "elevated_threshold": 60,
      "moderate_threshold": 40,
      "normal_threshold": 0
    },
    "spr": {
      "minimum_coverage_days": 15,
      "target_coverage_days": 30,
      "critical_level_pct": 30,
      "emergency_drawdown_limit_pct": 40
    },
    "procurement": {
      "max_single_supplier_pct": 40,
      "max_route_risk_score": 50,
      "max_landed_cost_usd_bbl": 95.0,
      "min_reliability_score": 70,
      "min_compatibility_score": 65
    },
    "economic": {
      "inflation_alert_pct": 1.5,
      "gdp_alert_pct": -0.3,
      "fuel_price_alert_inr": 10.0,
      "fiscal_alert_cr": 20000
    },
    "notifications": {
      "critical_channels": ["email", "sms", "dashboard"],
      "warning_channels": ["email", "dashboard"],
      "info_channels": ["dashboard"]
    }
  },
  "timestamp": "2024-09-12T09:00:00Z"
}
```

---

### `PUT /api/settings/thresholds`

**Frontend Usage:** `ThresholdsAlerts.jsx` (Save Changes button)

**Request:**
```json
{
  "thresholds": {
    "risk": {
      "critical_threshold": 80
    },
    "spr": {
      "minimum_coverage_days": 7
    }
  },
  "updated_by": "Commander Arjun Mehta"
}
```

> The backend performs a **deep merge** — you only need to send the keys you want to update.

**Response:**
```json
{
  "success": true,
  "thresholds": { "...full merged thresholds object..." },
  "updated_by": "Commander Arjun Mehta",
  "timestamp": "2024-09-12T09:00:00Z"
}
```

---

## 18. Supply Chain Digital Twin

### `GET /api/supply-chain-twin`

**Frontend Usage:** `SupplyChainTwin.jsx`

**Response:**
```json
{
  "nodes": [
    {"id": "jamnagar", "x": 135, "y": 228, "label": "Jamnagar Refinery", "type": "refinery", "status": "OPERATIONAL", "capacity": "1.24M bbl/day", "risk": 22}
  ],
  "routes": [
    {"id": "r1", "from": "basrah", "to": "mumbai", "type": "sea", "status": "ACTIVE"}
  ],
  "ports": [],
  "refineries": [],
  "spr_sites": [],
  "ships": [
    {"name": "MV Bharat Star", "status": "IN TRANSIT", "route": "Nigeria → Paradip", "lat": 10.45, "lon": 65.2}
  ],
  "disrupted_routes": [],
  "active_risk_nodes": []
}
```

---

## 19. Refinery Compatibility

### `GET /api/refinery-compatibility`

**Frontend Usage:** `RefineryCompatibility.jsx`

**Request Parameters:**
* `crude_type` (optional string): Filter compatibility metrics for specific crude grade.

**Response:**
```json
{
  "crude_options": ["Bonny Light (Nigeria)", "Arab Light (Saudi)"],
  "selected_crude": "Bonny Light (Nigeria)",
  "refineries": [
    {"name": "Jamnagar Refinery (RIL)", "location": "Gujarat", "capacity": "1,240,000 bbl/d", "compatibility": 95, "status": "COMPATIBLE"}
  ],
  "compatibility_matrix": {
    "gravity_api": 35.4,
    "sulfur_pct": 0.14,
    "tan_mg_koh": 0.28,
    "viscosity_cst": 4.5
  },
  "recommended_refineries": ["Jamnagar Refinery (RIL)"],
  "blending_advice": "Advice text..."
}
```

---

## 20. AI Copilot Query

### `POST /api/copilot/query`

**Frontend Usage:** `AICopilot.jsx`

**Request:**
```json
{
  "message": "analyze the risk of Hormuz disruption"
}
```

**Response:**
```json
{
  "answer": "Hormuz Strait transit routes are blocked. 8.5 MMT crude shortfall predicted over 30 days.",
  "evidence": "Daily supply gap: 2.4 million barrels.",
  "recommended_actions": [
    "Initiate 8.5 MMT drawdown from Visakhapatnam and Mangaluru SPR",
    "Reroute 4 contracted VLCCs via West Africa spot agreements"
  ],
  "linked_pages": ["/spr-planner", "/procurement"],
  "chart_data": {
    "labels": ["SPR Usable", "SPR Drawdown", "Commercial Stocks"],
    "values": [6.71, 1.8, 14.2]
  }
}
```

---

## 21. Explainable AI

### `GET /api/explainability`

**Frontend Usage:** `ExplainableAI.jsx`

**Request Parameters:**
* `decision` (optional string, defaults to `west_africa`)

**Response:**
```json
{
  "question": "Why did the system prioritize routing spot cargoes via West Africa?",
  "answer": "West Africa route provides a secure physical shipping lane...",
  "reason_graph": {
    "nodes": [
      {"id": "n1", "label": "Hormuz Blockage Detected"}
    ],
    "edges": [
      {"from": "n1", "to": "n2"}
    ]
  },
  "evidence": "Freight surcharge: +12% vs standard...",
  "confidence": 0.92,
  "factor_contributions": [
    {"factor": "Geopolitical Safety", "weight": 55}
  ],
  "alternatives": [
    {"option": "West Africa Route", "cost_cr": 4200, "safety": "HIGH", "selected": true}
  ]
}
```

---

## 22. Reports Library

### `GET /api/reports`

**Frontend Usage:** `ReportsLibrary.jsx`

**Response:**
```json
[
  {
    "id": "REP-ABCD",
    "title": "Energy Resilience Assessment — July 2026",
    "format": "PDF",
    "generated_by": "Commander Arjun Mehta",
    "size": "2.8 MB",
    "status": "READY",
    "timestamp": "2026-07-10T12:00:00Z"
  }
]
```

### `POST /api/reports/generate`

**Frontend Usage:** `ReportsLibrary.jsx` (Generate Report button)

**Response:**
```json
{
  "id": "REP-EFGH",
  "title": "Energy Resilience Assessment — July 2026",
  "format": "PDF",
  "generated_by": "Commander Arjun Mehta",
  "size": "2.8 MB",
  "status": "READY",
  "timestamp": "2026-07-10T12:00:00Z"
}
```

---

## 23. User Management

### `GET /api/users`

**Frontend Usage:** `UserManagement.jsx`

**Response:**
```json
[
  {
    "id": "arjun_mehta",
    "name": "Arjun Mehta",
    "email": "arjun.mehta@nemc.gov.in",
    "role": "Commander",
    "status": "ACTIVE",
    "avatar": "AM"
  }
]
```

### `POST /api/users/invite`

**Frontend Usage:** `UserManagement.jsx` (Add/Invite user)

**Request:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@nemc.gov.in",
  "role": "Analyst"
}
```

**Response:**
```json
{
  "id": "rajesh_kumar",
  "name": "Rajesh Kumar",
  "email": "rajesh@nemc.gov.in",
  "role": "Analyst",
  "status": "ACTIVE",
  "avatar": "RK"
}
```

### `PATCH /api/users/{id}`

**Frontend Usage:** `UserManagement.jsx` (Edit user details)

**Request:**
```json
{
  "role": "Senior Analyst",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "id": "rajesh_kumar",
  "name": "Rajesh Kumar",
  "email": "rajesh@nemc.gov.in",
  "role": "Senior Analyst",
  "status": "ACTIVE",
  "avatar": "RK"
}
```

### `DELETE /api/users/{id}`

**Frontend Usage:** `UserManagement.jsx` (Remove user)

**Response:**
```json
{
  "success": true,
  "message": "User rajesh_kumar deleted successfully."
}
```

---

## 24. Data Sources

### `GET /api/data-sources`

**Frontend Usage:** `DataSources.jsx`

**Response:**
```json
[
  {
    "id": "spr_telemetry",
    "name": "SPR Telemetry Link",
    "category": "Telemetry",
    "status": "SYNCED",
    "records_count": 12500,
    "last_sync_time": "Just now"
  }
]
```

### `POST /api/data-sources/refresh`

**Frontend Usage:** `DataSources.jsx` (Sync database link)

**Request:**
```json
{
  "id": "spr_telemetry"
}
```

**Response:**
```json
{
  "id": "spr_telemetry",
  "name": "SPR Telemetry Link",
  "category": "Telemetry",
  "status": "SYNCED",
  "records_count": 12950,
  "last_sync_time": "Just now"
}
```

---

## 25. Collaboration Board

### `GET /api/collaboration/rooms`

**Frontend Usage:** `CollaborationRoom.jsx`

**Response:**
```json
[
  {
    "id": "crisis_room",
    "name": "Emergency Command Room",
    "active_users": 4,
    "last_message": "Update on Hormuz Strait..."
  }
]
```

### `GET /api/collaboration/rooms/{id}/messages`

**Frontend Usage:** `CollaborationRoom.jsx`

**Response:**
```json
[
  {
    "id": 1,
    "room_id": "crisis_room",
    "sender": "Commander Arjun Mehta",
    "sender_role": "Commander, NEMC",
    "message": "Please review alternate West Africa routing.",
    "timestamp": "10:15 AM",
    "avatar": "AM"
  }
]
```

### `POST /api/collaboration/rooms/{id}/messages`

**Frontend Usage:** `CollaborationRoom.jsx` (Send chat message)

**Request:**
```json
{
  "sender": "Commander Arjun Mehta",
  "sender_role": "Commander, NEMC",
  "message": "Let's proceed with authorization.",
  "avatar": "AM"
}
```

**Response:** Array of updated messages in the room.

### `POST /api/collaboration/approvals`

**Frontend Usage:** `CollaborationRoom.jsx` (Crisis motion voting)

**Request:**
```json
{
  "motion_id": "MOT-HORMUZ",
  "approved_by": "Arjun Mehta",
  "status": "APPROVED"
}
```

**Response:**
```json
{
  "success": true,
  "status": "APPROVED"
}
```

---

## 26. User Profile Preferences

### `GET /api/profile`

**Frontend Usage:** `Profile.jsx`

**Response:**
```json
{
  "id": "arjun_mehta",
  "name": "Arjun Mehta",
  "role": "Commander, NEMC",
  "email": "arjun.mehta@nemc.gov.in",
  "avatar": "AM",
  "preferences": {
    "id": 1,
    "theme": "dark",
    "notifications_enabled": true,
    "high_contrast": false,
    "refresh_interval_seconds": 30
  }
}
```

### `PUT /api/profile/preferences`

**Frontend Usage:** `Profile.jsx` (Update settings preference)

**Request:**
```json
{
  "theme": "dark",
  "notifications_enabled": true,
  "high_contrast": false,
  "refresh_interval_seconds": 30
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": "arjun_mehta",
  "theme": "dark",
  "notifications_enabled": true,
  "high_contrast": false,
  "refresh_interval_seconds": 30
}
```

---

## 27. Help Center

### `GET /api/help-center`

**Frontend Usage:** `HelpCenter.jsx`

**Request Parameters:**
* `query` (optional string): Filter articles by keyword.

**Response:**
```json
[
  {
    "id": "art-1",
    "title": "Strategic Petroleum Reserve Drawdown Guidelines",
    "category": "SPR Operations",
    "summary": "Detailed protocol for initiating staged cavern releases during supply disruptions."
  }
]
```

---

## 28. General System Settings

### `GET /api/settings`

**Frontend Usage:** `Settings.jsx`

**Response:**
```json
{
  "api_endpoint": "http://localhost:8000/api",
  "auto_refresh": true,
  "active_security_profile": "Standard NATO-Level AES256",
  "alert_emails": "alerts@nemc.gov.in",
  "engines": {
    "scenario": "ACTIVE",
    "risk": "ACTIVE",
    "compliance": "ACTIVE",
    "redteam": "ACTIVE"
  }
}
```

### `PUT /api/settings`

**Frontend Usage:** `Settings.jsx` (Save Settings button)

**Request:**
```json
{
  "api_endpoint": "http://localhost:8000/api",
  "auto_refresh": true,
  "active_security_profile": "Standard NATO-Level AES256",
  "alert_emails": "alerts@nemc.gov.in"
}
```

**Response:**
```json
{
  "success": true,
  "updated_settings": {
    "api_endpoint": "http://localhost:8000/api",
    "auto_refresh": true,
    "active_security_profile": "Standard NATO-Level AES256",
    "alert_emails": "alerts@nemc.gov.in"
  },
  "timestamp": "2026-07-10T12:00:00Z"
}
```

---

## 29. Master Intelligence Pipeline

### `GET /api/pipeline/state`

**Response:**
```json
{
  "active_scenario": {},
  "demo": {},
  "timeline": {},
  "state": {},
  "risk": {},
  "economic": {},
  "procurement": {},
  "spr": {},
  "compliance": {},
  "redteam": {},
  "brief": {},
  "latest_decision": {},
  "notifications": [],
  "audit_summary": {},
  "generated_at": ""
}
```

### `POST /api/pipeline/run`

**Response:**
```json
{
  "active_scenario": {},
  "demo": {},
  "timeline": {},
  "state": {},
  "risk": {},
  "economic": {},
  "procurement": {},
  "spr": {},
  "compliance": {},
  "redteam": {},
  "brief": {},
  "latest_decision": {},
  "notifications": [],
  "audit_summary": {},
  "generated_at": ""
}
```

---

## 30. Custom Scenario Upload

### `POST /api/scenarios/upload`

**Request:**
```json
{
  "scenario_name": "Custom Gulf Escalation",
  "crude_price_change_pct": 18,
  "shipping_delay_days": 9,
  "insurance_spike_pct": 28,
  "supplier_disruption_pct": 35,
  "spr_coverage_days": 8,
  "route_risk": "critical",
  "affected_routes": ["Strait of Hormuz"],
  "affected_suppliers": ["Iraq", "Saudi Arabia", "UAE"],
  "timeline": []
}
```

**Response:**
```json
{
  "success": true,
  "scenario_id": "custom_gulf_escalation",
  "message": "Custom scenario 'Custom Gulf Escalation' uploaded and activated. Demo reset to step 0.",
  "activated_at": "2026-07-10T12:00:00Z"
}
```

---

## Endpoints That Do NOT Exist (Dead Routes)

| Function | Route Attempted | Status | Resolution |
|---|---|---|---|
| `fetchActiveScenario()` | `GET /api/scenarios/active` | ❌ Does not exist | Remove from `api.js`. Active scenario comes from `GET /api/state → active_scenario` |

---

## Parameter Bug

| Function | Current Param | Correct Param | File |
|---|---|---|---|
| `fetchAuditLogs(skip, limit)` | `skip` | `offset` | `src/services/api.js` line 101 |

