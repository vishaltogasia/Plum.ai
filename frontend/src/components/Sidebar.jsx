import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Bot, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  HelpCircle,
  LogOut,
  Plus,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { businessId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', path: `/workspace/${businessId}/overview`, icon: LayoutGrid },
    { name: 'Agent Builder', path: `/workspace/${businessId}/kb`, icon: Bot },
    { name: 'Analytics', path: `/workspace/${businessId}/analytics`, icon: BarChart3 },
    { name: 'Inbox', path: `/workspace/${businessId}/inbox`, icon: MessageSquare },
    { name: 'Team Members', path: `/workspace/${businessId}/team`, icon: Users },
    { name: 'Settings', path: `/workspace/${businessId}/settings`, icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-100 bg-[#f7f5fa] flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 z-40 select-none">
      <div className="py-6 px-4">
        {/* Workspace Card Header */}
        <div className="mb-6 px-3.5 py-3 rounded-2xl bg-[#ede9fe]/40 border border-[#ddd6fe]/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4c1d95] flex items-center justify-center text-white shadow-md">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 leading-tight">Enterprise Workspace</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Plum.ai Pro</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-150 ${
                  isActive
                    ? 'bg-[#e9e5f0] text-[#31103f] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-[#eae7ee]/40'
                }`
              }
            >
              <item.icon size={16} className="text-slate-400 group-hover:text-slate-600" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Bottom section */}
      <div className="p-4 space-y-4 border-t border-slate-200/50 bg-[#F3F1F6]/50">
        
        {/* + New Agent Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#31103f] hover:bg-[#431B52] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <Plus size={14} />
          New Agent
        </button>

        {/* Footer Actions */}
        <div className="space-y-1.5 pt-2">
          <a
            href="#help"
            className="flex items-center gap-3 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <HelpCircle size={16} className="text-slate-400" />
            Help
          </a>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition text-left"
          >
            <LogOut size={16} className="text-slate-400" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
