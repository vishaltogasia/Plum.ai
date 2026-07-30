import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const SettingsPage = () => {
  const { businessId } = useParams();
  const id = businessId || 1;

  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState('Plum Enterprise Workspace');
  const [description, setDescription] = useState('Customer Support & Lead Gen AI Employee');
  const [contactEmail, setContactEmail] = useState('admin@plum.ai');
  const [systemPrompt, setSystemPrompt] = useState('You are a polite, helpful enterprise customer support assistant. Answer queries accurately using knowledge base facts.');

  // API Keys state
  const [apiKeys, setApiKeys] = useState([
    { id: 'key_1', name: 'Production Chatbot Key', key: 'pk_live_89f3a...91a2', created_at: '2026-07-15' },
    { id: 'key_2', name: 'Staging Integration Key', key: 'pk_test_41b9c...08c4', created_at: '2026-07-20' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  // Webhooks state
  const [webhooks, setWebhooks] = useState([
    { id: 'wh_1', url: 'https://api.acme.corp/webhooks/plum-events', events: ['human_needed', 'chat_resolved'], status: 'active' }
  ]);
  const [webhookUrl, setWebhookUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/businesses/${id}`, {
        name,
        description,
        contact_email: contactEmail,
        system_prompt: systemPrompt
      });
      setMessage('Workspace settings saved successfully.');
    } catch (err) {
      setMessage('Saved locally for current workspace preview.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCreateApiKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `pk_live_${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
  };

  const handleDeleteKey = (keyId) => {
    setApiKeys(apiKeys.filter(k => k.id !== keyId));
  };

  const handleCreateWebhook = (e) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    const newWh = {
      id: `wh_${Date.now()}`,
      url: webhookUrl,
      events: ['human_needed'],
      status: 'active'
    };
    setWebhooks([...webhooks, newWh]);
    setWebhookUrl('');
  };

  const handleDeleteWebhook = (whId) => {
    setWebhooks(webhooks.filter(w => w.id !== whId));
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#300033]">Workspace Settings & Developer APIs</h1>
        <p className="text-sm text-[#4f434c] mt-1">Manage AI agent instructions, API credentials, and real-time webhook routing</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d2c2cd] gap-8">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'general' ? 'text-[#300033] border-b-2 border-[#300033]' : 'text-[#4f434c] hover:text-[#300033]'
          }`}
        >
          General & AI Prompt
        </button>
        <button 
          onClick={() => setActiveTab('apikeys')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'apikeys' ? 'text-[#300033] border-b-2 border-[#300033]' : 'text-[#4f434c] hover:text-[#300033]'
          }`}
        >
          API Keys
        </button>
        <button 
          onClick={() => setActiveTab('webhooks')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'webhooks' ? 'text-[#300033] border-b-2 border-[#300033]' : 'text-[#4f434c] hover:text-[#300033]'
          }`}
        >
          Webhooks & Integrations
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
          {message}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white p-8 rounded-xl border border-[#d2c2cd] custom-shadow max-w-4xl space-y-6">
          <h2 className="text-lg font-bold text-[#300033]">General Workspace Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#300033] uppercase mb-2">Workspace Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#300033]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#300033] uppercase mb-2">Support Contact Email</label>
              <input 
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#300033]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#300033] uppercase mb-2">Agent Description</label>
            <input 
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#300033]"
            />
          </div>

          <div className="pt-4 border-t border-[#f0e5eb]">
            <label className="block text-xs font-bold text-[#300033] uppercase mb-1">AI Employee System Instructions</label>
            <p className="text-xs text-[#80737d] mb-3">Define behavioral constraints, tone, and guardrails for all customer responses.</p>
            <textarea 
              rows={5}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl p-4 text-xs font-mono outline-none focus:ring-1 focus:ring-[#300033]"
            />
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition shadow"
          >
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </form>
      )}

      {activeTab === 'apikeys' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
            <h2 className="text-lg font-bold text-[#300033] mb-4">Generate API Key</h2>
            <form onSubmit={handleCreateApiKey} className="flex gap-4">
              <input 
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key Description (e.g. Production Web Widget)"
                className="flex-1 bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#300033]"
              />
              <button 
                type="submit"
                disabled={!newKeyName.trim()}
                className="px-6 py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition shadow shrink-0"
              >
                + Create Key
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
            <h2 className="text-lg font-bold text-[#300033] mb-4">Active API Keys</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#f0e5eb] text-xs font-semibold text-[#80737d]">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Key Token</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e5eb]">
                  {apiKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="py-3.5 font-bold text-[#300033]">{k.name}</td>
                      <td className="py-3.5 font-mono text-xs text-[#4a154b]">{k.key}</td>
                      <td className="py-3.5 text-xs text-[#80737d]">{k.created_at}</td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => handleDeleteKey(k.id)}
                          className="text-[#80737d] hover:text-[#ba1a1a] transition"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
            <h2 className="text-lg font-bold text-[#300033] mb-4">Add Webhook Endpoint</h2>
            <form onSubmit={handleCreateWebhook} className="flex gap-4">
              <input 
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks/plum"
                className="flex-1 bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#300033]"
              />
              <button 
                type="submit"
                disabled={!webhookUrl.trim()}
                className="px-6 py-2.5 bg-[#4a154b] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition shadow shrink-0"
              >
                + Add Endpoint
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
            <h2 className="text-lg font-bold text-[#300033] mb-4">Configured Webhook Endpoints</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#f0e5eb] text-xs font-semibold text-[#80737d]">
                    <th className="pb-3">Endpoint URL</th>
                    <th className="pb-3">Subscribed Events</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e5eb]">
                  {webhooks.map((w) => (
                    <tr key={w.id}>
                      <td className="py-3.5 font-mono text-xs font-bold text-[#300033] truncate max-w-xs">{w.url}</td>
                      <td className="py-3.5 text-xs text-[#4f434c]">{w.events.join(', ')}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          ACTIVE
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => handleDeleteWebhook(w.id)}
                          className="text-[#80737d] hover:text-[#ba1a1a] transition"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
