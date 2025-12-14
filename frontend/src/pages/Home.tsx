import { useState } from 'react';
import axios from 'axios';
import { MdContentCopy, MdCheck, MdRefresh } from 'react-icons/md';
import QRCode from 'react-qr-code';

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [prevLongUrl, setPrevLongUrl] = useState("");
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'idle', msg: string }>({ type: 'idle', msg: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'idle', msg: '' });

    if (longUrl === prevLongUrl && shortUrl) {
      return;
    }

    if (longUrl.trim() === "") {
        return;
    }

    try {
        new URL(longUrl);
    } catch (_) {
        setStatus({ type: 'error', msg: 'Invalid URL' });
        return;
    }

    const baseURL = window.location.origin;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

    try {
      const response = await axios.post(
        `${backendUrl}/reduce/shorten`,
        {
          lurl: longUrl,
          base_url: baseURL,
        },
      );

      setShortUrl(response.data.surl);
      setPrevLongUrl(longUrl);
      setStatus({ type: 'success', msg: '' });
    } catch (error) {
      console.error("Error shortening URL:", error);
      setStatus({ type: 'error', msg: 'Error' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setLongUrl("");
    setShortUrl("");
    setPrevLongUrl("");
    setStatus({ type: 'idle', msg: '' });
    setCopied(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-widest text-zinc-100 uppercase">
            Reduce
          </h1>
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
                        <QRCode value={shortUrl} size={150} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
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
