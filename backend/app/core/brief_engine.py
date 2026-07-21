"""
Action Brief Generator — produces official-style executive decision briefs.
Fully deterministic based on active scenario.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional
from app.core.scenario_engine import get_scenario

BRIEFS = {
    "hormuz_closure": {
        "subject": "URGENT: Strait of Hormuz Disruption — National Energy Security Response",
        "sections": [
            {
                "heading": "1. SITUATION",
                "content": (
                    "Iranian naval forces have commenced large-scale exercises in the Strait of Hormuz, "
                    "reducing commercial tanker throughput by 18% as of 09:15 IST. The Strait currently "
                    "handles 38% of India's crude oil imports (≈2.4M bbl/day). The risk of full closure "
                    "is assessed at 34% probability within 72 hours. Brent crude has spiked to $96.4/bbl "
                    "from a baseline of $88.0/bbl — an increase of $8.4/bbl."
                ),
            },
            {
                "heading": "2. IMPACT ASSESSMENT",
                "content": (
                    "A 30-day full closure would result in:\n"
                    "• Supply gap: 2.4M bbl/day (≈72M bbl total exposure)\n"
                    "• CPI impact: +1.8% (petrol retail: +₹12.4/litre)\n"
                    "• GDP impact: -0.4% for FY2024-25\n"
                    "• Fiscal cost: ₹28,000 Cr in subsidy burden\n"
                    "• CAD widening: -1.2% of GDP\n"
                    "• Most exposed states: UP (91/100), Maharashtra (85/100), Gujarat (78/100)"
                ),
            },
            {
                "heading": "3. AI RECOMMENDATION",
                "content": (
                    "UrjaNetra AI recommends the following immediate action plan:\n\n"
                    "PRIMARY: West Africa (Nigeria / Bonny Light) via Cape of Good Hope route\n"
                    "• Landed cost: $84.2/bbl | ETA: 22 days | Risk score: 28/100\n"
                    "• Route avoids Hormuz entirely | Compliance: CLEAR | Insurance: VALID\n\n"
                    "SECONDARY: Brazil (Petrobras / Tupi) via Atlantic\n"
                    "• Landed cost: $86.5/bbl | ETA: 26 days | Risk score: 22/100\n\n"
                    "BRIDGE: SPR drawdown of 8.5M bbl from Visakhapatnam and Mangaluru sites\n"
                    "• Covers 22-day cargo gap | Reserve post-drawdown: 54.1%"
                ),
            },
            {
                "heading": "4. IMPLEMENTATION PLAN",
                "content": (
                    "Day 0–2 (Immediate):\n"
                    "• Activate West Africa procurement corridor — issue LOI to NNPC and Bonny Light traders\n"
                    "• Begin SPR drawdown authorisation process (Cabinet notification required)\n"
                    "• Issue maritime advisory to all India-bound VLCCs to reroute via Cape of Good Hope\n\n"
                    "Day 3–7 (Near-term):\n"
                    "• Confirm term contract with Petrobras for secondary supply\n"
                    "• Engage IOCL, BPCL, HPCL to suspend Hormuz-routed orders temporarily\n"
                    "• Activate refinery compatibility review for Bonny Light at Jamnagar\n\n"
                    "Day 8–22 (Bridge Period):\n"
                    "• SPR drawdown at 0.9M bbl/day from operational sites\n"
                    "• Monitor Hormuz situation — reassess weekly\n"
                    "• Maintain 15-day rolling procurement visibility"
                ),
            },
            {
                "heading": "5. RISKS TO PLAN",
                "content": (
                    "• Cyclone season (Arabian Sea): Cape route ETA may extend by 3–5 days\n"
                    "• Nigerian lifting schedule delays: historical Q3 delay risk of 8–12 days\n"
                    "• Freight market hardening: VLCC rates may spike 40% on Cape route surge demand\n"
                    "• USD/INR: If rupee depreciates >2%, landed cost advantage narrows\n"
                    "• SPR post-drawdown level (54.1%) below 60% target — replenishment required within 45 days"
                ),
            },
        ],
        "decision_required": (
            "The Minister of Petroleum is requested to:\n"
            "1. APPROVE emergency SPR drawdown of 8.5M bbl (Cabinet resolution required)\n"
            "2. AUTHORISE West Africa procurement at up to $87/bbl landed cost ceiling\n"
            "3. DIRECT IOCL, BPCL, HPCL to suspend Hormuz-origin orders pending further notice\n"
            "4. NOTE the economic impact parameters for Cabinet communication"
        ),
        "actions": [
            { "priority": "P1", "action": "Approve Strategic Response Plan and emergency SPR drawdown of 8.5M bbl", "owner": "Cabinet", "deadline": "Immediate", "status": "PENDING" },
            { "priority": "P1", "action": "Direct IOCL, BPCL, HPCL to suspend Hormuz-routed orders", "owner": "MoP", "deadline": "24 Hours", "status": "PENDING" },
            { "priority": "P2", "action": "Issue LOI to West Africa suppliers (NNPC/Bonny Light) via Cape route", "owner": "NEMC", "deadline": "48 Hours", "status": "IN PROGRESS" },
            { "priority": "P3", "action": "Activate refinery compatibility review for Bonny Light at Jamnagar", "owner": "IOCL", "deadline": "72 Hours", "status": "DONE" }
        ],
    },
    "opec_cut": {
        "subject": "ALERT: OPEC+ Production Cut of 2M bbl/day — Supply Security Response Required",
        "sections": [
            {"heading": "1. SITUATION", "content": "OPEC+ emergency meeting in Vienna has confirmed a coordinated production cut of 2M bbl/day effective immediately. Saudi Arabia and UAE account for 60% of the cut. India's Middle East import volume is expected to reduce by 35% in the next 60 days. Brent crude is currently at $94.2/bbl."},
            {"heading": "2. IMPACT ASSESSMENT", "content": "• Supply gap: 1.8M bbl/day\n• CPI impact: +1.3%\n• GDP impact: -0.28%\n• Fiscal cost: ₹19,000 Cr\n• CAD widening: -0.9% of GDP"},
            {"heading": "3. AI RECOMMENDATION", "content": "Pivot to Brazil + USA supply mix. Extend SPR drawdown to 60-day plan. Negotiate emergency bilateral with Norway and UK North Sea producers."},
            {"heading": "4. IMPLEMENTATION PLAN", "content": "Week 1: Issue term contract LOI to Petrobras. Begin USA DOE engagement for SPR release coordination.\nWeek 2–4: Reduce Middle East allocation by 35%. Monitor OPEC compliance rates.\nWeek 4–12: Lock in 90-day supply from Atlantic Basin producers."},
            {"heading": "5. RISKS TO PLAN", "content": "• Atlantic Basin spot market will tighten rapidly — act within 10-day window.\n• OPEC historical compliance at 72% — actual cut may be 1.44M bbl/day.\n• USD/INR sensitivity to CAD widening."},
        ],
        "decision_required": "Minister to approve Atlantic Basin procurement mandate and extended SPR drawdown authority.",
        "actions": [
            { "priority": "P1", "action": "Approve Atlantic Basin procurement mandate (Brazil + USA mix)", "owner": "Cabinet", "deadline": "Immediate", "status": "PENDING" },
            { "priority": "P2", "action": "Formulate extended 60-day SPR drawdown plan", "owner": "SPR Agency", "deadline": "24 Hours", "status": "IN PROGRESS" },
            { "priority": "P2", "action": "Negotiate bilateral contracts with Norway/UK North Sea producers", "owner": "NEMC", "deadline": "48 Hours", "status": "PENDING" }
        ],
    },
    "russia_sanctions": {
        "subject": "COMPLIANCE CRITICAL: Russia Sanctions Escalation — Immediate Supply Pivot Required",
        "sections": [
            {"heading": "1. SITUATION", "content": "G7 nations have imposed sweeping new sanctions on Russian oil exports. 14 VLCCs carrying Russian crude are now on the OFAC SDN list. Indian refiners currently source 22% of imports from Russia — immediate compliance action required."},
            {"heading": "2. IMPACT ASSESSMENT", "content": "• Compliance exposure: 22% of import volume at risk\n• Insurance withdrawal: 14 flagged VLCCs cannot obtain P&I coverage\n• Supply gap: 1.1M bbl/day\n• Nayara Energy (Vadinar) crude compatibility at risk — runs on Urals"},
            {"heading": "3. AI RECOMMENDATION", "content": "Phase down Russia crude over 45 days. Pivot to West Africa + Saudi Arabia mix. Run Nayara on Arab Heavy blend. Full OFAC compliance by day 45."},
            {"heading": "4. IMPLEMENTATION PLAN", "content": "Week 1: Halt new Russia crude purchase orders. Secure West Africa contracts.\nWeek 2–3: Begin Urals → Arab Heavy transition at Vadinar.\nWeek 4–6: Complete Russia exposure elimination. File OFAC compliance certification."},
            {"heading": "5. RISKS TO PLAN", "content": "• Shadow fleet exposure — 22 unidentified VLCCs detected in India EEZ.\n• Banking channel disruption during transition.\n• Nayara refinery compatibility transition requires 2-week crude blending period."},
        ],
        "decision_required": "Minister to direct immediate halt of Russia crude procurement and approve 45-day transition plan.",
        "actions": [
            { "priority": "P1", "action": "Direct refiners to halt new purchases of Russian crude", "owner": "MoP", "deadline": "Immediate", "status": "PENDING" },
            { "priority": "P1", "action": "Initiate Urals to Arab Heavy transition at Nayara Vadinar refinery", "owner": "Nayara", "deadline": "48 Hours", "status": "PENDING" },
            { "priority": "P2", "action": "Secure alternative West Africa and Saudi crude term contracts", "owner": "NEMC", "deadline": "72 Hours", "status": "IN PROGRESS" }
        ],
    },
    "port_disruption": {
        "subject": "OPERATIONAL ALERT: Port Disruption — Cyclone & Strike — Supply Continuity Action",
        "sections": [
            {"heading": "1. SITUATION", "content": "Category 4 cyclone has disabled Vadinar and Mundra ports on the Gujarat coast. Paradip port on the eastern coast is under a 48-hour dock worker strike. Combined, these events affect 60% of India's crude import terminal capacity."},
            {"heading": "2. IMPACT ASSESSMENT", "content": "• Port capacity loss: ~1.6M bbl/day receiving capacity offline\n• Supply gap: 0.8M bbl/day\n• Duration estimate: 10–15 days\n• Fiscal cost: ₹5,800 Cr"},
            {"heading": "3. AI RECOMMENDATION", "content": "Reroute all VLCCs to Vizag, Ennore, and Kochi. Activate SPR Padur site for western India supply. Resolve Paradip labour dispute via arbitration."},
            {"heading": "4. IMPLEMENTATION PLAN", "content": "Day 0–1: Issue VTMS advisory to reroute inbound VLCCs.\nDay 1–3: Activate SPR Padur emergency drawdown.\nDay 3–5: Labour arbitration at Paradip. Restore eastern port operations.\nDay 10–15: Vadinar structural assessment — phased reopening."},
            {"heading": "5. RISKS TO PLAN", "content": "• Vizag berth capacity may be exceeded — pre-book additional anchorage.\n• Cyclone track uncertainty ±120km — Kochi may be affected.\n• Inland pipeline bottleneck from eastern ports to western grid."},
        ],
        "decision_required": "Minister to approve emergency SPR Padur drawdown and direct labour ministry to intervene in Paradip strike.",
        "actions": [
            { "priority": "P1", "action": "Reroute incoming VLCC tankers to Vizag, Ennore, and Kochi ports", "owner": "Port Trust", "deadline": "Immediate", "status": "PENDING" },
            { "priority": "P1", "action": "Activate SPR Padur emergency drawdown", "owner": "Cabinet", "deadline": "12 Hours", "status": "PENDING" },
            { "priority": "P2", "action": "Initiate labour arbitration for Paradip dock workers strike resolution", "owner": "Labour Ministry", "deadline": "24 Hours", "status": "IN PROGRESS" }
        ],
    },
}

DEFAULT_BRIEF = {
    "subject": "UrjaNetra AI — No Active Scenario",
    "sections": [
        {"heading": "1. SITUATION", "content": "No active crisis scenario. System is in monitoring mode. All supply chains operating within normal parameters."},
        {"heading": "2. RECOMMENDATION", "content": "Continue standard monitoring. Maintain SPR above 60%. No immediate action required."},
    ],
    "decision_required": "No decision required at this time.",
    "actions": [
        { "priority": "P3", "action": "Continue standard monitoring and maintain reserve buffers", "owner": "NEMC", "deadline": "Ongoing", "status": "DONE" }
    ],
}


def generate_brief(scenario_id: Optional[str], classification: str, prepared_for: str) -> Dict:
    brief_data = BRIEFS.get(scenario_id, DEFAULT_BRIEF)

    scenario = get_scenario(scenario_id) if scenario_id else None
    scenario_name = scenario["name"] if scenario else "No Active Scenario"

    brief_id = f"BRIEF-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    return {
        "brief_id": brief_id,
        "classification": classification,
        "prepared_for": prepared_for,
        "prepared_by": "UrjaNetra AI System / NEMC Secretariat",
        "date": datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC"),
        "subject": brief_data["subject"],
        "sections": brief_data["sections"],
        "decision_required": brief_data.get("decision_required", "No decision required."),
        "actions": brief_data.get("actions", []),
    }

