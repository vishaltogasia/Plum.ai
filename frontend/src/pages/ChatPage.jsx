import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Send, User, Bot, AlertCircle, Sparkles, Building, ChevronRight, FileText } from 'lucide-react';

const ChatPage = () => {
  const { businessId } = useParams();
  
  const [business, setBusiness] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [customerName, setCustomerName] = useState('Visitor');
  const [customerEmail, setCustomerEmail] = useState('');
  const [sessionCreated, setSessionCreated] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBusiness, setFetchingBusiness] = useState(true);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const response = await api.get(`/businesses/${businessId}`);
        setBusiness(response.data);
      } catch (err) {
        setError('Business not found.');
      } finally {
        setFetchingBusiness(false);
      }
    };
    fetchBusinessDetails();
  }, [businessId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/chat/sessions?business_id=${businessId}`, {
        customer_name: customerName,
        customer_email: customerEmail || null,
      });
      setSessionId(response.data.id);
      setSessionCreated(true);
      
      // Add initial greeting message from the AI employee
      setMessages([
        {
          id: 'greeting',
          sender: 'bot',
          content: `Hello! Welcome to ${business?.name}. How can I assist you today?`,
          created_at: new Date().toISOString(),
        }
      ]);
    } catch (err) {
      setError('Failed to start chat session.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Create an empty bot message placeholder for streaming
    const botMessagePlaceholderId = (Date.now() + 1).toString();
    const botPlaceholder = {
      id: botMessagePlaceholderId,
      sender: 'bot',
      content: '',
      citations: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botPlaceholder]);

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawText = decoder.decode(value);
        const lines = rawText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.replace('data:', '').strip();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                
                if (data.text) {
                  botContent += data.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessagePlaceholderId
                        ? { ...msg, content: botContent }
                        : msg
                    )
                  );
                }
                
                if (data.citations) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessagePlaceholderId
                        ? { ...msg, citations: data.citations }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessagePlaceholderId
            ? { ...msg, content: 'Sorry, I encountered an error connection issue. Please try again.' }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingBusiness) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Workspace Offline</h2>
        <p className="text-slate-400 text-sm max-w-sm">The requested business support chatbot is currently unavailable or doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-3xl h-screen md:h-[650px] bg-slate-900 md:rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl relative">
        
        {/* Chat Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-400 overflow-hidden">
              {business.logo_url ? (
                <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                business.name.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{business.name}</h3>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                AI Assistant Online
              </p>
            </div>
          </div>
          
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-950 px-2 py-1 rounded-md">
            Powered by Plum.ai
          </span>
        </header>

        {/* Dynamic Inner body */}
        {!sessionCreated ? (
          /* Session Start Form */
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/20">
            <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-800/80">
              <h4 className="text-base font-bold text-white mb-1.5 flex items-center gap-1.5">
                <Sparkles size={16} className="text-brand-400" />
                Support Assistant
              </h4>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">Let us know who you are to start a secure, tenant-isolated chat session with our customer support AI agent.</p>
              
              <form onSubmit={handleStartSession} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Visitor"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 text-white px-3.5 py-2 rounded-xl outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 text-white px-3.5 py-2 rounded-xl outline-none text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  Start Conversation
                  <ChevronRight size={14} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Main Messages Flow */
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.sender === 'user' 
                      ? 'bg-slate-800 border-slate-700 text-slate-200' 
                      : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                  }`}>
                    {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-800 text-slate-100 rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.content || (
                        <div className="flex items-center gap-1 py-1">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                    
                    {/* Render Citations sources */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pl-1 space-y-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sources:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, cidx) => (
                            <div 
                              key={cidx} 
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800/60 text-[10px] text-slate-400 hover:text-slate-200 transition"
                              title={cite.content}
                            >
                              <FileText size={10} className="text-brand-400" />
                              <span className="max-w-[120px] truncate">{cite.filename}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input form bar */}
            <footer className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-brand-500 text-white px-4 py-3 rounded-xl outline-none text-xs disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-4 py-3 bg-[#4c1d95] hover:bg-[#3D1B48] disabled:opacity-40 text-white font-semibold rounded-xl transition flex items-center justify-center shrink-0 shadow-lg shadow-[#4c1d95]/10"
                >
                  <Send size={14} />
                </button>
              </form>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
