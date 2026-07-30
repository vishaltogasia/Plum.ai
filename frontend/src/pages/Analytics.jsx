import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const Analytics = () => {
  const { businessId } = useParams();
  const id = businessId || 1;
  
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topQuestions, setTopQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const ovRes = await api.get(`/businesses/${id}/analytics/overview`);
        setOverview(ovRes.data);
        
        const tlRes = await api.get(`/businesses/${id}/analytics/timeline`);
        setTimeline(tlRes.data);
        
        const tqRes = await api.get(`/businesses/${id}/analytics/top-questions`);
        setTopQuestions(tqRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#300033] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sentimentData = [
    { name: 'Positive', value: 84, color: '#300033' },
    { name: 'Neutral', value: 12, color: '#be7db9' },
    { name: 'Negative', value: 4, color: '#e0b8da' },
  ];

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#300033]">Analytics & Insights</h1>
          <p className="text-sm text-[#4f434c] mt-1">Real-time performance monitoring and intelligence for Plum AI agents</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-[#d2c2cd] text-[#4f434c] rounded-xl font-semibold text-xs hover:bg-[#f6ebf0] transition">
            Last 30 Days
          </button>
          <button className="px-5 py-2 bg-[#300033] text-white rounded-xl font-semibold text-xs hover:opacity-90 transition shadow flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Analytics PDF
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#4f434c] text-sm font-medium">Resolution Rate</span>
            <span className="material-symbols-outlined text-[#4a154b]">task_alt</span>
          </div>
          <div className="text-3xl font-bold text-[#300033]">{overview?.resolution_rate || '94.2'}%</div>
          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            +12.4% vs last period
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#4f434c] text-sm font-medium">Avg Response Time</span>
            <span className="material-symbols-outlined text-[#4a154b]">speed</span>
          </div>
          <div className="text-3xl font-bold text-[#300033]">{overview?.avg_response_time || '0.8'}s</div>
          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_downward</span>
            -0.2s optimization
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#4f434c] text-sm font-medium">Total Conversations</span>
            <span className="material-symbols-outlined text-[#4a154b]">forum</span>
          </div>
          <div className="text-3xl font-bold text-[#300033]">{overview?.total_chats?.toLocaleString() || '42,891'}</div>
          <p className="text-xs text-[#be7db9] mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            +8.7% volume increase
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conversation Volume Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
          <h2 className="text-lg font-bold text-[#300033] mb-6">Conversation Volume</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#300033" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#300033" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#80737d' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#80737d' }} />
                <Tooltip contentStyle={{ background: '#300033', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="conversations" stroke="#300033" strokeWidth={3} fill="url(#volumeGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#300033] mb-4">Sentiment Breakdown</h2>
            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-3xl font-bold text-[#300033]">84%</span>
                <p className="text-[10px] text-[#80737d] uppercase font-bold">Positive CSAT</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#f0e5eb] pt-4">
            {sentimentData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#4f434c]">{item.name}</span>
                </div>
                <span className="text-[#300033]">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Questions Table */}
      <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
        <h2 className="text-lg font-bold text-[#300033] mb-4">Top User Queries & Resolution Confidence</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#f0e5eb] text-xs font-semibold text-[#80737d]">
                <th className="pb-3">Query</th>
                <th className="pb-3 text-center">Frequency</th>
                <th className="pb-3 text-center">Resolution %</th>
                <th className="pb-3 text-right">AI Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e5eb]">
              {topQuestions.map((q, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 font-medium text-[#1f1a1e]">{q.question}</td>
                  <td className="py-3.5 text-center text-[#4f434c]">{q.frequency}</td>
                  <td className="py-3.5 text-center font-bold text-green-700">{q.resolution_rate}%</td>
                  <td className="py-3.5 text-right font-mono text-xs font-bold text-[#300033]">
                    {(q.ai_confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
