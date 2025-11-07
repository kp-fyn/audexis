"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                  <svg
                    className="w-16 h-16 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Error
              </h1>
              <p className="text-lg text-gray-400">
                An error occurred. Please try refreshing the page.
              </p>
            </div>

            <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 text-left max-w-xl mx-auto">
              <div className="text-xs font-mono text-red-400 mb-2">
                Error Details:
              </div>
              <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.digest && (
                <div className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button
                onClick={() => reset()}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-lg font-medium transition-all duration-150 hover:bg-red-700 hover:shadow-lg hover:scale-105"
              >
                <svg
                  className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload Application
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 text-white rounded-lg font-medium transition-all duration-150 hover:bg-gray-700 border border-gray-700"
              >
                Go to Homepage
              </button>
            </div>

            <div className="pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-500">
                If the problem continues, please contact support or report this
                issue on GitHub.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
