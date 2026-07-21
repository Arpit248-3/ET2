import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─── Metadata Models ──────────────────────────────────────────────────────────

class ExplanationMetadata(BaseModel):
    assumptions: List[str] = Field(default_factory=list)
    formula_used: str = ""
    primary_drivers: List[str] = Field(default_factory=list)
    secondary_drivers: List[str] = Field(default_factory=list)
    sensitivity_factors: Dict[str, float] = Field(default_factory=dict)
    limitations: List[str] = Field(default_factory=list)


class CalculationMetadata(BaseModel):
    execution_time_ms: float = 0.0
    input_hash: str = ""
    output_hash: str = ""
    calculation_version: str = "1.0.0"
    engine_version: str = "1.0.0"


def compute_hash(data: Any) -> str:
    """Deterministic SHA-256 hash of arbitrary dictionary/pydantic data."""
    if hasattr(data, "model_dump"):
        data = data.model_dump(mode="json")
    elif not isinstance(data, (dict, list)):
        data = str(data)
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


# ─── Execution Context ────────────────────────────────────────────────────────

class ExecutionContext(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scenario_id: Optional[str] = None
    demo_step: int = 0
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    trigger: str = "USER"  # USER, SYSTEM, DEMO, SCHEDULER
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class PipelineMetadata(BaseModel):
    version: int = 1
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    scenario_id: Optional[str] = None
    demo_step: int = 0
    execution_id: str
    correlation_id: str


# ─── Section Sub-Models ────────────────────────────────────────────────────────

# Risk Section Models
class RiskComponent(BaseModel):
    name: str
    value: float
    weight: float
    weighted_score: float
    label: str


class RiskSignal(BaseModel):
    id: int
    source: str
    signal: str
    score: int
    confidence: int
    trend: str
    category: str


class RiskSection(BaseModel):
    overall_score: int = 32
    crisis_level: str = "NORMAL"
    components: List[RiskComponent] = Field(default_factory=list)
    trend: str = "stable"
    signals: List[RiskSignal] = Field(default_factory=list)
    recommendation: str = "System nominal."
    affected_regions: List[str] = Field(default_factory=list)
    top_contributors: List[str] = Field(default_factory=list)
    future_projection: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 95.0
    warnings: List[str] = Field(default_factory=list)
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None
    timestamp: str = ""


# Economic Section Models
class EconomicMetric(BaseModel):
    value: float
    unit: str
    trend: str
    label: str


class StateImpact(BaseModel):
    state: str
    impact: int
    population: int
    gdp_exposure: str


class SectorImpact(BaseModel):
    sector: str
    impact: int
    fill: str


class EconomicSection(BaseModel):
    metrics: Dict[str, EconomicMetric] = Field(default_factory=dict)
    state_impact: List[StateImpact] = Field(default_factory=list)
    sector_impact: List[SectorImpact] = Field(default_factory=list)
    time_series: List[Dict[str, Any]] = Field(default_factory=list)
    scenario_id: Optional[str] = None
    import_bill_usd_bn: float = 142.5
    inflation_impact_pct: float = 0.0
    gdp_impact_pct: float = 0.0
    current_account_impact_bn: float = 0.0
    retail_fuel_projection_inr: float = 96.7
    refinery_margin_usd_bbl: float = 8.5
    confidence: float = 90.0
    warnings: List[str] = Field(default_factory=list)
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None
    timestamp: str = ""


# Timeline Section Models
class TimelineEvent(BaseModel):
    time: str
    event: str
    type: str
    risk: int
    step: int
    is_current: bool


class TimelineSection(BaseModel):
    scenario_id: Optional[str] = None
    scenario_name: Optional[str] = None
    events: List[TimelineEvent] = Field(default_factory=list)
    current_step: int = 0
    confidence: float = 95.0
    warnings: List[str] = Field(default_factory=list)
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None


# Procurement Section Models
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
    score_breakdown: Dict[str, float] = Field(default_factory=dict)


class ProcurementSection(BaseModel):
    recommended_mix: List[SupplierScore] = Field(default_factory=list)
    total_cost_estimate_cr: float = 0.0
    coverage_days: int = 30
    risk_summary: str = ""
    optimized_for: str = ""
    fallback_supplier: Optional[Dict[str, Any]] = None
    confidence: float = 88.0
    warnings: List[str] = Field(default_factory=list)
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None
    timestamp: str = ""


# Compatibility Section Models
class CompatibilitySection(BaseModel):
    crude_options: List[str] = Field(default_factory=list)
    selected_crude: str = ""
    refineries: List[Dict[str, Any]] = Field(default_factory=list)
    compatibility_matrix: Dict[str, Any] = Field(default_factory=dict)
    recommended_refineries: List[str] = Field(default_factory=list)
    blending_advice: str = ""
    refining_cost_penalty_usd: float = 0.0
    confidence: float = 92.0
    warnings: List[str] = Field(default_factory=list)
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None


# SPR Section Models
class SPRSite(BaseModel):
    name: str
    capacity_mbbl: float
    current_stock_mbbl: float
    drawdown_allocated_mbbl: float
    status: str


class SPRSection(BaseModel):
    daily_supply_gap_mbbl: float = 0.0
    days_until_cargo_arrival: int = 0
    total_drawdown_required_mbbl: float = 0.0
    reserve_after_action_mbbl: float = 0.0
    reserve_after_action_pct: float = 0.0
    coverage_days: int = 0
    sites: List[SPRSite] = Field(default_factory=list)
    feasible: bool = True
    critical_date: Optional[str] = None
    warning: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    depletion_projection: Optional[List[Dict[str, Any]]] = None
    action_comparison: Optional[List[Dict[str, Any]]] = None
    ai_recommendation: Optional[str] = None
    confidence: float = 94.0
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None
    timestamp: str = ""


# Compliance Section Models
class ComplianceResult(BaseModel):
    supplier_id: str
    supplier_name: str
    sanctions: str
    insurance: str
    legal_status: str
    policy_alignment: str
    route_restriction: str
    overall: str
    flags: List[str] = Field(default_factory=list)


class ComplianceSection(BaseModel):
    results: List[ComplianceResult] = Field(default_factory=list)
    all_clear: bool = True
    flagged_count: int = 0
    status_level: str = "GREEN"  # GREEN, YELLOW, RED
    violations: List[str] = Field(default_factory=list)
    required_actions: List[str] = Field(default_factory=list)
    legal_summary: str = ""
    confidence: float = 98.0
    warnings: List[str] = Field(default_factory=list)
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None
    timestamp: str = ""


# Decision Section Models (Purely Deterministic)
class DecisionSection(BaseModel):
    id: str = "MOT-MONITOR"
    title: str = "System Monitoring and Standard Operations Protocol"
    proposedBy: str = "System Admin"
    status: str = "APPROVED"
    urgency: str = "LOW"
    priority: str = "NORMAL"
    decision_score: float = 85.0
    approval_status: str = "APPROVED"
    required_approvals: List[str] = Field(default_factory=list)
    impact_summary: Dict[str, Any] = Field(default_factory=dict)
    votes: Dict[str, int] = Field(default_factory=lambda: {"for": 6, "against": 0, "abstain": 0})
    quorum: int = 6
    deadline: str = "Passed"
    summary: str = "No active threat scenarios."
    aiRecommendation: str = "MONITOR"
    aiConfidence: int = 99
    confidence: float = 90.0
    warnings: List[str] = Field(default_factory=list)
    members: List[Dict[str, Any]] = Field(default_factory=list)
    latest_decision: Dict[str, Any] = Field(default_factory=dict)
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None


# Notification Section Models
class Notification(BaseModel):
    id: int
    time: str
    type: str
    severity: str = "INFO"  # INFO, WARNING, CRITICAL, SUCCESS
    category: str = "SYSTEM"  # RISK, SPR, COMPLIANCE, ECONOMIC, TIMELINE
    title: str
    detail: str
    suggested_action: str = ""
    read: bool = False


# Audit Section Models
class AuditSection(BaseModel):
    total_count: int = 0
    last_updated: Optional[str] = None
    latest_action: Optional[str] = None
    confidence: float = 100.0
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None


# Executive Section Models (Consolidated for UI consumption)
class KPIData(BaseModel):
    risk_score: int = 32
    crisis_level: str = "NORMAL"
    active_incidents: int = 0
    supply_gap: str = "0M bbl/day"
    spr_coverage: int = 64
    active_sanctions: int = 0


class ExecutiveIncidentItem(BaseModel):
    id: int
    time: str
    type: str
    title: str
    detail: str
    region: str
    color: str


class ExecutiveDemoEvent(BaseModel):
    step: int
    time: str
    event: str
    type: str
    risk: int


class ExecutiveDemoState(BaseModel):
    current_step: int = 0
    total_steps: int = 0
    current_event: ExecutiveDemoEvent
    scenario_name: str = "No Active Scenario"
    elapsed_time: str = "00:00"
    is_complete: bool = False


class BriefSectionModel(BaseModel):
    heading: str
    content: str


class ExecutiveBrief(BaseModel):
    brief_id: str = ""
    classification: str = ""
    prepared_for: str = ""
    prepared_by: str = ""
    date: str = ""
    subject: str = ""
    sections: List[BriefSectionModel] = Field(default_factory=list)
    decision_required: str = ""
    timestamp: str = ""
    actions: List[Dict[str, Any]] = Field(default_factory=list)


class ExecutiveSection(BaseModel):
    kpi: KPIData = Field(default_factory=KPIData)
    incident_feed: List[ExecutiveIncidentItem] = Field(default_factory=list)
    risk_signals: List[RiskSignal] = Field(default_factory=list)
    brent_price: float = 88.0
    active_scenario: Optional[str] = None
    demo_step: int = 0
    timestamp: str = ""
    current_situation: str = "Normal operating parameters."
    risk_summary: str = "Low overall risk."
    economic_summary: str = "Stable crude import pricing."
    recommended_action: str = "Maintain standard monitor status."
    current_supplier: str = "Diversified Mix"
    spr_status: str = "Normal reserve levels."
    compliance_status: str = "All Clear"
    confidence: float = 92.0
    overall_pipeline_confidence: float = 92.0
    warnings: List[str] = Field(default_factory=list)
    demo: Optional[ExecutiveDemoState] = None
    brief: Optional[ExecutiveBrief] = None
    explanation_metadata: Optional[ExplanationMetadata] = None
    calculation_metadata: Optional[CalculationMetadata] = None


# ─── Centralized Pipeline State ───────────────────────────────────────────────

class PipelineState(BaseModel):
    metadata: PipelineMetadata
    scenario: Dict[str, Any] = Field(default_factory=dict)
    risk: RiskSection = Field(default_factory=RiskSection)
    economic: EconomicSection = Field(default_factory=EconomicSection)
    procurement: ProcurementSection = Field(default_factory=ProcurementSection)
    compatibility: CompatibilitySection = Field(default_factory=CompatibilitySection)
    spr: SPRSection = Field(default_factory=SPRSection)
    compliance: ComplianceSection = Field(default_factory=ComplianceSection)
    decision: DecisionSection = Field(default_factory=DecisionSection)
    timeline: TimelineSection = Field(default_factory=TimelineSection)
    notifications: List[Notification] = Field(default_factory=list)
    audit: AuditSection = Field(default_factory=AuditSection)
    executive: ExecutiveSection = Field(default_factory=ExecutiveSection)
    ai_extensions: Dict[str, Any] = Field(default_factory=dict)  # AI placeholder section
    overall_confidence: float = 92.0
    version: int = 1
    timestamp: str = ""

    # Legacy attributes mapped at the root for 100% backward compatibility
    kpi: KPIData = Field(default_factory=KPIData)
    incident_feed: List[ExecutiveIncidentItem] = Field(default_factory=list)
    risk_signals: List[RiskSignal] = Field(default_factory=list)
    active_scenario: Optional[str] = None
    demo_step: int = 0
    brent_price: float = 88.0

    def update_legacy_fields(self):
        """Sync legacy root fields with sub-section values for API consumer compatibility."""
        self.kpi = self.executive.kpi
        self.incident_feed = self.executive.incident_feed
        self.risk_signals = self.executive.risk_signals
        self.active_scenario = self.metadata.scenario_id
        self.demo_step = self.metadata.demo_step
        self.brent_price = self.executive.brent_price
        self.version = self.metadata.version
        self.timestamp = self.metadata.timestamp
