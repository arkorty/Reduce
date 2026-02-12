import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdPerson, MdLogout, MdLink, MdSettings } from 'react-icons/md';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-zinc-100 font-bold tracking-widest uppercase text-sm">
          Reduce
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/links"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
              >
                <MdLink size={16} />
                Links
              </Link>
              <Link
                to="/user"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
                title="Account Settings"
              >
                <MdSettings size={16} />
                Account
              </Link>
              <span className="text-zinc-600 text-xs font-mono flex items-center gap-1">
                <MdPerson size={14} />
                {user.username}
              </span>
              <button
                onClick={logout}
                className="text-zinc-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <MdLogout size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-zinc-200 text-zinc-900 px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
