# UrjaNetra AI — Judge Walkthrough & Evaluation Guide

Welcome to UrjaNetra AI (meaning *Energy Eye*), a high-fidelity **National Energy Resilience Command Platform** designed to manage energy supply chains during extreme geopolitical crises. 

This guide helps hackathon judges evaluate the completeness, technical depth, and design aesthetics of the implementation.

---

## 🚀 Key Evaluation Points

### 1. Unified Master Intelligence Pipeline
- **FastAPI Core**: Unlike typical frontends with mock files, UrjaNetra AI has a **FastAPI backend** running on port `8000`.
- **9-Step Core Engine Cascade**: In backend directory `backend/app/core/`, inspect the Python implementations of:
  * `scenario_engine.py` (Active crisis vectors)
  * `risk_engine.py` (Insurance premium spikes, route risk)
  * `economic_engine.py` (GDP drag, inflation impact)
  * `procurement_optimizer.py` (Risk-minimizing contract reallocations)
  * `spr_planner.py` (Depletion simulations, drawdown scheduling)
  * `compliance_shield.py` (G7 price cap checks, insurance flag lists)
  * `red_team_validator.py` (Adversarial stress-testing)
  * `brief_generator.py` (AI briefing synthesis)

### 2. Geopolitical Input & Upload Ingestion
- **Custom Crisis Feed Modal**: On the **Command Center** or **Demo Mode** pages, click **Upload Crisis Feed**.
- **JSON Validation & Pipeline Execution**: Paste custom scenario configurations (e.g., custom price increases, shipping delays). The backend validates this structure, runs the full cascade of engines, and re-renders the dashboard instantly with the computed state.

### 3. Premium Aesthetics & Hardened Responsiveness
- **Google Stitch Dark Theme**: Uses custom glassmorphism, vibrant blue/amber/red warning indicators, and smooth transition animations.
- **Fluid Layout Hardening**: Resizing the window triggers responsive layout rules:
  * **Sidebar**: Automatically collapses to minimized icon-only mode below `1024px` to keep workspace focus.
  * **Grid layouts**: KPI metrics adapt dynamically to screen size.
  * **Two-column grids**: Map/lists stack vertically below `1100px`.
  * **Tables**: Scroll horizontally rather than breaking layout.

---

## 🛠️ Quick Start for Local Testing

1. **Verify Backend Status**:
   The FastAPI server is pre-configured and runs locally on `http://127.0.0.1:8000`. The SQLite database file `urjanetra.db` is initiated in the backend directory.
   
2. **Verify Frontend Status**:
   The Vite React dev server is running on `http://localhost:5173`. Open this URL in Chrome or Edge to view the UI.

---

## 🧭 Step-by-Step Judge Inspection Path

1. **Command Center (`/command-center`)**:
   - Verify the interactive **India Energy Risk Map** displaying regional refineries, ports, and pipelines.
   - Click **Upload Crisis Feed** -> Paste the sample JSON -> Click **Upload & Recalculate** -> Watch the National Risk Score spike to **86** and the Map highlight risk zones.
2. **Demo Mode (`/demo-mode`)**:
   - Check the custom timeline playback. Click **Next Step** to cycle step-by-step through the crisis evolution.
3. **Operational Dashboards**:
   - Visit **Economic Impact** to review the financial metrics.
   - Visit **Procurement Optimizer** and click **Optimize** to see the system recalculate supplier paths.
   - Visit **SPR Planner** to review drawdown graphs.
4. **Governance & Records**:
   - Go to the **Executive Decision Board** (`/executive-decision-board`), click **Approve Option**, then **Record Official Decision**.
   - Go to **Audit Logs** (`/audit-logs`) to see your recorded votes and actions committed to the database.
