/**
 * UrjaNetra AI — API Service Layer
 * Centralised wrapper for all FastAPI backend calls.
 * Implements caching, offline fallbacks, and response adapters.
 */

import {
  adaptPipelineState,
  adaptCommandCenter,
  adaptDemoMode,
  adaptRiskIntelligence,
  adaptEconomicImpact,
  adaptProcurement,
  adaptSPR,
  adaptCompliance,
  adaptRedTeam,
  adaptBrief,
  adaptExecutiveDecision,
  adaptTimeline,
  adaptNotifications,
  adaptAuditLogs,
  adaptPipelineResultState
} from './adapters.js';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

// Helper to get sanitized endpoint name for caching key
function getEndpointName(path) {
  let name = path.split('?')[0];
  name = name.replace(/^\/+|\/+$/g, '');
  name = name.replace(/\//g, '_');
  return name || 'root';
}

// ─── Generic fetch helper with Caching ─────────────────────────────────────
async function apiFetch(path, options = {}) {
  const endpointName = getEndpointName(path);
  const cacheKey = `urjanetra_cache_${endpointName}`;
  const url = `${API_BASE}${path}`;

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API ${res.status}: ${errorBody}`);
    }
    const data = await res.json();

    // Cache successful response
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to cache endpoint ${endpointName}:`, e);
    }

    return data;
  } catch (err) {
    console.warn(`Fetch failed for ${path}, attempting cache retrieval:`, err);
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null) {
        const cachedData = JSON.parse(cached);
        if (cachedData && typeof cachedData === 'object') {
          cachedData.__fromCache = true;
          cachedData.__offline = true;
        }
        return cachedData;
      }
    } catch (e) {
      console.warn(`Cache retrieval failed for ${endpointName}:`, e);
    }
    return null;
  }
}

// ─── Health ────────────────────────────────────────────────────────────────
export const fetchHealth = () => apiFetch('/health');

// ─── Scenarios ─────────────────────────────────────────────────────────────
export const fetchScenarios = () => apiFetch('/scenarios');

export const activateScenario = (scenarioId) =>
  apiFetch(`/scenarios/${scenarioId}/activate`, { method: 'POST' });

// ─── System State (KPIs + Incidents + Risk Signals) ───────────────────────
export const fetchState = async () => {
  const data = await apiFetch('/state');
  return adaptPipelineState(data);
};

// ─── Risk ──────────────────────────────────────────────────────────────────
export const fetchRisk = async () => {
  const data = await apiFetch('/risk');
  return adaptRiskIntelligence(data);
};

// ─── Economic Impact ───────────────────────────────────────────────────────
export const fetchEconomicImpact = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.scenario_id) params.append('scenario_id', options.scenario_id);
  if (options.recalculate) params.append('recalculate', 'true');
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiFetch(`/economic-impact${query}`);
  return adaptEconomicImpact(data);
};

