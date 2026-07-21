<USER_REQUEST>
Connect these pages fully to backend data and remove visible hardcoded operational data:

1. ProcurementOptimizer.jsx
2. SPRPlanner.jsx
3. ComplianceShield.jsx

Do not redesign UI.

Procurement Optimizer:
Use POST /api/procurement/optimize.
Render:
- recommended_mix
- total_cost_estimate_cr
- coverage_days
- risk_summary
- optimized_for

Remove visible supplierData dependency from src/data/mockData.js.
Approve Plan should NOT call optimizeProcurement({ approved: true }).
Instead it should call POST /api/decisions with:
action_type: "APPROVE_PROCUREMENT_PLAN"
approved_by: "Commander Arjun Mehta"
details: selected recommendation

SPR Planner:
Use POST /api/spr/plan.
Render:
- daily_supply_gap_mbbl
- days_until_cargo_arrival
- total_drawdown_required_mbbl
- reserve_after_action_mbbl
- reserve_after_action_pct
- coverage_days
- sites
- feasible
- warning

Remove visible sprData dependency from src/data/mockData.js.
If depletion charts need data, extend backend /api/spr/plan to return:
<truncated 1938 bytes>