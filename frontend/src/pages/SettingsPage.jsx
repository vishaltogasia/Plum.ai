import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Save, Loader2, UploadCloud, CheckCircle2, Clock } from 'lucide-react';

const SettingsPage = () => {
  const { businessId } = useParams();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Working Hours (Monday - Friday)
  const [monOpen, setMonOpen] = useState('09:00');
  const [monClose, setMonClose] = useState('17:00');
  const [weekendOpen, setWeekendOpen] = useState('10:00');
  const [weekendClose, setWeekendClose] = useState('15:00');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get(`/businesses/${businessId}`);
        const data = response.data;
        setName(data.name);
        setDescription(data.description || '');
        setContactEmail(data.contact_email || '');
        setContactPhone(data.contact_phone || '');
        setSystemPrompt(data.system_prompt || 'You are a helpful customer support representative. Answer queries politely and accurately using facts from the knowledge base. If unsure, tell the customer you will look into it.');
        setLogoUrl(data.logo_url || '');
        
        if (data.working_hours) {
          setMonOpen(data.working_hours.weekday?.open || '09:00');
          setMonClose(data.working_hours.weekday?.close || '17:00');
          setWeekendOpen(data.working_hours.weekend?.open || '10:00');
          setWeekendClose(data.working_hours.weekend?.close || '15:00');
        }
      } catch (err) {
        setError('Failed to load workspace settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [businessId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError('');
    
    const workingHoursObj = {
      weekday: { open: monOpen, close: monClose },
      weekend: { open: weekendOpen, close: weekendClose }
    };
    
    try {
      const response = await api.put(`/businesses/${businessId}`, {
        name,
        description,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        system_prompt: systemPrompt,
        working_hours: workingHoursObj
      });
      setSuccessMsg('Settings updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingLogo(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post(`/businesses/${businessId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLogoUrl(response.data.logo_url);
      setSuccessMsg('Logo updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Workspace Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure company metadata and AI agent personality profile</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Logo Upload & Hours */}
        <div className="space-y-6 md:col-span-1">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Workspace Logo</h3>
            <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 mx-auto mb-4 flex items-center justify-center font-bold text-slate-500 overflow-hidden relative group">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                name.charAt(0)
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-brand-400" size={20} />
                </div>
              )}
            </div>
            
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer">
              <UploadCloud size={14} className="text-brand-400" />
              Upload Image
              <input type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
            </label>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock size={16} className="text-brand-400" />
              Operating Hours
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium">Weekdays (Mon-Fri)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={monOpen}
                    onChange={(e) => setMonOpen(e.target.value)}
                    placeholder="09:00"
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-2 py-1.5 rounded-lg text-xs outline-none text-center font-mono"
                  />
                  <input
                    type="text"
                    value={monClose}
                    onChange={(e) => setMonClose(e.target.value)}
                    placeholder="17:00"
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-2 py-1.5 rounded-lg text-xs outline-none text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium">Weekends (Sat-Sun)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={weekendOpen}
                    onChange={(e) => setWeekendOpen(e.target.value)}
                    placeholder="10:00"
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-2 py-1.5 rounded-lg text-xs outline-none text-center font-mono"
                  />
                  <input
                    type="text"
                    value={weekendClose}
                    onChange={(e) => setWeekendClose(e.target.value)}
                    placeholder="15:00"
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-2 py-1.5 rounded-lg text-xs outline-none text-center font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: General Settings & AI Agent instructions */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">General Profile</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-4 py-2.5 rounded-xl outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="support@company.com"
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-4 py-2.5 rounded-xl outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-4 py-2.5 rounded-xl outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white px-4 py-2.5 rounded-xl outline-none transition text-sm"
                />
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-6">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">AI Employee System Instructions</label>
              <p className="text-slate-500 text-xs mb-3">Define the behavior, tone, guidelines and boundaries of your AI Customer Support assistant.</p>
              <textarea
                required
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={6}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white p-4 rounded-xl outline-none transition text-sm font-mono resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm flex items-center gap-1.5 shadow-lg shadow-brand-500/10 ml-auto"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
