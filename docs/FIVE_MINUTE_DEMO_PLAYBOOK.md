# Aegis / UrjaNetra AI — 5-Minute Hero Demo Playbook
## Strategic Video Recording & Presentation Guide

> **Core Theme**: High-impact demonstration of the **Aegis Autonomous Orchestration Engine**:  
> **MISSION $\longrightarrow$ AI INTENT $\longrightarrow$ TOOL-BACKED ANALYSIS $\longrightarrow$ PLAN V1 $\longrightarrow$ RED TEAM REJECTION $\longrightarrow$ REPLAN $\longrightarrow$ PLAN V2 $\longrightarrow$ POLICY GATE $\longrightarrow$ HUMAN APPROVAL $\longrightarrow$ DECISION $\longrightarrow$ AUDIT**

---

## 1. Pre-Recording Technical Checklist

- [ ] Backend running on `http://127.0.0.1:8000` (`python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`).
- [ ] Frontend running on `http://localhost:5173` (`npm run dev`).
- [ ] Active Scenario verified as **Strait of Hormuz Disruption** (`hormuz_closure`).
- [ ] Test verification verified: `python -m pytest` passes all 80 tests.
- [ ] Audit chain verified: `GET /api/agent/audit/verify` reports `verified: true`.
- [ ] Browser window sized to standard 1080p (1920x1080) or maximized at 100% zoom.
- [ ] Logged in as `arpitjham23@gmail.com` with `System Administrator / LEVEL-5 COSMIC TOP SECRET` clearance.

---

## 2. Timed 5-Minute Screen-by-Screen Script

### Beat 1: The Sovereign Problem (0:00 – 0:25)
- **Screen**: Login $\longrightarrow$ Command Center (`/command-center`).
- **Action**: Hover over the Topbar title and national risk metric badge.
- **Spoken Script**:
  > *"India imports 88% of its crude oil, with over 40% transiting a single maritime chokepoint: the Strait of Hormuz. When a blockade hits, traditional dashboards only visualize the disaster after it happens, while chatbots hallucinate numbers and suggest impossible plans. We built Aegis: a bounded autonomous crisis decision platform for India's national energy resilience."*
- **Technical Takeaway**: Grounded national stakes; explains why dashboards and raw LLMs fail.

---

### Beat 2: Command Center & Deterministic Context (0:25 – 0:50)
- **Screen**: Command Center (`/command-center`).
- **Action**: Point to KPI cards (National Risk: 87/100, Deficit: 2.4M bbl/day, Crude Shock: +$18.5/bbl) and Leaflet maritime map.
- **Spoken Script**:
  > *"Here in the Command Center, we are monitoring an active Strait of Hormuz Disruption. Our deterministic risk engine scores national risk at a critical 87/100. We face an immediate crude shortfall of 2.4M barrels a day and a monthly import bill surge of 2.5 billion dollars. Notice these numbers don't come from an LLM prompt—they are calculated by deterministic Python engines running on the server."*
- **Technical Takeaway**: Demonstrates mathematical source of truth; zero numbers are invented by the AI.

---

### Beat 3: Launching the Aegis Agentic Mission (0:50 – 1:30)
- **Screen**: Top Aegis Autonomous Operations Panel (`AegisAgentPanel.jsx`).
- **Action**: Click preset button: **Primary Demo (Hormuz + SPR + Compliance)**, then click **[ RUN AGENT ]**.
- **Spoken Script**:
  > *"At the top is the Aegis Autonomous Operations Panel. Rather than manually clicking across twenty dashboards, the commander enters a high-level strategic mission: 'Stabilize Indian refinery supply while minimizing SPR depletion and avoiding suppliers with compliance concerns.' When I click Run Agent, Aegis launches a live agentic state machine. Watch the real-time execution trace reconstructed directly from our database."*
- **Technical Takeaway**: Real agentic mission execution; state persisted in SQLite `agent_runs` and `agent_steps`.

---

### Beat 4: Intent Extraction & Strict Tool Execution (1:30 – 2:15)
- **Screen**: Execution Step Trace Reconstructor.
- **Action**: Scroll through steps 1 through 7, expanding Step 1 (Intent) and Step 4 (Procurement Tool).
- **Spoken Script**:
  > *"In Step 1, our LLM interprets the mission intent into mathematical optimization weights—shifting priority to risk and resilience. But the LLM is forbidden from doing math. In Steps 2 through 7, it queries our strict Tool Registry: calling our Risk Engine, calculating the 2.4M barrel deficit, running multi-attribute procurement scoring across global suppliers, and modeling physical cavern discharge rates across Visakhapatnam, Mangaluru, and Padur."*
- **Technical Takeaway**: Strict separation of LLM reasoner from deterministic domain math; schema-validated tools.

---

