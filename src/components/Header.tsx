import { useState } from "react";

type Props = {
  onLanguageChange?: (lang: "de" | "en") => void;
};

export default function Header({ onLanguageChange }: Props) {
  const [isEN, setIsEN] = useState(false);

  const toggle = () => {
    const next = !isEN;
    setIsEN(next);
    onLanguageChange?.(next ? "en" : "de");
  };

  return (
    <header className="bg-white border-b-2 border-red-500 px-6 py-4 flex items-center justify-between shrink-0">

      {/* Left — title + subtitle */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-4">
          <h1 className="relative isolate inline-block text-2xl font-black font-mono text-black
                         before:absolute before:inset-0 before:bg-amber-400 before:-rotate-3 before:z-[-1]">
            finanzamt
          </h1>
          <span className="text-black/70 text-sm font-medium">
            a Python library for extracting key information from receipts and preparing essential German tax return statements
          </span>
        </div>
        <div className="flex items-center gap-2">
          <code className="bg-black text-white text-xs font-mono px-2.5 py-0.5 rounded">
            pip install finanzamt
          </code>
        </div>
      </div>

      {/* Right — DE / EN toggle */}
      <div className="inline-flex items-center gap-3 cursor-pointer shrink-0 ml-6 select-none" onClick={toggle}>
        <span className={`text-sm font-black font-mono transition-opacity ${!isEN ? "opacity-100" : "opacity-30"}`}>
          DE
        </span>

        {/* Track */}
        <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${isEN ? "bg-red-500" : "bg-amber-400"}`}>
          {/* Thumb */}
          <div className={`absolute top-[4px] left-[4px] w-4 h-4 bg-black rounded-full transition-transform duration-200 ${isEN ? "translate-x-4" : "translate-x-0"}`} />
        </div>

        <span className={`text-sm font-black font-mono transition-opacity ${isEN ? "opacity-100" : "opacity-30"}`}>
          EN
        </span>
      </div>

    </header>
  );
}