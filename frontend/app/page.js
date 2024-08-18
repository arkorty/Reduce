"use client";

import { useState } from "react";
import axios from "axios";
import { MdContentCopy } from "react-icons/md";
import Link from "next/link";
import QRCode from "react-qr-code";

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [prevLongUrl, setPrevLongUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (longUrl === prevLongUrl && shortUrl) {
      return;
    }

    const baseURL = window.location.origin;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reduce/shorten`,
        {
          long_url: longUrl,
          base_url: baseURL,
        },
      );

      setShortUrl(response.data.short_url);
      setPrevLongUrl(longUrl);
    } catch (error) {
      console.error("Error shortening URL:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animated-gradient {
          background-size: 200% 200%;
          animation: gradientFlow 10s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animated-gradient">
        <div className="bg-black bg-opacity-60 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">
            Reduce
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Enter URL"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="border border-gray-300 bg-inherit rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Reduce
            </button>
          </form>
          {shortUrl && (
            <div className="mt-4 text-center text-gray-800">
              <div className="flex items-center justify-center space-x-2">
                <Link
                  href={shortUrl}
                  className="text-blue-400 text-xl underline"
                  passHref
                >
                  {shortUrl}
                </Link>
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center p-2 rounded-lg transition duration-200 ${
                    copied
                      ? "text-slate-400"
                      : "text-blue-400 hover:text-blue-600"
                  }`}
                  aria-label="Copy to clipboard"
                >
                  <MdContentCopy className="text-xl" />
                </button>
              </div>
              <div className="mt-4 flex justify-center">
                <QRCode value={shortUrl} size={320} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
