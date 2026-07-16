import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Briefcase, ChevronRight, Loader2, Settings, MessageSquare, PlusCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Business Modal states
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBusinesses = async () => {
    try {
      const response = await api.get('/businesses');
      setBusinesses(response.data);
    } catch (err) {
      setError('Failed to load businesses. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setCreating(true);
    try {
      const response = await api.post('/businesses', {
        name: newName,
        description: newDesc,
      });
      setShowModal(false);
      setNewName('');
      setNewDesc('');
      fetchBusinesses();
      // Auto route to the new workspace
      navigate(`/workspace/${response.data.id}/overview`);
    } catch (err) {
      setError('Failed to create workspace.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-6 md:p-10 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-900/5 blur-[150px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Workspaces</h1>
            <p className="text-slate-400 text-sm mt-1">Select an isolated workspace to manage your customer support assistant</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition shadow-lg shadow-brand-500/10 self-start md:self-auto"
          >
            <Plus size={18} />
            Create Workspace
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
        ) : businesses.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 mx-auto mb-4 text-slate-500">
              <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">No workspaces yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">Create a business workspace to start training your support agent and get your public chat URL.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-medium rounded-xl transition"
            >
              <PlusCircle size={18} className="text-brand-400" />
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {businesses.map((business) => (
              <div 
                key={business.id}
                onClick={() => navigate(`/workspace/${business.id}/overview`)}
                className="glass-panel hover:border-brand-500/30 p-6 rounded-2xl border border-slate-800 hover:bg-slate-900/30 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 font-bold text-brand-400 text-lg shadow-sm">
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        business.name.charAt(0)
                      )}
                    </div>
                    <ChevronRight size={18} className="text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">{business.name}</h3>
                  <p className="text-slate-400 text-sm mt-1.5 line-clamp-2 h-10">{business.description || 'No description provided.'}</p>
                </div>
                
                <div className="border-t border-slate-800/80 mt-6 pt-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={13} />
                    AI Support Ready
                  </span>
                  <span>ID: #{business.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 glow-brand">
            <h3 className="text-xl font-bold text-white mb-1">Create Workspace</h3>
            <p className="text-slate-400 text-xs mb-6">Setup your company details to initialize your isolated chatbot knowledge database.</p>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Company / Business Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-4 py-2.5 rounded-xl outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Briefly describe what your business does..."
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-4 py-2.5 rounded-xl outline-none transition text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="animate-spin" size={14} />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
