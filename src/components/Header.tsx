import { useState } from "react";


const INSTALL_CMD = "pip install audia";



export default function Header() {

  const [copied, setCopied] = useState(false);



  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between shrink-0">

      {/* Left — title + subtitle */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-4">
          <h1 className="relative isolate inline-block text-2xl font-black font-mono text-black
                         before:absolute before:inset-0 before:bg-purple-500 before:-rotate-3 before:z-[-1]">
            audia
          </h1>
          <span className="text-black/70 text-sm font-medium">
            an agentic Python package that converts PDFs — academic papers, reports, regulations — into podcast-style audio files
          </span>
        </div>

        <div className="flex items-center gap-2">
          <code className="bg-black text-white text-xs font-mono px-2.5 py-0.5 rounded">
            {INSTALL_CMD}
          </code>
          <button
            onClick={copy}
            title="Copy to clipboard"
            className="text-black/30 hover:text-black transition-colors"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="1.5" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

    </header>
  );
}