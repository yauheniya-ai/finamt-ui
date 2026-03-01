import { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import Sidebar, { type Receipt, type PeriodFilter, DEFAULT_PERIOD, filterByPeriod } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PreviewPanel from "./components/PreviewPanel";
import { type DBInfo } from "./components/DBSelector";
import Footer from "./components/Footer";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function App() {
  const [receipts,  setReceipts]  = useState<Receipt[]>([]);
  const [selected,  setSelected]  = useState<Receipt | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [activeDb,  setActiveDb]  = useState<string | null>(null);
  const [period,    setPeriod]    = useState<PeriodFilter>(DEFAULT_PERIOD);

  const dbQs = activeDb ? `?db=${encodeURIComponent(activeDb)}` : "";

  // All receipts from DB — filtering is client-side
  useEffect(() => {
    fetch(`${API_BASE}/receipts${dbQs}`)
      .then((r) => r.json())
      .then((d) => setReceipts(d.receipts ?? []))
      .catch(() => setError("Could not load receipts from server."));
  }, [activeDb]);

  // Filtered view — passed to Sidebar + Dashboard
  const visibleReceipts = filterByPeriod(receipts, period);

  const handleUpload = useCallback(async (file: File, type: "purchase" | "sale" = "purchase") => {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(
        `${API_BASE}/receipts/upload?receipt_type=${type}${activeDb ? `&db=${encodeURIComponent(activeDb)}` : ""}`,
        { method: "POST", body }
      );
      if (!res.ok) throw new Error((await res.json()).detail ?? "Upload failed.");
      const receipt: Receipt = await res.json();
      setReceipts((prev) => (prev.find((r) => r.id === receipt.id) ? prev : [...prev, receipt]));
      setSelected(receipt);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [activeDb]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/receipts/${id}${dbQs}`, { method: "DELETE" });
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => (prev?.id === id ? null : prev));
    } catch {
      setError("Could not delete receipt.");
    }
  }, [activeDb]);

  const handleSaved = useCallback((updated: Receipt) => {
    setReceipts((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected(updated);
  }, []);

  const handleDbSelect = (db: DBInfo | null) => {
    setActiveDb(db?.path ?? null);
    setSelected(null);
    setReceipts([]);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Header
        apiBase={API_BASE}
        activeDb={activeDb}
        onDbSelect={handleDbSelect}
      />

      {error && (
        <div className="bg-red-50 border-b border-pink-200 px-6 py-2 text-xs text-pink-600 font-mono flex justify-between items-center">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-pink-400 hover:text-pink-700 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          receipts={visibleReceipts}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading}
          error={null}
          period={period}
          onPeriodChange={setPeriod}
        />
        <Dashboard receipts={visibleReceipts} period={period} />
        <PreviewPanel
          receipt={selected}
          apiBase={API_BASE}
          dbPath={activeDb}
          onSaved={handleSaved}
        />
      </div>

      <Footer />
    </div>
  );
}