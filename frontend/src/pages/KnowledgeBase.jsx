import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { 
  UploadCloud, 
  Globe, 
  Trash2, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';

const KnowledgeBase = () => {
  const { businessId } = useParams();
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload States
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scraping, setScraping] = useState(false);

  const fetchDocs = async () => {
    try {
      const response = await api.get(`/businesses/${businessId}/kb/documents`);
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load knowledge base items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    
    // Poll documents status every 5 seconds if there are items processing
    const interval = setInterval(() => {
      const hasProcessing = documents.some(doc => doc.status === 'processing');
      if (hasProcessing) {
        fetchDocs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [businessId, documents]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post(`/businesses/${businessId}/kb/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      // Reset input element
      document.getElementById('file-input').value = '';
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
      await api.post(`/businesses/${businessId}/kb/url`, formData);
      setUrl('');
      fetchDocs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to crawl website.');
    } finally {
      setScraping(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document? All vectors and indexed knowledge will be deleted immediately.')) return;
    
    try {
      await api.delete(`/businesses/${businessId}/kb/documents/${docId}`);
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err) {
      setError('Failed to delete document.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Knowledge Base</h1>
        <p className="text-slate-400 text-sm mt-1">Upload and manage resources to train your support agent.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload File Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Upload File</h2>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="border border-dashed border-slate-800 hover:border-brand-500/50 rounded-xl p-8 text-center transition cursor-pointer relative bg-slate-900/10">
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.txt,.csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud size={32} className="text-slate-500 mx-auto mb-2" />
              {file ? (
                <p className="text-sm font-semibold text-brand-400">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-slate-300">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, CSV up to 10MB</p>
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              {uploading && <Loader2 className="animate-spin" size={16} />}
              Upload & Index
            </button>
          </form>
        </div>

        {/* Crawl URL Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Crawl Website URL</h2>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Website URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Globe size={18} />
                  </span>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/faq"
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-500 text-white pl-11 pr-4 py-2.5 rounded-xl outline-none transition text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!url || scraping}
                className="w-full py-2.5 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                {scraping && <Loader2 className="animate-spin" size={16} />}
                Crawl Website
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-4">Ingested Data Sources</h2>
        
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-500" size={24} />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">No data sources uploaded yet. Add files above to teach your AI assistant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Filename / Source</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Size (Chars)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/20">
                    <td className="py-3.5 px-4 font-medium text-slate-200 truncate max-w-xs md:max-w-md">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-brand-400 shrink-0" />
                        <span title={doc.filename}>{doc.filename}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs uppercase text-slate-400">{doc.file_type}</td>
                    <td className="py-3.5 px-4">
                      {doc.status === 'completed' && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 size={14} /> Ready
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold">
                          <Clock size={14} className="animate-pulse" /> Indexing
                        </span>
                      )}
                      {doc.status === 'error' && (
                        <span className="flex items-center gap-1 text-rose-400 text-xs font-semibold" title={doc.error_message}>
                          <AlertCircle size={14} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      {doc.status === 'completed' ? doc.char_count.toLocaleString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
