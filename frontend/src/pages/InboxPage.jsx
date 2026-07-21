import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { MessageCircle, Clock, User, AlertCircle, CheckCircle, Phone, X, Send, ChevronRight } from 'lucide-react';

const InboxPage = () => {
  const { businessId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [responseInput, setResponseInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, archived

  // Fetch chat sessions for the business
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        // Get all chat sessions for this business
        const response = await api.get(`/api/chat/sessions?business_id=${businessId}`);
        setSessions(response.data || []);
      } catch (err) {
        setError('Failed to load chat sessions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchSessions();
    }
  }, [businessId]);

  // Fetch messages for selected session
  useEffect(() => {
    const fetchSessionMessages = async () => {
      if (!selectedSession) return;
      try {
        const response = await api.get(`/api/chat/sessions/${selectedSession.id}/messages`);
        setSessionMessages(response.data || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    if (selectedSession) {
      fetchSessionMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchSessionMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  // Send admin response to customer
  const handleSendResponse = async () => {
    if (!responseInput.trim() || !selectedSession) return;

    try {
      setSendingMessage(true);
      // Send the admin response as a bot message
      const messagePayload = {
        content: responseInput,
        sender: 'admin' // Mark as admin response
      };
      
      await api.post(
        `/api/chat/sessions/${selectedSession.id}/admin-message`,
        messagePayload
      );

      // Clear input and refresh messages
      setResponseInput('');
      const response = await api.get(`/api/chat/sessions/${selectedSession.id}/messages`);
      setSessionMessages(response.data || []);
    } catch (err) {
      console.error('Failed to send response:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Filter sessions based on status
  const filteredSessions = sessions.filter((session) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') {
      const lastMessage = session.messages?.[session.messages.length - 1]?.created_at;
      if (!lastMessage) return true;
      const minutesAgo = (new Date() - new Date(lastMessage)) / 60000;
      return minutesAgo < 60; // Active within last hour
    }
    return false;
  });

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bgDark text-slate-100">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 animate-bounce text-brand-500 mx-auto mb-4" />
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bgDark text-slate-100">
      {/* Sessions List */}
      <div className="w-1/3 border-r border-borderDark flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-borderDark">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-brand-500" />
            Customer Conversations
          </h1>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filterStatus === 'all'
                  ? 'bg-brand-500 text-white'
                  : 'bg-panelDark text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filterStatus === 'active'
                  ? 'bg-brand-500 text-white'
                  : 'bg-panelDark text-slate-400 hover:text-slate-200'
              }`}
            >
              Active
            </button>
          </div>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`p-4 border-b border-borderDark cursor-pointer transition-colors ${
                  selectedSession?.id === session.id
                    ? 'bg-brand-500 bg-opacity-20'
                    : 'hover:bg-panelDark'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <p className="font-semibold text-sm">{session.customer_name || 'Anonymous'}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatTime(session.created_at)}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{session.customer_email || 'No email'}</p>
                <p className="text-xs text-slate-500 truncate">
                  {session.messages?.length || 0} messages
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col bg-bgDark">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-borderDark flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{selectedSession.customer_name || 'Customer'}</h2>
                <p className="text-xs text-slate-400">{selectedSession.customer_email}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded hover:bg-panelDark transition-colors">
                  <Phone className="w-5 h-5 text-slate-400" />
                </button>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 rounded hover:bg-panelDark transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sessionMessages.length === 0 ? (
                <div className="text-center text-slate-400 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                sessionMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-panelDark text-slate-100'
                          : msg.sender === 'admin'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(msg.created_at)}
                      </p>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-opacity-20 border-current text-xs">
                          <p className="font-semibold mb-1">Sources:</p>
                          {msg.citations.map((citation, cidx) => (
                            <p key={cidx} className="opacity-80">• {citation.filename}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Response Input */}
            <div className="p-4 border-t border-borderDark">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={responseInput}
                  onChange={(e) => setResponseInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendResponse()}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 bg-panelDark border border-borderDark rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <button
                  onClick={handleSendResponse}
                  disabled={sendingMessage || !responseInput.trim()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation to get started</p>
              <p className="text-sm mt-2">Click on a customer chat to respond</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
