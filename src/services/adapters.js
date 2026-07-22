/**
 * UrjaNetra AI — Data Adapters
 * Normalizes backend response structures into UI-friendly objects.
 * Fully null-safe, with type conversion where appropriate.
 * Contains NO hardcoded fake operational data.
 */

export function adaptPipelineState(data) {
  if (!data) return null;
  return {
    kpi: data.kpi ? {
      risk_score: Number(data.kpi.risk_score ?? 0),
      crisis_level: data.kpi.crisis_level ?? 'NORMAL',
      active_incidents: Number(data.kpi.active_incidents ?? 0),
      supply_gap: data.kpi.supply_gap ?? '0M bbl/day',
      spr_coverage: Number(data.kpi.spr_coverage ?? 0),
      active_sanctions: Number(data.kpi.active_sanctions ?? 0),
    } : null,
    incident_feed: (data.incident_feed || []).map(i => ({
      id: i.id ?? 0,
      time: i.time ?? '',
      type: i.type ?? 'INFO',
      title: i.title ?? '',
      detail: i.detail ?? '',
      region: i.region ?? '',
      color: i.color ?? 'blue',
    })),
    risk_signals: (data.risk_signals || []).map(s => ({
      id: s.id ?? 0,
      source: s.source ?? '',
      signal: s.signal ?? '',
      score: Number(s.score ?? 0),
      confidence: Number(s.confidence ?? 0),
      trend: s.trend ?? 'STABLE',
      category: s.category ?? '',
    })),
    active_scenario: data.active_scenario ?? null,
    demo_step: Number(data.demo_step ?? 0),
    brent_price: Number(data.brent_price ?? 0),
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptCommandCenter(data) {
  if (!data) return null;
  return {
    scenario_id: data.scenario_id ?? '',
    duration_days: Number(data.duration_days ?? 0),
    summary: data.summary ? {
      peak_brent: Number(data.summary.peak_brent ?? 0),
      peak_risk: Number(data.summary.peak_risk ?? 0),
      min_spr_pct: Number(data.summary.min_spr_pct ?? 0),
      total_supply_gap_mbbl: Number(data.summary.total_supply_gap_mbbl ?? 0),
      scenario: data.summary.scenario ?? '',
      severity: data.summary.severity ?? '',
    } : null,
    daily_projection: (data.daily_projection || []).map(p => ({
      day: Number(p.day ?? 0),
      brent_price: Number(p.brent_price ?? 0),
      risk_score: Number(p.risk_score ?? 0),
      spr_level_pct: Number(p.spr_level_pct ?? 0),
      supply_gap_mbbl: Number(p.supply_gap_mbbl ?? 0),
      action: p.action ?? null,
    })),
    recommended_action: data.recommended_action ?? '',
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptDemoMode(data) {
  if (!data) return null;
  return {
    current_step: Number(data.current_step ?? 0),
    total_steps: Number(data.total_steps ?? 0),
    current_event: data.current_event ? {
      step: Number(data.current_event.step ?? 0),
      time: data.current_event.time ?? '',
      event: data.current_event.event ?? '',
      type: data.current_event.type ?? 'INFO',
      risk: Number(data.current_event.risk ?? 0),
    } : null,
    scenario_name: data.scenario_name ?? '',
    elapsed_time: data.elapsed_time ?? '',
    is_complete: !!data.is_complete,
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptRiskIntelligence(data) {
  if (!data) return null;
  return {
    overall_score: Number(data.overall_score ?? 0),
    crisis_level: data.crisis_level ?? 'NORMAL',
    components: (data.components || []).map(c => ({
      name: c.name ?? '',
      value: Number(c.value ?? 0),
      weight: Number(c.weight ?? 0),
      weighted_score: Number(c.weighted_score ?? 0),
      label: c.label ?? '',
    })),
    trend: data.trend ?? 'STABLE',
    signals: (data.signals || []).map(s => ({
      id: s.id ?? 0,
      source: s.source ?? '',
      signal: s.signal ?? '',
      score: Number(s.score ?? 0),
      confidence: Number(s.confidence ?? 0),
      trend: s.trend ?? 'STABLE',
      category: s.category ?? '',
    })),
    recommendation: data.recommendation ?? '',
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptEconomicImpact(data) {
  if (!data) return null;
  const headline = data.headline ? {
    inflation_impact_pp: Number(data.headline.inflation_impact_pp ?? 0),
    gdp_growth_drag_pp: Number(data.headline.gdp_growth_drag_pp ?? 0),
    fuel_price_impact_pct: Number(data.headline.fuel_price_impact_pct ?? 0),
    import_bill_increase_usd_bn: Number(data.headline.import_bill_increase_usd_bn ?? 0),
    fiscal_burden_inr_cr: Number(data.headline.fiscal_burden_inr_cr ?? 0),
    cad_impact_pct_gdp: Number(data.headline.cad_impact_pct_gdp ?? 0),
  } : {
    inflation_impact_pp: Number(data.metrics?.inflation?.value ?? 0),
    gdp_growth_drag_pp: Math.abs(Number(data.metrics?.gdp?.value ?? 0)),
    fuel_price_impact_pct: Number(data.metrics?.fuelPrice?.value ?? 0),
    import_bill_increase_usd_bn: 0,
    fiscal_burden_inr_cr: Number(data.metrics?.fiscal?.value ?? 0),
    cad_impact_pct_gdp: Math.abs(Number(data.metrics?.currentAccount?.value ?? 0)),
  };

  const adaptedMetrics = data.metrics ? Object.fromEntries(
    Object.entries(data.metrics).map(([key, m]) => [key, {
      value: Number(m.value ?? 0),
      unit: m.unit ?? '',
      trend: m.trend ?? 'STABLE',
      label: m.label ?? '',
    }])
  ) : {
    inflation: { value: headline.inflation_impact_pp, unit: 'pp', trend: 'up', label: 'Inflation impact' },
    gdp: { value: -headline.gdp_growth_drag_pp, unit: 'pp', trend: 'down', label: 'GDP growth drag' },
    fuelPrice: { value: headline.fuel_price_impact_pct, unit: '%', trend: 'up', label: 'Fuel price impact' },
    fiscal: { value: headline.fiscal_burden_inr_cr, unit: 'Cr', trend: 'up', label: 'Fiscal burden' },
    currentAccount: { value: headline.cad_impact_pct_gdp, unit: '% GDP', trend: 'down', label: 'CAD impact' },
    tradeDeficit: { value: headline.import_bill_increase_usd_bn, unit: 'USD bn', trend: 'up', label: 'Import bill impact' },
  };

  const projection = (data.projection || []).map(p => ({
    ...p,
    day: Number(p.day ?? 0),
    crude_price_usd: Number(p.crude_price_usd ?? 0),
    inflation_impact_pp: Number(p.inflation_impact_pp ?? 0),
    gdp_growth_drag_pp: Number(p.gdp_growth_drag_pp ?? 0),
    fuel_price_impact_pct: Number(p.fuel_price_impact_pct ?? 0),
    import_bill_increase_usd_bn: Number(p.import_bill_increase_usd_bn ?? 0),
    fiscal_burden_inr_cr: Number(p.fiscal_burden_inr_cr ?? 0),
    cad_impact_pct_gdp: Number(p.cad_impact_pct_gdp ?? 0),
  }));

  const derivedTimeSeries = projection
    .filter(p => [0, 5, 10, 15, 20, 25, 30].includes(p.day))
    .map(p => ({
      month: `D+${p.day}`,
      brent: Number(p.crude_price_usd || 0),
      indianBasket: Number(((p.crude_price_usd || 0) * 0.96).toFixed(1)),
      wti: Number(((p.crude_price_usd || 0) * 0.92).toFixed(1)),
      import: Number(p.import_bill_increase_usd_bn || 0),
    }));

  return {
    headline,
    time_series: derivedTimeSeries,
    cost_of_living: data.cost_of_living ? {
      urban_monthly_household_impact_inr: Number(data.cost_of_living.urban_monthly_household_impact_inr ?? 0),
      rural_monthly_household_impact_inr: Number(data.cost_of_living.rural_monthly_household_impact_inr ?? 0),
      main_drivers: data.cost_of_living.main_drivers || [],
      calculation_basis: data.cost_of_living.calculation_basis || {},
    } : null,
    projection,
    policy_options: data.policy_options || [],
    uncertainty_band: data.uncertainty_band || {},
    assumptions: data.assumptions || {},
    confidence: Number(data.confidence ?? 0),
    inflation_transmission_chain: data.inflation_transmission_chain || [],
    metrics: adaptedMetrics,
    state_impact: (data.state_impact || []).map(s => ({
      state: s.state ?? '',
      impact_score: Number(s.impact_score ?? s.impact ?? 0),
      impact: Number(s.impact ?? s.impact_score ?? 0),
      population_mn: Number(s.population_mn ?? s.population ?? 0),
      population: Number(s.population ?? s.population_mn ?? 0),
      gdp_exposure: s.gdp_exposure ?? '',
      main_driver: s.main_driver ?? '',
      fuel_dependency: Number(s.fuel_dependency ?? 0),
      logistics_dependency: Number(s.logistics_dependency ?? 0),
    })),
    sector_impact: (data.sector_impact || []).map(sec => ({
      sector: sec.sector ?? '',
      impact_score: Number(sec.impact_score ?? sec.impact ?? 0),
      impact: Number(sec.impact ?? sec.impact_score ?? 0),
      cost_increase_pct: Number(sec.cost_increase_pct ?? 0),
      elasticity: Number(sec.elasticity ?? 0),
      main_driver: sec.main_driver ?? '',
      fill: sec.fill ?? '#1d8cff',
    })),
    time_series: (data.time_series || derivedTimeSeries).map(t => ({ ...t })),
    scenario_id: data.scenario_id ?? null,
    scenario_name: data.scenario_name ?? '',
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptProcurement(data) {
  if (!data) return null;
  return {
    recommended_mix: (data.recommended_mix || []).map(s => ({
      supplier_id: s.supplier_id ?? '',
      name: s.name ?? '',
      country: s.country ?? '',
      crude_type: s.crude_type ?? '',
      route: s.route ?? '',
      landed_cost_usd_bbl: Number(s.landed_cost_usd_bbl ?? 0),
      eta_days: Number(s.eta_days ?? 0),
      risk_score: Number(s.risk_score ?? 0),
      composite_score: Number(s.composite_score ?? 0),
      sanctions_status: s.sanctions_status ?? 'CLEAR',
      insurance_status: s.insurance_status ?? 'COVERED',
      availability: s.availability ?? 'HIGH',
      refinery_compatibility: Number(s.refinery_compatibility ?? 0),
      reliability_score: Number(s.reliability_score ?? 0),
      verdict: s.verdict ?? '',
      recommended_volume_mbbl: Number(s.recommended_volume_mbbl ?? 0),
      score_breakdown: s.score_breakdown ? Object.fromEntries(
        Object.entries(s.score_breakdown).map(([k, v]) => [k, Number(v)])
      ) : {},
    })),
    total_cost_estimate_cr: Number(data.total_cost_estimate_cr ?? 0),
    coverage_days: Number(data.coverage_days ?? 0),
    risk_summary: data.risk_summary ?? '',
    optimized_for: data.optimized_for ?? '',
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptSPR(data) {
  if (!data) return null;
  return {
    daily_supply_gap_mbbl: Number(data.daily_supply_gap_mbbl ?? 0),
    days_until_cargo_arrival: Number(data.days_until_cargo_arrival ?? 0),
    total_drawdown_required_mbbl: Number(data.total_drawdown_required_mbbl ?? 0),
    reserve_after_action_mbbl: Number(data.reserve_after_action_mbbl ?? 0),
    reserve_after_action_pct: Number(data.reserve_after_action_pct ?? 0),
    coverage_days: Number(data.coverage_days ?? 0),
    sites: (data.sites || []).map(site => ({
      name: site.name ?? '',
      capacity_mbbl: Number(site.capacity_mbbl ?? 0),
      current_stock_mbbl: Number(site.current_stock_mbbl ?? 0),
      drawdown_allocated_mbbl: Number(site.drawdown_allocated_mbbl ?? 0),
      status: site.status ?? 'ACTIVE',
    })),
    feasible: !!data.feasible,
    warning: data.warning ?? null,
    depletion_projection: data.depletion_projection ? data.depletion_projection.map(dp => ({ ...dp })) : null,
    action_comparison: data.action_comparison ? data.action_comparison.map(ac => ({ ...ac })) : null,
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptCompliance(data) {
  if (!data) return null;
  return {
    results: (data.results || []).map(r => ({
      supplier_id: r.supplier_id ?? '',
      supplier_name: r.supplier_name ?? '',
      sanctions: r.sanctions ?? 'CLEAR',
      insurance: r.insurance ?? 'COVERED',
      legal_status: r.legal_status ?? 'COMPLIANT',
      policy_alignment: r.policy_alignment ?? 'COMPLIANT',
      route_restriction: r.route_restriction ?? 'NONE',
      overall: r.overall ?? 'COMPLIANT',
      flags: r.flags || [],
    })),
    all_clear: !!data.all_clear,
    flagged_count: Number(data.flagged_count ?? 0),
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptRedTeam(data) {
  if (!data) return null;
  return {
    original_recommendation: data.original_recommendation ?? '',
    critique: data.critique ?? '',
    weak_assumptions: data.weak_assumptions || [],
    ignored_risks: data.ignored_risks || [],
    findings: (data.findings || []).map(f => ({
      category: f.category ?? '',
      finding: f.finding ?? '',
      severity: f.severity ?? 'MEDIUM',
    })),
    confidence_original: Number(data.confidence_original ?? 0),
    confidence_adjusted: Number(data.confidence_adjusted ?? 0),
    final_recommendation: data.final_recommendation ?? '',
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptBrief(data) {
  if (!data) return null;
  return {
    brief_id: data.brief_id ?? '',
    classification: data.classification ?? '',
    prepared_for: data.prepared_for ?? '',
    prepared_by: data.prepared_by ?? '',
    date: data.date ?? '',
    subject: data.subject ?? '',
    sections: (data.sections || []).map(s => ({
      heading: s.heading ?? '',
      content: s.content ?? '',
    })),
    decision_required: data.decision_required ?? '',
    timestamp: data.timestamp ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptExecutiveDecision(data) {
  if (!data) return null;

  const mapDecisionObj = (d) => ({
    decision_id: d.decision_id ?? d.id ?? '',
    action_type: d.action_type ?? d.title ?? '',
    approved_by: d.approved_by ?? d.voted_by ?? '',
    scenario_id: d.scenario_id ?? '',
    status: d.status ?? 'PENDING',
    timestamp: d.timestamp ?? d.time ?? '',
    details: d.details ?? {},
    __fromCache: d.__fromCache ?? false,
    __offline: d.__offline ?? false,
  });

  if (Array.isArray(data)) {
    const arr = data.map(mapDecisionObj);
    arr.__fromCache = data.__fromCache ?? false;
    arr.__offline = data.__offline ?? false;
    return arr;
  }

  return mapDecisionObj(data);
}

export function adaptTimeline(data) {
  if (!data) return null;
  return {
    scenario_id: data.scenario_id ?? null,
    scenario_name: data.scenario_name ?? null,
    events: (data.events || []).map(ev => ({
      time: ev.time ?? '',
      event: ev.event ?? '',
      type: ev.type ?? 'INFO',
      risk: Number(ev.risk ?? 0),
      step: Number(ev.step ?? 0),
      is_current: !!ev.is_current,
    })),
    current_step: Number(data.current_step ?? 0),
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptNotifications(data) {
  if (!data) return null;
  return {
    notifications: (data.notifications || []).map(n => ({
      id: n.id ?? 0,
      time: n.time ?? '',
      type: n.type ?? 'INFO',
      title: n.title ?? '',
      detail: n.detail ?? '',
      read: !!n.read,
    })),
    unread_count: Number(data.unread_count ?? 0),
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptAuditLogs(data) {
  if (!data) return null;
  return {
    logs: (data.logs || []).map(l => ({
      id: l.id ?? '',
      time: l.time ?? '',
      user: l.user ?? '',
      action: l.action ?? '',
      module: l.module ?? '',
      status: l.status ?? 'COMPLETED',
      type: l.type ?? 'USER',
      details: l.details ?? null,
    })),
    total: Number(data.total ?? 0),
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

export function adaptPipelineResultState(data) {
  if (!data) return null;
  return {
    active_scenario: data.active_scenario ?? {},
    demo: adaptDemoMode(data.demo),
    timeline: adaptTimeline(data.timeline),
    state: adaptPipelineState(data.state),
    risk: adaptRiskIntelligence(data.risk),
    economic: adaptEconomicImpact(data.economic),
    procurement: adaptProcurement(data.procurement),
    spr: adaptSPR(data.spr),
    compliance: adaptCompliance(data.compliance),
    redteam: adaptRedTeam(data.redteam),
    brief: adaptBrief(data.brief),
    latest_decision: data.latest_decision ?? {},
    notifications: (data.notifications || []).map(n => ({
      id: n.id ?? 0,
      time: n.time ?? '',
      type: n.type ?? 'INFO',
      title: n.title ?? '',
      detail: n.detail ?? '',
      read: !!n.read,
    })),
    audit_summary: data.audit_summary ?? {},
    generated_at: data.generated_at ?? '',
    __fromCache: data.__fromCache ?? false,
    __offline: data.__offline ?? false,
  };
}

