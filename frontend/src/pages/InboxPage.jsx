import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const InboxPage = () => {
  const { businessId } = useParams();
  const id = businessId || 1;

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [intervened, setIntervened] = useState(false);
  const [inputMsg, setInputMsg] = useState('');

  const [conversations, setConversations] = useState([
    {
      id: 1,
      customerName: 'Sarah Jenkins',
      email: 'sarah.j@acme.corp',
      time: '10:42 AM',
      preview: 'I received the wrong item order #9821. Need a refund immediately.',
      status: 'human_needed', // human_needed, ai_active, resolved
      unread: true,
      location: 'San Francisco, CA',
      device: 'Chrome / macOS',
      sentiment: 'Frustrated (0.2)',
      suggestedResponse: "Hello Sarah, I apologize for the mix-up with order #9821. I can issue an immediate replacement or process a full refund to your original payment method. Which would you prefer?",
      messages: [
        {
          id: 1,
          sender: 'user',
          text: 'Hi, I ordered a Plum Enterprise plan last week and received invoice #9821 for double the amount. Can someone assist?',
          time: '10:38 AM'
        },
        {
          id: 2,
          sender: 'ai',
          text: 'Hello Sarah! I see your invoice #9821 for $2,400. Let me check your account tier in our billing records.',
          time: '10:39 AM',
          citation: 'Billing_Terms.pdf'
        },
        {
          id: 3,
          sender: 'user',
          text: 'This is urgent, my card was charged twice! I need human support right now.',
          time: '10:41 AM'
        }
      ]
    },
    {
      id: 2,
      customerName: 'David Kolar',
      email: 'd.kolar@techsys.io',
      time: '09:15 AM',
      preview: 'How do I add webhook endpoints for my custom agent events?',
      status: 'ai_active',
      unread: false,
      location: 'Austin, TX',
      device: 'Firefox / Linux',
      sentiment: 'Neutral (0.7)',
      suggestedResponse: "You can add webhook endpoints under Workspace Settings -> API & Webhooks -> Add Webhook Endpoint.",
      messages: [
        {
          id: 1,
          sender: 'user',
          text: 'How do I add webhook endpoints for my custom agent events?',
          time: '09:14 AM'
        },
        {
          id: 2,
          sender: 'ai',
          text: 'You can configure webhook endpoints directly in your Workspace Settings under the "API & Webhooks" card. Paste your endpoint URL and select trigger events like "Human Intervention Required".',
          time: '09:15 AM',
          citation: 'API_Documentation.pdf'
        }
      ]
    },
    {
      id: 3,
      customerName: 'Elena Rostova',
      email: 'elena@biotech.de',
      time: 'Yesterday',
      preview: 'Thanks, that resolved my issue with SSO SAML login.',
      status: 'resolved',
      unread: false,
      location: 'Berlin, Germany',
      device: 'Safari / iOS',
      sentiment: 'Positive (0.9)',
      suggestedResponse: "You're very welcome! Let us know if you need anything else.",
      messages: [
        {
          id: 1,
          sender: 'user',
          text: 'SSO setup complete. Thanks for the guidance!',
          time: 'Yesterday'
        },
        {
          id: 2,
          sender: 'ai',
          text: 'Glad to help! Your enterprise workspace is now fully secured with SAML 2.0.',
          time: 'Yesterday',
          citation: 'SSO_Setup_Guide.pdf'
        }
      ]
    }
  ]);

  const currentChat = conversations.find(c => c.id === selectedChatId) || conversations[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: intervened ? 'agent' : 'user',
      text: inputMsg,
      time: 'Just now'
    };

    setConversations(prev => prev.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          messages: [...c.messages, newMsg],
          preview: inputMsg
        };
      }
      return c;
    }));

    setInputMsg('');
  };

  const handleApplySuggested = (text) => {
    setInputMsg(text);
  };

  const filteredConversations = conversations.filter(c => {
    if (activeFilter === 'human') return c.status === 'human_needed';
    if (activeFilter === 'resolved') return c.status === 'resolved';
    return true;
  });

  return (
    <div className="h-screen bg-[#fff7fa] flex flex-col overflow-hidden">
      {/* Inbox Grid Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Messages List */}
        <div className="w-80 bg-white border-r border-[#d2c2cd] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#f0e5eb]">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-[#300033]">Inbox</h1>
              <span className="px-2.5 py-0.5 bg-[#4a154b] text-white text-xs font-bold rounded-full">
                24 Active
              </span>
            </div>
            
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#80737d] text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-9 pr-3 py-2 bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#300033]"
              />
            </div>

            <div className="flex gap-1 bg-[#fcf1f6] p-1 rounded-lg text-xs font-semibold text-[#4f434c]">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-1 rounded-md transition ${activeFilter === 'all' ? 'bg-white text-[#300033] shadow-sm' : 'hover:text-[#300033]'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('human')}
                className={`flex-1 py-1 rounded-md transition ${activeFilter === 'human' ? 'bg-white text-[#300033] shadow-sm' : 'hover:text-[#300033]'}`}
              >
                Human Needed
              </button>
              <button 
                onClick={() => setActiveFilter('resolved')}
                className={`flex-1 py-1 rounded-md transition ${activeFilter === 'resolved' ? 'bg-white text-[#300033] shadow-sm' : 'hover:text-[#300033]'}`}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#f0e5eb]">
            {filteredConversations.map((c) => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedChatId(c.id);
                  setIntervened(c.status === 'human_needed');
                }}
                className={`p-4 cursor-pointer transition ${selectedChatId === c.id ? 'bg-[#fcf1f6] border-l-4 border-[#300033]' : 'hover:bg-[#fff7fa]'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-[#300033]">{c.customerName}</h4>
                  <span className="text-[10px] text-[#80737d]">{c.time}</span>
                </div>
                <p className="text-xs text-[#4f434c] line-clamp-2 mb-2">{c.preview}</p>
                
                <div>
                  {c.status === 'human_needed' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                      HUMAN NEEDED
                    </span>
                  )}
                  {c.status === 'ai_active' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                      AI ACTIVE
                    </span>
                  )}
                  {c.status === 'resolved' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">
                      RESOLVED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Main Active Chat Area */}
        <div className="flex-1 flex flex-col bg-[#fff7fa]">
          {/* Active Chat Header */}
          <div className="p-4 bg-white border-b border-[#d2c2cd] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#300033] text-white flex items-center justify-center font-bold">
                {currentChat.customerName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base text-[#300033]">{currentChat.customerName}</h3>
                <p className="text-xs text-[#80737d]">
                  {intervened ? 'Human Agent Intervened (AI Paused)' : 'Awaiting human intervention'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 border border-[#d2c2cd] text-xs font-semibold text-[#4f434c] hover:bg-[#f6ebf0] rounded-xl transition">
                View CRM Profile
              </button>
              <button 
                onClick={() => setIntervened(!intervened)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shadow ${
                  intervened ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-[#300033] text-white hover:opacity-90'
                }`}
              >
                {intervened ? 'Resume AI Agent' : 'Intervene Now'}
              </button>
            </div>
          </div>

          {/* Chat Messages Transcript */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* System Alert Banner */}
            {currentChat.status === 'human_needed' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-xs font-medium max-w-lg mx-auto">
                <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
                AI confidence dropped below 40% (Billing dispute) — Triggered Human Handoff Rule.
              </div>
            )}

            {currentChat.messages.map((m) => (
              <div 
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#d6e0f6] text-[#121c2c] flex items-center justify-center font-bold text-xs shrink-0">
                    {currentChat.customerName.charAt(0)}
                  </div>
                )}
                
                <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-md ${
                  m.sender === 'user'
                    ? 'bg-white text-[#1f1a1e] border border-[#d2c2cd] rounded-tl-none shadow-sm'
                    : m.sender === 'agent'
                    ? 'bg-[#4a154b] text-white rounded-tr-none shadow'
                    : 'bg-gradient-to-r from-[#4a154b] to-[#300033] text-white rounded-tr-none shadow'
                }`}>
                  <div className="flex items-center justify-between mb-1 opacity-80 text-[10px]">
                    <span className="font-bold">
                      {m.sender === 'user' ? currentChat.customerName : m.sender === 'agent' ? 'Human Agent' : 'Plum AI Assistant'}
                    </span>
                    <span>{m.time}</span>
                  </div>
                  <p>{m.text}</p>

                  {m.citation && (
                    <div className="mt-2 pt-2 border-t border-white/20 text-[10px] text-[#ffd6f8] flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-xs">auto_stories</span>
                      Ref: {m.citation}
                    </div>
                  )}
                </div>

                {m.sender !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#4a154b] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <span className="material-symbols-outlined text-xs">smart_toy</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#d2c2cd]">
            <div className="flex items-center gap-2 mb-2 text-[#80737d]">
              <button type="button" className="p-1.5 hover:bg-[#fcf1f6] rounded-lg transition" title="Attach file">
                <span className="material-symbols-outlined text-sm">attach_file</span>
              </button>
              <button type="button" className="p-1.5 hover:bg-[#fcf1f6] rounded-lg transition" title="Add emoji">
                <span className="material-symbols-outlined text-sm">sentiment_satisfied</span>
              </button>
              <button type="button" className="p-1.5 hover:bg-[#fcf1f6] rounded-lg transition" title="Quick KB snippet">
                <span className="material-symbols-outlined text-sm">auto_stories</span>
              </button>
              <span className="text-[10px] text-[#80737d] ml-auto font-medium">
                {intervened ? 'Mode: Live Human Override' : 'Mode: AI Copilot Active'}
              </span>
            </div>

            <div className="flex gap-3">
              <textarea 
                rows={2}
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder={intervened ? "Type message as Human Agent..." : "Type response or edit AI copilot draft..."}
                className="flex-1 bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-[#300033] resize-none"
              />
              <button 
                type="submit"
                disabled={!inputMsg.trim()}
                className="px-6 bg-[#300033] text-white font-semibold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow self-end py-3"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>

        {/* Column 3: Context Sidebar */}
        <div className="w-80 bg-white border-l border-[#d2c2cd] p-6 space-y-6 overflow-y-auto shrink-0 hidden xl:block">
          {/* Customer Details */}
          <div>
            <h3 className="text-sm font-bold text-[#300033] mb-3">Customer Profile</h3>
            <div className="space-y-2 text-xs text-[#4f434c]">
              <div className="flex justify-between">
                <span className="text-[#80737d]">Email:</span>
                <span className="font-medium text-[#1f1a1e]">{currentChat.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#80737d]">Location:</span>
                <span className="font-medium text-[#1f1a1e]">{currentChat.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#80737d]">Client:</span>
                <span className="font-medium text-[#1f1a1e]">{currentChat.device}</span>
              </div>
            </div>
          </div>

          <hr className="border-[#f0e5eb]" />

          {/* AI Insights Card */}
          <div className="bg-[#fcf1f6] p-4 rounded-xl border border-[#d2c2cd]">
            <h3 className="text-xs font-bold text-[#300033] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#4a154b]">auto_awesome</span>
              AI Copilot Insights
            </h3>
            <div className="mb-3">
              <span className="text-[10px] text-[#80737d] block uppercase font-semibold">Detected Sentiment</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                {currentChat.sentiment}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#80737d] block uppercase font-semibold mb-1">Suggested AI Response</span>
              <p className="text-xs text-[#4f434c] bg-white p-3 rounded-lg border border-[#d2c2cd] leading-relaxed mb-2">
                "{currentChat.suggestedResponse}"
              </p>
              <button 
                onClick={() => handleApplySuggested(currentChat.suggestedResponse)}
                className="w-full py-1.5 bg-[#4a154b] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
              >
                Use Response Draft
              </button>
            </div>
          </div>

          <hr className="border-[#f0e5eb]" />

          {/* Knowledge Base References */}
          <div>
            <h3 className="text-sm font-bold text-[#300033] mb-3">Cited KB Documents</h3>
            <div className="space-y-2">
              <div className="p-2.5 bg-[#fcf1f6] rounded-lg border border-[#d2c2cd] flex items-center gap-2 cursor-pointer hover:bg-[#f6ebf0] transition">
                <span className="material-symbols-outlined text-sm text-[#300033]">description</span>
                <span className="text-xs font-medium text-[#300033]">Billing_Terms.pdf</span>
              </div>
              <div className="p-2.5 bg-[#fcf1f6] rounded-lg border border-[#d2c2cd] flex items-center gap-2 cursor-pointer hover:bg-[#f6ebf0] transition">
                <span className="material-symbols-outlined text-sm text-[#300033]">description</span>
                <span className="text-xs font-medium text-[#300033]">Refund_Policy.pdf</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
