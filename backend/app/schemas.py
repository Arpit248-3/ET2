from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    active_scenario: Optional[str]
    demo_step: int


# ─── Scenario ──────────────────────────────────────────────────────────────────

class ScenarioSummary(BaseModel):
    id: str
    name: str
    description: str
    severity: str
    probability: int
    region: str
    is_active: bool


class ScenarioActivateResponse(BaseModel):
    success: bool
    scenario_id: str
    message: str
    activated_at: str


# ─── State / KPI ───────────────────────────────────────────────────────────────

class KPIData(BaseModel):
    risk_score: int
    crisis_level: str
    active_incidents: int
    supply_gap: str
    spr_coverage: int
    active_sanctions: int


class IncidentItem(BaseModel):
    id: int
    time: str
    type: str
    title: str
    detail: str
    region: str
    color: str


class RiskSignal(BaseModel):
    id: int
    source: str
    signal: str
    score: int
    confidence: int
    trend: str
    category: str


class StateResponse(BaseModel):
    kpi: KPIData
    incident_feed: List[IncidentItem]
    risk_signals: List[RiskSignal]
    active_scenario: Optional[str]
    demo_step: int
    brent_price: float
    timestamp: str


# ─── Demo ──────────────────────────────────────────────────────────────────────

class DemoTimelineStep(BaseModel):
    step: int
    time: str
    event: str
    type: str
    risk: int


class DemoState(BaseModel):
    current_step: int
    total_steps: int
    current_event: DemoTimelineStep
    scenario_name: str
    elapsed_time: str
    is_complete: bool


class DemoNextResponse(BaseModel):
    success: bool
    current_step: int
    total_steps: int
    event: DemoTimelineStep
    is_complete: bool


# ─── Risk ──────────────────────────────────────────────────────────────────────

class RiskComponent(BaseModel):
    name: str
    value: float
    weight: float
    weighted_score: float
    label: str


class RiskResponse(BaseModel):
    overall_score: int
    crisis_level: str
    components: List[RiskComponent]
    trend: str
    signals: List[RiskSignal]
    recommendation: str
    timestamp: str


# ─── Simulation ────────────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    scenario_id: str
    duration_days: int = 30
    severity_multiplier: float = 1.0


class SimulationDayPoint(BaseModel):
    day: int
    brent_price: float
    risk_score: int
    spr_level_pct: float
    supply_gap_mbbl: float
    action: Optional[str]


class SimulationResponse(BaseModel):
    scenario_id: str
    duration_days: int
    summary: Dict[str, Any]
    daily_projection: List[SimulationDayPoint]
    recommended_action: str
    timestamp: str


# ─── Economic Impact ───────────────────────────────────────────────────────────

class EconomicResponse(BaseModel):
    headline: Dict[str, Any]
    cost_of_living: Dict[str, Any]
    sector_impact: List[Dict[str, Any]]
    state_impact: List[Dict[str, Any]]
    projection: List[Dict[str, Any]]
    policy_options: List[Dict[str, Any]]
    uncertainty_band: Dict[str, Any]
    assumptions: Dict[str, Any]
    confidence: float
    inflation_transmission_chain: Optional[List[Dict[str, Any]]] = None
    scenario_id: Optional[str]
    scenario_name: Optional[str] = None
    timestamp: str


# ─── Procurement ───────────────────────────────────────────────────────────────

class ProcurementRequest(BaseModel):
    target_volume_mbbl: float = 2.4
    duration_days: int = 30
    exclude_routes: List[str] = []
    max_risk_score: int = 60


class SupplierScore(BaseModel):
    supplier_id: str
    name: str
    country: str
    crude_type: str
    route: str
    landed_cost_usd_bbl: float
    eta_days: int
    risk_score: int
    composite_score: float
    sanctions_status: str
    insurance_status: str
    availability: str
    refinery_compatibility: int
    reliability_score: int
    verdict: str
    recommended_volume_mbbl: float
    score_breakdown: Dict[str, float]


class ProcurementResponse(BaseModel):
    recommended_mix: List[SupplierScore]
    total_cost_estimate_cr: float
    coverage_days: int
    risk_summary: str
    optimized_for: str
    timestamp: str


