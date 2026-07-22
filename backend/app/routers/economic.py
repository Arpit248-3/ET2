"""
Economic impact routes powered by deterministic economic engine and OpenRouter Qwen Explainability AI.
"""
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScenarioState
from app.schemas import EconomicResponse
from app.core.economic_engine import get_economic_impact
from app.ai.config import AIConfig
from app.ai.services.openrouter_client import OpenRouterClient
from app.ai.models.ai_models import AICompletionRequest, AgentKind, ModelRole, AIMessage

router = APIRouter()


class EconomicExplainRequest(BaseModel):
    economic_result: Optional[Dict[str, Any]] = None
    question: Optional[str] = None


def _active_economic_result(db: Session, scenario_id: Optional[str] = None) -> Dict[str, Any]:
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    target_scenario_id = scenario_id or (state.active_scenario_id if state else None)
    demo_step = state.demo_step if state else 0
    return get_economic_impact(target_scenario_id, demo_step)


def _fallback_economic_explanation(econ_data: Dict[str, Any]) -> str:
    headline = econ_data.get("headline", {})
    cpi = headline.get("inflation_impact_pp", 0.0)
    gdp = headline.get("gdp_growth_drag_pp", 0.0)
    import_bill = headline.get("import_bill_increase_usd_bn", 0.0)
    fiscal = headline.get("fiscal_burden_inr_cr", 0.0)
    cad = headline.get("cad_impact_pct_gdp", 0.0)
    fuel = headline.get("fuel_price_impact_pct", 0.0)
    scenario_name = econ_data.get("scenario_name", "Current Scenario")

    return (
        f"**Economic Impact Analysis ({scenario_name}):**\n\n"
        f"• **Inflation Shock:** Headline CPI is projected to rise by **+{cpi:.2f} pp**, driven by direct fuel price pass-through (+{fuel:.2f}%) and secondary spillovers in transport and food distribution.\n"
        f"• **GDP Growth Drag:** National GDP growth faces a drag of **{gdp:.2f} pp** as elevated energy costs weigh on industrial output, logistics, and private consumption.\n"
        f"• **Import Bill & Foreign Exchange:** The monthly crude import bill increases by **${import_bill:.2f} billion**, widening the Current Account Deficit by **+{cad:.2f}% of GDP**.\n"
        f"• **Fiscal Exposure:** Total fiscal absorption is estimated at **₹{fiscal:,.0f} crore** per month across excise adjustments, subsidy buffers, and public sector bridge financing.\n\n"
        f"*Policy Note:* Recommended near-term mitigations include calibrated excise buffers and accelerating alternate crude procurement."
    )


@router.get("/economic-impact", response_model=EconomicResponse)
def get_economic(scenario_id: Optional[str] = None, recalculate: bool = False, db: Session = Depends(get_db)):
    return _active_economic_result(db, scenario_id=scenario_id)


@router.post("/ai/economic-explain")
async def explain_economic_impact(request: EconomicExplainRequest, db: Session = Depends(get_db)):
    economic_result = request.economic_result or _active_economic_result(db)
    prompt = (
        "You are explaining a deterministic economic impact calculation for UrjaNetra.\n"
        "Use only the backend data in the JSON below. Do not invent numbers. "
        "Do not calculate new economic values. If data needed for an answer is missing, say what is missing. "
        "Explain the result in concise, policy-ready language and cite the provided headline values exactly.\n\n"
        f"Backend economic data:\n{json.dumps(economic_result, ensure_ascii=False, sort_keys=True)}\n\n"
        f"Question: {request.question or 'Explain the calculated economic impact, main transmission channels, uncertainty, and policy tradeoffs.'}"
    )

    try:
        config = AIConfig.from_env_file()
        client = OpenRouterClient(config=config)
        ai_req = AICompletionRequest(
            agent=AgentKind.EXPLAIN,
            model_role=ModelRole.EXPLAIN,
            messages=[
                AIMessage(role="system", content="You are the UrjaNetra AI Economic Explainability Engine. Return concise, structured JSON with an 'explanation' field."),
                AIMessage(role="user", content=prompt),
            ],
            response_format={"type": "json_object"},
        )
        response = await client.complete(ai_req)
        explanation_text = ""
        if response.parsed_json and "explanation" in response.parsed_json:
            explanation_text = str(response.parsed_json["explanation"])
        elif response.raw_content:
            explanation_text = response.raw_content.strip()

        if not explanation_text:
            explanation_text = _fallback_economic_explanation(economic_result)

        return {
            "available": True,
            "source": "openrouter",
            "model": config.model_explain,
            "explanation": explanation_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        fallback = _fallback_economic_explanation(economic_result)
        return {
            "available": True,
            "source": "grounded_rule_engine",
            "model": "deterministic_explain_engine",
            "explanation": fallback,
            "error": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
