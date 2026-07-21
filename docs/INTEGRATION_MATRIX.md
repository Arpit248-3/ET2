# UrjaNetra AI — Backend Integration Matrix

This matrix maps all 27 dashboard pages to their corresponding routes, active backend endpoints, current integration status, and fallback requirements.

## Integration Status Legend
* **Fully Backend-Driven**: Page consumes live data from backend APIs; local static constants serve only as last-known cached fallbacks when the backend is offline.
* **Partially Connected**: Page consumes some backend fields but relies on hardcoded data for primary visual features.
* **Static**: No backend integration exists.

---

| Page Name | Route | Current Backend Endpoint | Integration Status | Local Fallbacks / Static Constants | Required Backend Endpoint | Required Correction |
|---|---|---|---|---|---|---|
| **Command Center** | `/command-center` | `GET /api/state`, `GET /api/economic-impact`, `POST /api/decisions` | Fully Backend-Driven | Local default KPI numbers used only when context state is null. | `GET /api/state`, `GET /api/economic-impact`, `POST /api/decisions` | None. |
| **Risk Intelligence** | `/risk-intelligence` | `GET /api/risk` | Fully Backend-Driven | Local fallback risk component objects when backend offline. | `GET /api/risk` | None. |
| **Scenario Simulator** | `/scenario-simulator` | `POST /api/simulate`, `GET /api/scenarios`, `GET /api/economic-impact` | Fully Backend-Driven | Local fallback projection metrics when simulation fails. | `POST /api/simulate`, `GET /api/scenarios`, `GET /api/economic-impact` | None. |
| **Economic Impact** | `/economic-impact` | `GET /api/economic-impact` | Fully Backend-Driven | Local fallback state/sector arrays and month metrics when offline. | `GET /api/economic-impact` | None. |
| **Procurement Optimizer** | `/procurement-optimizer` | `POST /api/procurement/optimize`, `POST /api/decisions` | Fully Backend-Driven | Fallback supplier scoring grid when optimization call fails. | `POST /api/procurement/optimize`, `POST /api/decisions` | None. |
| **Refinery Compatibility** | `/refinery-compatibility` | `GET /api/refinery-compatibility` | Fully Backend-Driven | Fallback crude option listing array and refinery list. | `GET /api/refinery-compatibility` | None. |
| **SPR Planner** | `/spr-planner` | `POST /api/spr/plan`, `POST /api/decisions` | Fully Backend-Driven | Fallback sites list and 3D cavern volume estimates. | `POST /api/spr/plan`, `POST /api/decisions` | None. |
| **Compliance Shield** | `/compliance-shield` | `POST /api/compliance/check` | Fully Backend-Driven | Fallback compliance result array and radar score layout. | `POST /api/compliance/check` | None. |
| **Red Team Validator** | `/red-team-validator` | `POST /api/redteam/validate` | Fully Backend-Driven | Fallback critique strings, assumptions, and findings. | `POST /api/redteam/validate` | None. |
| **Action Brief** | `/action-brief` | `POST /api/brief/generate` | Fully Backend-Driven | Fallback classification headers and bullet sections. | `POST /api/brief/generate` | None. |
| **AI Chat Copilot** | `/ai-copilot` | `POST /api/copilot/query` | Fully Backend-Driven | Fallback message bubbles and sample prompts. | `POST /api/copilot/query` | None. |
| **Explainable AI** | `/explainable-ai` | `GET /api/explainability` | Fully Backend-Driven | Fallback alternate routing lists and reasoning nodes. | `GET /api/explainability` | None. |
| **Executive Decision Board** | `/executive-decision-board` | `GET /api/decision-board/current`, `GET /api/decisions`, `POST /api/decisions` | Fully Backend-Driven | Fallback default motion card structures and voter states. | `GET /api/decision-board/current`, `GET /api/decisions`, `POST /api/decisions` | None. |
| **Notifications** | `/notifications` | `GET /api/notifications` | Fully Backend-Driven | Fallback list of notifications when offline. | `GET /api/notifications` | None. |
| **Reports Library** | `/reports` | `GET /api/reports`, `POST /api/reports/generate` | Fully Backend-Driven | Fallback report documents list. | `GET /api/reports`, `POST /api/reports/generate` | None. |
| **Audit Logs** | `/audit-logs` | `GET /api/audit-logs` | Fully Backend-Driven | Fallback event records list. | `GET /api/audit-logs` | None. |
| **User Management** | `/user-management` | `GET /api/users`, `POST /api/users/invite`, `PATCH /api/users/{id}`, `DELETE /api/users/{id}` | Fully Backend-Driven | Fallback user profile structures. | `GET /api/users`, `POST /api/users/invite`, `PATCH /api/users/{id}`, `DELETE /api/users/{id}` | None. |
| **Settings** | `/settings` | `GET /api/settings`, `PUT /api/settings` | Fully Backend-Driven | Fallback settings configuration properties when offline. | `GET /api/settings`, `PUT /api/settings` | None. |
| **Timeline Replay** | `/timeline-replay` | `GET /api/timeline`, `POST /api/demo/step/{step_idx}` | Fully Backend-Driven | Fallback timeline steps. | `GET /api/timeline`, `POST /api/demo/step/{step_idx}` | None. |
| **Collaboration Room** | `/collaboration-room` | `GET /api/collaboration/rooms`, `GET /api/collaboration/rooms/{id}/messages`, `POST /api/collaboration/rooms/{id}/messages`, `POST /api/collaboration/approvals` | Fully Backend-Driven | Fallback mock messages. | `GET /api/collaboration/rooms`, `GET /api/collaboration/rooms/{id}/messages`, `POST /api/collaboration/rooms/{id}/messages`, `POST /api/collaboration/approvals` | None. |
| **Data Sources** | `/data-sources` | `GET /api/data-sources`, `POST /api/data-sources/refresh` | Fully Backend-Driven | Fallback sync history listing. | `GET /api/data-sources`, `POST /api/data-sources/refresh` | None. |
| **Help Center** | `/help` | `GET /api/help-center` | Fully Backend-Driven | Fallback FAQ list. | `GET /api/help-center` | None. |
| **Profile** | `/profile` | `GET /api/profile`, `PUT /api/profile/preferences` | Fully Backend-Driven | Fallback user avatar and role preferences. | `GET /api/profile`, `PUT /api/profile/preferences` | None. |
| **Crisis Mode** | `/crisis-mode` | Uses context (`GET /api/state`), `POST /api/decisions` | Fully Backend-Driven | Fallback layout details and checklist actions. | `GET /api/state`, `POST /api/decisions` | None. |
| **Demo Mode** | `/demo-mode` | `GET /api/demo`, `POST /api/demo/next`, `POST /api/demo/reset`, `POST /api/demo/step/{step_idx}`, `POST /api/scenarios/{id}/activate` | Fully Backend-Driven | None. | `GET /api/demo`, `POST /api/demo/next`, `POST /api/demo/reset`, `POST /api/demo/step/{step_idx}`, `POST /api/scenarios/{id}/activate` | None. |
| **Thresholds & Alerts** | `/settings/thresholds-alerts` | `GET /api/settings/thresholds`, `PUT /api/settings/thresholds` | Fully Backend-Driven | Fallback JSON alert boundaries. | `GET /api/settings/thresholds`, `PUT /api/settings/thresholds` | None. |
| **Supply Chain Digital Twin** | `/supply-chain-twin` | `GET /api/supply-chain-twin` | Fully Backend-Driven | Fallback nodes, routes, ships, and risk statuses. | `GET /api/supply-chain-twin` | None. |