# ─── SPR ───────────────────────────────────────────────────────────────────────

class SPRPlanRequest(BaseModel):
    daily_gap_mbbl: float = 2.4
    days_until_cargo: int = 22
    target_coverage_days: int = 30


class SPRSite(BaseModel):
    name: str
    capacity_mbbl: float
    current_stock_mbbl: float
    drawdown_allocated_mbbl: float
    status: str


class SPRPlanResponse(BaseModel):
    daily_supply_gap_mbbl: float
    days_until_cargo_arrival: int
    total_drawdown_required_mbbl: float
    reserve_after_action_mbbl: float
    reserve_after_action_pct: float
    coverage_days: int
    sites: List[SPRSite]
    feasible: bool
    warning: Optional[str]
    depletion_projection: Optional[List[Dict[str, Any]]] = None
    action_comparison: Optional[List[Dict[str, Any]]] = None
    ai_recommendation: Optional[str] = None
    timestamp: str


# ─── Compliance ────────────────────────────────────────────────────────────────

class ComplianceCheckRequest(BaseModel):
    supplier_ids: List[str]
    route: Optional[str] = None


class ComplianceResult(BaseModel):
    supplier_id: str
    supplier_name: str
    sanctions: str
    insurance: str
    legal_status: str
    policy_alignment: str
    route_restriction: str
    overall: str
    flags: List[str]


class ComplianceResponse(BaseModel):
    results: List[ComplianceResult]
    all_clear: bool
    flagged_count: int
    timestamp: str


# ─── Red Team ──────────────────────────────────────────────────────────────────

class RedTeamRequest(BaseModel):
    recommendation: str
    scenario_id: str
    confidence: float = 0.85


class RedTeamFinding(BaseModel):
    category: str
    finding: str
    severity: str


class RedTeamResponse(BaseModel):
    original_recommendation: str
    critique: str
    weak_assumptions: List[str]
    ignored_risks: List[str]
    findings: List[RedTeamFinding]
    confidence_original: float
    confidence_adjusted: float
    final_recommendation: str
    timestamp: str


# ─── Brief ─────────────────────────────────────────────────────────────────────

class BriefRequest(BaseModel):
    scenario_id: str
    classification: str = "TOP SECRET"
    prepared_for: str = "Hon. Minister of Petroleum"


class BriefSection(BaseModel):
    heading: str
    content: str


class BriefResponse(BaseModel):
    brief_id: str
    classification: str
    prepared_for: str
    prepared_by: str
    date: str
    subject: str
    sections: List[BriefSection]
    decision_required: str
    timestamp: str
    actions: Optional[List[Dict[str, Any]]] = []



# ─── Decisions ─────────────────────────────────────────────────────────────────

class DecisionRequest(BaseModel):
    action_type: str
    approved_by: str
    scenario_id: Optional[str] = None
    details: Dict[str, Any] = {}


class DecisionResponse(BaseModel):
    decision_id: str
    action_type: str
    approved_by: str
    scenario_id: str
    status: str
    timestamp: str


# ─── Timeline ──────────────────────────────────────────────────────────────────

class TimelineEvent(BaseModel):
    time: str
    event: str
    type: str
    risk: int
    step: int
    is_current: bool


class TimelineResponse(BaseModel):
    scenario_id: Optional[str]
    scenario_name: Optional[str]
    events: List[TimelineEvent]
    current_step: int


# ─── Notifications ─────────────────────────────────────────────────────────────

class Notification(BaseModel):
    id: int
    time: str
    type: str
    title: str
    detail: str
    read: bool


class NotificationsResponse(BaseModel):
    notifications: List[Notification]
    unread_count: int


# ─── Audit Logs ────────────────────────────────────────────────────────────────

class AuditLogEntry(BaseModel):
    id: str
    time: str
    user: str
    action: str
    module: str
    status: str
    type: str
    details: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class AuditLogsResponse(BaseModel):
    logs: List[AuditLogEntry]
    total: int


# ─── Settings ──────────────────────────────────────────────────────────────────

class ThresholdUpdateRequest(BaseModel):
    thresholds: Dict[str, Any]
    updated_by: str = "Operator"
