import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Settings, Search, User } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Helper to determine if link is active
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <nav className="h-16 border-b border-slate-100 bg-white px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-extrabold text-2xl tracking-tight text-[#31103f]">
            Plum.ai
          </span>
        </Link>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-8">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search analytics..."
            className="w-full bg-[#f8f6fa] border border-[#e8e5ec] text-slate-700 placeholder-slate-400 pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-brand-400 transition"
          />
        </div>
      </div>

      {/* Nav Actions Links & User profile */}
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
              <Link 
                to="/dashboard" 
                className={`hover:text-slate-900 transition ${isActive('/dashboard') ? 'text-slate-900 border-b-2 border-[#4c1d95] py-5 mt-0.5' : ''}`}
              >
                Dashboard
              </Link>
              <Link 
                to={`/workspace/1/analytics`} 
                className={`hover:text-slate-900 transition ${isActive('/analytics') ? 'text-slate-900 border-b-2 border-[#4c1d95] py-5 mt-0.5' : ''}`}
              >
                Analytics
              </Link>
              <a 
                href="#inbox" 
                className="hover:text-slate-900 transition"
              >
                Inbox
              </a>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-4">
              {/* Notification icon */}
              <button className="text-slate-400 hover:text-slate-600 transition relative">
                <Bell size={18} />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full" />
              </button>

              {/* Settings icon */}
              <Link 
                to="/profile"
                className="text-slate-400 hover:text-slate-600 transition"
                title="Account Settings"
              >
                <Settings size={18} />
              </Link>

              {/* Profile Avatar */}
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-bold bg-[#4c1d95] hover:bg-[#3D1B48] text-white px-4 py-2 rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
