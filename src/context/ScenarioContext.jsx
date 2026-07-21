/**
 * ScenarioContext — Global scenario state.
 * Fully integrated to delegate to PipelineContext for single source of truth.
 */

import React, { createContext, useContext } from 'react';
import { usePipeline } from './PipelineContext.jsx';

const ScenarioContext = createContext(null);

export function ScenarioProvider({ children }) {
  const {
    pipelineState,
    scenarios,
    loading,
    offline,
    activateScenario,
    refreshPipeline,
  } = usePipeline();

  const activeScenarioId = pipelineState?.active_scenario_id ?? pipelineState?.state?.active_scenario;
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || null;

  const value = {
    scenarios,
    activeScenario,
    systemState: pipelineState?.state || null,
    timelineData: pipelineState?.timeline || null,
    demoState: pipelineState?.demo || null,
    backendOnline: !offline,
    loading,
    activateScenario,
    refreshState: refreshPipeline,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider');
  return ctx;
}
