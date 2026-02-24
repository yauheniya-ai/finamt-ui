import { useState, useCallback } from "react";
import Header from "./components/Header";
import Sidebar, { type Receipt } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PreviewPanel from "./components/PreviewPanel";
import Footer from "./components/Footer";

const API_BASE = "";

export default function App() {
  const [receipts, setReceipts]   = useState<Receipt[]>([]);
  const [selected, setSelected]   = useState<Receipt | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API_BASE}/receipts/upload`, { method: "POST", body });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Upload failed.");
      const receipt: Receipt = await res.json();
      setReceipts((prev) => [...prev, receipt]);
      setSelected(receipt);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/receipts/${id}`, { method: "DELETE" });
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => (prev?.id === id ? null : prev));
    } catch {
      setError("Could not delete receipt.");
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Header />

      {error && (
        <div className="bg-red-50 border-b-2 border-red-500 px-6 py-2 text-xs text-red-700 font-mono flex justify-between items-center">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          receipts={receipts}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading}
        />
        <Dashboard receipts={receipts} />
        <PreviewPanel receipt={selected} apiBase={API_BASE} />
      </div>

      <Footer />
    </div>
  );
}