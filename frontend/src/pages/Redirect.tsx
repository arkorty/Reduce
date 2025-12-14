import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MdErrorOutline } from "react-icons/md";

export default function Redirect() {
  const { code } = useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!code) return;
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

      try {
        const response = await axios.get(
          `${backendUrl}/reduce/${code}`
        );
        if (response.status === 200 && response.data.lurl) {
          window.location.replace(response.data.lurl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Redirect error:", err);
        setError(true);
      }
    };

    fetchUrl();
  }, [code]);

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
                <MdErrorOutline className="text-red-500 text-5xl" />
            </div>
            <h1 className="text-xl font-bold mb-4 text-zinc-100 uppercase tracking-widest">404 Not Found</h1>
            <p className="text-zinc-500 font-mono text-sm mb-8">
              Link invalid or expired.
            </p>
            <a href="/" className="inline-block w-full">
              <span className="block bg-zinc-200 text-zinc-900 font-bold uppercase tracking-widest py-3 hover:bg-white transition-colors border border-transparent">
                Go Home
              </span>
            </a>
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
