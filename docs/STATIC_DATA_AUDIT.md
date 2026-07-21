# UrjaNetra AI — Static Data Audit

**Purpose:** Identify every dashboard page that still renders hardcoded operational data despite live backend APIs existing. Pages must ultimately serve all data from the backend; this document tracks what is done and what remains.

---

## Legend

| Status | Meaning |
|---|---|
| ✅ BACKEND-DRIVEN | All operational data comes from the backend. Fallback data exists for offline only. |
| ⚠️ PARTIAL | Backend is connected, but some operational arrays/constants are still hardcoded. |
| ❌ STATIC | No backend connection. All data is hardcoded. |

---

## Page Audit

---

### 1. Command Center

| Field | Value |
|---|---|
| **Route** | `/command-center` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/state`, `GET /api/economic-impact`, `POST /api/decisions` |
| **Static Arrays / Constants Found** | None operationally significant. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 2. Risk Intelligence

| Field | Value |
|---|---|
| **Route** | `/risk-intelligence` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/risk` |
| **Static Arrays / Constants Found** | None operationally significant. Fallback threat vector objects exist as local constants when backend is offline. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 3. Scenario Simulator

| Field | Value |
|---|---|
| **Route** | `/scenario-simulator` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `POST /api/simulate`, `GET /api/scenarios`, `GET /api/economic-impact` |
| **Static Arrays / Constants Found** | None operationally significant. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 4. Economic Impact

| Field | Value |
|---|---|
| **Route** | `/economic-impact` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/economic-impact` |
| **Static Arrays / Constants Found** | Local fallback metric map used when `econData` is null. These are offline-only defaults. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. Note: The response shape uses `metrics` (dict), `state_impact`, `sector_impact`, `time_series` — the frontend correctly maps all of these. |

---

### 5. Procurement Optimizer

| Field | Value |
|---|---|
| **Route** | `/procurement-optimizer` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `POST /api/procurement/optimize` |
| **Static Arrays / Constants Found** | Local fallback supplier rows used when `procData` is null (offline only). |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 6. SPR Planner

| Field | Value |
|---|---|
| **Route** | `/spr-planner` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `POST /api/spr/plan` |
| **Static Arrays / Constants Found** | Local fallback SPR site list used when `sprPlan` is null (offline only). |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 7. Supply Chain Twin

| Field | Value |
|---|---|
| **Route** | `/supply-chain-twin` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | All map nodes, route lines, disruption overlays, and shipping status data are hardcoded. No `useApi` import exists. |
| **Backend Endpoint Needed** | `GET /api/state` (`incident_feed`, `risk_signals`) could provide live node risk status. No dedicated supply chain endpoint exists in the current backend. |
| **Correction Required** | Low priority — no dedicated backend endpoint exists. Could consume `incident_feed` from `/api/state` for overlay annotations. Flag for future backend endpoint: `GET /api/supply-chain`. |

---

### 8. Refinery Compatibility

| Field | Value |
|---|---|
| **Route** | `/refinery-compatibility` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | All refinery specs, crude API gravity tables, and compatibility scores are hardcoded. No `useApi` import exists. |
| **Backend Endpoint Needed** | Reference data exists in `backend/app/data/reference/refineries.json` and `suppliers.json`. No HTTP endpoint exposes this data. |
| **Correction Required** | Flag for future backend endpoint: `GET /api/reference/refineries` and `GET /api/reference/suppliers`. |

---

### 9. Compliance Shield

| Field | Value |
|---|---|
| **Route** | `/compliance-shield` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `POST /api/compliance/check` |
| **Static Arrays / Constants Found** | Local fallback compliance result rows used when `compData` is null (offline only). |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 10. Red Team Validator

| Field | Value |
|---|---|
| **Route** | `/red-team-validator` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `POST /api/redteam/validate` |
| **Static Arrays / Constants Found** | `mockRtData` constant (line 31) is used as fallback when backend is offline. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None — fallback is correct offline behavior. |

---

### 11. AI Action Brief

| Field | Value |
|---|---|
| **Route** | `/action-brief` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `POST /api/brief/generate` |
| **Static Arrays / Constants Found** | Local fallback brief sections used when `liveBriefData` is null. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 12. Executive Decision Board

| Field | Value |
|---|---|
| **Route** | `/executive-decision-board` |
| **Status** | ⚠️ PARTIAL |
| **Backend Endpoint Used** | `POST /api/decisions` |
| **Static Arrays / Constants Found** | `mockMotions` array (line 10) contains motion titles, vote tallies, member names, and AI recommendations all hardcoded. Board member roster is static. Motion list is never fetched from backend. |
| **Backend Endpoint Needed** | No `GET /api/decisions` or `GET /api/motions` endpoint exists in the current backend. The `POST /api/decisions` only records approvals. |
| **Correction Required** | The motions catalog is presenter data (not operational). Until a `GET /api/decisions` endpoint is built, static motions are acceptable. Decision recording via `POST` is correctly wired. |

---

### 13. Timeline Replay

| Field | Value |
|---|---|
| **Route** | `/timeline-replay` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/timeline` |
| **Static Arrays / Constants Found** | `defaultCrisisEvents` and `defaultTimelineData` used as offline fallback. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 14. Notifications

