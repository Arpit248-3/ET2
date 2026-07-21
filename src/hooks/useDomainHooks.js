/**
 * Centralized Domain Hooks Layer for UrjaNetra AI.
 * Exposes reactive React hooks consuming PipelineContext and backend REST/AI APIs.
 */
import { useState, useEffect, useCallback } from 'react';
import { usePipeline } from '../context/PipelineContext.jsx';
import {
  fetchRisk,
  fetchEconomicImpact,
  optimizeProcurement,
  planSPR,
  checkCompliance,
  fetchTimeline,
  generateBrief,
  fetchNotifications,
  fetchAuditLogs,
} from '../services/api.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

/**
 * useRisk — Subscribes to Risk Engine state from PipelineContext or fetches /api/risk.
 */
export function useRisk() {
  const { pipelineState, loading: pipelineLoading, error: pipelineError, refreshPipeline } = usePipeline();
  const riskState = pipelineState?.risk || null;

  return {
    riskState,
    overallScore: riskState?.overall_score ?? 32,
    crisisLevel: riskState?.crisis_level ?? 'NORMAL',
    topContributors: riskState?.top_contributors ?? ['Geopolitical Threat', 'Market Volatility'],
    threatVectors: riskState?.threat_vectors ?? {},
    loading: pipelineLoading,
    error: pipelineError,
    refresh: refreshPipeline,
  };
}

/**
 * useEconomic — Subscribes to Economic Engine state from PipelineContext or fetches /api/economic-impact.
 */
export function useEconomic() {
  const { pipelineState, loading: pipelineLoading, refreshPipeline } = usePipeline();
  const econState = pipelineState?.economic || null;

  return {
    econState,
    importBillUsdBn: econState?.import_bill_usd_bn ?? 142.5,
    inflationImpactPct: econState?.inflation_impact_pct ?? 0.0,
    gdpImpactPct: econState?.gdp_impact_pct ?? 0.0,
    retailFuelInr: econState?.retail_fuel_projection_inr ?? 96.7,
    cadUsdBn: econState?.cad_usd_bn ?? 32.4,
    loading: pipelineLoading,
    refresh: refreshPipeline,
  };
}

/**
 * useProcurement — Subscribes to Procurement Optimizer state.
 */
export function useProcurement() {
  const { pipelineState, loading: pipelineLoading, refreshPipeline } = usePipeline();
  const procState = pipelineState?.procurement || null;

  return {
    procState,
    recommendedMix: procState?.recommended_mix ?? [],
    primarySupplier: procState?.recommended_mix?.[0] ?? null,
    totalVolumeMbbl: procState?.total_volume_mbbl ?? 4.5,
    weightedScore: procState?.weighted_utility_score ?? 78.5,
    loading: pipelineLoading,
    refresh: refreshPipeline,
  };
}

/**
 * useSPR — Subscribes to Strategic Petroleum Reserve state.
 */
export function useSPR() {
  const { pipelineState, loading: pipelineLoading, refreshPipeline } = usePipeline();
  const sprState = pipelineState?.spr || null;

  return {
    sprState,
    coverageDays: sprState?.coverage_days ?? 64,
    dailySupplyGapMbbl: sprState?.daily_supply_gap_mbbl ?? 0.0,
    reserveAfterActionMbbl: sprState?.reserve_after_action_mbbl ?? 25.0,
    totalDrawdownRequiredMbbl: sprState?.total_drawdown_required_mbbl ?? 0.0,
    sites: sprState?.sites ?? [],
    loading: pipelineLoading,
    refresh: refreshPipeline,
  };
}

/**
 * useCompliance — Subscribes to Compliance Shield state.
 */
export function useCompliance() {
  const { pipelineState, loading: pipelineLoading, refreshPipeline } = usePipeline();
  const compState = pipelineState?.compliance || null;

  return {
    compState,
    statusLevel: compState?.status_level ?? 'GREEN',
    allClear: compState?.all_clear ?? true,
    flaggedCount: compState?.flagged_count ?? 0,
    violations: compState?.violations ?? [],
    legalSummary: compState?.legal_summary ?? 'All cleared.',
    loading: pipelineLoading,
    refresh: refreshPipeline,
  };
}

/**
 * useTimeline — Subscribes to Timeline Replay state.
 */
export function useTimeline() {
  const { pipelineState, loading: pipelineLoading, refreshPipeline } = usePipeline();
  const timelineState = pipelineState?.timeline || null;

  return {
    timelineState,
    events: timelineState?.events ?? [],
    currentStep: timelineState?.current_step ?? 0,
    totalSteps: timelineState?.total_steps ?? 1,
    loading: pipelineLoading,
    refresh: refreshPipeline,
  };
}

/**
 * useExecutive — Subscribes to Executive Brief / Decision Board state.
 */
export function useExecutive() {
  const { pipelineState, loading: pipelineLoading, refreshPipeline } = usePipeline();
  const execState = pipelineState?.executive || null;

  return {
    execState,
    summary: execState?.executive_summary ?? '',
    activeMotion: execState?.active_motion ?? null,
    confidence: pipelineState?.overall_confidence ?? 92,
    loading: pipelineLoading,
    refresh: refreshPipeline,
  };
}

/**
 * useNotifications — Subscribes to Notifications feed.
 */
export function useNotifications() {
  const { pipelineState, refreshPipeline } = usePipeline();
  const notifications = pipelineState?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    refresh: refreshPipeline,
  };
}

/**
 * useCopilot — Interacts with POST /api/ai/copilot endpoint.
 */
export function useCopilot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryCopilot = useCallback(async (queryText) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });
      if (!res.ok) throw new Error(`Copilot API error: ${res.statusText}`);
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  return { queryCopilot, loading, error };
}

/**
 * useExplainability — Interacts with POST /api/ai/explainability endpoint.
 */
export function useExplainability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchExplainability = useCallback(async (query = 'Why West Africa?', scenarioId = null) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/explainability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, scenario_id: scenarioId }),
      });
      if (!res.ok) throw new Error(`Explainability API error: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
      return json;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  return { data, loading, fetchExplainability };
}

/**
 * useRedTeam — Interacts with POST /api/ai/redteam endpoint.
 */
export function useRedTeam() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateRedTeam = useCallback(async (recommendation = 'Procure primary crude from West Africa', scenarioId = null) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/redteam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation, scenario_id: scenarioId }),
      });
      if (!res.ok) throw new Error(`RedTeam API error: ${res.statusText}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
      return json;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  return { data, loading, validateRedTeam };
}
