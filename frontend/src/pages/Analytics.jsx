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
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert,
  Clock, 
  MessageSquare,
  MoreVertical,
  CheckCircle,
  TrendingUp as TrendUpIcon,
  ChevronRight,
  TrendingDown as TrendDownIcon,
  Loader2
} from 'lucide-react';

const Analytics = () => {
  const { businessId } = useParams();
  
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topQuestions, setTopQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const ovRes = await api.get(`/businesses/${businessId}/analytics/overview`);
        setOverview(ovRes.data);
        
        const tlRes = await api.get(`/businesses/${businessId}/analytics/timeline`);
        setTimeline(tlRes.data);
        
        const tqRes = await api.get(`/businesses/${businessId}/analytics/top-questions`);
        setTopQuestions(tqRes.data);
      } catch (err) {
        setError('Failed to fetch analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [businessId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  // Sentiment Pie Chart data
  const sentimentData = [
    { name: 'Positive', value: 84, color: '#A7C49E' }, // Soft green
    { name: 'Neutral', value: 12, color: '#C0D5E8' },  // Soft blue
    { name: 'Negative', value: 4, color: '#6A4D76' },   // Soft purple
  ];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto bg-[#FDFBFD] p-1 text-slate-800">
      
      {/* Title Header with date filters and PDF Export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Insights</h1>
          <p className="text-slate-500 text-xs mt-0.5">Real-time performance monitoring for Plum AI agents.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg bg-white shadow-sm transition">
            <Calendar size={14} className="text-slate-400" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3D1B48] text-white text-xs font-semibold rounded-lg shadow-sm shadow-[#4c1d95]/10 transition">
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Card 1: Resolution Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <CheckCircle size={20} />
            </div>
            <div className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-50/50 px-1.5 py-0.5 rounded-full">
              <TrendingUp size={12} />
              +12.4%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Resolution Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {overview?.resolution_rate || '94.2'}%
            </h3>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#A7C49E] h-full rounded-full" style={{ width: `${overview?.resolution_rate || 94.2}%` }} />
          </div>
        </div>

        {/* Card 2: Avg Response Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Clock size={20} />
            </div>
            <div className="flex items-center gap-0.5 text-xs font-bold text-rose-500 bg-rose-50/50 px-1.5 py-0.5 rounded-full">
              <TrendingDown size={12} />
              -2.1%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Avg Response Time</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {overview?.avg_response_time || '0.8'}s
            </h3>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#6A4D76] h-full rounded-full animate-pulse" style={{ width: '40%' }} />
          </div>
        </div>

        {/* Card 3: Total Conversations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <MessageSquare size={20} />
            </div>
            <div className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-50/50 px-1.5 py-0.5 rounded-full">
              <TrendingUp size={12} />
              +8.7%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Conversations</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {overview?.total_chats.toLocaleString() || '42,891'}
            </h3>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: '78%' }} />
          </div>
        </div>
      </div>

      {/* Charts Section: Volume and Sentiment */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Conversation Volume Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-900">Conversation Volume</h2>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical size={16} />
            </button>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4c1d95" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4c1d95" stopOpacity={0.005}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="#4c1d95" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#volumeGlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-6">Sentiment Analysis</h2>
            
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Central text representation */}
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-slate-900">84%</span>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Positive</p>
              </div>
            </div>
          </div>

          {/* Sentiment Legends list matching visual style */}
          <div className="space-y-2 border-t border-slate-50 pt-4 mt-2">
            {sentimentData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500">{item.name}</span>
                </div>
                <span className="text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Questions insights table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-50">
          <h2 className="text-sm font-bold text-slate-900">Top Questions</h2>
          <a href="#insights" className="text-xs text-brand-600 hover:text-brand-500 font-bold flex items-center gap-0.5">
            View All Insights
            <ChevronRight size={14} />
          </a>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-6">Common User Query</th>
                <th className="py-3 px-6 text-center">Frequency</th>
                <th className="py-3 px-6 text-center">Resolution %</th>
                <th className="py-3 px-6 text-center">Trend</th>
                <th className="py-3 px-6 text-center">AI Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
              {topQuestions.map((q, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20">
                  <td className="py-3.5 px-6 font-semibold text-slate-800">{q.question}</td>
                  <td className="py-3.5 px-6 text-center font-semibold text-slate-500">{q.frequency}</td>
                  <td className="py-3.5 px-6 text-center font-semibold text-slate-700">{q.resolution_rate}%</td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mx-auto">
                      <TrendUpIcon size={10} /> +{(15 - idx * 2.3).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div className="bg-[#4c1d95] h-full rounded-full" style={{ width: `${q.ai_confidence * 100}%` }} />
                      </div>
                      <span className="font-semibold text-slate-500 font-mono text-[10px]">{(q.ai_confidence * 100).toFixed(0)}%</span>
                    </div>
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
