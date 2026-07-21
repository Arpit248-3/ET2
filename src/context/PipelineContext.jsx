/**
 * PipelineContext — Unified intelligence state management for UrjaNetra AI.
 * Handles sequence execution, scenario uploading, and demo control.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  fetchScenarios,
  fetchPipelineState,
  fetchNotifications,
  runPipeline as apiRunPipeline,
  uploadScenario as apiUploadScenario,
  advanceDemoStep,
  resetDemo as apiResetDemo,
  activateScenario as apiActivateScenario,
} from '../services/api.js';

const PipelineContext = createContext(null);

export function PipelineProvider({ children }) {
  const [pipelineState, setPipelineState] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  // ── Load scenarios on mount ──────────────────────────────────────────────
  const loadScenarios = useCallback(async () => {
    try {
      const data = await fetchScenarios();
      if (data) {
        setScenarios(data);
      }
    } catch (err) {
      console.warn('Failed to load scenarios list:', err);
    }
  }, []);

  // ── Refresh pipeline state (GET /api/pipeline/state) ─────────────────────
  const refreshPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPipelineState();
      let notifs = null;
      try {
        notifs = await fetchNotifications();
      } catch (e) {
        console.warn('Could not fetch notifications in pipeline context:', e);
      }
      if (data) {
        setPipelineState({
          ...data,
          notifications: notifs?.notifications || [],
          notifications_unread_count: notifs?.unread_count ?? 0,
        });
        setOffline(!!data.__offline);
      } else {
        const cached = localStorage.getItem('urjanetra_cache_pipeline_state');
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.__fromCache = true;
          parsed.__offline = true;
          setPipelineState(parsed);
          setOffline(true);
        } else {
          setPipelineState(null);
          setOffline(true);
        }
      }
    } catch (err) {
      console.warn('Error refreshing pipeline state, reading local cache:', err);
      setOffline(true);
      const cached = localStorage.getItem('urjanetra_cache_pipeline_state');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          parsed.__fromCache = true;
          parsed.__offline = true;
          setPipelineState(parsed);
        } catch {
          setPipelineState(null);
        }
      } else {
        setPipelineState(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Run pipeline sequence (POST /api/pipeline/run) ───────────────────────
  const runPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRunPipeline();
      if (data) {
        setPipelineState(data);
        setOffline(!!data.__offline);
      }
    } catch (err) {
      console.error('Error running pipeline:', err);
      setError(err.message || 'Failed to run pipeline');
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Upload new scenario JSON (POST /api/scenarios/upload) ─────────────────
  const uploadScenario = useCallback(async (fileOrJson) => {
    setLoading(true);
    setError(null);
    try {
      let payload;
      if (fileOrJson instanceof File) {
        const text = await fileOrJson.text();
        payload = JSON.parse(text);
      } else if (typeof fileOrJson === 'string') {
        payload = JSON.parse(fileOrJson);
      } else {
        payload = fileOrJson;
      }

      const result = await apiUploadScenario(payload);
      
      // Reload scenarios list and run master pipeline immediately
      await loadScenarios();
      await runPipeline();
      return result;
    } catch (err) {
      console.error('Error uploading scenario:', err);
      setError(err.message || 'Failed to upload scenario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadScenarios, runPipeline]);

  // ── Next Demo Step (POST /api/demo/next) ─────────────────────────────────
  const nextDemoStep = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await advanceDemoStep();
      await refreshPipeline();
      return result;
    } catch (err) {
      console.error('Error advancing demo step:', err);
      setError(err.message || 'Failed to advance demo step');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPipeline]);

  // ── Reset Demo (POST /api/demo/reset) ────────────────────────────────────
  const resetDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiResetDemo();
      await refreshPipeline();
      return result;
    } catch (err) {
      console.error('Error resetting demo:', err);
      setError(err.message || 'Failed to reset demo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPipeline]);

  // ── Activate Scenario (POST /api/scenarios/{id}/activate) ────────────────
  const activateScenario = useCallback(async (scenarioId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiActivateScenario(scenarioId);
      await runPipeline();
      return result;
    } catch (err) {
      console.error('Error activating scenario:', err);
      setError(err.message || 'Failed to activate scenario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [runPipeline]);

  // ── Boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const boot = async () => {
      await loadScenarios();
      await refreshPipeline();
    };
    boot();
  }, [loadScenarios, refreshPipeline]);

  // ── Polling every 30 seconds ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPipeline();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refreshPipeline]);

  const value = {
    pipelineState,
    scenarios,
    loading,
    error,
    offline,
    refreshPipeline,
    runPipeline,
    uploadScenario,
    nextDemoStep,
    resetDemo,
    activateScenario,
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return ctx;
}
