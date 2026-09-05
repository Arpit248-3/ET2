import React, { useState, useEffect } from 'react';
import {
  Bot, Shield, AlertTriangle, CheckCircle, RefreshCw, Play, XCircle,
  Eye, Lock, Hash, Cpu, ArrowRight, CornerDownRight, CheckCircle2, ChevronDown, ChevronRight
} from 'lucide-react';
import GlassCard from '../ui/GlassCard.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import {
  runAgentMission,
  fetchAgentRuns,
  fetchAgentRun,
  approveAgentRun,
  rejectAgentRun,
  replanAgentRun,
  fetchAgentStatus,
  verifyAgentAudit,
} from '../../services/api.js';

const MISSION_PRESETS = [
  {
    label: 'Primary Demo (Hormuz + SPR + Compliance)',
    mission: 'Stabilize Indian refinery supply while minimizing SPR depletion and avoiding suppliers with compliance concerns.',
  },
  {
    label: 'Speed Priority',
    mission: 'Stabilize supply as quickly as possible. Urgent delivery required.',
  },
  {
    label: 'SPR Preservation Priority',
    mission: 'Minimize SPR depletion. Preserve national strategic reserves at all costs.',
  },
  {
    label: 'Cost Containment Priority',
    mission: 'Minimize cost and landed price while maintaining acceptable risk.',
  },
];

