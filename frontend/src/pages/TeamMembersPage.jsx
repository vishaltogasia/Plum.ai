import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const TeamMembersPage = () => {
  const { businessId } = useParams();
  const id = businessId || 1;
  const { user } = useAuth();

  const [members, setMembers] = useState([
    { id: 1, full_name: 'Alex Rivera', email: 'alex@plum.ai', role: 'admin', joined_at: '2026-06-01' },
    { id: 2, full_name: 'Sarah Chen', email: 'sarah.c@company.com', role: 'moderator', joined_at: '2026-06-15' },
    { id: 3, full_name: 'Marcus Vance', email: 'marcus.v@company.com', role: 'member', joined_at: '2026-07-02' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [message, setMessage] = useState('');

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const newM = {
      id: Date.now(),
      full_name: newEmail.split('@')[0],
      email: newEmail,
      role: newRole,
      joined_at: new Date().toISOString().split('T')[0]
    };
    setMembers([...members, newM]);
    setNewEmail('');
    setShowAddForm(false);
    setMessage('Team member invited successfully.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRemoveMember = (memberId) => {
    setMembers(members.filter(m => m.id !== memberId));
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#300033]">Team Members & Access Control</h1>
          <p className="text-sm text-[#4f434c] mt-1">Manage team roles, human agent handoffs, and workspace permissions</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-[#300033] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition shadow flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Invite Team Member
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
          {message}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddMember} className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow max-w-xl space-y-4">
          <h2 className="text-lg font-bold text-[#300033]">Invite New Collaborator</h2>
          <div>
            <label className="block text-xs font-bold text-[#300033] uppercase mb-1">Email Address</label>
            <input 
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#300033]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#300033] uppercase mb-1">Assigned Role</label>
            <select 
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full bg-[#fcf1f6] border border-[#d2c2cd] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#300033]"
            >
              <option value="member font-medium">Member (View & Chat)</option>
              <option value="moderator">Moderator (Manage Agents)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="submit"
              className="px-5 py-2 bg-[#300033] text-white rounded-xl font-semibold text-xs hover:opacity-90 transition"
            >
              Send Invitation
            </button>
            <button 
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 border border-[#d2c2cd] text-[#4f434c] rounded-xl font-semibold text-xs hover:bg-[#fcf1f6] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members Table */}
      <div className="bg-white p-6 rounded-xl border border-[#d2c2cd] custom-shadow">
        <h2 className="text-lg font-bold text-[#300033] mb-4">Workspace Collaborators ({members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#f0e5eb] text-xs font-semibold text-[#80737d]">
                <th className="pb-3">User</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Joined</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e5eb]">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="py-3.5 font-bold text-[#300033]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#300033] text-white flex items-center justify-center font-bold text-xs uppercase">
                        {m.full_name.charAt(0)}
                      </div>
                      <span>{m.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-xs text-[#4f434c]">{m.email}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                      m.role === 'admin' ? 'bg-[#300033] text-white' :
                      m.role === 'moderator' ? 'bg-[#be7db9] text-white' :
                      'bg-[#f0e5eb] text-[#300033]'
                    }`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-[#80737d]">{m.joined_at}</td>
                  <td className="py-3.5 text-right">
                    <button 
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-[#80737d] hover:text-[#ba1a1a] transition"
                    >
                      <span className="material-symbols-outlined text-sm">person_remove</span>
                    </button>
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

export default TeamMembersPage;
