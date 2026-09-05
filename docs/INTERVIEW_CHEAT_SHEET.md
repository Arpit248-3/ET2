# Aegis / UrjaNetra AI — One-Page Interview Cheat Sheet
## Essential Rapid-Recall Reference for Technical Reviews & Interviews

---

### 1. The 30-Second Elevator Pitch
> *"Aegis is a bounded autonomous crisis decision platform for India's sovereign crude oil supply chain. When maritime blockades or price shocks strike, Aegis uses an LLM to interpret the commander's strategic mission into optimization priorities, calls a strict registry of schema-validated tools backed by deterministic Python engines to calculate exact deficits and routes, subjects candidate plans to an automated adversarial Red Team that rejects single-point vulnerabilities and forces replanning, enforces statutory reserve minimums through a server-side Sovereign Policy Gate, halts high-risk actions for Level-5 human authorization, and permanently anchors executed directives in a SHA-256 cryptographically chained audit log."*

---

### 2. Core Architecture & Workflow Loop
$$\text{MISSION} \longrightarrow \text{AI INTENT} \longrightarrow \text{TOOL REGISTRY} \longrightarrow \text{DETERMINISTIC MATH} \longrightarrow \text{PLAN V1} \longrightarrow \text{RED TEAM}$$
$$\longrightarrow \text{REPLAN} \longrightarrow \text{PLAN V2} \longrightarrow \text{POLICY GATE} \longrightarrow \text{HUMAN APPROVAL (LEVEL-5)} \longrightarrow \text{DECISION \& AUDIT}$$

---

### 3. Strict AI vs. Deterministic Engine Boundary
| Subsystem | What AI (LLM) Does | What Deterministic Engines Do |
| :--- | :--- | :--- |
| **Mission Planning** | Parses unstructured natural language mission; derives optimization weights (`price`, `eta`, `risk`, `reliability`, `compatibility`). | Validates that weights sum to `1.0`; calculates quantitative score rankings. |
| **Crisis Context** | Summarizes situational context for human briefings. | Calculates physical composite risk score ($87/100$) using 7-vector weighted sum. |
| **Supply & Procurement** | Interprets strategic priority ('speed' vs 'cost' vs 'resilience'). | Multi-attribute utility equations evaluate landed costs, transit days, and refinery assay blends. |
| **Reserve Planning** | Proposes high-level reserve bridging intent. | Models subterranean cavern discharge limits ($0.5$, $0.4$, $0.3\text{M bbl/day}$) and 45-day depletion curves. |
| **Compliance & Sanctions** | Formulates compliance risk inquiries. | Screens entity IDs against OFAC SDN, UN lists, and the G7 $\$60/\text{bbl}$ price cap. |
| **Validation & Safety** | None. AI cannot audit or approve itself. | **Red Team** challenges single-route reliance; **Policy Gate** enforces $20\%$ statutory cavern floor. |

---

### 4. Key Numbers to Quote Confidently (Strait of Hormuz Scenario)
- **National Import Dependency**: **$87.8\%$** seaborne crude imports ($\sim 4.5\text{M to } 5.0\text{M bbl/day}$).
- **Hormuz Chokepoint Vulnerability**: Over **$40\% \text{ to } 45\%$** of Indian imports transit the Strait of Hormuz.
- **Crisis Composite Risk**: **$87 / 100$ (CRITICAL)** calculated across 7 weighted vectors.
- **Crude Shortfall**: **$2.4\text{M bbl/day}$** physical deficit ($14\text{ days unmitigated} \implies 33.6\text{M bbl}$ cumulative deficit).
- **Crude Price Benchmark Shock**: Brent benchmark increases by **$+\$18.50/\text{bbl}$** ($\$85.00 \to \$103.50/\text{bbl}$).
- **Macroeconomic Damage**: Monthly import bill surge of **$+\$2.49\text{B USD}$**; domestic fiscal burden of **$₹14,500\text{ Cr}$**; headline CPI inflation surge of **$+0.86\%$**.
- **ISPRL Cavern Reserves**: Total capacity **$39.0\text{M bbl}$**; usable baseline stock **$23.6\text{M bbl}$** (Visakhapatnam $8.9\text{M}$, Mangaluru $7.8\text{M}$, Padur $6.9\text{M}$).
- **Plan V1 vs. Plan V2 Delta**: Plan V1 requested $33.6\text{M bbl}$ SPR (exhausting $86\%$ of reserves); Plan V2 caps SPR release at **$12.0\text{M bbl}$** (preserving reserve at **$58.0\%$**) and reroutes crude via **West Africa (60%)** and **Brazil (40%)**.

