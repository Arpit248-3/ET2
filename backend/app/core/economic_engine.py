"""
Deterministic Economic Impact Engine.

The engine never asks an LLM for numbers. Every estimate comes from scenario
inputs, pipeline state, formulas in this file, and parameters in
data/reference/economic_parameters.json.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.scenario_engine import get_reference, get_scenario


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        if isinstance(value, str):
            cleaned = (
                value.replace("M bbl/day", "")
                .replace("mbpd", "")
                .replace("M", "")
                .replace("%", "")
                .strip()
            )
            return float(cleaned)
        return float(value)
    except (TypeError, ValueError):
        return default


def _risk_color(score: float) -> str:
    if score >= 75:
        return "#ef4444"
    if score >= 50:
        return "#f59e0b"
    if score >= 25:
        return "#1d8cff"
    return "#22c55e"


class EconomicEngine:
    def __init__(self, parameters: Optional[Dict[str, Any]] = None):
        self.params = parameters or get_reference("economic_parameters")

    def calculate(self, scenario: Optional[Dict[str, Any]], demo_step: int = 0, severity_multiplier: float = 1.0) -> Dict[str, Any]:
        inputs = self._build_inputs(scenario, demo_step, severity_multiplier)
        confidence = self.calculate_confidence(inputs)

        crude = self.calculate_crude_shock(inputs)
        import_bill = self.calculate_import_bill_impact(inputs, crude)
        fx = self.calculate_fx_pressure(inputs, import_bill)
        fuel = self.calculate_fuel_pass_through(inputs, import_bill)
        cpi = self.calculate_cpi_impact(inputs, fuel)
        gdp = self.calculate_gdp_drag(inputs, crude, cpi)
        fiscal = self.calculate_fiscal_burden(inputs, import_bill)
        household = self.calculate_household_cost_impact(inputs, fuel, cpi)
        sectors = self.calculate_sector_impact(inputs, fuel, import_bill)
        states = self.calculate_state_impact(inputs, fuel, cpi, sectors)

        headline = {
            "inflation_impact_pp": round(cpi["inflation_impact_pp"], 2),
            "gdp_growth_drag_pp": round(gdp["gdp_growth_drag_pp"], 2),
            "fuel_price_impact_pct": round(fuel["fuel_price_impact_pct"], 2),
            "import_bill_increase_usd_bn": round(import_bill["import_bill_increase_usd_bn"], 2),
            "fiscal_burden_inr_cr": round(fiscal["fiscal_burden_inr_cr"], 0),
            "cad_impact_pct_gdp": round(fx["cad_impact_pct_gdp"], 2),
        }

        total_import_bill_usd_bn = round(import_bill["baseline_monthly_import_bill_usd_bn"] + import_bill["import_bill_increase_usd_bn"], 2)
        result = {
            "headline": headline,
            "cost_of_living": household,
            "sector_impact": sectors,
            "state_impact": states,
            "projection": self.build_30_day_projection(inputs),
            "policy_options": self.generate_policy_options(inputs, headline, fuel, cpi, fiscal, import_bill),
            "uncertainty_band": self.calculate_uncertainty_bands(headline, inputs, confidence),
            "assumptions": self._build_assumptions(inputs, crude, import_bill, fx, fuel, cpi, gdp, fiscal),
            "confidence": confidence,
            "inflation_transmission_chain": cpi["transmission_chain"],
            "scenario_id": inputs["scenario_id"],
            "scenario_name": inputs["scenario_name"],
            "import_bill_usd_bn": total_import_bill_usd_bn,
            "inflation_impact_pct": round(cpi["inflation_impact_pp"], 2),
            "retail_fuel_projection_inr": round(fuel["fuel_price_impact_pct"], 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return result

    def calculate_crude_shock(self, inputs: Dict[str, Any]) -> Dict[str, float]:
        baseline_price = self.params["baseline_crude_price_usd"]
        price_change_pct = _clamp(inputs["crude_price_change_pct"], -50.0, 150.0)
        shock_usd_bbl = baseline_price * price_change_pct / 100.0
        shocked_price_usd = baseline_price + shock_usd_bbl
        return {
            "baseline_price_usd": round(baseline_price, 2),
            "price_change_pct": round(price_change_pct, 2),
            "shock_usd_bbl": round(shock_usd_bbl, 2),
            "shocked_price_usd": round(shocked_price_usd, 2),
        }

    def calculate_import_bill_impact(
        self, inputs: Dict[str, Any], crude_shock: Dict[str, float]
    ) -> Dict[str, float]:
        coeffs = self.params["model_coefficients"]
        baseline_monthly_mbbl = self.params["baseline_monthly_crude_import_mbbl"]
        baseline_price = self.params["baseline_crude_price_usd"]

        insurance_component_pct = inputs["insurance_spike_pct"] * coeffs["insurance_to_landed_cost_pct"]
        delay_component_pct = inputs["shipping_delay_days"] * coeffs["shipping_delay_to_landed_cost_pct_per_day"]
        supplier_component_pct = inputs["supplier_disruption_pct"] * coeffs["supplier_disruption_to_landed_cost_pct"]
        landed_cost_change_pct = max(
            0.0,
            crude_shock["price_change_pct"]
            + insurance_component_pct
            + delay_component_pct
            + supplier_component_pct,
        )

        baseline_bill_usd_bn = baseline_monthly_mbbl * baseline_price / 1000.0
        shocked_bill_usd_bn = baseline_bill_usd_bn * (1 + landed_cost_change_pct / 100.0)
        increase_usd_bn = shocked_bill_usd_bn - baseline_bill_usd_bn

        return {
            "baseline_monthly_import_bill_usd_bn": round(baseline_bill_usd_bn, 2),
            "landed_cost_change_pct": round(landed_cost_change_pct, 2),
            "insurance_component_pct": round(insurance_component_pct, 2),
            "shipping_component_pct": round(delay_component_pct, 2),
            "supplier_component_pct": round(supplier_component_pct, 2),
            "import_bill_increase_usd_bn": round(increase_usd_bn, 3),
        }

    def calculate_fx_pressure(
        self, inputs: Dict[str, Any], import_bill: Dict[str, float]
    ) -> Dict[str, float]:
        gdp_usd_bn = self.params["baseline_nominal_gdp_usd_bn"]
        annualized_import_delta_usd_bn = import_bill["import_bill_increase_usd_bn"] * 12.0
        cad_impact_pct_gdp = annualized_import_delta_usd_bn / gdp_usd_bn * 100.0
        fx_pressure_pct = (
            import_bill["import_bill_increase_usd_bn"]
            * self.params["model_coefficients"]["fx_pressure_per_usd_bn_pct"]
            + (inputs["risk_score"] / 100.0) * 0.25
        )
        return {
            "cad_impact_pct_gdp": round(cad_impact_pct_gdp, 3),
            "cad_after_shock_pct_gdp": round(self.params["baseline_cad_pct_gdp"] + cad_impact_pct_gdp, 3),
            "fx_pressure_pct": round(fx_pressure_pct, 3),
            "baseline_usdinr": self.params["baseline_usdinr"],
            "stressed_usdinr": round(self.params["baseline_usdinr"] * (1 + fx_pressure_pct / 100.0), 2),
        }

    def calculate_fuel_pass_through(
        self, inputs: Dict[str, Any], import_bill: Dict[str, float]
    ) -> Dict[str, float]:
        pass_through_rate = self.params["pass_through_levels"].get(
            inputs["pass_through_level"], self.params["pass_through_levels"]["medium"]
        )
        policy_absorption = _clamp(inputs["policy_absorption"], 0.0, 0.85)
        fuel_price_impact_pct = (
            import_bill["landed_cost_change_pct"] * pass_through_rate * (1 - policy_absorption)
        )
        return {
            "pass_through_rate": round(pass_through_rate, 2),
            "policy_absorption": round(policy_absorption, 2),
            "fuel_price_impact_pct": round(fuel_price_impact_pct, 3),
            "petrol_price_impact_inr_litre": round(
                self.params["baseline_petrol_price_inr_litre"] * fuel_price_impact_pct / 100.0, 2
            ),
            "diesel_price_impact_inr_litre": round(
                self.params["baseline_diesel_price_inr_litre"] * fuel_price_impact_pct / 100.0, 2
            ),
        }

    def calculate_cpi_impact(
        self, inputs: Dict[str, Any], fuel_pass_through: Dict[str, float]
    ) -> Dict[str, Any]:
        weights = self.params["cpi_weights"]
        coeffs = self.params["model_coefficients"]
        elasticities = self.params["sector_elasticities"]
        fuel_pct = fuel_pass_through["fuel_price_impact_pct"]

        fuel_direct_pp = fuel_pct * weights["fuel_light"] / 100.0
        transport_pp = fuel_pct * weights["transport_communication"] * elasticities["transport"] / 100.0
        food_pp = (
            fuel_pct
            * weights["food_indirect"]
            * coeffs["food_indirect_pass_through"]
            * (1 + inputs["supplier_disruption_pct"] / 100.0)
            / 100.0
        )
        manufacturing_pp = (
            fuel_pct
            * weights["manufacturing_indirect"]
            * coeffs["manufacturing_indirect_pass_through"]
            * (1 + inputs["shipping_delay_days"] / 45.0)
            / 100.0
        )
        risk_multiplier = 1 + min(0.12, inputs["risk_score"] / 100.0 * 0.12)
        total_pp = (fuel_direct_pp + transport_pp + food_pp + manufacturing_pp) * risk_multiplier

        components = [
            {
                "stage": "Crude and landed cost shock",
                "impact_pp": round(fuel_direct_pp, 3),
                "driver": "Fuel and light CPI basket exposure",
            },
            {
                "stage": "Transport pass-through",
                "impact_pp": round(transport_pp, 3),
                "driver": "Road freight, passenger mobility, and logistics",
            },
            {
                "stage": "Food distribution spillover",
                "impact_pp": round(food_pp, 3),
                "driver": "Diesel-linked farm logistics and cold chain movement",
            },
            {
                "stage": "Manufacturing input cost spillover",
                "impact_pp": round(manufacturing_pp, 3),
                "driver": "Energy-intensive materials and delivery costs",
            },
        ]

        return {
            "inflation_impact_pp": round(total_pp, 3),
            "cpi_after_shock": round(self.params["baseline_cpi"] * (1 + total_pp / 100.0), 2),
            "components": components,
            "transmission_chain": components,
        }

    def calculate_gdp_drag(
        self,
        inputs: Dict[str, Any],
        crude_shock: Dict[str, float],
        cpi_impact: Dict[str, Any],
    ) -> Dict[str, float]:
        sensitivity = self.params["gdp_sensitivity"]
        oil_price_drag = (
            max(0.0, crude_shock["price_change_pct"]) / 10.0
            * sensitivity["oil_price_10pct_shock_growth_drag"]
        )
        spr_buffer = min(0.35, inputs["spr_coverage_days"] / 120.0)
        supply_gap_drag = (
            inputs["supply_gap_mbpd"]
            * sensitivity["supply_gap_1mbpd_growth_drag"]
            * (1 - spr_buffer)
        )
        confidence_drag = (
            (inputs["risk_score"] / 100.0) ** 2
            * sensitivity["confidence_shock_multiplier"]
            * inputs["impact_progress"]
        )
        inflation_drag = cpi_impact["inflation_impact_pp"] * 0.08
        total_drag = oil_price_drag + supply_gap_drag + confidence_drag + inflation_drag

        return {
            "oil_price_drag_pp": round(oil_price_drag, 3),
            "supply_gap_drag_pp": round(supply_gap_drag, 3),
            "confidence_drag_pp": round(confidence_drag, 3),
            "inflation_drag_pp": round(inflation_drag, 3),
            "gdp_growth_drag_pp": round(total_drag, 3),
            "gdp_growth_after_shock": round(self.params["baseline_gdp_growth"] - total_drag, 3),
        }

    def calculate_fiscal_burden(
        self, inputs: Dict[str, Any], import_bill: Dict[str, float]
    ) -> Dict[str, float]:
        fiscal = self.params["fiscal_parameters"]
        usdinr = self.params["baseline_usdinr"]
        gross_import_cost_cr = import_bill["import_bill_increase_usd_bn"] * usdinr * 100.0
        fiscal_absorption_rate = _clamp(inputs["policy_absorption"], 0.0, 0.85)
        absorbed_cost_cr = gross_import_cost_cr * fiscal_absorption_rate
        spr_bridge_cost_cr = (
            inputs["supply_gap_mbpd"]
            * min(inputs["shipping_delay_days"], 30.0)
            * self.params["baseline_crude_price_usd"]
            * usdinr
            / 10.0
            * fiscal["public_sector_absorption_pct"]
        )
        total = absorbed_cost_cr + spr_bridge_cost_cr
        return {
            "gross_import_cost_inr_cr": round(gross_import_cost_cr, 0),
            "absorbed_cost_inr_cr": round(absorbed_cost_cr, 0),
            "spr_bridge_cost_inr_cr": round(spr_bridge_cost_cr, 0),
            "fiscal_burden_inr_cr": round(total, 0),
            "fiscal_absorption_rate": round(fiscal_absorption_rate, 2),
        }

    def calculate_sector_impact(
        self,
        inputs: Dict[str, Any],
        fuel_pass_through: Dict[str, float],
        import_bill: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        fuel_pct = fuel_pass_through["fuel_price_impact_pct"]
        sectors = []
        for sector, elasticity in self.params["sector_elasticities"].items():
            cost_increase_pct = (
                fuel_pct * elasticity
                + import_bill["landed_cost_change_pct"] * 0.08
                + inputs["insurance_spike_pct"] * 0.015
            )
            score = 100.0 * (
                0.42 * min(1.0, (fuel_pct * elasticity) / 8.0)
                + 0.22 * min(1.0, inputs["supply_gap_mbpd"] / 3.0)
                + 0.22 * (inputs["risk_score"] / 100.0)
                + 0.14 * min(1.0, inputs["shipping_delay_days"] / 21.0)
            )
            sectors.append(
                {
                    "sector": sector.title(),
                    "impact_score": round(score, 0),
                    "impact": round(score, 0),
                    "cost_increase_pct": round(cost_increase_pct, 2),
                    "elasticity": elasticity,
                    "main_driver": self._sector_driver(sector),
                    "fill": _risk_color(score),
                }
            )
        return sorted(sectors, key=lambda item: item["impact_score"], reverse=True)

    def calculate_state_impact(
        self,
        inputs: Dict[str, Any],
        fuel_pass_through: Dict[str, float],
        cpi_impact: Dict[str, Any],
        sector_impact: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        fuel_pct = fuel_pass_through["fuel_price_impact_pct"]
        avg_sector_score = (
            sum(item["impact_score"] for item in sector_impact) / len(sector_impact)
            if sector_impact
            else 0.0
        )
        states = []
        for state in self.params.get("state_exposures", []):
            score = 100.0 * (
                0.3 * state["fuel_dependency"] * min(1.0, fuel_pct / 8.0)
                + 0.22 * state["industry_exposure"] * min(1.0, avg_sector_score / 100.0)
                + 0.18 * state["logistics_dependency"] * min(1.0, inputs["shipping_delay_days"] / 21.0)
                + 0.16 * state["rural_sensitivity"] * min(1.0, cpi_impact["inflation_impact_pp"] / 1.8)
                + 0.14 * min(1.0, inputs["supply_gap_mbpd"] / 3.0)
            )
            exposure = "CRITICAL" if score >= 72 else "HIGH" if score >= 52 else "MEDIUM" if score >= 28 else "LOW"
            states.append(
                {
                    "state": state["state"],
                    "impact_score": round(score, 0),
                    "impact": round(score, 0),
                    "population_mn": state["population_mn"],
                    "population": state["population_mn"],
                    "gdp_exposure": exposure,
                    "main_driver": state["main_driver"],
                    "fuel_dependency": state["fuel_dependency"],
                    "logistics_dependency": state["logistics_dependency"],
                }
            )
        return sorted(states, key=lambda item: item["impact_score"], reverse=True)

    def calculate_household_cost_impact(
        self,
        inputs: Dict[str, Any],
        fuel_pass_through: Dict[str, float],
        cpi_impact: Dict[str, Any],
    ) -> Dict[str, Any]:
        spend = self.params["household_monthly_spend_inr"]
        coeffs = self.params["model_coefficients"]
        fuel_pct = fuel_pass_through["fuel_price_impact_pct"]
        food_pct = fuel_pct * coeffs["food_indirect_pass_through"] * (
            1 + inputs["supplier_disruption_pct"] / 100.0
        )
        goods_pct = fuel_pct * coeffs["manufacturing_indirect_pass_through"] * (
            1 + inputs["shipping_delay_days"] / 45.0
        )

        urban_transport = spend["urban"]["fuel_transport"] * fuel_pct / 100.0 * coeffs["urban_transport_sensitivity"]
        urban_energy = spend["urban"]["electricity_lpg"] * fuel_pct / 100.0
        urban_food = spend["urban"]["food_sensitive"] * food_pct / 100.0
        urban_goods = spend["urban"]["manufactured_goods"] * goods_pct / 100.0

        rural_transport = spend["rural"]["fuel_transport"] * fuel_pct / 100.0
        rural_energy = spend["rural"]["electricity_lpg"] * fuel_pct / 100.0
        rural_food = spend["rural"]["food_sensitive"] * food_pct / 100.0 * coeffs["rural_food_sensitivity"]
        rural_goods = spend["rural"]["manufactured_goods"] * goods_pct / 100.0

        return {
            "urban_monthly_household_impact_inr": round(
                urban_transport + urban_energy + urban_food + urban_goods, 0
            ),
            "rural_monthly_household_impact_inr": round(
                rural_transport + rural_energy + rural_food + rural_goods, 0
            ),
            "main_drivers": [
                {
                    "driver": "Fuel and transport",
                    "urban_impact_inr": round(urban_transport + urban_energy, 0),
                    "rural_impact_inr": round(rural_transport + rural_energy, 0),
                },
                {
                    "driver": "Food distribution",
                    "urban_impact_inr": round(urban_food, 0),
                    "rural_impact_inr": round(rural_food, 0),
                },
                {
                    "driver": "Manufactured goods",
                    "urban_impact_inr": round(urban_goods, 0),
                    "rural_impact_inr": round(rural_goods, 0),
                },
            ],
            "calculation_basis": {
                "fuel_price_impact_pct": round(fuel_pct, 2),
                "food_indirect_price_pct": round(food_pct, 2),
                "manufacturing_indirect_price_pct": round(goods_pct, 2),
            },
        }

    def calculate_uncertainty_bands(
        self, headline: Dict[str, float], inputs: Dict[str, Any], confidence: float
    ) -> Dict[str, Any]:
        width = (
            self.params["model_coefficients"]["uncertainty_base_pct"]
            + inputs["risk_score"] / 100.0 * 0.08
            + (1 - confidence) * 0.12
            + min(0.06, inputs["supply_gap_mbpd"] / 50.0)
        )
        bands = {}
        for key, value in headline.items():
            if key == "fiscal_burden_inr_cr":
                digits = 0
            else:
                digits = 2
            bands[key] = {
                "lower": round(value * (1 - width), digits),
                "base": round(value, digits),
                "upper": round(value * (1 + width), digits),
            }
        bands["method"] = {
            "band_width_pct": round(width * 100.0, 1),
            "drivers": [
                "scenario risk score",
                "supply gap size",
                "data completeness",
                "baseline parameter uncertainty",
            ],
        }
        return bands

    def generate_policy_options(
        self,
        inputs: Dict[str, Any],
        headline: Dict[str, float],
        fuel: Dict[str, float],
        cpi: Dict[str, Any],
        fiscal: Dict[str, float],
        import_bill: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        fuel_relief = fuel["fuel_price_impact_pct"] * 0.22
        cpi_relief = cpi["inflation_impact_pp"] * 0.16
        import_relief = import_bill["import_bill_increase_usd_bn"] * 0.18
        supply_drag_relief = (
            inputs["supply_gap_mbpd"]
            * self.params["gdp_sensitivity"]["supply_gap_1mbpd_growth_drag"]
            * 0.35
        )
        return [
            {
                "option": "Calibrated excise buffer",
                "recommended_when": "fuel pass-through is high and fiscal space is available",
                "estimated_effect": {
                    "fuel_price_relief_pct": round(fuel_relief, 2),
                    "inflation_relief_pp": round(cpi_relief, 2),
                },
                "tradeoff": f"Adds about INR {round(fiscal['fiscal_burden_inr_cr'] * 0.18, 0):,.0f} crore if extended for a month.",
            },
            {
                "option": "Targeted freight and fertilizer support",
                "recommended_when": "food and agriculture pass-through dominate household costs",
                "estimated_effect": {
                    "inflation_relief_pp": round(cpi["inflation_impact_pp"] * 0.12, 2),
                    "rural_household_relief_pct": 12,
                },
                "tradeoff": "Keeps support narrow, but requires beneficiary targeting and weekly leakage checks.",
            },
            {
                "option": "Accelerate alternate crude procurement",
                "recommended_when": "supplier disruption and route insurance premiums are elevated",
                "estimated_effect": {
                    "import_bill_relief_usd_bn": round(import_relief, 2),
                    "cad_relief_pct_gdp": round(headline["cad_impact_pct_gdp"] * 0.18, 2),
                },
                "tradeoff": "May raise freight distance, but reduces disruption and insurance concentration risk.",
            },
            {
                "option": "SPR bridge for critical cargo delays",
                "recommended_when": "supply gap persists while replacement cargo is in transit",
                "estimated_effect": {
                    "gdp_drag_relief_pp": round(supply_drag_relief, 2),
                    "coverage_days_available": round(inputs["spr_coverage_days"], 0),
                },
                "tradeoff": "Protects near-term output while lowering reserve cover, so replenishment timing must be pre-authorized.",
            },
        ]

    def build_30_day_projection(self, inputs: Dict[str, Any]) -> List[Dict[str, Any]]:
        projection = []
        base_price = float(self.params.get("baseline_crude_price_usd", 88.0))
        raw_change_pct = float(inputs.get("raw_crude_price_change_pct", 15.0))
        mult = float(inputs.get("severity_multiplier", 1.0))
        spike_usd = base_price * (raw_change_pct / 100.0) * mult

        for day in range(0, 31):
            if spike_usd > 0:
                if day <= 5:
                    shock_factor = (day / 5.0) * 1.15
                elif day <= 12:
                    shock_factor = 1.15 - (day - 5) * 0.01
                elif day <= 22:
                    shock_factor = 1.08 - (day - 12) * 0.05
                else:
                    shock_factor = max(0.15, 0.58 - (day - 22) * 0.05)
            else:
                shock_factor = 0.0

            cur_crude_usd = round(base_price + spike_usd * shock_factor, 2)
            projected_inputs = dict(inputs)
            projected_inputs["crude_price_change_pct"] = ((cur_crude_usd - base_price) / base_price) * 100.0 if base_price > 0 else 0.0

            crude = self.calculate_crude_shock(projected_inputs)
            crude["shocked_price_usd"] = cur_crude_usd
            import_bill = self.calculate_import_bill_impact(projected_inputs, crude)
            fx = self.calculate_fx_pressure(projected_inputs, import_bill)
            fuel = self.calculate_fuel_pass_through(projected_inputs, import_bill)
            cpi = self.calculate_cpi_impact(projected_inputs, fuel)
            gdp = self.calculate_gdp_drag(projected_inputs, crude, cpi)
            fiscal = self.calculate_fiscal_burden(projected_inputs, import_bill)
            projection.append(
                {
                    "day": day,
                    "crude_price_usd": cur_crude_usd,
                    "inflation_impact_pp": round(cpi["inflation_impact_pp"], 2),
                    "gdp_growth_drag_pp": round(gdp["gdp_growth_drag_pp"], 2),
                    "fuel_price_impact_pct": round(fuel["fuel_price_impact_pct"], 2),
                    "import_bill_increase_usd_bn": round(import_bill["import_bill_increase_usd_bn"], 2),
                    "fiscal_burden_inr_cr": round(fiscal["fiscal_burden_inr_cr"], 0),
                    "cad_impact_pct_gdp": round(fx["cad_impact_pct_gdp"], 2),
                }
            )
        return projection

    def calculate_confidence(self, inputs: Dict[str, Any]) -> float:
        if not inputs["scenario_id"]:
            return 0.92

        confidence = 0.87
        confidence -= len(inputs["missing_fields"]) * 0.03
        confidence -= min(0.05, inputs["risk_score"] / 1000.0)
        confidence -= min(0.04, inputs["shipping_delay_days"] / 750.0)
        confidence -= min(0.03, inputs["supplier_disruption_pct"] / 2000.0)
        return round(_clamp(confidence, 0.62, 0.94), 2)

    def _build_inputs(self, scenario: Optional[Dict[str, Any]], demo_step: int, severity_multiplier: float = 1.0) -> Dict[str, Any]:
        mult = float(max(0.1, severity_multiplier))
        if not scenario:
            return {
                "scenario_id": None,
                "scenario_name": "Baseline monitoring",
                "demo_step": demo_step,
                "impact_progress": 0.0,
                "crude_price_change_pct": 0.0,
                "raw_crude_price_change_pct": 0.0,
                "shipping_delay_days": 0.0,
                "raw_shipping_delay_days": 0.0,
                "insurance_spike_pct": 0.0,
                "raw_insurance_spike_pct": 0.0,
                "supplier_disruption_pct": 0.0,
                "raw_supplier_disruption_pct": 0.0,
                "risk_score": 32.0,
                "supply_gap_mbpd": 0.0,
                "raw_supply_gap_mbpd": 0.0,
                "spr_coverage_days": 64.0,
                "pass_through_level": "low",
                "policy_absorption": self._default_policy_absorption(32.0),
                "missing_fields": [],
                "derived_fields": [],
                "severity_multiplier": mult,
            }

        kpi = scenario.get("kpi", {})
        timeline = scenario.get("timeline", [])
        risk_score = self._current_risk_score(scenario, demo_step) * mult
        impact_progress = self._impact_progress(timeline, demo_step, risk_score)

        derived_fields: List[str] = []
        missing_fields: List[str] = []

        baseline = _safe_float(scenario.get("brent_baseline_usd"), self.params["baseline_crude_price_usd"])
        if "crude_price_change_pct" in scenario:
            raw_crude_pct = _safe_float(scenario.get("crude_price_change_pct"))
        elif "crude_price_spike_usd" in scenario:
            raw_crude_pct = _safe_float(scenario.get("crude_price_spike_usd")) / baseline * 100.0
            derived_fields.append("crude_price_change_pct from crude_price_spike_usd")
        elif "brent_shock_usd" in scenario:
            raw_crude_pct = (_safe_float(scenario.get("brent_shock_usd")) - baseline) / baseline * 100.0
            derived_fields.append("crude_price_change_pct from brent_shock_usd")
        else:
            raw_crude_pct = 10.0
            missing_fields.append("crude_price_change_pct")

        if "shipping_delay_days" in scenario:
            raw_delay_days = _safe_float(scenario.get("shipping_delay_days"))
        elif "maritime_delay_days" in scenario:
            raw_delay_days = _safe_float(scenario.get("maritime_delay_days"))
            derived_fields.append("shipping_delay_days from maritime_delay_days")
        elif "maritime_delay_pct" in scenario:
            raw_delay_days = _safe_float(scenario.get("maritime_delay_pct"))
            derived_fields.append("shipping_delay_days from maritime_delay_pct proxy")
        else:
            raw_delay_days = 4.0
            missing_fields.append("shipping_delay_days")

        if "insurance_spike_pct" in scenario:
            raw_insurance_pct = _safe_float(scenario.get("insurance_spike_pct"))
        elif "insurance_premium_spike_pct" in scenario:
            raw_insurance_pct = _safe_float(scenario.get("insurance_premium_spike_pct"))
            derived_fields.append("insurance_spike_pct from insurance_premium_spike_pct")
        else:
            raw_insurance_pct = 15.0
            missing_fields.append("insurance_spike_pct")

        if "supplier_disruption_pct" in scenario:
            raw_supplier_pct = _safe_float(scenario.get("supplier_disruption_pct"))
        else:
            raw_supplier_pct = 20.0
            missing_fields.append("supplier_disruption_pct")

        raw_supply_gap = _safe_float(scenario.get("india_import_gap_mbbl_day") or kpi.get("supply_gap"), 1.8)

        # Scale all shock parameters by severity_multiplier
        crude_price_change_pct = raw_crude_pct * mult
        shipping_delay_days = raw_delay_days * mult
        insurance_spike_pct = raw_insurance_pct * mult
        supplier_disruption_pct = raw_supplier_pct * mult
        supply_gap_mbpd = raw_supply_gap * mult
        spr_coverage_days = _safe_float(scenario.get("spr_coverage_days"), _safe_float(kpi.get("spr_coverage"), 64.0))

        return {
            "scenario_id": scenario.get("id"),
            "scenario_name": scenario.get("name", "Custom Scenario"),
            "demo_step": demo_step,
            "impact_progress": impact_progress,
            "crude_price_change_pct": crude_price_change_pct,
            "raw_crude_price_change_pct": raw_crude_pct,
            "shipping_delay_days": shipping_delay_days,
            "raw_shipping_delay_days": raw_delay_days,
            "insurance_spike_pct": insurance_spike_pct,
            "raw_insurance_spike_pct": raw_insurance_pct,
            "supplier_disruption_pct": supplier_disruption_pct,
            "raw_supplier_disruption_pct": raw_supplier_pct,
            "risk_score": _clamp(risk_score, 10.0, 100.0),
            "supply_gap_mbpd": supply_gap_mbpd,
            "raw_supply_gap_mbpd": raw_supply_gap,
            "spr_coverage_days": spr_coverage_days,
            "pass_through_level": scenario.get("pass_through_level", "medium"),
            "policy_absorption": self._default_policy_absorption(risk_score),
            "missing_fields": missing_fields,
            "derived_fields": derived_fields,
            "severity_multiplier": mult,
        }

    def _inputs_at_progress(self, inputs: Dict[str, Any], progress: float) -> Dict[str, Any]:
        projected = dict(inputs)
        projected["impact_progress"] = progress
        projected["crude_price_change_pct"] = inputs["raw_crude_price_change_pct"] * progress
        projected["shipping_delay_days"] = inputs["raw_shipping_delay_days"] * progress
        projected["insurance_spike_pct"] = inputs["raw_insurance_spike_pct"] * progress
        projected["supplier_disruption_pct"] = inputs["raw_supplier_disruption_pct"] * progress
        projected["supply_gap_mbpd"] = inputs["raw_supply_gap_mbpd"] * progress
        return projected

    def _build_assumptions(
        self,
        inputs: Dict[str, Any],
        crude: Dict[str, Any],
        import_bill: Dict[str, Any],
        fx: Dict[str, Any],
        fuel: Dict[str, Any],
        cpi: Dict[str, Any],
        gdp: Dict[str, Any],
        fiscal: Dict[str, Any],
    ) -> Dict[str, Any]:
        return {
            "model": "deterministic_scenario_parameter_model_v2",
            "llm_used_for_numbers": False,
            "units": {
                "inflation_impact_pp": "percentage points",
                "gdp_growth_drag_pp": "percentage points",
                "import_bill_increase_usd_bn": "USD billion for current monthly import run-rate",
                "fiscal_burden_inr_cr": "INR crore for current monthly shock window",
                "cad_impact_pct_gdp": "percentage of GDP, annualized if monthly shock persists",
            },
            "inputs": {
                "crude_price_change_pct": round(inputs["crude_price_change_pct"], 2),
                "shipping_delay_days": round(inputs["shipping_delay_days"], 2),
                "insurance_spike_pct": round(inputs["insurance_spike_pct"], 2),
                "supplier_disruption_pct": round(inputs["supplier_disruption_pct"], 2),
                "risk_score": round(inputs["risk_score"], 0),
                "supply_gap_mbpd": round(inputs["supply_gap_mbpd"], 2),
                "spr_coverage_days": round(inputs["spr_coverage_days"], 0),
                "pass_through_level": inputs["pass_through_level"],
                "policy_absorption": round(inputs["policy_absorption"], 2),
                "impact_progress": round(inputs["impact_progress"], 2),
            },
            "reference_parameters": {
                "baseline_crude_price_usd": self.params["baseline_crude_price_usd"],
                "baseline_usdinr": self.params["baseline_usdinr"],
                "baseline_monthly_crude_import_mbbl": self.params["baseline_monthly_crude_import_mbbl"],
                "oil_import_dependency": self.params["oil_import_dependency"],
                "baseline_cpi": self.params["baseline_cpi"],
                "baseline_gdp_growth": self.params["baseline_gdp_growth"],
                "baseline_cad_pct_gdp": self.params["baseline_cad_pct_gdp"],
                "cpi_weights": self.params["cpi_weights"],
                "pass_through_levels": self.params["pass_through_levels"],
                "sector_elasticities": self.params["sector_elasticities"],
                "gdp_sensitivity": self.params["gdp_sensitivity"],
                "fiscal_parameters": self.params["fiscal_parameters"],
            },
            "formula_trace": {
                "crude": crude,
                "import_bill": import_bill,
                "fx_pressure": fx,
                "fuel_pass_through": fuel,
                "cpi_components": cpi["components"],
                "gdp_components": gdp,
                "fiscal_components": fiscal,
            },
            "data_quality": {
                "missing_fields": inputs["missing_fields"],
                "derived_fields": inputs["derived_fields"],
            },
        }

    def _current_risk_score(self, scenario: Dict[str, Any], demo_step: int) -> float:
        timeline = scenario.get("timeline", [])
        if timeline:
            index = int(_clamp(demo_step, 0, len(timeline) - 1))
            return _safe_float(timeline[index].get("risk"), _safe_float(scenario.get("kpi", {}).get("risk_score"), 50.0))
        return _safe_float(scenario.get("kpi", {}).get("risk_score"), _safe_float(scenario.get("geopolitical_risk"), 50.0))

    def _impact_progress(self, timeline: List[Dict[str, Any]], demo_step: int, risk_score: float) -> float:
        min_progress = 0.25 if risk_score > 40 else 0.0
        if not timeline:
            return _clamp(max(min_progress, (risk_score - 32.0) / 60.0), 0.0, 1.0)
        timeline_fraction = (demo_step + 1) / max(len(timeline), 1)
        risk_fraction = _clamp((risk_score - 32.0) / 60.0, 0.0, 1.0)
        return round(_clamp(max(min_progress, timeline_fraction, risk_fraction), 0.0, 1.0), 3)

    def _default_pass_through_level(self, risk_score: float, spr_coverage_days: float) -> str:
        if spr_coverage_days < 15 or risk_score >= 80:
            return "high"
        if risk_score >= 60:
            return "medium"
        return "low"

    def _default_policy_absorption(self, risk_score: float) -> float:
        fiscal = self.params["fiscal_parameters"]
        full_absorption = (
            fiscal["excise_buffer_pct"]
            + fiscal["subsidy_absorption_pct"]
            + fiscal["public_sector_absorption_pct"]
        )
        if risk_score >= 75:
            return round(full_absorption, 2)
        if risk_score >= 60:
            return round(full_absorption * 0.85, 2)
        return round(full_absorption * 0.65, 2)

    def _sector_driver(self, sector: str) -> str:
        drivers = {
            "transport": "retail fuel and freight diesel exposure",
            "aviation": "aviation turbine fuel and insurance exposure",
            "logistics": "line-haul trucking and port delay exposure",
            "fertilizer": "natural gas, feedstock, and farm distribution exposure",
            "manufacturing": "power, petrochemical, and freight input costs",
            "agriculture": "diesel irrigation, fertilizer, and food logistics",
            "construction": "bitumen, cement movement, and diesel equipment",
            "services": "mobility, backup power, and consumption drag",
        }
        return drivers.get(sector, "fuel-linked input cost exposure")


def get_economic_impact(scenario_id: Optional[str], demo_step: int = 0, severity_multiplier: float = 1.0) -> Dict[str, Any]:
    scenario = get_scenario(scenario_id) if scenario_id else None
    return EconomicEngine().calculate(scenario, demo_step, severity_multiplier)


calculate_economic_impact = get_economic_impact


def set_recalc_factor(scenario_id: str) -> None:
    """Backward-compatible no-op. Recalculation is deterministic."""
    return None


def execute(state: Any, context: Any) -> Any:
    """
    Pipeline integration wrapper for EconomicEngine.
    """
    import time
    from app.pipeline.models import (
        EconomicSection, EconomicMetric, StateImpact, SectorImpact,
        ExplanationMetadata, CalculationMetadata, compute_hash
    )

    t_start = time.perf_counter()
    scenario_id = getattr(context, "active_scenario_id", None)
    demo_step = getattr(context, "demo_step", 0)

    raw = get_economic_impact(scenario_id, demo_step)
    headline = raw.get("headline", {})

    explanation = ExplanationMetadata(
        assumptions=[
            "Deterministic economic calculation from scenario parameters.",
            "Inflation transmission chain includes fuel, transport, food, and manufacturing.",
        ],
        formula_used="Deterministic macro impact equations",
        primary_drivers=["Crude Landed Cost", "Shipping Delay", "Pass-Through Level"],
        secondary_drivers=["Policy Absorption", "Exchange Rate Sensitivity"],
        sensitivity_factors={"crude_price": 0.35, "shipping_delay": 0.25},
        limitations=["Assumes fixed baseline demand profile during shock window."],
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0
    inp_hash = compute_hash({"scenario_id": scenario_id, "demo_step": demo_step})
    deterministic_raw = {k: v for k, v in raw.items() if k != "timestamp"}
    out_hash = compute_hash(deterministic_raw)

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state_impacts = [
        StateImpact(
            state=s["state"],
            impact=int(s.get("impact_score", s.get("impact", 0))),
            population=int(s.get("population_mn", s.get("population", 0))),
            gdp_exposure=s.get("gdp_exposure", "LOW"),
        )
        for s in raw.get("state_impact", [])
    ]
    sector_impacts = [
        SectorImpact(
            sector=s["sector"],
            impact=int(s.get("impact_score", s.get("impact", 0))),
            fill=s.get("fill", "#1d8cff"),
        )
        for s in raw.get("sector_impact", [])
    ]

    metrics = {
        "inflation": EconomicMetric(value=headline.get("inflation_impact_pp", 0.0), unit="pp", trend="up", label="Inflation Impact"),
        "gdp": EconomicMetric(value=-headline.get("gdp_growth_drag_pp", 0.0), unit="pp", trend="down", label="GDP Growth Drag"),
        "fuelPrice": EconomicMetric(value=headline.get("fuel_price_impact_pct", 0.0), unit="%", trend="up", label="Fuel Price Impact"),
        "fiscal": EconomicMetric(value=headline.get("fiscal_burden_inr_cr", 0.0), unit="Cr", trend="up", label="Fiscal Burden"),
        "currentAccount": EconomicMetric(value=headline.get("cad_impact_pct_gdp", 0.0), unit="% GDP", trend="down", label="CAD Impact"),
        "tradeDeficit": EconomicMetric(value=headline.get("import_bill_increase_usd_bn", 0.0), unit="USD bn", trend="up", label="Import Bill Impact"),
    }

    conf = raw.get("confidence", 0.9)
    if conf <= 1.0:
        conf = conf * 100.0

    state.economic = EconomicSection(
        metrics=metrics,
        state_impact=state_impacts,
        sector_impact=sector_impacts,
        time_series=raw.get("projection", []),
        scenario_id=scenario_id,
        import_bill_usd_bn=raw.get("import_bill_usd_bn", 12.85),
        inflation_impact_pct=headline.get("inflation_impact_pp", 0.0),
        gdp_impact_pct=headline.get("gdp_growth_drag_pp", 0.0),
        current_account_impact_bn=headline.get("cad_impact_pct_gdp", 0.0),
        retail_fuel_projection_inr=headline.get("fuel_price_impact_pct", 0.0),
        refinery_margin_usd_bbl=8.5,
        confidence=conf,
        warnings=[],
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
        timestamp=getattr(context, "timestamp", ""),
    )
    return state
