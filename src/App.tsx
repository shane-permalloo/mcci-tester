import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { BetaRegistrationForm } from './components/BetaRegistrationForm';
import { FeedbackForm } from './components/FeedbackForm';
import { FeedbackKanban } from './components/FeedbackKanban';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { InvitationManager } from './components/InvitationManager';
import { FeedbackDashboard } from './components/FeedbackDashboard';
import { useAuth } from './hooks/useAuth';
import { KanbanImporter } from './components/KanbanImporter';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-yellow-900 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-200 dark:border-yellow-700 border-t-yellow-600 dark:border-t-yellow-400"></div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<BetaRegistrationForm />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          <Route path="/kanban" element={<KanbanImporter />} />
          <Route
        path="/admin"
        element={user ? <AdminDashboard /> : <AdminLogin />}
          />
          <Route
        path="/admin/invitations"
        element={user ? <InvitationManager /> : <Navigate to="/admin" />}
          />
          <Route
        path="/admin/feedback"
        element={user ? <FeedbackDashboard /> : <Navigate to="/admin" />}
          />
          <Route
            path="/admin/kanban"
            element={user ? <FeedbackKanban /> : <Navigate to="/admin" />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;