import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const WorkspaceOverview = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);

  const id = businessId || 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const busRes = await api.get(`/businesses/${id}`);
        setBusiness(busRes.data);
      } catch (err) {
        console.error('Failed to load workspace:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#300033] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#300033]">Workspace Overview</h1>
          <p className="text-sm text-[#4f434c] mt-1">
            {business?.name ? `${business.name} — AI Employees and Performance Metrics` : 'Manage your enterprise AI agents and monitor real-time performance'}
          </p>
        </div>
        <button 
          onClick={() => navigate(`/workspace/${id}/kb`)}
          className="px-5 py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Create New Agent
        </button>
      </div>

      {/* 4 Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#4f434c] text-sm font-medium">Total Agents</span>
            <span className="material-symbols-outlined text-[#4a154b]">smart_toy</span>
          </div>
          <div className="text-3xl font-bold text-[#300033]">12</div>
          <p className="text-xs text-[#be7db9] mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            +2 this month
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#4f434c] text-sm font-medium">Active Convos</span>
            <span className="material-symbols-outlined text-[#4a154b]">forum</span>
          </div>
          <div className="text-3xl font-bold text-[#300033]">1.4k</div>
          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_upward</span>
            14% vs last week
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#4f434c] text-sm font-medium">Avg. Response Time</span>
            <span className="material-symbols-outlined text-[#4a154b]">speed</span>
          </div>
          <div className="text-3xl font-bold text-[#300033]">0.8s</div>
          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_downward</span>
            -0.2s optimization
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#4f434c] text-sm font-medium">Success Rate</span>
            <span className="material-symbols-outlined text-[#4a154b]">check_circle</span>
          </div>
          <div className="text-3xl font-bold text-[#300033]">94%</div>
          <p className="text-xs text-[#be7db9] mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            +3.1% csat
          </p>
        </div>
      </div>

      {/* Agents Grid & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My AI Agents (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#300033]">My AI Agents</h2>
            <button 
              onClick={() => navigate(`/workspace/${id}/kb`)}
              className="text-xs font-semibold text-[#300033] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer Support Agent */}
            <div 
              onClick={() => navigate(`/workspace/${id}/kb`)}
              className="bg-white p-6 rounded-xl border border-[#d2c2cd] bento-card cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#4a154b] text-white flex items-center justify-center font-bold">
                    CS
                  </div>
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    Active
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#300033]">Customer Support</h3>
                <p className="text-xs text-[#4f434c] mt-1 line-clamp-2">Handles general customer inquiries, order tracking, and refund requests.</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#f0e5eb] flex items-center justify-between text-xs text-[#80737d]">
                <span>1,240 Convos</span>
                <span className="text-[#300033] font-semibold hover:underline">Configure →</span>
              </div>
            </div>

            {/* Sales Assistant */}
            <div 
              onClick={() => navigate(`/workspace/${id}/kb`)}
              className="bg-white p-6 rounded-xl border border-[#d2c2cd] bento-card cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#d6e0f6] text-[#121c2c] flex items-center justify-center font-bold">
                    SA
                  </div>
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    Active
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#300033]">Sales Assistant</h3>
                <p className="text-xs text-[#4f434c] mt-1 line-clamp-2">Qualifies inbound leads and schedules product demo calls on calendar.</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#f0e5eb] flex items-center justify-between text-xs text-[#80737d]">
                <span>480 Convos</span>
                <span className="text-[#300033] font-semibold hover:underline">Configure →</span>
              </div>
            </div>

            {/* IT Helpdesk */}
            <div 
              onClick={() => navigate(`/workspace/${id}/kb`)}
              className="bg-white p-6 rounded-xl border border-[#d2c2cd] bento-card cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#dbe9a5] text-[#141a00] flex items-center justify-center font-bold">
                    IT
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                    Training
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#300033]">IT Helpdesk</h3>
                <p className="text-xs text-[#4f434c] mt-1 line-clamp-2">Internal employee support for password resets and software provisioning.</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#f0e5eb] flex items-center justify-between text-xs text-[#80737d]">
                <span>120 Convos</span>
                <span className="text-[#300033] font-semibold hover:underline">Configure →</span>
              </div>
            </div>

            {/* + New Agent Card */}
            <div 
              onClick={() => navigate(`/workspace/${id}/kb`)}
              className="drag-dash-border bg-[#fcf1f6]/60 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f6ebf0] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-[#d2c2cd] flex items-center justify-center text-[#300033] mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">add</span>
              </div>
              <h4 className="text-sm font-bold text-[#300033]">Create New Agent</h4>
              <p className="text-xs text-[#80737d] mt-1">Deploy another tailored AI persona</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#300033] mb-6">Recent Activity</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
                <div>
                  <p className="text-xs text-[#1f1a1e] font-semibold">Customer Support resolved ticket #8942</p>
                  <p className="text-[10px] text-[#80737d] mt-0.5">12 mins ago — 100% AI resolution</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-sm">sync</span>
                </div>
                <div>
                  <p className="text-xs text-[#1f1a1e] font-semibold">IT Helpdesk indexed User_Guide_v3.pdf</p>
                  <p className="text-[10px] text-[#80737d] mt-0.5">1 hour ago — 75% complete</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-sm">person_add</span>
                </div>
                <div>
                  <p className="text-xs text-[#1f1a1e] font-semibold">Sarah Chen joined workspace as Admin</p>
                  <p className="text-[10px] text-[#80737d] mt-0.5">3 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-sm">warning</span>
                </div>
                <div>
                  <p className="text-xs text-[#1f1a1e] font-semibold">Sales Assistant API rate limit alert</p>
                  <p className="text-[10px] text-[#80737d] mt-0.5">Yesterday — Rate limit expanded</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate(`/workspace/${id}/inbox`)}
            className="w-full mt-6 py-2.5 bg-[#fcf1f6] border border-[#d2c2cd] text-[#300033] font-semibold text-xs rounded-xl hover:bg-[#f0e5eb] transition"
          >
            Open Live Inbox →
          </button>
        </div>
      </div>

      {/* AI Insight Recommendation Banner */}
      <div className="bg-gradient-to-r from-[#4a154b] to-[#300033] text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl text-[#f6afef]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h4 className="font-bold text-base">AI Traffic Optimization Insight</h4>
            <p className="text-xs text-[#ffd6f8] mt-0.5">
              Recommendation: High traffic expected for upcoming promo. Consider scaling agent concurrency limits to 50 threads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setSuggestionAccepted(true)}
            disabled={suggestionAccepted}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              suggestionAccepted ? 'bg-green-500 text-white' : 'bg-[#f6afef] text-[#300033] hover:bg-white'
            }`}
          >
            {suggestionAccepted ? '✓ Concurrency Scaled' : 'Accept Suggestion'}
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg text-white transition">
            <span className="material-symbols-outlined text-sm">thumb_up</span>
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg text-white transition">
            <span className="material-symbols-outlined text-sm">thumb_down</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceOverview;