| Field | Value |
|---|---|
| **Route** | `/notifications` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/notifications` |
| **Static Arrays / Constants Found** | Local `notifications` constant used as offline fallback. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 15. Audit Logs

| Field | Value |
|---|---|
| **Route** | `/audit-logs` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/audit-logs` |
| **Static Arrays / Constants Found** | Local `logs` constant used as offline fallback. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. Note: API uses `offset` query param, not `skip`. Current frontend sends `skip` — see API contract correction. |

---

### 16. Thresholds & Alerts

| Field | Value |
|---|---|
| **Route** | `/thresholds-alerts` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/settings/thresholds`, `PUT /api/settings/thresholds` |
| **Static Arrays / Constants Found** | `alertRules`, `escalationLevels`, `alertHistory`, `hourlyAlerts` are all hardcoded arrays. These are policy display elements with no backend endpoint. |
| **Backend Endpoint Needed** | No backend endpoint for alert rules or escalation matrix. Only threshold values are backend-driven. |
| **Correction Required** | Alert rules and escalation matrix are display-only policy documentation — no correction needed until backend exposes them. |

---

### 17. Demo Mode

| Field | Value |
|---|---|
| **Route** | `/demo-mode` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/demo`, `GET /api/timeline`, `POST /api/demo/next`, `POST /api/demo/reset`, `POST /api/demo/step/{idx}` |
| **Static Arrays / Constants Found** | None operationally significant. Offline fallbacks exist. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 18. Crisis Mode

| Field | Value |
|---|---|
| **Route** | `/crisis-mode` |
| **Status** | ✅ BACKEND-DRIVEN |
| **Backend Endpoint Used** | `GET /api/state`, `POST /api/decisions` |
| **Static Arrays / Constants Found** | None operationally significant. |
| **Backend Endpoint Needed** | Already connected. |
| **Correction Required** | None. |

---

### 19. AI Copilot

| Field | Value |
|---|---|
| **Route** | `/ai-copilot` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | `mockResponses` object (line 24) contains all AI response text. Chat history is local state only. |
| **Backend Endpoint Needed** | No dedicated copilot endpoint exists in backend. Could forward queries to `POST /api/brief/generate` or `POST /api/redteam/validate` as a proxy. |
| **Correction Required** | Flag for future: `POST /api/copilot/query`. Low priority — this is a UX feature not an operational data display. |

---

### 20. Explainable AI

| Field | Value |
|---|---|
| **Route** | `/explainable-ai` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | All factor weights, confidence scores, decision tree data, and reasoning text are hardcoded. |
| **Backend Endpoint Needed** | No dedicated explainability endpoint. Could derive from `GET /api/risk` (component weights) and `POST /api/redteam/validate`. |
| **Correction Required** | Flag for future: `GET /api/explain/{decision_id}`. Low priority. |

---

### 21. Data Sources

| Field | Value |
|---|---|
| **Route** | `/data-sources` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | All data source names, statuses, latency values, and feed counts are hardcoded. |
| **Backend Endpoint Needed** | No backend endpoint. Could expose `GET /api/health` with data feed status. |
| **Correction Required** | Flag for future: `GET /api/data-sources`. Low priority. |

---

### 22. Reports Library

