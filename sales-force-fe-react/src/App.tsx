import { Routes, Route, Navigate } from 'react-router-dom';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import LoginPage from '@/pages/LoginPage';
import FeaturesPage from '@/pages/FeaturesPage';
import DashboardPage from '@/pages/DashboardPage';
import LeadsPage from '@/pages/LeadsPage';
import PipelinePage from '@/pages/PipelinePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import PropertiesPage from '@/pages/PropertiesPage';
import UsersPage from '@/pages/UsersPage';
import SubscriptionsPage from '@/pages/SubscriptionsPage';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  return (
    <>
      <DocumentTitle />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/features" element={<FeaturesPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Role-restricted routes */}
        <Route element={<ProtectedRoute roles={['Admin', 'Supervisor']} />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['Admin']} />}>
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
