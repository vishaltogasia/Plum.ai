import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.includes(path);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fff7fa]/80 glass-nav border-b border-[#d2c2cd] h-20">
      <nav className="flex justify-between items-center w-full px-8 h-full max-w-[1440px] mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold text-xl text-[#300033] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#300033]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
            Plum.ai
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link 
                to="/dashboard" 
                className={`transition-colors py-1 ${isActive('/dashboard') ? 'text-[#300033] font-semibold border-b-2 border-[#300033]' : 'text-[#4f434c] hover:text-[#300033]'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/workspace/1/analytics" 
                className={`transition-colors py-1 ${isActive('/analytics') ? 'text-[#300033] font-semibold border-b-2 border-[#300033]' : 'text-[#4f434c] hover:text-[#300033]'}`}
              >
                Analytics
              </Link>
              <Link 
                to="/workspace/1/inbox" 
                className={`transition-colors py-1 ${isActive('/inbox') ? 'text-[#300033] font-semibold border-b-2 border-[#300033]' : 'text-[#4f434c] hover:text-[#300033]'}`}
              >
                Inbox
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button 
                className="material-symbols-outlined text-[#4f434c] hover:text-[#300033] p-2 transition-all relative"
                title="Notifications"
              >
                notifications
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
              </button>
              <button 
                onClick={() => navigate('/workspace/1/settings')}
                className="material-symbols-outlined text-[#4f434c] hover:text-[#300033] p-2 transition-all"
                title="Settings"
              >
                settings
              </button>
              <Link to="/profile" className="w-10 h-10 rounded-full bg-[#d6e0f6] overflow-hidden border border-[#d2c2cd] flex items-center justify-center cursor-pointer">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3ah1-ezVQbOD_OXY9LdIuaEThJdcXdOGoKRW99gx3ou211hItb8RhwC6t-kNE6YPUgW31nIVWHas3tzWSYaK4YsftRmbCJEfesZ9lHyigecEtKmJLZISv-jELAAgOU6e1kE55AoLqUZ5688tjOMUEpqiAK2zQ-3pZ8yQCZMOYwMjV67jollj0JEr7NfUwWcMn-nMnERRZZyuNasZ-fsBP7gU0dDWYLnwcNQt7DERluvA63Z0dvrBo" 
                  alt="User avatar" 
                />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold text-[#4f434c] hover:text-[#300033]">
                Sign In
              </Link>
              <Link to="/register" className="px-5 py-2.5 bg-[#300033] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow">
                Start Free
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
