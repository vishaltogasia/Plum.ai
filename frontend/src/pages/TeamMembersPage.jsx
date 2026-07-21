import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Users, Plus, Trash2, Shield, AlertCircle, Check, Mail } from 'lucide-react';

const TeamMembersPage = () => {
  const { businessId } = useParams();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  useEffect(() => {
    fetchTeamData();
  }, [businessId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch team info
      const teamRes = await api.get(`/api/teams/${businessId}`);
      setTeamInfo(teamRes.data);
      
      // Fetch team members
      const membersRes = await api.get(`/api/teams/${businessId}/members`);
      setMembers(membersRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await api.post(`/api/teams/${businessId}/members`, {
        email: newMemberEmail,
        role: newMemberRole
      });

      setSuccess('Member added successfully!');
      setNewMemberEmail('');
      setNewMemberRole('member');
      setShowAddForm(false);
      await fetchTeamData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      setError('');
      setSuccess('');
      
      await api.put(`/api/teams/${businessId}/members/${memberId}`, {
        role: newRole
      });

      setSuccess('Member role updated successfully!');
      await fetchTeamData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      await api.delete(`/api/teams/${businessId}/members/${memberId}`);

      setSuccess('Member removed successfully!');
      await fetchTeamData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-bgDark text-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="w-8 h-8 text-brand-500" />
            Team Members
          </h1>
          <p className="text-slate-400">
            {teamInfo && `${teamInfo.members_count} member${teamInfo.members_count !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Add Member Button */}
        <div className="mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Team Member
            </button>
          ) : (
            <div className="bg-panelDark border border-borderDark rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Add New Team Member</h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Admin: Full access | Moderator: Can manage chats | Member: View-only
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
                  >
                    Add Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="bg-panelDark border border-borderDark rounded-lg overflow-hidden">
          {loading && members.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No team members yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bgDark border-b border-borderDark">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-borderDark hover:bg-bgDark transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
                            {(member.full_name || member.email).charAt(0).toUpperCase()}
                          </div>
                          <span>{member.full_name || 'Unnamed'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="w-4 h-4 text-slate-500" />
                          {member.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(member.role)} bg-opacity-20 border ${getRoleBadgeColor(member.role)} border-opacity-30 cursor-pointer`}
                          disabled={loading}
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={loading}
                          className="px-3 py-1 text-red-400 hover:text-red-300 hover:bg-red-500 hover:bg-opacity-20 rounded transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-panelDark border border-borderDark rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              Admin
            </h3>
            <p className="text-sm text-slate-400">Full access to all features and settings</p>
          </div>
          <div className="bg-panelDark border border-borderDark rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Moderator
            </h3>
            <p className="text-sm text-slate-400">Can manage conversations and chats</p>
          </div>
          <div className="bg-panelDark border border-borderDark rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              Member
            </h3>
            <p className="text-sm text-slate-400">View-only access to conversations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMembersPage;
