# UrjaNetra AI — Static Data Replacement Report

This report documents the systematic removal of hardcoded operational mock data dependencies (`src/data/mockData.js`) from all dashboard pages, replaced by dynamic backend API data, last-known local storage cache keys, and context-driven offline handling.

## Removed Static Operational Dependencies

| Static Data Constant (in `mockData.js`) | Removed From Dashboard Pages | Replaced By Backend API / Context | Caching Key / Offline Fallback |
|---|---|---|---|
| `mockUser` | `Profile.jsx`, `CommandCenter.jsx` | `GET /api/profile` / `pipelineState.user` | `urjanetra_cache_profile` |
| `kpiData` | `CommandCenter.jsx`, `DemoMode.jsx` | `GET /api/pipeline/state` (system KPIs) | `urjanetra_cache_pipeline_state` |
| `incidentFeed` | `CommandCenter.jsx`, `Notifications.jsx` | `GET /api/notifications` | `urjanetra_cache_notifications` |
| `riskSignals` | `RiskIntelligence.jsx`, `CrisisMode.jsx` | `GET /api/risk` | `urjanetra_cache_risk` |
| `supplierData` | `ProcurementOptimizer.jsx` | `POST /api/procurement/optimize` | `urjanetra_cache_optimize` |
| `sprData` | `SPRPlanner.jsx`, `CrisisMode.jsx` | `POST /api/spr/plan` | `urjanetra_cache_spr_plan` |
| `refineryData` | `RefineryCompatibility.jsx` | `GET /api/refinery-compatibility` | `urjanetra_cache_refinery_compat` |
| `complianceData` | `ComplianceShield.jsx` | `POST /api/compliance/check` | `urjanetra_cache_compliance` |
| `auditLogs` | `AuditLogs.jsx` | `GET /api/audit-logs` | `urjanetra_cache_audit_logs` |
| `usersData` | `UserManagement.jsx` | `GET /api/users` | `urjanetra_cache_users` |
| `reportsData` | `ReportsLibrary.jsx` | `GET /api/reports` | `urjanetra_cache_reports` |
| `dataSourcesData` | `DataSources.jsx` | `GET /api/data-sources` | `urjanetra_cache_data_sources` |
| `chatHistory` | `AICopilot.jsx` | `POST /api/copilot/query` | `urjanetra_cache_copilot_history` |
| `explainabilityData` | `ExplainableAI.jsx` | `GET /api/explainability` | `urjanetra_cache_explainability` |
| `timelineEvents` | `TimelineReplay.jsx`, `DemoMode.jsx` | `GET /api/timeline` / `pipelineState.timeline` | `urjanetra_cache_pipeline_state` |

## Offline Caching and Default Fallback Protocol

If the backend goes offline, the frontend API layer (`src/services/api.js`) interceptor catches the failed request and implements the following flow:
1. **Cache Lookup**: Attempts to load from `localStorage` using the namespace prefix `urjanetra_cache_`.
2. **Metadata Injection**: If a cache hit occurs, appends `__fromCache: true` and `__offline: true` metadata to the payload.
3. **Graceful Empty State**: If no cache is found, returns `null` or an empty array. The target dashboard page then displays a clean offline layout (e.g. "Data Sources Offline") with retry actions instead of falling back to fake/static mock values.

## Build Verification

A clean production build has been executed successfully to guarantee zero import errors, broken paths, or bundle warnings:
```bash
$ npm run build
vite v8.1.3 building client environment for production...
✓ built in 1.82s
dist/index.html                          1.02 kB
dist/assets/index-BeVESqQN.css          41.71 kB
dist/assets/leaflet-src-DehrWf5W.js    148.81 kB
dist/assets/index-BasZMml3.js        1,079.87 kB
```
No active code imports `src/data/mockData.js` for visible operational data rendering.
