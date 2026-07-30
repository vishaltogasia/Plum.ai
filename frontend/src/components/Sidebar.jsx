import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { businessId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const id = businessId || 1;

  const menuItems = [
    { name: 'Overview', path: `/workspace/${id}/overview`, icon: 'dashboard' },
    { name: 'Agent Builder', path: `/workspace/${id}/kb`, icon: 'smart_toy' },
    { name: 'Analytics', path: `/workspace/${id}/analytics`, icon: 'monitoring' },
    { name: 'Inbox', path: `/workspace/${id}/inbox`, icon: 'chat' },
    { name: 'Deploy', path: `/workspace/${id}/deploy`, icon: 'rocket_launch' },
    { name: 'Team Members', path: `/workspace/${id}/team`, icon: 'group' },
    { name: 'Settings', path: `/workspace/${id}/settings`, icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-nav bg-[#fcf1f6] border-r border-[#d2c2cd] flex flex-col z-[60]">
      {/* Workspace Brand Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4a154b] rounded-lg flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        <div className="overflow-hidden">
          <h2 className="font-semibold text-sm text-[#300033] leading-tight truncate">Enterprise Workspace</h2>
          <p className="text-xs text-[#4f434c]">Plum.ai Pro</p>
        </div>
      </div>

      {/* New Agent Button */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="mx-4 mb-6 py-3 px-4 bg-[#300033] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg hover:opacity-90"
      >
        <span className="material-symbols-outlined text-sm">add_circle</span>
        New Agent
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col px-4 gap-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-[#d6e0f6] text-[#121c2c] font-semibold'
                  : 'text-[#4f434c] hover:bg-[#f0e5eb] hover:text-[#300033]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px] group-hover:text-[#300033]">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation Actions */}
      <div className="p-4 border-t border-[#d2c2cd] flex flex-col gap-1">
        <a 
          href="#help" 
          className="flex items-center gap-3 text-[#4f434c] hover:bg-[#f0e5eb] hover:text-[#300033] px-4 py-3 rounded-lg text-sm font-medium transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span>Help</span>
        </a>
        <button
          onClick={logout}
          className="flex items-center gap-3 text-[#4f434c] hover:bg-[#f0e5eb] hover:text-[#ba1a1a] px-4 py-3 rounded-lg text-sm font-medium transition-all w-full text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
