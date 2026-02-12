import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MdErrorOutline, MdLock } from 'react-icons/md';
import api from '../lib/api';

export default function Redirect() {
  const { code } = useParams();
  const [error, setError] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!code) return;

      try {
        const response = await api.get(`/reduce/${code}`);
        if (response.data.requires_auth) {
          setNeedsAuth(true);
        } else if (response.data.lurl) {
          window.location.replace(response.data.lurl);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    fetchUrl();
  }, [code]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setVerifying(true);

    try {
      const res = await api.post(`/reduce/${code}/verify`, { username, password });
      if (res.data.lurl) {
        window.location.replace(res.data.lurl);
      } else {
        setAuthError('Unexpected response');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setVerifying(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <MdErrorOutline className="text-red-500 text-5xl" />
          </div>
          <h1 className="text-xl font-bold mb-4 text-zinc-100 uppercase tracking-widest">
            404 Not Found
          </h1>
          <p className="text-zinc-500 font-mono text-sm mb-8">Link invalid or expired.</p>
          <a href="/" className="inline-block w-full">
            <span className="block bg-zinc-200 text-zinc-900 font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors border border-transparent">
              Go Home
            </span>
          </a>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-full p-3">
              <MdLock className="text-amber-400 text-2xl" />
            </div>
          </div>
          <h1 className="text-lg font-bold mb-1 text-zinc-100 uppercase tracking-widest text-center">
            Protected Link
          </h1>
          <p className="text-zinc-600 font-mono text-xs mb-6 text-center">
            Enter credentials to continue
          </p>
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
              required
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-zinc-200 text-zinc-950 font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Continue'}
            </button>
          </form>
          {authError && (
            <div className="mt-4 text-xs font-mono uppercase tracking-wide border-l-2 pl-3 py-1 border-red-500 text-red-400">
              {authError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="font-mono text-zinc-400 text-sm tracking-widest animate-pulse">
        Redirecting...
      </div>
    </div>
  );
}
