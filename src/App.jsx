import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ScenarioProvider } from './context/ScenarioContext.jsx';
import { PipelineProvider } from './context/PipelineContext.jsx';
import CommandCenter from './pages/dashboard/CommandCenter.jsx';
import RiskIntelligence from './pages/dashboard/RiskIntelligence.jsx';
import SupplyChainTwin from './pages/dashboard/SupplyChainTwin.jsx';
import ScenarioSimulator from './pages/dashboard/ScenarioSimulator.jsx';
import EconomicImpact from './pages/dashboard/EconomicImpact.jsx';
import ProcurementOptimizer from './pages/dashboard/ProcurementOptimizer.jsx';
import RefineryCompatibility from './pages/dashboard/RefineryCompatibility.jsx';
import SPRPlanner from './pages/dashboard/SPRPlanner.jsx';
import ComplianceShield from './pages/dashboard/ComplianceShield.jsx';
import RedTeamValidator from './pages/dashboard/RedTeamValidator.jsx';
import ActionBrief from './pages/dashboard/ActionBrief.jsx';
import AICopilot from './pages/dashboard/AICopilot.jsx';
import ExplainableAI from './pages/dashboard/ExplainableAI.jsx';
import ExecutiveDecisionBoard from './pages/dashboard/ExecutiveDecisionBoard.jsx';
import Notifications from './pages/dashboard/Notifications.jsx';
import ReportsLibrary from './pages/dashboard/ReportsLibrary.jsx';
import AuditLogs from './pages/dashboard/AuditLogs.jsx';
import UserManagement from './pages/dashboard/UserManagement.jsx';
import SettingsPage from './pages/dashboard/Settings.jsx';
import TimelineReplay from './pages/dashboard/TimelineReplay.jsx';
import CollaborationRoom from './pages/dashboard/CollaborationRoom.jsx';
import DataSources from './pages/dashboard/DataSources.jsx';
import HelpCenter from './pages/dashboard/HelpCenter.jsx';
import Profile from './pages/dashboard/Profile.jsx';
import CrisisMode from './pages/dashboard/CrisisMode.jsx';
import DemoMode from './pages/dashboard/DemoMode.jsx';
import ThresholdsAlerts from './pages/dashboard/ThresholdsAlerts.jsx';

export default function App() {
  React.useEffect(() => {
    const isDark = localStorage.getItem('urja_dark_mode') !== 'false';
    document.body.classList.toggle('light-theme', !isDark);
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <PipelineProvider>
          <ScenarioProvider>
            <Routes>
              {/* Default Entry Point: Command Center */}
              <Route path="/" element={<Navigate to="/command-center" replace />} />
              <Route path="/home" element={<Navigate to="/command-center" replace />} />
              <Route path="/login" element={<Navigate to="/command-center" replace />} />
              <Route path="/register" element={<Navigate to="/command-center" replace />} />

              {/* Direct Dashboard Routes */}
              <Route path="/command-center" element={<CommandCenter />} />
              <Route path="/risk-intelligence" element={<RiskIntelligence />} />
              <Route path="/supply-chain-twin" element={<SupplyChainTwin />} />
              <Route path="/scenario-simulator" element={<ScenarioSimulator />} />
              <Route path="/economic-impact" element={<EconomicImpact />} />
              <Route path="/procurement-optimizer" element={<ProcurementOptimizer />} />
              <Route path="/refinery-compatibility" element={<RefineryCompatibility />} />
              <Route path="/spr-planner" element={<SPRPlanner />} />
              <Route path="/compliance-shield" element={<ComplianceShield />} />
              <Route path="/red-team-validator" element={<RedTeamValidator />} />
              <Route path="/action-brief" element={<ActionBrief />} />
              <Route path="/ai-copilot" element={<AICopilot />} />
              <Route path="/explainable-ai" element={<ExplainableAI />} />
              <Route path="/executive-decision-board" element={<ExecutiveDecisionBoard />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/reports" element={<ReportsLibrary />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/timeline-replay" element={<TimelineReplay />} />
              <Route path="/collaboration-room" element={<CollaborationRoom />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/crisis-mode" element={<CrisisMode />} />
              <Route path="/demo-mode" element={<DemoMode />} />
              <Route path="/settings/thresholds-alerts" element={<ThresholdsAlerts />} />

              {/* Catch-all redirect to Command Center */}
              <Route path="*" element={<Navigate to="/command-center" replace />} />
            </Routes>
          </ScenarioProvider>
        </PipelineProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