---

### 5. Critical Mathematical Formulas to Quote
1. **Risk Score**: $\text{Risk} = \sum_{i=1}^{9} (V_i \times W_i)$ *(Hormuz dynamic weights: Delay $0.30$, Threat $0.25$, Insurance $0.15$)*.
2. **Procurement Utility**: $\text{Composite} = \sum (\text{Utility}_k \times W_k)$ where $U_{\text{price}} = \max(0, 100 - (\text{Price} - 70) \times 2.5)$ and $U_{\text{eta}} = \max(0, 100 - \text{ETA} \times 3.5)$.
3. **SPR Allocation**: $\text{Site Draw} = \min(\text{Req} \times \text{Share}_c, \text{Stock}_c, \text{MaxRate}_c \times \text{Transit Days})$.
4. **Inflation Pass-Through**: $\Delta \text{CPI}_{\text{pp}} = \Delta \%_{\text{landed}} \times 0.038 \times \beta_{\text{fuel\_weight}}$.
5. **Audit Chain**: $\text{hash}_n = \text{SHA-256}(\text{hash}_{n-1} + \text{canonical\_json}(\text{payload}_n))$.

---

### 6. Top 10 Tough Interview Questions & Winning Answers

1. **Why not use LangGraph or CrewAI?**  
   *“In sovereign defense, third-party agent frameworks introduce opaque abstractions, dependency bloat, and uncontrolled non-deterministic state mutations. Our custom state machine gives us 100% auditable control over database persistence, step sequences, and server-side policy enforcement.”*
2. **How do you guarantee the AI doesn't hallucinate numbers?**  
   *“Physical separation of concerns. The LLM prompt schema physically forbids numerical generation—it only outputs strategic weights. 100% of domain numbers originate from audited, deterministic Python engines.”*
3. **How do you know Plan V2 is actually different from Plan V1?**  
   *“We compute a machine-comparable diff in `_diff_plans`. In our Hormuz run, `suppliers_changed` is true, routes shift to Cape of Good Hope, and SPR drawdown decreases by exactly 21.6M barrels.”*
4. **Can an operator bypass the Policy Gate via the frontend?**  
   *“No. The frontend is not a security boundary. The Policy Gate runs on the FastAPI backend. Any unauthorized approval request is rejected with HTTP 401/403.”*
5. **What happens if the LLM provider API goes down?**  
   *“Aegis activates Safe Mode. It parses mission intent using deterministic keyword heuristics and executes the domain engines. Safe Mode plans remain 100% bound by the Policy Gate.”*
6. **Why is the audit chain tamper-evident rather than an immutable blockchain?**  
   *“We use SHA-256 hash chaining. If an adversary modifies a historical database row, the computed hash mismatches and `verify_audit_chain()` immediately pinpoints the exact corrupted event ID.”*
7. **What is synthetic vs. real in this project?**  
   *“The mathematical formulas, state machine, policy gate, and audit chain are 100% real and verified by 80 automated tests. The maritime vessel tracks and scenario parameters are scenario-calibrated synthetic data.”*
8. **What clearance is needed to approve an SPR release?**  
   *“`LEVEL-5 COSMIC TOP SECRET`. Attempting approval with a lower clearance like `LEVEL-2 RESTRICTED` throws an HTTP 403 Forbidden error.”*
9. **How does JARVIS / AI Copilot work?**  
   *“JARVIS connects user queries directly to deterministic engines (e.g. `EconomicEngine`, `scenario_engine`), dynamically calculating multi-day stress scenarios rather than guessing answers.”*
10. **What is your test coverage?**  
    *“80 automated backend tests across 21 test files covering determinism, tool contracts, policy violations, Red Team replanning, failure recovery, and a 14-scenario evaluation harness.”*
