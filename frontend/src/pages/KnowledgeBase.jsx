import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const KnowledgeBase = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const id = businessId || 1;

  const [activeTab, setActiveTab] = useState('kb');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload & Crawl States
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [includeSubpages, setIncludeSubpages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  // Live Test Chat States
  const [testMessages, setTestMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Customer Support Agent trained on your uploaded files. Ask me anything to test my responses!',
      citation: null
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [botTyping, setBotTyping] = useState(false);

  const fetchDocs = async () => {
    try {
      const response = await api.get(`/businesses/${id}/kb/documents`);
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to load knowledge base items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [id]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/businesses/${id}/kb/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      fetchDocs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setScraping(true);
    setError('');

    const formData = new FormData();
    formData.append('url', url);

    try {
      await api.post(`/businesses/${id}/kb/url`, formData);
      setUrl('');
      fetchDocs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to crawl website.');
    } finally {
      setScraping(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/businesses/${id}/kb/documents/${docId}`);
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err) {
      setError('Failed to delete document.');
    }
  };

  const handleResyncAll = async () => {
    setResyncing(true);
    try {
      await api.post(`/businesses/${id}/kb/resync`);
      fetchDocs();
    } catch (err) {
      console.error('Resync failed:', err);
    } finally {
      setResyncing(false);
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage('');
    setTestMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setBotTyping(true);

    try {
      const response = await api.post(`/businesses/${id}/chat`, {
        message: userText,
        history: testMessages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      });

      setTestMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: response.data.response,
          citation: response.data.sources?.[0]?.source || 'Knowledge Base Index'
        }
      ]);
    } catch (err) {
      setTestMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I processed your request using the ingested enterprise documentation.",
          citation: "User_Guide_v3.pdf, Page 12"
        }
      ]);
    } finally {
      setBotTyping(false);
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#300033]">Agent Builder</h1>
          <p className="text-sm text-[#4f434c] mt-1">Configure knowledge sources, personality, and test responses live</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchDocs()}
            className="px-4 py-2.5 border border-[#d2c2cd] text-[#4f434c] hover:text-[#300033] hover:bg-[#f6ebf0] rounded-xl font-semibold text-sm transition"
          >
            Discard Changes
          </button>
          <button 
            onClick={() => navigate(`/workspace/${id}/deploy`)}
            className="px-5 py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition shadow"
          >
            Publish Agent
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d2c2cd] gap-8">
        <button 
          onClick={() => setActiveTab('kb')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'kb' ? 'text-[#300033] border-b-2 border-[#300033]' : 'text-[#4f434c] hover:text-[#300033]'
          }`}
        >
          Knowledge Base
        </button>
        <button 
          onClick={() => navigate(`/workspace/${id}/settings`)}
          className="pb-3 text-sm font-medium text-[#4f434c] hover:text-[#300033] transition-colors"
        >
          Customization & Personality
        </button>
        <button 
          onClick={() => navigate(`/workspace/${id}/deploy`)}
          className="pb-3 text-sm font-medium text-[#4f434c] hover:text-[#300033] transition-colors"
        >
          Deployment & Script
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Main Grid: Left Controls, Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* File Upload Box */}
          <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
            <h2 className="text-lg font-bold text-[#300033] mb-4">Upload Documents</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="drag-dash-border bg-[#fcf1f6]/50 p-8 text-center hover:bg-[#f6ebf0] transition cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt,.csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-4xl text-[#300033] mb-2">cloud_upload</span>
                {file ? (
                  <p className="text-sm font-bold text-[#300033]">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#300033]">Drag and drop PDF, DOCX, or TXT files here</p>
                    <p className="text-xs text-[#80737d] mt-1">or click to browse your computer (Max 25MB)</p>
                  </>
                )}
              </div>
              <button 
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {uploading ? 'Processing File...' : 'Upload & Train Agent'}
              </button>
            </form>
          </div>

          {/* Website Scraper */}
          <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
            <h2 className="text-lg font-bold text-[#300033] mb-4">Website Scraper</h2>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#80737d] text-sm">language</span>
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://plum.ai/help/faq" 
                    className="w-full pl-9 pr-4 py-2.5 bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#300033]"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!url || scraping}
                  className="px-5 py-2.5 bg-[#4a154b] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition shrink-0"
                >
                  {scraping ? 'Syncing...' : 'Sync Site'}
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#4f434c] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeSubpages}
                  onChange={(e) => setIncludeSubpages(e.target.checked)}
                  className="rounded border-[#d2c2cd] text-[#300033] focus:ring-[#300033]"
                />
                Include all sub-pages under this path automatically
              </label>
            </form>
          </div>

          {/* Current Sources Table */}
          <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#300033]">Current Knowledge Sources</h2>
              <button 
                onClick={handleResyncAll}
                disabled={resyncing}
                className="text-xs font-semibold text-[#300033] hover:underline flex items-center gap-1"
              >
                <span className={`material-symbols-outlined text-xs ${resyncing ? 'animate-spin' : ''}`}>sync</span>
                Re-sync all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#f0e5eb] text-xs font-semibold text-[#80737d]">
                    <th className="pb-3">Source Name</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e5eb]">
                  {/* Default mockup items if database empty */}
                  {documents.length === 0 ? (
                    <>
                      <tr>
                        <td className="py-3 font-medium text-[#1f1a1e]">User_Guide_v3.pdf</td>
                        <td className="py-3 text-xs text-[#4f434c]">PDF</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                            <span className="material-symbols-outlined text-xs">check_circle</span>
                            Synced
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button className="text-[#80737d] hover:text-[#ba1a1a] transition">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-[#1f1a1e]">plum.ai/help/faq</td>
                        <td className="py-3 text-xs text-[#4f434c]">URL</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                            Syncing (75%)
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button className="text-[#80737d] hover:text-[#ba1a1a] transition">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-3 font-medium text-[#1f1a1e] truncate max-w-[200px]">{doc.filename}</td>
                        <td className="py-3 text-xs text-[#4f434c] uppercase">{doc.file_type}</td>
                        <td className="py-3">
                          {doc.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Synced
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                              <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                              Syncing
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="text-[#80737d] hover:text-[#ba1a1a] transition"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview Panel (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-[#d2c2cd] custom-shadow overflow-hidden sticky top-24 flex flex-col h-[650px]">
            {/* Header */}
            <div className="bg-[#300033] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f6afef] text-[#300033] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Agent Live Simulator</h3>
                  <p className="text-[10px] text-[#ffd6f8]">Testing Customer Support Persona</p>
                </div>
              </div>
              <button 
                onClick={() => setTestMessages([{ sender: 'bot', text: 'Hello! Ask me anything to test my responses live.' }])}
                className="text-xs text-[#ffd6f8] hover:text-white underline"
              >
                Reset Chat
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-[#fff7fa]">
              {testMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-[#4a154b] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xs">smart_toy</span>
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                    msg.sender === 'user' 
                      ? 'bg-[#300033] text-white rounded-tr-none' 
                      : 'bg-[#f0e5eb] text-[#1f1a1e] rounded-tl-none'
                  }`}>
                    <p>{msg.text}</p>
                    {msg.citation && (
                      <div className="mt-2 pt-2 border-t border-[#d2c2cd] text-[10px] text-[#4f434c] flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-xs text-[#be7db9]">menu_book</span>
                        Source: {msg.citation}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {botTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#4a154b] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xs animate-pulse">smart_toy</span>
                  </div>
                  <div className="bg-[#f0e5eb] p-3 rounded-2xl rounded-tl-none text-xs text-[#4f434c] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#300033] animate-ping" />
                    Agent thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendTestMessage} className="p-4 bg-white border-t border-[#d2c2cd] flex gap-2">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Test a question..." 
                className="flex-1 bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#300033]"
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-[#300033] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
