import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspaceLayout from './pages/WorkspaceLayout';
import WorkspaceOverview from './pages/WorkspaceOverview';
import KnowledgeBase from './pages/KnowledgeBase';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/SettingsPage';
import DeployPage from './pages/DeployPage';
import ChatPage from './pages/ChatPage';
import InboxPage from './pages/InboxPage';
import ProfilePage from './pages/ProfilePage';
import TeamMembersPage from './pages/TeamMembersPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Route wrapper to conditionally display the main navbar
// We don't want the admin navigation navbar to show on the public ChatPage viewport!
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Dashboard routes (protected) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Profile/Account settings route (protected) */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* Workspaces details routes (protected) */}
          <Route 
            path="/workspace/:businessId" 
            element={
              <ProtectedRoute>
                <WorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route path="overview" element={<WorkspaceOverview />} />
            <Route path="kb" element={<KnowledgeBase />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="deploy" element={<DeployPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="team" element={<TeamMembersPage />} />
            <Route index element={<Navigate to="overview" replace />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Customer Support Chat client viewport (No Admin Navbar) */}
          <Route path="/chat/:businessId" element={<ChatPage />} />
          
          {/* Main platform routes */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