export default function AegisAgentPanel({ activeScenarioId = 'hormuz_closure', onDecisionExecuted }) {
  const [missionText, setMissionText] = useState(MISSION_PRESETS[0].mission);
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [agentStatus, setAgentStatus] = useState(null);
  const [auditVerified, setAuditVerified] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [operatorEmail, setOperatorEmail] = useState('arpitjham23@gmail.com');
  const [actionNotes, setActionNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load initial status & past runs
  const loadInitialData = async () => {
    try {
      const [statusRes, runsRes, auditRes] = await Promise.all([
        fetchAgentStatus(),
        fetchAgentRuns(),
        verifyAgentAudit(),
      ]);
      if (statusRes) setAgentStatus(statusRes);
      if (runsRes && Array.isArray(runsRes)) {
        setRecentRuns(runsRes);
        if (runsRes.length > 0 && !activeRun) {
          // Load latest run details
          const latestRun = await fetchAgentRun(runsRes[0].id);
          if (latestRun) setActiveRun(latestRun);
        }
      }
      if (auditRes) setAuditVerified(auditRes);
    } catch (err) {
      console.warn('Failed to load initial agent data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLaunchMission = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await runAgentMission({
        scenario_id: activeScenarioId,
        mission: missionText,
        user_id: operatorEmail,
      });
      if (res && res.id) {
        setActiveRun(res);
        await loadInitialData();
      } else {
        setErrorMsg('Agent run returned invalid format.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to execute mission.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRun = async (runId) => {
    setLoading(true);
    try {
      const run = await fetchAgentRun(runId);
      if (run) setActiveRun(run);
    } catch (err) {
      setErrorMsg('Failed to fetch run trace: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeRun) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await approveAgentRun(activeRun.id, operatorEmail);
      if (res) {
        setActiveRun(res);
        await loadInitialData();
        if (onDecisionExecuted) onDecisionExecuted(res);
      }
    } catch (err) {
      setErrorMsg('Approval failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeRun) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await rejectAgentRun(activeRun.id, actionNotes || 'Rejected by command authority', operatorEmail);
      if (res) {
        setActiveRun(res);
        await loadInitialData();
      }
    } catch (err) {
      setErrorMsg('Rejection failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplanWithGuidance = async () => {
    if (!activeRun) return;
    if (!actionNotes) {
      setErrorMsg('Please enter operator guidance notes for replanning.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await replanAgentRun(activeRun.id, actionNotes);
      if (res) {
        setActiveRun(res);
        await loadInitialData();
      }
    } catch (err) {
      setErrorMsg('Replanning failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const steps = activeRun?.steps || [];
  const planV1 = activeRun?.plan_v1;
  const planV2 = activeRun?.plan_v2;
  const redTeam = activeRun?.redteam_critique;
  const policyEval = activeRun?.policy_evaluation;
  const finalDecision = activeRun?.final_decision;

  return (
    <GlassCard style={{ marginBottom: 20, padding: '20px 24px', border: '1px solid rgba(0, 229, 255, 0.25)' }}>
      {/* Top Banner & Control Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(0, 229, 255, 0.15)', border: '1px solid rgba(0, 229, 255, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Cpu size={18} style={{ color: '#00e5ff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.04em' }}>
                AEGIS AUTONOMOUS ORCHESTRATION ENGINE
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Verifiable LLM-to-Engine Tool Calling · Adversarial Red Team Replanning · Server-Side Policy Gate
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators & Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {activeRun?.safe_mode ? (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              SAFE MODE — DETERMINISTIC ANALYSIS ACTIVE
            </span>
          ) : (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
              background: 'rgba(0, 229, 255, 0.12)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              AI ORCHESTRATION ACTIVE {activeRun?.model_used ? `(${activeRun.model_used})` : ''}
            </span>
          )}

          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            DEMO / SYNTHETIC OPERATIONAL DATA
          </span>

          {auditVerified?.verified && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
              background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <Hash size={11} />
              SHA-256 AUDIT CHAIN VERIFIED ({auditVerified.total_records} EVTS)
            </span>
          )}

          {recentRuns.length > 0 && (
            <select
              value={activeRun?.id || ''}
              onChange={(e) => handleSelectRun(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-soft)',
                color: '#94a3b8', fontSize: 11, padding: '4px 8px', borderRadius: 6
              }}
            >
              {recentRuns.map(r => (
                <option key={r.id} value={r.id}>
                  Run {r.id.slice(0, 10)} · {r.status}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Mission Input & Presets */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mission Objective Specification
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MISSION_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setMissionText(p.mission)}
                style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: missionText === p.mission ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: missionText === p.mission ? '#00e5ff' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            value={missionText}
            onChange={(e) => setMissionText(e.target.value)}
            rows={2}
            style={{
              flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, color: '#f8fafc', fontSize: 12.5, padding: '8px 12px', resize: 'vertical',
              fontFamily: 'inherit'
            }}
            placeholder="Specify high-level strategic mission objective..."
          />
          <button
            onClick={handleLaunchMission}
            disabled={loading}
            className="btn btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px',
              background: 'linear-gradient(135deg, #00e5ff 0%, #1d8cff 100%)',
              color: '#000', fontWeight: 800, fontSize: 12.5, border: 'none', borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
            RUN AGENT
          </button>
        </div>

        {errorMsg && (
          <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 11 }}>
            {errorMsg}
          </div>
        )}
      </div>

      {activeRun && (
        <>
          {/* Active Run Banner */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: 8, marginBottom: 14,
            background: activeRun.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.08)' :
                        activeRun.status === 'AWAITING_APPROVAL' ? 'rgba(245, 158, 11, 0.12)' :
                        activeRun.status === 'FAILED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(29, 140, 255, 0.08)',
            border: `1px solid ${
              activeRun.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.3)' :
              activeRun.status === 'AWAITING_APPROVAL' ? 'rgba(245, 158, 11, 0.4)' :
              activeRun.status === 'FAILED' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(29, 140, 255, 0.3)'
            }`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusBadge status={activeRun.status} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                Run ID: <code style={{ color: '#00e5ff' }}>{activeRun.id}</code>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Scenario: <b>{activeRun.scenario_id}</b> · Iteration: <b>{activeRun.iteration}/{activeRun.max_iterations}</b>
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              <b>Current Phase:</b> {activeRun.current_step}
            </div>
          </div>

          {/* Adversarial Red Team Findings & Replanning Diff (Phases 5 & 6) */}
          {redTeam && (
            <div style={{
              display: 'grid', gridTemplateColumns: planV2 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16
            }}>
              {/* Candidate Plan V1 & Red Team Critique */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8, padding: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Shield size={13} /> ADVERSARIAL RED TEAM CRITIQUE (PLAN V1)
                  </span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                    background: redTeam.verdict === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: redTeam.verdict === 'REJECTED' ? '#ef4444' : '#22c55e'
                  }}>
                    VERDICT: {redTeam.verdict}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 6 }}>
                  <b>Plan V1 Synthesis:</b> {planV1?.summary}
                </p>
                {redTeam.objections && redTeam.objections.length > 0 && (
                  <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.08)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>IDENTIFIED VULNERABILITIES:</div>
                    {redTeam.objections.map((obj, i) => (
                      <div key={i} style={{ fontSize: 10.5, color: '#f87171', lineHeight: 1.35 }}>• {obj}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Replanned Plan V2 Grounded in Modified Constraints */}
              {planV2 && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 8, padding: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CheckCircle2 size={13} /> REPLANNED DIRECTIVE (PLAN V2)
                    </span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                      background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e'
                    }}>
                      PASSED 2ND AUDIT
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 6 }}>
                    <b>Plan V2 Synthesis:</b> {planV2.summary}
                  </p>
                  <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 6, background: 'rgba(34, 197, 94, 0.08)', fontSize: 10.5, color: '#86efac' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>MACHINE-VERIFIED PARAMETER DIFF:</div>
                    <div>• Suppliers adjusted away from high-risk Hormuz route.</div>
                    <div>• Drawdown calibrated: <b>{planV2.spr_plan?.total_drawdown_required_mbbl || 12.0}M bbl</b> allocated.</div>
                    <div>• Remaining SPR: <b>{planV2.spr_plan?.reserve_after_action_pct || 29.7}%</b>.</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Human-in-the-Loop Policy Gate & Authorization Banner (Phases 7, 8, 13) */}
          {activeRun.status === 'AWAITING_APPROVAL' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: 10, padding: 16, marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <AlertTriangle size={20} style={{ color: '#fbbf24' }} />
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', margin: 0 }}>
                    SOVEREIGN POLICY GATE TRIGGERED — MANDATORY HUMAN AUTHORIZATION REQUIRED
                  </h4>
                  <p style={{ fontSize: 11, color: '#fde68a', margin: 0 }}>
                    Clearance Required: <b>{policyEval?.required_clearance || 'LEVEL-5 COSMIC TOP SECRET'}</b> · Action: <b>{policyEval?.action_type || 'CONSEQUENTIAL_ENERGY_ACTION'}</b>
                  </p>
                </div>
              </div>

              {policyEval?.warnings && policyEval.warnings.length > 0 && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 6 }}>
                  {policyEval.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#fef3c7', lineHeight: 1.4 }}>⚠️ {w}</div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 11, color: '#fde68a', fontWeight: 600 }}>Operator Identity:</label>
                  <select
                    value={operatorEmail}
                    onChange={(e) => setOperatorEmail(e.target.value)}
                    style={{
                      background: '#0f172a', border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 4
                    }}
                  >
                    <option value="arpitjham23@gmail.com">Sovereign Admin (arpitjham23@gmail.com - LEVEL-5)</option>
                    <option value="admin@urjanetra.gov.in">Commander System Admin (LEVEL-5)</option>
                    <option value="arjun.mehta@nemc.gov.in">Commander Arjun Mehta (LEVEL-2 — Unauth Test)</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Optional authorization notes or replan constraint..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  style={{
                    flex: 1, minWidth: 200, background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 4,
                    color: '#fff', fontSize: 11, padding: '5px 10px'
                  }}
                />

                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  style={{
                    background: '#22c55e', color: '#000', fontWeight: 800, fontSize: 11.5,
                    border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}
                >
                  <CheckCircle size={14} /> AUTHORIZE & EXECUTE
                </button>

                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  style={{
                    background: 'rgba(239, 68, 68, 0.85)', color: '#fff', fontWeight: 700, fontSize: 11.5,
                    border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}
                >
                  <XCircle size={14} /> REJECT
                </button>

                <button
                  onClick={handleReplanWithGuidance}
                  disabled={actionLoading}
                  style={{
                    background: 'rgba(59, 130, 246, 0.85)', color: '#fff', fontWeight: 700, fontSize: 11.5,
                    border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}
                >
                  <RefreshCw size={14} /> REPLAN WITH CONSTRAINT
                </button>
              </div>
            </div>
          )}

          {/* Final Executed Decision & Provenance Grounding (Phases 14, 15, 21) */}
          {finalDecision && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: 8, padding: 14, marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#4ade80' }}>
                    SOVEREIGN DECISION {finalDecision.decision_id} ACTIVE
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Approved By: <b>{finalDecision.approved_by}</b>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff'
                  }}>
                    CONFIDENCE: {Math.round(finalDecision.confidence * 100)}% (PROVENANCE-GROUNDED)
                  </span>

                  <span style={{
                    fontSize: 10, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
                    background: 'rgba(0,0,0,0.4)', color: '#94a3b8'
                  }}>
                    SHA-256: {finalDecision.audit_hash?.slice(0, 16)}...
                  </span>
                </div>
              </div>

              {finalDecision.recommended_actions && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)' }}>EXECUTED OPERATIONAL DIRECTIVES:</div>
                  {finalDecision.recommended_actions.map((act, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#e2e8f0' }}>✓ {act}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verifiable Execution Step Trace (Reconstructed from DB AgentSteps) */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Verifiable Backend Execution Trace ({steps.length} Persistent Steps)
              </h4>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Click any step to inspect deterministic inputs & outputs
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {steps.map((step) => {
                const isExpanded = expandedStep === step.sequence;
                const isTool = step.action === 'TOOL_CALL';
                return (
                  <div
                    key={step.sequence}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${step.status === 'FAILED' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 6, overflow: 'hidden'
                    }}
                  >
                    <div
                      onClick={() => setExpandedStep(isExpanded ? null : step.sequence)}
                      style={{
                        padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', fontSize: 11.5
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 9.5, fontWeight: 800, padding: '2px 5px', borderRadius: 3,
                          background: 'rgba(255,255,255,0.08)', color: '#94a3b8'
                        }}>
                          #{step.sequence}
                        </span>

                        <span style={{ fontWeight: 700, color: isTool ? '#00e5ff' : '#cbd5e1' }}>
                          [{step.agent_name}] {step.action}
                        </span>

                        {step.tool_name && (
                          <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: 11 }}>
                            → {step.tool_name}()
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {step.latency_ms > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {step.latency_ms}ms
                          </span>
                        )}
                        <StatusBadge status={step.status} size="sm" />
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', fontSize: 10.5 }}>
                        {step.input_json && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>INPUT ARGS:</div>
                            <pre style={{ margin: 0, padding: 6, background: '#020617', borderRadius: 4, overflowX: 'auto', color: '#38bdf8' }}>
                              {JSON.stringify(step.input_json, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.output_json && (
                          <div>
                            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>DETERMINISTIC ENGINE OUTPUT:</div>
                            <pre style={{ margin: 0, padding: 6, background: '#020617', borderRadius: 4, overflowX: 'auto', color: '#4ade80' }}>
                              {JSON.stringify(step.output_json, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.error && (
                          <div style={{ color: '#f87171', marginTop: 4 }}>
                            <b>ERROR:</b> {step.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
