import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User, Lock, Mail, Save, AlertCircle, Check } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.full_name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Update profile endpoint
      await api.put('/api/auth/profile', {
        full_name: profile.full_name,
        email: profile.email
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Change password endpoint
      await api.post('/api/auth/change-password', {
        current_password: passwords.current,
        new_password: passwords.new
      });

      setPasswords({ current: '', new: '', confirm: '' });
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-bgDark text-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <User className="w-8 h-8 text-brand-500" />
            Account Settings
          </h1>
          <p className="text-slate-400">Manage your profile and security settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-borderDark">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Security
          </button>
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-panelDark border border-borderDark rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" />
              Profile Information
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-400 cursor-not-allowed opacity-75"
                />
                <p className="text-xs text-slate-400 mt-1">
                  To change your email, please contact support
                </p>
              </div>

              {/* User ID */}
              <div>
                <label className="block text-sm font-semibold mb-2">User ID</label>
                <input
                  type="text"
                  value={user?.id || 'N/A'}
                  disabled
                  className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-400 cursor-not-allowed opacity-75"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-panelDark border border-borderDark rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-500" />
                Change Password
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Current Password</label>
                  <input
                    type="password"
                    name="current"
                    value={passwords.current}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold mb-2">New Password</label>
                  <input
                    type="password"
                    name="new"
                    value={passwords.new}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="Enter new password (min. 8 characters)"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Use a strong password with letters, numbers, and symbols
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm"
                    value={passwords.confirm}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 bg-bgDark border border-borderDark rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-50 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h2>
              <p className="text-slate-400 mb-4">
                Logging out will end your current session. You'll need to log in again to access your account.
              </p>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
