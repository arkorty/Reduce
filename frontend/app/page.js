"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import dotenv from "dotenv";
import { MdContentCopy } from "react-icons/md";

dotenv.config({ path: "./.env.local" });

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [prevLongUrl, setPrevLongUrl] = useState("");

  useEffect(() => {
    if (prevLongUrl !== longUrl) {
      setShortUrl("");
    }
  }, [longUrl, prevLongUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (longUrl === prevLongUrl && shortUrl) {
      return;
    }

    // Use the frontend domain as the base URL
    const baseURL = window.location.origin;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reduce/shorten`,
        {
          long_url: longUrl,
          base_url: baseURL, // Include the frontend domain in the request body
        },
      );

      setShortUrl(response.data.short_url);
      setPrevLongUrl(longUrl);
    } catch (error) {
      console.error("Error shortening URL:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(shortUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset copy state after 2 seconds
      })
      .catch((error) => {
        console.error("Failed to copy URL:", error);
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Reduce
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
            Reduce
          </button>
        </form>
        {shortUrl && (
          <div className="mt-4 text-center text-gray-800">
            <div className="flex items-center justify-center space-x-2">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-lg underline"
              >
                {shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center p-2 rounded-lg transition duration-200 ${copied ? "text-gray-400" : "text-blue-500 hover:text-blue-600"}`}
                aria-label="Copy to clipboard"
              >
                <MdContentCopy className="text-2xl" />{" "}
                {/* Adjust the size here */}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
