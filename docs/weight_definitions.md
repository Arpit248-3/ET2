# UrjaNetra AI — Phase 3 Dynamic Weight Definitions & Matrices

This document specifies the exact dynamic weighting matrices applied per scenario category in UrjaNetra AI.

---

## Risk Component Weights Matrix

| Scenario Category | Geopolitical | Maritime Delay | Insurance | Port Avail. | Weather | Cyber Threat | Volatility | OPEC Uncert. | Inventory |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BASELINE (Nominal)** | 0.20 | 0.15 | 0.10 | 0.10 | 0.05 | 0.05 | 0.15 | 0.10 | 0.10 |
| **MARITIME_DISRUPTION** | 0.25 | **0.30** | 0.15 | 0.10 | 0.05 | 0.05 | 0.05 | 0.05 | 0.00 |
| **OPEC_CUT** | 0.15 | 0.05 | 0.00 | 0.00 | 0.05 | 0.00 | 0.25 | **0.35** | 0.15 |
| **WEATHER_EXTREME** | 0.05 | 0.20 | 0.00 | **0.30** | **0.30** | 0.05 | 0.05 | 0.05 | 0.00 |
| **CYBER_ATTACK** | 0.15 | 0.05 | 0.00 | 0.20 | 0.05 | **0.40** | 0.15 | 0.00 | 0.00 |
| **SANCTIONS** | **0.35** | 0.10 | **0.25** | 0.00 | 0.00 | 0.00 | 0.20 | 0.00 | 0.10 |

---

## Procurement Multi-Attribute Utility Weights

| Utility Metric | Weight | Description |
| :--- | :---: | :--- |
| **Price Utility** | 0.30 | Landed cost USD/bbl relative to $70/bbl floor |
| **ETA Utility** | 0.20 | Transit time penalty (3.5 pts/day) |
| **Risk Utility** | 0.20 | Combined route risk & supplier country risk |
| **Reliability Score** | 0.15 | Supplier historical delivery fulfillment index |
| **Refinery Compatibility** | 0.15 | Crude API gravity & sulfur assay match score |

---

## Confidence Calculation Parameters

| Engine | Primary Input Parameters | Penalty / Variance Factor |
| :--- | :--- | :--- |
| **Risk Engine** | Scenario completeness, overall risk score | $-0.05$ per risk point above nominal |
| **Economic Engine** | Risk score, CPI inflation delta | $-0.10$ per risk point, $-2.0\%$ per CPI point |
| **Procurement Engine** | Risk score, blocked supplier count | $-0.10$ per risk point, $-5.0\%$ per blocked supplier |
| **Compatibility Engine** | Refinery assay sulfur difference | Fixed $94.0\%$ base confidence |
| **SPR Engine** | Reserve after action percentage | Fixed $96.0\%$ base confidence |
| **Compliance Engine** | All clear flag status | $98.0\%$ if clear, $88.0\%$ if sanctions active |
