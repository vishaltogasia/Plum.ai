import React from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

const WorkspaceLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const { businessId } = useParams();

  if (loading) {
    return null; // or loader spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Workspace Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
};

export default WorkspaceLayout;
