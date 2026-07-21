# UrjaNetra AI — Phase 3 Mathematical Calculation Formulas

This document provides the authoritative mathematical equations, dynamic weight formulas, and deterministic models implemented across all 12 backend decision engines in UrjaNetra AI.

---

## 1. Risk Engine Equations

### Dynamic Weight Normalization
$$\text{Weight}_i = \frac{W_i^{\text{category}}}{\sum_{k=1}^{9} W_k^{\text{category}}}$$

where $W_i^{\text{category}}$ scales according to primary threat category:
- **Maritime Disruption**: $\text{Maritime\_Delay} = 0.30$, $\text{Geopolitical\_Threat} = 0.25$, $\text{Insurance} = 0.15$.
- **OPEC Cut**: $\text{OPEC\_Uncertainty} = 0.35$, $\text{Market\_Volatility} = 0.25$.
- **Weather / Cyclone**: $\text{Weather\_Severity} = 0.30$, $\text{Port\_Availability} = 0.30$.
- **Cyberattack**: $\text{Cyber\_Threat} = 0.40$, $\text{Port\_Availability} = 0.20$.
- **Sanctions**: $\text{Geopolitical\_Threat} = 0.35$, $\text{Insurance} = 0.25$.

### Composite Risk Score
$$\text{Overall Risk Score} = \min\left(100, \max\left(0, \sum_{i=1}^{9} \text{Component}_i \times \text{Weight}_i\right)\right)$$

### Engine Confidence Score
$$\text{Confidence}_{\text{Risk}} = \min\left(99.0, \max\left(50.0, 80.0 + (\text{Completeness} \times 15.0) - (\text{Overall Risk} \times 0.05)\right)\right)$$

---

## 2. Economic Engine Equations

### Annual Crude Import Bill (USD Billion)
$$\text{Import Bill} = \frac{4.5 \times 10^6 \text{ bbl/day} \times 365 \text{ days} \times P_{\text{Brent}}}{10^9}$$

### Current Account Deficit Impact (USD Billion)
$$\text{CAD Impact} = \text{Import Bill} - 142.5 \text{ (Baseline CAD)}$$

### Projected CPI Inflation Delta (% CPI)
$$\Delta \text{CPI} = \max(P_{\text{Brent}} - 88.0, 0) \times 0.045\%$$

### Real GDP Loss (%)
$$\text{GDP Impact} = -1.0 \times \left(\text{Shortfall}_{\text{mbbl}} \times 0.15 + \Delta P_{\text{Brent}} \times 0.01\right)$$

### Metro Retail Petrol Benchmark (INR / Liter)
$$\text{Retail Petrol} = 96.7 + \left(\max(P_{\text{Brent}} - 88.0, 0) \times 0.72\right)$$

---

## 3. Procurement Engine Equations

### Multi-Attribute Utility Scoring (0 – 100)
$$\text{Score}_j = \text{Price Utility} \times 0.30 + \text{ETA Utility} \times 0.20 + \text{Risk Utility} \times 0.20 + \text{Reliability} \times 0.15 + \text{Compatibility} \times 0.15$$

where:
- $\text{Price Utility} = \max\left(0, 100 - (P_{\text{landed}} - 70) \times 2.5\right)$
- $\text{ETA Utility} = \max\left(0, 100 - \text{ETA}_{\text{days}} \times 3.5\right)$
- $\text{Risk Utility} = \max\left(0, 100 - (\text{Supplier Risk} \times 0.5 + \text{Route Risk} \times 0.5)\right)$

### Hard Exclusion Rule
$$\text{If } \text{Sanctions\_Active}(\text{Country}_j) \lor \text{Disrupted}(\text{Supplier}_j) \implies \text{Score}_j = 0.0, \text{Verdict} = \text{REJECTED}$$

---

## 4. Refinery Compatibility Engine Equations

### Compatibility Score
$$\text{Score}_r = 100 - \max(0, \text{Sulfur}_{\text{crude}} - \text{Max\_Sulfur}_r) \times 45.0 - \text{Penalty}_{\text{API}}$$

where:
$$\text{Penalty}_{\text{API}} = \begin{cases} 
(\text{Min\_API}_r - \text{API}_{\text{crude}}) \times 3.0 & \text{if } \text{API} < \text{Min\_API} \\
(\text{API}_{\text{crude}} - \text{Max\_API}_r) \times 2.0 & \text{if } \text{API} > \text{Max\_API} \\
0 & \text{otherwise}
\end{cases}$$

---

## 5. SPR Planner Equations

### Total Drawdown Requirement (M bbl)
$$\text{Drawdown}_{\text{Required}} = \text{Daily Supply Gap}_{\text{mbbl}} \times \text{Cargo Transit ETA}_{\text{days}}$$

### Proportional Site Allocation
$$\text{Drawdown}_s = \min\left(\text{Drawdown}_{\text{Required}} \times \frac{\text{Stock}_s}{\sum \text{Stock}}, \text{Stock}_s, \text{Max Discharge}_s \times \text{ETA}\right)$$

---

## 6. Overall Pipeline Confidence Equation

$$\text{Overall Pipeline Confidence} = \frac{1}{N} \sum_{k=1}^{N} \text{Confidence}_k$$

where $N = 7$ primary calculation engines.
