"use client";

import { MdError } from "react-icons/md";
import Link from "next/link";

export default function ServerErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="flex items-center justify-center">
          <MdError className="text-red-500 text-6xl mb-4" />
        </div>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Server Error</h1>
        <p className="text-gray-600 mb-6">
          Oops! Something went wrong on our end. Please try again later.
        </p>
        <Link href="/">
          <a className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200">
            Go Back to Home
          </a>
        </Link>
      </div>
    </div>
  );
}