| Field | Value |
|---|---|
| **Route** | `/reports-library` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | All report names, dates, and statuses are hardcoded. |
| **Backend Endpoint Needed** | Could derive from `GET /api/audit-logs` for generated briefs. No dedicated reports endpoint. |
| **Correction Required** | Low priority. Flag for future: `GET /api/reports`. |

---

### 23. Collaboration Room

| Field | Value |
|---|---|
| **Route** | `/collaboration-room` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | All messages, participants, and activity feeds are static. |
| **Backend Endpoint Needed** | Requires WebSocket / real-time infrastructure. Out of scope for current MVP. |
| **Correction Required** | Out of scope for MVP backend. |

---

### 24. User Management, Profile, Settings, Help Center

| Field | Value |
|---|---|
| **Routes** | `/user-management`, `/profile`, `/settings`, `/help-center` |
| **Status** | ❌ STATIC |
| **Backend Endpoint Used** | None |
| **Static Arrays / Constants Found** | All user data, role lists, and settings options are hardcoded. |
| **Backend Endpoint Needed** | Requires auth system. Out of scope for current MVP. |
| **Correction Required** | Out of scope for MVP. |

---

## Summary Table

| Page | Route | Status | Highest Priority Fix |
|---|---|---|---|
| Command Center | `/command-center` | ✅ | — |
| Risk Intelligence | `/risk-intelligence` | ✅ | — |
| Scenario Simulator | `/scenario-simulator` | ✅ | — |
| Economic Impact | `/economic-impact` | ✅ | — |
| Procurement Optimizer | `/procurement-optimizer` | ✅ | — |
| SPR Planner | `/spr-planner` | ✅ | — |
| Supply Chain Twin | `/supply-chain-twin` | ❌ | Future: `GET /api/supply-chain` |
| Refinery Compatibility | `/refinery-compatibility` | ❌ | Future: `GET /api/reference/refineries` |
| Compliance Shield | `/compliance-shield` | ✅ | — |
| Red Team Validator | `/red-team-validator` | ✅ | — |
| AI Action Brief | `/action-brief` | ✅ | — |
| Executive Decision Board | `/executive-decision-board` | ⚠️ PARTIAL | Motions need `GET /api/decisions` (not yet built) |
| Timeline Replay | `/timeline-replay` | ✅ | — |
| Notifications | `/notifications` | ✅ | — |
| Audit Logs | `/audit-logs` | ✅ | Fix: `skip` vs `offset` param name |
| Thresholds & Alerts | `/thresholds-alerts` | ✅ | — |
| Demo Mode | `/demo-mode` | ✅ | — |
| Crisis Mode | `/crisis-mode` | ✅ | — |
| AI Copilot | `/ai-copilot` | ❌ | Future: `POST /api/copilot/query` |
| Explainable AI | `/explainable-ai` | ❌ | Future: `GET /api/explain/{id}` |
| Data Sources | `/data-sources` | ❌ | Future: `GET /api/data-sources` |
| Reports Library | `/reports-library` | ❌ | Future: `GET /api/reports` |
| Collaboration Room | `/collaboration-room` | ❌ | Out of scope (WebSocket) |
| User Mgmt / Profile / Settings / Help | various | ❌ | Out of scope (Auth system) |

---

## api.js Findings

### `fetchActiveScenario` — DEAD ROUTE
- **Defined in** `api.js`: `GET /api/scenarios/active`
- **Backend status:** This route does **NOT exist** in `scenarios.py`. The backend only exposes `GET /api/scenarios` and `POST /api/scenarios/{id}/activate`.
- **Current usage:** `fetchActiveScenario` is **NOT imported or called anywhere** in the frontend (only defined in `api.js`).
- **Resolution:** Remove the `fetchActiveScenario` export from `api.js`. The active scenario is already derived inside `ScenarioContext` from `systemState.active_scenario` (which comes from `GET /api/state`).

### `fetchAuditLogs(skip, limit)` — WRONG PARAM NAME
- **Defined in** `api.js`: sends `skip` and `limit` as query params.
- **Backend** (`audit.py`): expects `offset` and `limit` (not `skip`).
- **Resolution:** Rename `skip` to `offset` in the `fetchAuditLogs` function call.
