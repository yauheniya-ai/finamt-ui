import { useState } from "react";
import { useTranslation } from "react-i18next";
import DBSelector, { type DBInfo } from "./DBSelector";

const INSTALL_CMD = "pip install finanzamt";

type Props = {
  apiBase:          string;
  activeDb:         string | null;
  onDbSelect:       (db: DBInfo | null) => void;
  onLanguageChange?: (lang: "de" | "en") => void;
};

export default function Header({ apiBase, activeDb, onDbSelect, onLanguageChange }: Props) {
  const { t, i18n } = useTranslation();
  const isEN = i18n.language === "en";
  const [copied, setCopied] = useState(false);

  const toggle = () => {
    const next = isEN ? "de" : "en";
    i18n.changeLanguage(next);
    onLanguageChange?.(next);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            {t("header.subtitle")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <code className="bg-black text-white text-xs font-mono px-2.5 py-0.5 rounded">
            {INSTALL_CMD}
          </code>
          <button
            onClick={copy}
            title="Copy to clipboard"
            className="text-black/40 hover:text-black transition-colors"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Right — DB selector + DE/EN toggle */}
      <div className="flex items-center gap-4 shrink-0 ml-6">

        <DBSelector
          apiBase={apiBase}
          activeDb={activeDb}
          onSelect={onDbSelect}
        />

        {/* Divider */}
        <div className="w-px h-5 bg-black/15" />

        {/* Language toggle */}
        <div
          className="inline-flex items-center gap-3 cursor-pointer select-none"
          onClick={toggle}
        >
          <span className={`text-sm font-black font-mono transition-opacity ${!isEN ? "opacity-100" : "opacity-30"}`}>
            DE
          </span>
          <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${isEN ? "bg-red-500" : "bg-amber-400"}`}>
            <div className={`absolute top-[4px] left-[4px] w-4 h-4 bg-black rounded-full transition-transform duration-200 ${isEN ? "translate-x-4" : "translate-x-0"}`} />
          </div>
          <span className={`text-sm font-black font-mono transition-opacity ${isEN ? "opacity-100" : "opacity-30"}`}>
            EN
          </span>
        </div>

      </div>
    </header>
  );
}