export const fetchEconomicExplanation = (payload = {}) =>
  apiFetch('/ai/economic-explain', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ─── Procurement ───────────────────────────────────────────────────────────
export const optimizeProcurement = async (payload = {}) => {
  const merged = {
    scenario_id: "hormuz_closure",
    objective: "minimize_total_risk",
    include_spr_bridge: true,
    ...payload,
  };
  const data = await apiFetch('/procurement/optimize', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
  return adaptProcurement(data);
};

// ─── SPR ───────────────────────────────────────────────────────────────────
export const planSPR = async (payload = {}) => {
  const merged = {
    scenario_id: "hormuz_closure",
    days_until_cargo_arrival: 9,
    daily_supply_gap_mbbl: 2.4,
    ...payload,
  };
  const data = await apiFetch('/spr/plan', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
  return adaptSPR(data);
};

// ─── Compliance ────────────────────────────────────────────────────────────
export const checkCompliance = async (payload = {}) => {
  const merged = {
    supplier_ids: ["west_africa", "brazil", "saudi_arabia", "uae", "russia", "usa"],
    route_id: "west_africa_india_route",
    scenario_id: "hormuz_closure",
    ...payload,
  };
  const data = await apiFetch('/compliance/check', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
  return adaptCompliance(data);
};

// ─── Red Team ──────────────────────────────────────────────────────────────
export const validateRedTeam = async (payload = {}) => {
  const merged = {
    scenario_id: "hormuz_closure",
    recommendation: "Activate West Africa procurement route with SPR bridge support.",
    confidence: 0.86,
    ...payload,
  };
  const data = await apiFetch('/redteam/validate', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
  return adaptRedTeam(data);
};

// ─── Simulation ────────────────────────────────────────────────────────────
export const runSimulation = async (payload = {}) => {
  const merged = {
    scenario_id: "hormuz_closure",
    duration_days: 30,
    disruption_level: "high",
    ...payload,
  };
  const data = await apiFetch('/simulate', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
  return adaptCommandCenter(data);
};

// ─── Brief ─────────────────────────────────────────────────────────────────
export const generateBrief = async (payload = {}) => {
  const merged = {
    scenario_id: "hormuz_closure",
    classification: "Official / Restricted",
    prepared_for: "Ministry of Petroleum and Natural Gas",
    prepared_by: "UrjaNetra AI Command Engine",
    ...payload,
  };
  const data = await apiFetch('/brief/generate', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
  return adaptBrief(data);
};

// ─── Route Approval ────────────────────────────────────────────────────────
export const approveProcurementRoute = async (payload) => {
  const data = await apiFetch('/procurement/approve-route', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data?.approved_route) {
    try {
      localStorage.setItem('urja_approved_route', JSON.stringify(data.approved_route));
      window.dispatchEvent(new CustomEvent('urja-route-approved', { detail: data.approved_route }));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }
  return data;
};

export const fetchApprovedRoute = async () => {
  try {
    const data = await apiFetch('/procurement/approved-route');
    if (data) {
      localStorage.setItem('urja_approved_route', JSON.stringify(data));
    }
    return data;
  } catch (err) {
    const cached = localStorage.getItem('urja_approved_route');
    return cached ? JSON.parse(cached) : null;
  }
};

// ─── Decisions ─────────────────────────────────────────────────────────────
export const recordDecision = async (payload = {}) => {
  const merged = {
    action_type: "APPROVE_RESPONSE_PLAN",
    approved_by: "Commander Arjun Mehta",
    details: {
      note: "Approved recommended procurement reroute and SPR bridge plan."
    },
    ...payload,
  };
  const data = await apiFetch('/decisions', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
  return adaptExecutiveDecision(data);
};

export const fetchDecisions = async () => {
  const data = await apiFetch('/decisions');
  return adaptExecutiveDecision(data);
};

export const fetchCurrentMotion = async () => {
  const data = await apiFetch('/decision-board/current');
  return adaptExecutiveDecision(data);
};

// ─── Notifications ─────────────────────────────────────────────────────────
export const fetchNotifications = async () => {
  const data = await apiFetch('/notifications');
  return adaptNotifications(data);
};

export const markNotificationsRead = async (id = 'all') => {
  const data = await apiFetch('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  return adaptNotifications(data);
};

export const updateNotificationPreferences = async (preferences) => {
  return apiFetch('/notifications/preferences', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
};


// ─── Timeline ──────────────────────────────────────────────────────────────
export const fetchTimeline = async () => {
  const data = await apiFetch('/timeline');
  return adaptTimeline(data);
};

// ─── Audit Logs ────────────────────────────────────────────────────────────
export const fetchAuditLogs = async (offset = 0, limit = 50) => {
  const data = await apiFetch(`/audit-logs?offset=${offset}&limit=${limit}`);
  return adaptAuditLogs(data);
};

// ─── Settings / Thresholds ─────────────────────────────────────────────────
export const fetchThresholds = () => apiFetch('/settings/thresholds');

export const updateThresholds = (payload) =>
  apiFetch('/settings/thresholds', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

// ─── Demo ──────────────────────────────────────────────────────────────────
export const fetchDemoState = async () => {
  const data = await apiFetch('/demo/status');
  return adaptDemoMode(data);
};

export const advanceDemoStep = async () => {
  const data = await apiFetch('/demo/step', { method: 'POST', body: JSON.stringify({}) });
  return adaptDemoMode(data);
};

export const resetDemo = async () => {
  const data = await apiFetch('/demo/reset', { method: 'POST' });
  return adaptDemoMode(data);
};

export const triggerDemoStep = async (stepIdx) => {
  const data = await apiFetch('/demo/step', { method: 'POST', body: JSON.stringify({ step: stepIdx }) });
  return adaptDemoMode(data);
};

export const fetchSupplyChainTwin = () => apiFetch('/supply-chain-twin');

// ─── Refinery Compatibility ────────────────────────────────────────────────
export const fetchRefineryCompatibility = (crudeType = '') =>
  apiFetch(`/refinery-compatibility${crudeType ? `?crude_type=${encodeURIComponent(crudeType)}` : ''}`);

// ─── AI Copilot ────────────────────────────────────────────────────────────
export const queryCopilot = (payload) =>
  apiFetch('/copilot/query', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ─── Explainable AI ────────────────────────────────────────────────────────
export const fetchExplainability = (decision = 'west_africa') =>
  apiFetch(`/explainability?decision=${encodeURIComponent(decision)}`);

// ─── Reports Library ───────────────────────────────────────────────────────
export const fetchReports = () => apiFetch('/reports');
export const generateReport = () => apiFetch('/reports/generate', { method: 'POST' });

// ─── User Management ───────────────────────────────────────────────────────
export const fetchUsers = () => apiFetch('/users');
export const inviteUser = (payload) =>
  apiFetch('/users/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const updateUser = (id, payload) =>
  apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
export const deleteUser = (id) =>
  apiFetch(`/users/${id}`, {
    method: 'DELETE',
  });

// ─── Data Sources ──────────────────────────────────────────────────────────
export const fetchDataSources = () => apiFetch('/data-sources');
export const refreshDataSource = (payload) =>
  apiFetch('/data-sources/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ─── Collaboration Rooms & Message Feed ───────────────────────────────────
export const fetchCollabRooms = () => apiFetch('/collaboration/rooms');
export const fetchCollabMessages = (roomId) => apiFetch(`/collaboration/messages/${roomId}`);
export const addCollabMessage = (roomId, payload) =>
  apiFetch('/collaboration/messages', {
    method: 'POST',
    body: JSON.stringify({ room_id: roomId, ...payload }),
  });
export const recordCollabApproval = (payload) =>
  apiFetch('/collaboration/approvals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ─── WebSocket URL Helper (dynamic ws:// or wss://) ─────────────────────────
export function getWebSocketUrl(path) {
  const base = import.meta.env.VITE_API_BASE || '';
  if (base) {
    const wsBase = base.replace(/^http/, 'ws').replace('/api', '');
    return `${wsBase}${path}`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  const port = import.meta.env.VITE_WS_PORT || '8000';
  return `${proto}://${host}:${port}${path}`;
}

// ─── User Profile Preferences ──────────────────────────────────────────────
export const fetchProfile = () => apiFetch('/profile');
export const updateProfile = (payload) =>
  apiFetch('/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const updateProfilePreferences = (payload) =>
  apiFetch('/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });


// ─── Help Center ──────────────────────────────────────────────────────────
export const fetchHelpCenter = (query = '') =>
  apiFetch(`/help-center${query ? `?query=${encodeURIComponent(query)}` : ''}`);

export const submitHelpTicket = (payload) =>
  apiFetch('/help/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchAdminTickets = () => apiFetch('/help/admin/tickets');

export const replyAdminTicket = (ticketId, payload) =>
  apiFetch(`/help/admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ─── Crisis Mode ──────────────────────────────────────────────────────────
export const fetchCrisisStatus = () => apiFetch('/crisis/status');

export const activateCrisisMode = (activate) =>
  apiFetch('/crisis/activate', {
    method: 'POST',
    body: JSON.stringify({ activate }),
  });

export const uploadCrisisManifest = async (file, notes = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('notes', notes);
  const url = `${API_BASE}/crisis/upload-manifest`;
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
};

// ─── General System Settings ──────────────────────────────────────────────
export const fetchSettings = () => apiFetch('/settings');
export const updateSettings = (payload) =>
  apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

// ─── Master Intelligence Pipeline ──────────────────────────────────────────
export const fetchPipelineState = async () => {
  const data = await apiFetch('/pipeline/state');
  return adaptPipelineResultState(data);
};

export const runPipeline = async () => {
  const data = await apiFetch('/pipeline/run', { method: 'POST' });
  return adaptPipelineResultState(data);
};

// ─── Custom Scenario Upload ────────────────────────────────────────────────
export const uploadScenario = async (payload = {}) => {
  const defaultPayload = {
    scenario_name: "Custom Gulf Escalation",
    crude_price_change_pct: 18,
    shipping_delay_days: 9,
    insurance_spike_pct: 28,
    supplier_disruption_pct: 35,
    spr_coverage_days: 8,
    route_risk: "critical",
    affected_routes: ["Strait of Hormuz"],
    affected_suppliers: ["Iraq", "Saudi Arabia", "UAE"],
    timeline: []
  };
  const merged = { ...defaultPayload, ...payload };
  return apiFetch('/scenarios/upload', {
    method: 'POST',
    body: JSON.stringify(merged),
  });
};

