import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ScenarioProvider } from './context/ScenarioContext.jsx';
import { PipelineProvider } from './context/PipelineContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CallProvider } from './context/CallContext.jsx';

// Auth Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// Dashboard Pages
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

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    const isDark = localStorage.getItem('urja_dark_mode') !== 'false';
    document.body.classList.toggle('light-theme', !isDark);
  }, []);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/command-center" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/command-center" replace /> : <Register />} />

      {/* Default Entry — redirect to login if not authenticated */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/command-center" : "/login"} replace />} />
      <Route path="/home" element={<Navigate to={isAuthenticated ? "/command-center" : "/login"} replace />} />

      {/* Protected Dashboard Routes */}
      <Route path="/command-center" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
      <Route path="/risk-intelligence" element={<ProtectedRoute><RiskIntelligence /></ProtectedRoute>} />
      <Route path="/supply-chain-twin" element={<ProtectedRoute><SupplyChainTwin /></ProtectedRoute>} />
      <Route path="/scenario-simulator" element={<ProtectedRoute><ScenarioSimulator /></ProtectedRoute>} />
      <Route path="/economic-impact" element={<ProtectedRoute><EconomicImpact /></ProtectedRoute>} />
      <Route path="/procurement-optimizer" element={<ProtectedRoute><ProcurementOptimizer /></ProtectedRoute>} />
      <Route path="/refinery-compatibility" element={<ProtectedRoute><RefineryCompatibility /></ProtectedRoute>} />
      <Route path="/spr-planner" element={<ProtectedRoute><SPRPlanner /></ProtectedRoute>} />
      <Route path="/compliance-shield" element={<ProtectedRoute><ComplianceShield /></ProtectedRoute>} />
      <Route path="/red-team-validator" element={<ProtectedRoute><RedTeamValidator /></ProtectedRoute>} />
      <Route path="/action-brief" element={<ProtectedRoute><ActionBrief /></ProtectedRoute>} />
      <Route path="/ai-copilot" element={<ProtectedRoute><AICopilot /></ProtectedRoute>} />
      <Route path="/explainable-ai" element={<ProtectedRoute><ExplainableAI /></ProtectedRoute>} />
      <Route path="/executive-decision-board" element={<ProtectedRoute><ExecutiveDecisionBoard /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsLibrary /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
      <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/timeline-replay" element={<ProtectedRoute><TimelineReplay /></ProtectedRoute>} />
      <Route path="/collaboration-room" element={<ProtectedRoute><CollaborationRoom /></ProtectedRoute>} />
      <Route path="/data-sources" element={<ProtectedRoute><DataSources /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/crisis-mode" element={<ProtectedRoute><CrisisMode /></ProtectedRoute>} />
      <Route path="/demo-mode" element={<ProtectedRoute><DemoMode /></ProtectedRoute>} />
      <Route path="/settings/thresholds-alerts" element={<ProtectedRoute><ThresholdsAlerts /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/command-center" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CallProvider>
          <BrowserRouter>
            <PipelineProvider>
              <ScenarioProvider>
                <AppRoutes />
              </ScenarioProvider>
            </PipelineProvider>
          </BrowserRouter>
        </CallProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
