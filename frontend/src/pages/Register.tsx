import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/links');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(username, password);
      navigate('/links');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-widest text-zinc-100 uppercase mb-8 text-center">
          Register
        </h1>
        <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username (3–32 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
              required
              minLength={3}
              maxLength={32}
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-200 text-zinc-950 font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          {error && (
            <div className="mt-4 text-xs font-mono uppercase tracking-wide border-l-2 pl-3 py-1 border-red-500 text-red-400">
              {error}
            </div>
          )}
          <p className="mt-6 text-center text-zinc-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
