import { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import Sidebar, { type Receipt, type PeriodFilter, type TaxpayerProfile, TaxpayerModal, DEFAULT_PERIOD, filterByPeriod } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PreviewPanel from "./components/PreviewPanel";
import { type DBInfo } from "./components/DBSelector";
import Footer from "./components/Footer";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const taxpayerKey = (db: string | null) => `finamt_taxpayer:${db ?? "__default__"}`;

function loadTaxpayer(db: string | null): TaxpayerProfile | null {
  try {
    const saved = localStorage.getItem(taxpayerKey(db));
    return saved ? (JSON.parse(saved) as TaxpayerProfile) : null;
  } catch { return null; }
}

export default function App() {
  const [receipts,  setReceipts]  = useState<Receipt[]>([]);
  const [selected,  setSelected]  = useState<Receipt | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [activeDb,  setActiveDb]  = useState<string | null>(null);
  const [period,    setPeriod]    = useState<PeriodFilter>(DEFAULT_PERIOD);
  const [taxpayer,  setTaxpayer]  = useState<TaxpayerProfile | null>(() => loadTaxpayer(null));
  const [showTaxpayerModal, setShowTaxpayerModal] = useState(false);

  // Reload taxpayer whenever the active DB changes
  useEffect(() => {
    setTaxpayer(loadTaxpayer(activeDb));
  }, [activeDb]);

  const handleTaxpayerChange = useCallback((tp: TaxpayerProfile | null) => {
    setTaxpayer(tp);
    if (tp) localStorage.setItem(taxpayerKey(activeDb), JSON.stringify(tp));
    else    localStorage.removeItem(taxpayerKey(activeDb));
  }, [activeDb]);

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

  const handleUpload = useCallback(async (files: File[], type: "purchase" | "sale" = "purchase") => {
    setUploading(true);
    setProgressStep(null);
    setError(null);
    let lastReceipt: Receipt | null = null;
    const total = files.length;
    for (let i = 0; i < total; i++) {
      const file = files[i];
      const prefix = total > 1 ? `[${i + 1}/${total}] ` : "";
      setProgressStep(prefix + "...");
      try {
        const body = new FormData();
        body.append("file", file);
        const tqs = taxpayer
          ? `&taxpayer_name=${encodeURIComponent(taxpayer.name)}&taxpayer_vat_id=${encodeURIComponent(taxpayer.vat_id)}&taxpayer_tax_number=${encodeURIComponent(taxpayer.tax_number)}&taxpayer_street=${encodeURIComponent(taxpayer.street)}&taxpayer_postcode=${encodeURIComponent(taxpayer.postcode)}&taxpayer_city=${encodeURIComponent(taxpayer.city)}&taxpayer_state=${encodeURIComponent(taxpayer.state)}&taxpayer_country=${encodeURIComponent(taxpayer.country)}`
          : "";
        const url = `${API_BASE}/receipts/upload/stream?receipt_type=${type}${activeDb ? `&db=${encodeURIComponent(activeDb)}` : ""}${tqs}`;
        const res = await fetch(url, { method: "POST", body });
        if (!res.ok || !res.body) throw new Error((await res.json()).detail ?? "Upload failed.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        outer: while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const lines = part.split("\n");
            let eventType = "message";
            let data = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) eventType = line.slice(7).trim();
              else if (line.startsWith("data: ")) data = line.slice(6).trim();
            }
            if (eventType === "progress") {
              const msg: string = JSON.parse(data);
              const m = msg.match(/→\s+(PyMuPDF|PaddleOCR|Tesseract|Agent\s+([1-4]))/);
              if (m) {
                const label = m[2] ? `Agent ${m[2]}/4` : m[1].replace(/\s+/, " ");
                setProgressStep(prefix + label + "...");
              }
            } else if (eventType === "result") {
              lastReceipt = JSON.parse(data) as Receipt;
              // Update sidebar immediately so each completed receipt appears live
              setReceipts((prev) => [
                lastReceipt!,
                ...prev.filter((r) => r.id !== lastReceipt!.id),
              ]);
              break outer;
            } else if (eventType === "error") {
              throw new Error(JSON.parse(data));
            }
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed.";
        setError(total > 1 ? `${file.name}: ${msg}` : msg);
        // Continue processing remaining files
      }
    }

    // Refresh list once after all files processed
    try {
      const listRes = await fetch(`${API_BASE}/receipts${dbQs}`);
      const listData = await listRes.json();
      setReceipts(listData.receipts ?? []);
      if (lastReceipt) setSelected(lastReceipt);
    } catch { /* ignore */ }

    setUploading(false);
    setProgressStep(null);
  }, [activeDb, dbQs, taxpayer]);

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
          progressStep={progressStep}
          error={null}
          period={period}
          onPeriodChange={setPeriod}
          taxpayer={taxpayer}
          onEditTaxpayer={() => setShowTaxpayerModal(true)}
        />
        <Dashboard
          receipts={visibleReceipts}
          period={period}
          taxpayer={taxpayer}
          onEditTaxpayer={() => setShowTaxpayerModal(true)}
        />
        <PreviewPanel
          receipt={selected}
          apiBase={API_BASE}
          dbPath={activeDb}
          onSaved={handleSaved}
        />
      </div>

      <Footer />

      {showTaxpayerModal && (
        <TaxpayerModal
          initial={taxpayer}
          onSave={(tp) => { handleTaxpayerChange(tp); setShowTaxpayerModal(false); }}
          onClear={() => { handleTaxpayerChange(null); setShowTaxpayerModal(false); }}
          onClose={() => setShowTaxpayerModal(false)}
        />
      )}
    </div>
  );
}