"use client";

import { useState } from "react";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/shorten`,
      {
        long_url: longUrl,
      },
    );
    setShortUrl(response.data.short_url);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          URL Shortener
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Enter URL"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Shorten
          </button>
        </form>
        {shortUrl && (
          <p className="mt-4 text-center text-gray-800">
            Short URL:{" "}
            <a
              href={shortUrl}
              className="text-blue-500 underline hover:text-blue-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortUrl}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
