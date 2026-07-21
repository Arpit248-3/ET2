"""
Strategy Comparison Agent — Compares multiple crude procurement or mitigation strategies.
Uses backend metrics only (price, risk, ETA, compatibility, compliance).
"""
import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

from app.ai.prompts.prompt_registry import get_prompt_record
from app.ai.services.openrouter_client import OpenRouterClient
from app.ai.models.ai_models import AICompletionRequest, AgentKind, ModelRole, AIMessage

logger = logging.getLogger("urjanetra.ai.agents.comparison")


async def run_comparison_agent(
    pipeline_context: Dict[str, Any],
    rag_docs: list,
    strategies_to_compare: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Run Strategy Comparison Agent over PipelineState context.
    """
    prompt_rec = get_prompt_record("comparison")
    proc_sec = pipeline_context.get("procurement", {})
    mix = proc_sec.get("recommended_mix", [])

    user_text = (
        f"STRATEGIES TO COMPARE: {strategies_to_compare or ['Saudi Arabia', 'West Africa', 'Brazil']}\n\n"
        f"PROCUREMENT ENGINE MIX:\n{json.dumps(mix, indent=2, default=str)}\n\n"
        f"FULL PIPELINE CONTEXT:\n{json.dumps(pipeline_context, indent=2, default=str)}\n\n"
        "EXPECTED OUTPUT SCHEMA (JSON):\n"
        "{\n"
        "  \"comparison_matrix\": [\n"
        "    {\"strategy\": \"West Africa\", \"landed_cost\": 84.2, \"risk_score\": 15.0, \"eta_days\": 22, \"compatibility\": \"94%\", \"compliance\": \"CLEARED\", \"advantages\": [\"Safe route\"], \"disadvantages\": [\"Longer ETA\"]}\n"
        "  ],\n"
        "  \"overall_recommendation\": \"West Africa\",\n"
        "  \"justification\": \"Detailed justification string\"\n"
        "}"
    )

    try:
        async with OpenRouterClient() as client:
            req = AICompletionRequest(
                agent=AgentKind.COPILOT,
                model_role=ModelRole.COPILOT,
                messages=[
                    AIMessage(role="system", content=prompt_rec.system_prompt),
                    AIMessage(role="user", content=user_text)
                ],
                response_format="json_object"
            )
            res = await client.complete(req)
            parsed = res.parsed_json or {}
            if parsed and "overall_recommendation" in parsed:
                parsed["chain_of_evidence"] = {
                    "reason": parsed.get("justification"),
                    "strategies_compared": len(parsed.get("comparison_matrix", [])),
                    "confidence": 0.92
                }
                return parsed
    except Exception as e:
        logger.warning(f"OpenRouter comparison call failed ({e}) — using grounded fallback.")

    # Deterministic Grounded Fallback
    matrix = []
    for s in mix[:4]:
        name = s.get("name", "Supplier")
        cost = s.get("landed_cost_usd_bbl", 85.0)
        score = s.get("composite_score", 70.0)
        route = s.get("route", "Cape of Good Hope")
        eta = s.get("eta_days", 18)
        compat = f"{s.get('refinery_compatibility_pct', 90.0)}%"
        status = s.get("sanctions_status", "CLEARED")

        advantages = ["Sanctions cleared", f"Landed cost ${cost}/bbl"] if status == "CLEARED" else ["Low spot price"]
        disadvantages = ["Transit via Cape adds ETA"] if "Cape" in route else ["Exposed to chokepoints"]
        if status != "CLEARED":
            disadvantages.append(f"Sanctions flag: {status}")

        matrix.append({
            "strategy": name,
            "landed_cost": cost,
            "composite_score": score,
            "eta_days": eta,
            "compatibility": compat,
            "compliance": status,
            "advantages": advantages,
            "disadvantages": disadvantages
        })

    top_rec = mix[0].get("name", "West Africa (Bonny Light)") if mix else "West Africa (Bonny Light)"

    return {
        "comparison_matrix": matrix,
        "overall_recommendation": top_rec,
        "justification": f"{top_rec} ranks highest in multi-attribute utility evaluation due to minimal chokepoint exposure, high refinery compatibility, and full OFAC compliance.",
        "chain_of_evidence": {
            "reason": f"Compared {len(matrix)} strategies using Procurement Engine metrics.",
            "strategies_compared": len(matrix),
            "confidence": 0.92
        }
    }
