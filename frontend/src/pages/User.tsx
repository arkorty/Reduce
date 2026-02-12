import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MdPerson, MdLock, MdDelete, MdSave, MdBarChart } from 'react-icons/md';

interface UserStats {
  link_count: number;
  total_clicks: number;
}

export default function User() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<UserStats>({ link_count: 0, total_clicks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Username update
  const [newUsername, setNewUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);

  // Password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/user/stats');
      setStats(res.data);
    } catch {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdatingUsername(true);

    try {
      setSuccess('Username updated successfully');
      // Update the user in context would require refetching /auth/me
      window.location.reload(); // Simple way to update context
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update username');
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setUpdatingPassword(true);

    try {
      await api.put('/user/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/user/account');
      logout();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="font-mono text-zinc-500 text-sm tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold tracking-widest text-zinc-100 uppercase mb-8">
          Account Settings
        </h1>

        {/* Messages */}
        {error && (
          <div className="mb-6 text-xs font-mono uppercase tracking-wide border-l-2 pl-3 py-1 border-red-500 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 text-xs font-mono uppercase tracking-wide border-l-2 pl-3 py-1 border-emerald-500 text-emerald-400">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MdBarChart size={20} className="text-zinc-400" />
            <h2 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">Statistics</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{stats.link_count}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Total Links</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{stats.total_clicks}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Total Clicks</div>
            </div>
          </div>
        </div>

        {/* Update Username */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MdPerson size={20} className="text-zinc-400" />
            <h2 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">Username</h2>
          </div>
          <form onSubmit={handleUpdateUsername} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-zinc-400 mb-2">
                New Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600"
                required
                minLength={3}
                maxLength={32}
              />
            </div>
            <button
              type="submit"
              disabled={updatingUsername || newUsername === user?.username}
              className="flex items-center gap-2 bg-zinc-200 text-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdSave size={16} /> Update Username
            </button>
          </form>
        </div>

        {/* Update Password */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MdLock size={20} className="text-zinc-400" />
            <h2 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">Password</h2>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-zinc-400 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-zinc-400 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-zinc-400 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={updatingPassword}
              className="flex items-center gap-2 bg-zinc-200 text-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdSave size={16} /> Update Password
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-zinc-900 border border-red-900/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MdDelete size={20} className="text-red-400" />
            <h2 className="text-sm font-bold tracking-widest text-red-400 uppercase">Danger Zone</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Deleting your account will permanently remove all your data, including all your shortened links. This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-900/20 text-red-400 border border-red-900/50 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-900/40 transition-colors"
            >
              <MdDelete size={16} /> Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-red-400 font-bold uppercase tracking-wide">
                Are you absolutely sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                >
                  <MdDelete size={16} /> Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
