import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

const WorkspaceLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7fa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#300033] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-[#fff7fa] min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Area */}
      <main className="flex-1 ml-64 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default WorkspaceLayout;
