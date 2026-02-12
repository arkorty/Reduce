import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdContentCopy,
  MdCheck,
  MdLock,
  MdClose,
  MdOpenInNew,
  MdLink,
} from 'react-icons/md';

interface LinkItem {
  id: number;
  user_id: number | null;
  code: string;
  long_url: string;
  is_custom: boolean;
  requires_auth: boolean;
  access_username: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  link?: LinkItem;
}

export default function Links() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) fetchLinks();
  }, [user]);

  const fetchLinks = async () => {
    try {
      const res = await api.get('/links');
      setLinks(res.data || []);
    } catch {
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this link permanently?')) return;
    try {
      await api.delete(`/links/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError('Failed to delete link');
    }
  };

  const handleCopy = (code: string, id: number) => {
    const url = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const baseUrl = window.location.origin;

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="font-mono text-zinc-500 text-sm tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-widest text-zinc-100 uppercase">Your Links</h1>
          <button
            onClick={() => setModal({ open: true, mode: 'create' })}
            className="flex items-center gap-1.5 bg-zinc-200 text-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors"
          >
            <MdAdd size={16} /> New Link
          </button>
        </div>

        {error && (
          <div className="mb-6 text-xs font-mono uppercase tracking-wide border-l-2 pl-3 py-1 border-red-500 text-red-400">
            {error}
          </div>
        )}

        {/* Links */}
        {links.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-12 text-center">
            <MdLink size={40} className="mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500 font-mono text-sm mb-4">No links yet</p>
            <button
              onClick={() => setModal({ open: true, mode: 'create' })}
              className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm underline"
            >
              Create your first link
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-zinc-900 border border-zinc-800 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3"
              >
                {/* Link info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-400 font-mono text-sm truncate">
                      {baseUrl}/{link.code}
                    </span>
                    {link.is_custom && (
                      <span className="text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-400 px-1.5 py-0.5 border border-zinc-700">
                        Custom
                      </span>
                    )}
                    {link.requires_auth && (
                      <span className="text-[10px] uppercase tracking-wider bg-amber-950/50 text-amber-400 px-1.5 py-0.5 border border-amber-900/50 flex items-center gap-0.5">
                        <MdLock size={10} /> Protected
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs font-mono truncate">{link.long_url}</p>
                  <p className="text-zinc-700 text-xs mt-1">
                    {link.click_count} click{link.click_count !== 1 ? 's' : ''} ·{' '}
                    {new Date(link.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(link.code, link.id)}
                    className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Copy short URL"
                  >
                    {copiedId === link.id ? <MdCheck size={16} /> : <MdContentCopy size={16} />}
                  </button>
                  <a
                    href={link.long_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Open long URL"
                  >
                    <MdOpenInNew size={16} />
                  </a>
                  <button
                    onClick={() => setModal({ open: true, mode: 'edit', link })}
                    className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Edit"
                  >
                    <MdEdit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title="Delete"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <LinkModal
          mode={modal.mode}
          link={modal.link}
          onClose={() => setModal({ open: false, mode: 'create' })}
          onSaved={fetchLinks}
        />
      )}
    </div>
  );
}

// ---------- Link Create/Edit Modal ----------

interface LinkModalProps {
  mode: 'create' | 'edit';
  link?: LinkItem;
  onClose: () => void;
  onSaved: () => void;
}

function LinkModal({ mode, link, onClose, onSaved }: LinkModalProps) {
  const { user } = useAuth();
  const [longUrl, setLongUrl] = useState(link?.long_url || '');
  const [code, setCode] = useState(link?.code || '');
  const [requiresAuth, setRequiresAuth] = useState(link?.requires_auth || false);
  const [useOwnCredentials, setUseOwnCredentials] = useState(true);
  const [accessUsername, setAccessUsername] = useState(link?.access_username || '');
  const [accessPassword, setAccessPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // If editing a link with custom credentials (not matching user), default to custom mode
  useEffect(() => {
    if (link && link.access_username && link.access_username !== user?.username) {
      setUseOwnCredentials(false);
    }
  }, [link, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (mode === 'create') {
        // Use r.webark.in for short links in production, otherwise use current origin
        const baseURL = window.location.hostname === 'r.webark.in'
          ? 'https://r.webark.in'
          : window.location.origin;
        await api.post('/reduce/shorten', {
          lurl: longUrl,
          base_url: baseURL,
          code: code || undefined,
          requires_auth: requiresAuth,
          access_username: requiresAuth && accessUsername ? accessUsername : undefined,
          access_password: requiresAuth && accessPassword ? accessPassword : undefined,
        });
      } else if (link) {
        const body: Record<string, any> = {};
        if (code !== link.code) body.code = code;
        if (longUrl !== link.long_url) body.long_url = longUrl;
        if (requiresAuth !== link.requires_auth) body.requires_auth = requiresAuth;
        if (requiresAuth) {
          if (accessUsername) body.access_username = accessUsername;
          if (accessPassword) body.access_password = accessPassword;
        }
        await api.put(`/links/${link.id}`, body);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">
            {mode === 'create' ? 'New Link' : 'Edit Link'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
              Long URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
              Short Code <span className="text-zinc-700">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="my-custom-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
              minLength={2}
              maxLength={32}
            />
          </div>

          {/* Requires Auth Toggle */}
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
            <span className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-1.5 group-hover:text-zinc-200 transition-colors">
              <MdLock size={14} /> Require authentication
            </span>
          </label>

          {/* Auth credentials */}
          {requiresAuth && (
            <div className="flex flex-col gap-3 pl-4 border-l-2 border-amber-900/50">
              <label className="flex items-center gap-2 cursor-pointer group text-xs">
                <input
                  type="checkbox"
                  checked={useOwnCredentials}
                  onChange={(e) => setUseOwnCredentials(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  Use my account credentials
                </span>
              </label>

              {useOwnCredentials ? (
                <p className="text-zinc-600 text-xs">
                  Visitors will need to enter your account username and password to access this link.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
                      Access Username
                    </label>
                    <input
                      type="text"
                      placeholder="visitor_username"
                      value={accessUsername}
                      onChange={(e) => setAccessUsername(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
                      required={requiresAuth && !useOwnCredentials}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">
                      Access Password{' '}
                      {mode === 'edit' && (
                        <span className="text-zinc-700">(leave blank to keep current)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 p-3 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all font-mono text-sm"
                      required={mode === 'create' && requiresAuth && !useOwnCredentials}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="text-xs font-mono uppercase tracking-wide border-l-2 pl-3 py-1 border-red-500 text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-zinc-200 text-zinc-950 font-bold uppercase tracking-widest py-3 text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-zinc-800 text-zinc-400 font-bold uppercase tracking-widest text-sm hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
