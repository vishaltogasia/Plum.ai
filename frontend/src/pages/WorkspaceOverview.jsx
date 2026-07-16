import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, 
  Database, 
  MessageSquare, 
  ArrowUpRight, 
  Loader2, 
  Settings, 
  UploadCloud,
  Share2
} from 'lucide-react';

const WorkspaceOverview = () => {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const busRes = await api.get(`/businesses/${businessId}`);
        setBusiness(busRes.data);
        
        const docRes = await api.get(`/businesses/${businessId}/kb/documents`);
        setDocuments(docRes.data);
      } catch (err) {
        setError('Failed to fetch workspace info.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const completedDocs = documents.filter(d => d.status === 'completed').length;
  const processingDocs = documents.filter(d => d.status === 'processing').length;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time health and configurations of your AI Employee</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Business Name</p>
            <h3 className="text-lg font-bold text-white mt-0.5 truncate max-w-[180px]">{business?.name}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ingested Documents</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">
              {completedDocs} <span className="text-xs text-slate-500 font-normal">loaded</span>
              {processingDocs > 0 && <span className="text-xs text-yellow-400 font-normal ml-2">({processingDocs} indexing)</span>}
            </h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Agent Status</p>
            <h3 className="text-lg font-bold text-emerald-400 mt-0.5">Active & Trained</h3>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Launch Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-brand-500/10 transition-all" />
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            Test Chatbot
            <ArrowUpRight size={16} className="text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">Open the public chat link for this workspace to test the AI's training and conversational response streaming.</p>
          <a
            href={`/chat/${businessId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition"
          >
            Launch Chatbot UI
          </a>
        </div>

        {/* Steps Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Setup Checklist</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xs text-brand-400 font-bold mt-0.5">1</div>
              <div>
                <Link to={`/workspace/${businessId}/kb`} className="text-sm font-semibold text-slate-200 hover:text-brand-400 transition flex items-center gap-1.5">
                  Upload Knowledge Base
                  <UploadCloud size={14} />
                </Link>
                <p className="text-xs text-slate-500 mt-1">Upload business manuals, CSV reports or insert crawlable website URLs.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xs text-brand-400 font-bold mt-0.5">2</div>
              <div>
                <Link to={`/workspace/${businessId}/settings`} className="text-sm font-semibold text-slate-200 hover:text-brand-400 transition flex items-center gap-1.5">
                  Configure Settings
                  <Settings size={14} />
                </Link>
                <p className="text-xs text-slate-500 mt-1">Customize system instructions prompt, logo, and core business metadata.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xs text-brand-400 font-bold mt-0.5">3</div>
              <div>
                <Link to={`/workspace/${businessId}/deploy`} className="text-sm font-semibold text-slate-200 hover:text-brand-400 transition flex items-center gap-1.5">
                  Deploy Web Widget
                  <Share2 size={14} />
                </Link>
                <p className="text-xs text-slate-500 mt-1">Embed the assistant script into your company website.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceOverview;