### Beat 5: Plan V1 & Adversarial Red Team Rejection (2:15 – 2:55)
- **Screen**: Red Team Critique Card & Plan V1 Summary.
- **Action**: Highlight the red **REJECTED** badge on the Red Team card and expand the critique text.
- **Spoken Script**:
  > *"The orchestrator synthesizes Plan V1. But rather than blindly executing it, Aegis subjects the plan to an automated Adversarial Red Team. The Red Team challenges Plan V1 and REJECTS it! Why? Because Plan V1 allocated 100% of crude replacement to West Africa, creating an unacceptable 22-day transit delay during monsoon season, while draining 33M barrels of our emergency reserves. The Red Team emits machine-readable constraints to force a replan."*
- **Technical Takeaway**: Key competitive differentiator: Red Team is an active closed control loop, not a passive warning.

---

### Beat 6: Constraint Revision & Plan V2 Re-Optimization (2:55 – 3:35)
- **Screen**: Plan V1 vs Plan V2 Diff Inspector.
- **Action**: Highlight the diff table showing supplier change and SPR drawdown reduction.
- **Spoken Script**:
  > *"In Step 10, the Replanner injects the Red Team constraints: strictly excluding the Strait of Hormuz and capping SPR release at 12M barrels. It re-runs the optimizers to produce Plan V2. Look at this machine-comparable diff: Plan V2 diversifies purchases across West Africa and Brazil, eliminates dangerous Persian Gulf transit, and reduces emergency reserve drawdown by 21.6M barrels."*
- **Technical Takeaway**: Proves replanning is genuine; machine-readable fields (suppliers, routes, SPR volumes) change.

---

### Beat 7: Server-Side Policy Gate & Level-5 Authorization (3:35 – 4:15)
- **Screen**: Sovereign Policy Gate Banner (`AWAITING_APPROVAL`).
- **Action**: Point to yellow warning banner, show operator clearance dropdown, select `Commander System Admin (LEVEL-5)`, and click **[ AUTHORIZE & EXECUTE ]**.
- **Spoken Script**:
  > *"Execution pauses in state AWAITING_APPROVAL. Our server-side Sovereign Policy Gate enforces bounded autonomy: any reserve release over 5M barrels strictly requires human authorization. If an unauthorized Level-2 operator tries to click approve, the backend rejects it with HTTP 403. As an authorized Commander with Level-5 Cosmic Top Secret clearance, I click Authorize & Execute."*
- **Technical Takeaway**: Proves server-side security boundary; frontend cannot bypass the Policy Gate; enforces clearance RBAC.

---

### Beat 8: Consequential Execution & Cryptographic Audit Chain (4:15 – 4:45)
- **Screen**: Final Decision Card & Audit Badge.
- **Action**: Point to green **COMPLETED** status, Decision ID (e.g. `DEC-3BA540C5`), and SHA-256 Chained Hash.
- **Spoken Script**:
  > *"Instantly, the directive executes! Official Decision record DEC-3BA540C5 is created, and the entire response is anchored into a tamper-evident SHA-256 cryptographic audit chain. If an attacker modifies any historical database row, our verification endpoint instantly flags the broken event. Notice also our Safe Mode: if the LLM API ever goes down, Aegis automatically falls back to deterministic keyword models without crashing."*
- **Technical Takeaway**: Tamper-evident cryptographic provenance; immutable decision tracking; fail-safe resilience.

---

### Beat 9: Wrap-Up & Value Proposition (4:45 – 5:00)
- **Screen**: Full Command Center layout with completed decision banner.
- **Action**: Smooth zoom-out or camera focus on operator.
- **Spoken Script**:
  > *"Aegis proves that agentic AI in sovereign defense must never be an ungrounded chatbot or a runaway autonomous agent. By uniting LLM reasoning, deterministic math, adversarial replanning, and sovereign clearance gates, Aegis safeguards India's energy lifeline. All 80 backend tests pass. Thank you."*
- **Technical Takeaway**: Memorable, authoritative, and professionally confident conclusion.

---

## 3. Demo Safety Net: "What If..." Troubleshooting

| Potential Friction Point | What It Looks Like | Immediate On-Camera Remedy | What to Say |
| :--- | :--- | :--- | :--- |
| **OpenRouter Network Lag** | Step trace takes $> 4$ seconds on Step 1 | Wait calmly; Safe Mode fallback will activate automatically within 5s. | *"Notice our built-in circuit breaker: if external AI networks experience latency, Aegis protects availability."* |
| **Accidentally Logged in as Level-2** | Click Authorize gives red 403 error banner | Open operator dropdown in the banner, select `Commander System Admin (LEVEL-5)`, click Authorize. | *"Here you see our security boundary in action: an unauthorized operator is blocked server-side."* |
| **Selected Wrong Scenario** | Active scenario is not Hormuz | Click Topbar Scenario dropdown $\to$ select `hormuz_closure`. | *"Let's switch our operational theatre to the Strait of Hormuz Disruption."* |
| **Browser Accidental Refresh** | Page reloads during recording | Page reloads with completed state populated from SQLite `agent_runs`. | *"Because all agent state is persisted in our database, reloading the browser preserves the exact execution state."* |
