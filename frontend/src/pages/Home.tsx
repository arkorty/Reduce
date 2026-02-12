import { useState } from 'react';
import { MdContentCopy, MdCheck, MdRefresh, MdLock, MdTune } from 'react-icons/md';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Home() {
  const { user } = useAuth();
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [prevLongUrl, setPrevLongUrl] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'idle'; msg: string }>({
    type: 'idle',
    msg: '',
  });

  // Advanced options (logged-in users)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [requiresAuth, setRequiresAuth] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'idle', msg: '' });

    if (longUrl === prevLongUrl && shortUrl) return;
    if (longUrl.trim() === '') return;

    try {
      new URL(longUrl);
    } catch {
      setStatus({ type: 'error', msg: 'Invalid URL' });
      return;
    }

    if (!user && requiresAuth) {
      setStatus({ type: 'error', msg: 'Login required for protected links' });
      return;
    }

    // Use r.webark.in for short links in production, otherwise use current origin
    const baseURL = window.location.hostname === 'r.webark.in' 
      ? 'https://r.webark.in'
      : window.location.origin;

    try {
      const payload: Record<string, any> = {
        lurl: longUrl,
        base_url: baseURL,
      };

      if (user && customCode) payload.code = customCode;
      if (user && requiresAuth) {
        payload.requires_auth = true;
      }

      const response = await api.post('/shorten', payload);

      setShortUrl(response.data.surl);
      setPrevLongUrl(longUrl);
      setStatus({ type: 'success', msg: '' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error';
      setStatus({ type: 'error', msg });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setLongUrl('');
    setShortUrl('');
    setPrevLongUrl('');
    setStatus({ type: 'idle', msg: '' });
    setCopied(false);
    setCustomCode('');
    setRequiresAuth(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-widest text-zinc-100 uppercase">Reduce</h1>
          {!user && (
            <p className="text-zinc-600 text-xs mt-2 font-mono">
              Login to create custom codes &amp; manage links
            </p>
          )}
        </header>

        {/* Main Interface */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8">
          {!shortUrl ? (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="https://..."
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
                />

                {/* Advanced options for logged-in users */}
                {user && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors text-xs uppercase tracking-wider self-start"
                    >
                      <MdTune size={14} />
                      {showAdvanced ? 'Hide options' : 'Options'}
                    </button>

                    {showAdvanced && (
                      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-3">
                        <input
                          type="text"
                          placeholder="Custom short code (optional)"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
                          minLength={2}
                          maxLength={32}
                        />

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div
                            className={`w-9 h-5 rounded-full relative transition-colors ${
                              requiresAuth ? 'bg-amber-500' : 'bg-zinc-700'
                            }`}
                            onClick={() => setRequiresAuth(!requiresAuth)}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                requiresAuth ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </div>
                          <span className="text-zinc-500 text-xs uppercase tracking-wider flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
                            <MdLock size={12} /> Protected
                          </span>
                        </label>

                        {requiresAuth && (
                          <div className="pl-4 border-l-2 border-amber-900/50">
                            <p className="text-zinc-600 text-xs">
                              Visitors will need to enter your account credentials to access this link.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  className="w-full bg-zinc-200 text-zinc-950 font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors border border-transparent active:border-zinc-400 active:scale-[0.99]"
                >
                  Reduce
                </button>
              </form>

              {/* Error Indicator */}
              {status.msg && status.type === 'error' && (
                <div className="mt-4 text-xs font-mono uppercase tracking-wide border-l-2 pl-3 py-1 border-red-500 text-red-400">
                  {status.msg}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shortUrl}
                  className="w-full bg-zinc-950 border border-zinc-700 p-3 text-emerald-400 font-mono text-sm focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 p-3 hover:bg-zinc-700 hover:text-white transition-colors"
                  aria-label="Copy"
                >
                  {copied ? <MdCheck size={20} /> : <MdContentCopy size={20} />}
                </button>
              </div>

              <div className="flex justify-center bg-white p-4">
                <QRCode
                  value={shortUrl}
                  size={150}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-zinc-800 text-zinc-300 font-bold uppercase tracking-widest py-3 hover:bg-zinc-700 hover:text-white transition-colors border border-transparent flex items-center justify-center gap-2"
              >
                <MdRefresh size={20} /> Use Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
