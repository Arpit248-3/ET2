"""
Audit Generator — records pipeline execution metrics and audit trail summaries.
Maintains calculation metadata, confidence, and explanation metadata.
"""
import time
from typing import Any
from app.pipeline.models import (
    AuditSection,
    ExplanationMetadata, CalculationMetadata, compute_hash,
)


def execute(state: Any, context: Any) -> Any:
    """
    Execute Audit Generator.
    Summarizes audit trail state and computes calculation telemetry.
    """
    t_start = time.perf_counter()
    audit_data = getattr(context, "audit_summary", {})

    total_count = audit_data.get("total_count", 0) + 1
    last_updated = audit_data.get("last_updated") or context.timestamp
    latest_action = f"Pipeline execution completed (ID: {context.execution_id[:8]})"

    explanation = ExplanationMetadata(
        assumptions=["Audit log immutability maintained via database server triggers."],
        formula_used="Audit_Count = DB_Count + Execution_Increment",
        primary_drivers=[f"Execution ID: {context.execution_id}", f"Trigger: {context.trigger}"],
        secondary_drivers=["Correlation ID", "Timestamp ISO"],
        sensitivity_factors={"log_retention_days": 365},
        limitations=["Audit logs stored in local SQLite database in current environment."]
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0
    inp_hash = compute_hash({"execution_id": context.execution_id, "trigger": context.trigger})
    out_hash = compute_hash({"total_count": total_count, "latest_action": latest_action})

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state.audit = AuditSection(
        total_count=total_count,
        last_updated=last_updated,
        latest_action=latest_action,
        confidence=100.0,
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
    )
    return state
