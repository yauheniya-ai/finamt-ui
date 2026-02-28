import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { Receipt, ReceiptItem } from "./Sidebar";
import { fmt, CATEGORY_META } from "./Sidebar";

type Props = {
  receipt:  Receipt | null;
  apiBase:  string;
  dbPath?:  string | null;
  onSaved?: (updated: Receipt) => void;
};

const qs = (dbPath?: string | null) =>
  dbPath ? `?db=${encodeURIComponent(dbPath)}` : "";

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
function Tip({ label, children, pos = "bottom" }: {
  label: string; children: React.ReactNode; pos?: "bottom" | "top" | "left";
}) {
  const posClass = pos === "top" ? "bottom-full mb-1 right-0"
    : pos === "left" ? "right-full mr-1 top-1/2 -translate-y-1/2"
    : "top-full mt-1 right-0";
  return (
    <div className="relative group">
      {children}
      <span className={`pointer-events-none absolute ${posClass} whitespace-nowrap bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRow
// ---------------------------------------------------------------------------
function FieldRow({ label, value, editing, inputValue, onInput, placeholder }: {
  label: string; value: React.ReactNode; editing?: boolean;
  inputValue?: string; onInput?: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10 last:border-0">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">{label}</span>
      {editing && onInput != null ? (
        <input value={inputValue ?? ""} placeholder={placeholder} onChange={(e) => onInput(e.target.value)}
          className="flex-1 min-w-0 text-xs text-black font-mono bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500" />
      ) : (
        <span className="flex-1 min-w-0 text-xs text-black font-mono text-right break-words">{value ?? "—"}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategorySelect
// ---------------------------------------------------------------------------
function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">Category</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs text-black font-mono bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500">
        {Object.entries(CATEGORY_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ItemRow
// ---------------------------------------------------------------------------
type DraftItem = {
  position: number; description: string;
  vat_rate: string; vat_amount: string; total_price: string; category: string;
};

function ItemRow({ item, editing, draft, onChange, onDelete, index }: {
  item: ReceiptItem; editing: boolean; draft: DraftItem;
  onChange: (field: keyof DraftItem, value: string) => void;
  onDelete: () => void; index: number;
}) {
  const pos = item.position ?? index + 1;
  if (!editing) {
    return (
      <div className="px-3 py-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-black text-black/30 font-mono shrink-0 w-4">{pos}.</span>
          <span className="text-xs text-black font-semibold flex-1 min-w-0">{item.description || "—"}</span>
          <span className="text-xs text-black font-black font-mono shrink-0">{fmt(item.total_price)}</span>
        </div>
        <div className="text-xs text-black/40 font-mono mt-0.5 flex gap-2 pl-6">
          {item.vat_rate   != null && <span>{item.vat_rate}% VAT</span>}
          {item.vat_amount != null && <span>{fmt(item.vat_amount)} VAT</span>}
        </div>
      </div>
    );
  }
  return (
    <div className="px-3 py-2 flex flex-col gap-1.5 bg-amber-50/50">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-black/30 font-mono w-4 shrink-0">{draft.position}.</span>
        <input value={draft.description} onChange={(e) => onChange("description", e.target.value)}
          placeholder="Description"
          className="flex-1 text-xs font-semibold text-black bg-white border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500" />
        <button onClick={onDelete} className="shrink-0 text-black/30 hover:text-red-500 transition-colors">
          <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 pl-6">
        {([["vat_rate","VAT %"],["vat_amount","VAT €"],["total_price","Total €"]] as [keyof DraftItem, string][]).map(([field, label]) => (
          <div key={field} className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase text-black/40">{label}</span>
            <input value={draft[field] as string} onChange={(e) => onChange(field, e.target.value)}
              className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VatSplitRow
// ---------------------------------------------------------------------------
type DraftVatSplit = { position: number; vat_rate: string; vat_amount: string };

function VatSplitRow({ split, editing, draft, onChange, onDelete }: {
  split: { position: number; vat_rate: number | null; vat_amount: number | null };
  editing: boolean; draft: DraftVatSplit;
  onChange: (field: keyof DraftVatSplit, value: string) => void;
  onDelete: () => void;
}) {
  if (!editing) {
    return (
      <div className="flex items-center gap-3 py-1.5 border-b border-black/10 last:border-0">
        <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28">VAT {split.position}</span>
        <span className="flex-1 text-xs font-mono text-right text-black/70">
          {split.vat_rate != null ? `${split.vat_rate}%` : "—"}
          {split.vat_rate != null && split.vat_amount != null ? " · " : ""}
          {split.vat_amount != null ? fmt(split.vat_amount) : ""}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-black/10 last:border-0">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-16">VAT {draft.position}</span>
      <input value={draft.vat_rate} onChange={(e) => onChange("vat_rate", e.target.value)}
        placeholder="%" className="w-16 text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500" />
      <input value={draft.vat_amount} onChange={(e) => onChange("vat_amount", e.target.value)}
        placeholder="€" className="flex-1 text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500" />
      <button onClick={onDelete} className="shrink-0 text-black/30 hover:text-red-500 transition-colors">
        <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Verified counterparty picker
// ---------------------------------------------------------------------------
type VerifiedCp = {
  id: string; name: string | null; tax_number: string | null; vat_id: string | null;
  verified: boolean;
  address: { street: string | null; street_number: string | null; postcode: string | null; city: string | null; country: string | null };
};

function VerifiedPicker({ apiBase, dbPath, onSelect }: {
  apiBase: string; dbPath?: string | null; onSelect: (cp: VerifiedCp) => void;
}) {
  const [list, setList]       = useState<VerifiedCp[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${apiBase}/counterparties/verified${qs(dbPath)}`)
      .then((r) => r.json())
      .then((d) => setList(d.counterparties ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <div className="py-2 border-b border-black/10">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[10px] font-bold text-black/60 hover:text-black uppercase tracking-wider transition-colors">
        <Icon icon="mdi:account-check-outline" className="w-3.5 h-3.5" />
        Select from verified
        <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-3 h-3" />
      </button>
      {open && (
        <div className="mt-2 border border-black/10 rounded overflow-hidden">
          {loading ? (
            <div className="px-3 py-2 text-xs text-black/30 font-mono">Loading…</div>
          ) : list.length === 0 ? (
            <div className="px-3 py-2 text-xs text-black/30 font-mono">No verified counterparties yet</div>
          ) : list.map((cp) => (
            <button key={cp.id} onClick={() => { onSelect(cp); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-amber-50 border-b border-black/5 last:border-0 transition-colors">
              <div className="text-xs font-bold text-black">{cp.name ?? "—"}</div>
              <div className="text-[10px] text-black/40 font-mono">{cp.vat_id ?? cp.tax_number ?? ""}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <aside className="w-[380px] shrink-0 bg-white border-l-2 border-red-500 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Icon icon="mdi:receipt-text-outline" className="w-16 h-16 text-black/10" />
      <p className="text-black/30 text-xs leading-relaxed font-mono">
        Select a receipt from the sidebar<br />to preview it here.
      </p>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PreviewPanel({ receipt, apiBase, dbPath, onSaved }: Props) {
  const [editing,          setEditing]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [savedVisible,     setSavedVisible]     = useState(false);
  const [saveErr,          setSaveErr]          = useState<string | null>(null);
  const [pdfOpen,          setPdfOpen]          = useState(false);
  const [addrOpen,         setAddrOpen]         = useState(false);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [splitVat,         setSplitVat]         = useState(false);
  const [vatSplitDrafts,   setVatSplitDrafts]   = useState<DraftVatSplit[]>([]);
  const [itemDrafts,       setItemDrafts]       = useState<DraftItem[]>([]);
  const [verifyConfirm,    setVerifyConfirm]    = useState(false);
  const [localVerified,    setLocalVerified]    = useState<boolean | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({
    counterparty_name: "", vat_id: "", tax_number: "",
    address_street: "", address_street_number: "", address_postcode: "",
    address_city: "", address_country: "",
    receipt_number: "", receipt_date: "", receipt_type: "purchase",
    total_amount: "", vat_percentage: "", vat_amount: "", category: "",
  });

  // Reset local overrides whenever we switch to a different receipt
  useEffect(() => {
    setLocalVerified(null);
    setVerifyConfirm(false);
    setEditing(false);
    setSavedVisible(false);
    setSaveErr(null);
  }, [receipt?.id]);

  if (!receipt) return <EmptyState />;

  const counterpartyName = receipt.vendor ?? receipt.counterparty?.name ?? null;
  const pdfUrl = receipt.pdf_url ? `${apiBase}${receipt.pdf_url}${qs(dbPath)}` : null;
  const receiptSplits = ((receipt as Receipt & { vat_splits?: { position: number; vat_rate: number | null; vat_amount: number | null }[] }).vat_splits ?? []);
  const cpVerifiedFromReceipt = !!(receipt.counterparty as (typeof receipt.counterparty & { verified?: boolean }))?.verified;
  const isVerified = localVerified !== null ? localVerified : cpVerifiedFromReceipt;
  const cpId = receipt.counterparty?.id ?? null;

  // ── Edit helpers ──────────────────────────────────────────────────────────

  const startEditing = () => {
    const addr = receipt.counterparty?.address;
    setDraft({
      counterparty_name:     counterpartyName ?? "",
      vat_id:                receipt.counterparty?.vat_id     ?? "",
      tax_number:            receipt.counterparty?.tax_number ?? "",
      address_street:        addr?.street        ?? "",
      address_street_number: addr?.street_number ?? "",
      address_postcode:      addr?.postcode      ?? "",
      address_city:          addr?.city          ?? "",
      address_country:       addr?.country       ?? "",
      receipt_number:        receipt.receipt_number  ?? "",
      receipt_date:          receipt.receipt_date    ?? "",
      receipt_type:          receipt.receipt_type    ?? "purchase",
      total_amount:          receipt.total_amount?.toString()   ?? "",
      vat_percentage:        receipt.vat_percentage?.toString() ?? "",
      vat_amount:            receipt.vat_amount?.toString()     ?? "",
      category:              receipt.category ?? "",
    });
    setItemDrafts(
      (receipt.items ?? []).map((item, i) => ({
        position:    item.position ?? i + 1,
        description: item.description  ?? "",
        vat_rate:    item.vat_rate?.toString()    ?? "",
        vat_amount:  item.vat_amount?.toString()  ?? "",
        total_price: item.total_price?.toString() ?? "",
        category:    item.category ?? "other",
      }))
    );
    if (receiptSplits.length > 0) {
      setSplitVat(true);
      setVatSplitDrafts(receiptSplits.map((s, i) => ({
        position: s.position ?? i + 1,
        vat_rate: s.vat_rate?.toString() ?? "",
        vat_amount: s.vat_amount?.toString() ?? "",
      })));
    } else {
      setSplitVat(false); setVatSplitDrafts([]);
    }
    setSavedVisible(false); setSaveErr(null); setEditing(true);
  };

  const cancelEditing = () => { setEditing(false); setSaveErr(null); };

  const setItem = (i: number, field: keyof DraftItem, value: string) =>
    setItemDrafts((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const deleteItem = (i: number) => {
    setItemDrafts((prev) => prev.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, position: idx + 1 })));
    setConfirmDeleteIdx(null);
  };

  const addItem = () =>
    setItemDrafts((prev) => [...prev, {
      position: prev.length + 1, description: "", vat_rate: "", vat_amount: "", total_price: "", category: "other",
    }]);

  const setVatSplit = (i: number, field: keyof DraftVatSplit, value: string) =>
    setVatSplitDrafts((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const addVatSplit = () =>
    setVatSplitDrafts((prev) => [...prev, { position: prev.length + 1, vat_rate: "", vat_amount: "" }]);

  const deleteVatSplit = (i: number) =>
    setVatSplitDrafts((prev) => prev.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, position: idx + 1 })));

  const applyVerifiedCp = (cp: VerifiedCp) => {
    setDraft((d) => ({
      ...d,
      counterparty_name:     cp.name                  ?? d.counterparty_name,
      vat_id:                cp.vat_id                ?? d.vat_id,
      tax_number:            cp.tax_number            ?? d.tax_number,
      address_street:        cp.address?.street        ?? d.address_street,
      address_street_number: cp.address?.street_number ?? d.address_street_number,
      address_postcode:      cp.address?.postcode      ?? d.address_postcode,
      address_city:          cp.address?.city          ?? d.address_city,
      address_country:       cp.address?.country       ?? d.address_country,
    }));
    setLocalVerified(true);
  };

  const doVerify = async (newVal: boolean) => {
    setLocalVerified(newVal);
    setVerifyConfirm(false);
    if (cpId) {
      await fetch(`${apiBase}/counterparties/${cpId}/verify${qs(dbPath)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: newVal }),
      }).catch(() => { setLocalVerified(null); });
      onSaved?.(receipt);
    }
    // If no cpId yet, verified flag will be saved with the next handleSave via counterparty_verified
  };

  const handleSave = async () => {
    setSaving(true); setSaveErr(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of [
        ["counterparty_name", draft.counterparty_name], ["receipt_number", draft.receipt_number],
        ["receipt_date", draft.receipt_date], ["receipt_type", draft.receipt_type], ["category", draft.category],
      ] as [string, string][]) { if (v) payload[k] = v; }
      for (const [k, v] of [
        ["total_amount", draft.total_amount], ["vat_percentage", draft.vat_percentage], ["vat_amount", draft.vat_amount],
      ] as [string, string][]) { if (v) payload[k] = parseFloat(v); }
      if (draft.vat_id)     payload.vat_id     = draft.vat_id;
      if (draft.tax_number) payload.tax_number = draft.tax_number;
      if (localVerified !== null) payload.counterparty_verified = localVerified;
      const addr: Record<string, string> = {};
      (["street","street_number","postcode","city","country"] as const).forEach((k, i) => {
        const v = draft[["address_street","address_street_number","address_postcode","address_city","address_country"][i]];
        if (v) addr[k] = v;
      });
      if (Object.keys(addr).length) payload["address"] = addr;
      payload["items"] = itemDrafts.map((d) => ({
        position: d.position, description: d.description || null,
        vat_rate: d.vat_rate ? parseFloat(d.vat_rate) : null,
        vat_amount: d.vat_amount ? parseFloat(d.vat_amount) : null,
        total_price: d.total_price ? parseFloat(d.total_price) : null,
        category: d.category || "other",
      }));
      payload["vat_splits"] = splitVat
        ? vatSplitDrafts.map((s) => ({
            position: s.position,
            vat_rate: s.vat_rate ? parseFloat(s.vat_rate) : null,
            vat_amount: s.vat_amount ? parseFloat(s.vat_amount) : null,
          }))
        : [];

      const res = await fetch(`${apiBase}/receipts/${receipt.id}${qs(dbPath)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`);
      const updated = await res.json();
      setSavedVisible(true); setEditing(false); onSaved?.(updated);
      setTimeout(() => setSavedVisible(false), 3500);
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : "Save failed.");
    } finally { setSaving(false); }
  };

  // ── Verified checkbox widget (always shown) ─────────────────────────────
  const verifiedWidget = (
    <div className="flex items-center gap-1.5">
      {verifyConfirm ? (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-black">
          Confirm verified?
          <button onClick={() => doVerify(true)}
            className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded hover:bg-black/80 transition-colors">
            Yes
          </button>
          <button onClick={() => setVerifyConfirm(false)}
            className="text-[10px] font-black bg-white text-black border border-black/30 px-1.5 py-0.5 rounded hover:bg-black/5 transition-colors">
            No
          </button>
        </span>
      ) : (
        <label className="flex items-center gap-1.5 select-none cursor-pointer text-[10px] font-bold text-black/60 uppercase tracking-wider">
          <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
            isVerified ? "bg-amber-400 border-amber-500" : "bg-white border-black/30"
          }`}>
            {isVerified && <Icon icon="mdi:check" className="w-2.5 h-2.5 text-black" />}
          </span>
          <input type="checkbox" checked={isVerified} className="sr-only"
            onChange={() => {
              if (!isVerified) setVerifyConfirm(true);
              else doVerify(false);
            }}
          />
          Verified
        </label>
      )}
    </div>
  );

  // ── Shared panel content (used in both normal + fullscreen) ─────────────
  const panelContent = (isPdfFullscreen: boolean) => (
    <aside className={`${isPdfFullscreen ? "w-[480px]" : "w-[380px]"} shrink-0 bg-white border-l-2 border-red-500 flex flex-col overflow-hidden`}>

      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-black bg-amber-400 flex items-start justify-between gap-2 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-black font-black truncate">{counterpartyName ?? receipt.id.slice(0, 16)}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
              receipt.receipt_type === "sale" ? "bg-black text-amber-400" : "bg-black/15 text-black/70"
            }`}>{receipt.receipt_type === "sale" ? "revenue" : "expense"}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-black/60 flex items-center gap-1">
              {CATEGORY_META[receipt.category]?.icon && <Icon icon={CATEGORY_META[receipt.category].icon} className="w-3 h-3" />}
              {CATEGORY_META[receipt.category]?.label ?? receipt.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <Tip label="Edit" pos="bottom">
              <button onClick={startEditing} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors">
                <Icon icon="fe:edit" className="w-4 h-4" />
              </button>
            </Tip>
          ) : (
            <button onClick={cancelEditing} className="text-xs font-bold bg-white text-red-500 px-2.5 py-1 rounded border border-red-500 hover:bg-red-50 transition-colors">
              Cancel
            </button>
          )}
          {pdfOpen && (
            <Tip label="Exit fullscreen" pos="bottom">
              <button onClick={() => setPdfOpen(false)} className="bg-black/10 hover:bg-black/20 text-black p-1.5 rounded transition-colors">
                <Icon icon="mdi:fullscreen-exit" className="w-4 h-4" />
              </button>
            </Tip>
          )}
        </div>
      </div>

      {/* Status banners */}
      {receipt.duplicate && (
        <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-700 font-mono flex items-center gap-2">
          <Icon icon="mdi:alert-outline" className="w-3.5 h-3.5 shrink-0" /> Duplicate — already in DB
        </div>
      )}
      {savedVisible && !editing && (
        <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-black font-mono flex items-center gap-2">
          <Icon icon="mdi:check" className="w-3.5 h-3.5 shrink-0" /> Changes saved
        </div>
      )}
      {saveErr && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-pink-600 font-mono flex items-center gap-2">
          <Icon icon="mdi:alert-circle-outline" className="w-3.5 h-3.5 shrink-0" /> {saveErr}
        </div>
      )}

      {/* PDF thumbnail — hidden in fullscreen (PDF is full-width on left) */}
      {!pdfOpen && pdfUrl && (
        <div className="relative shrink-0 border-b-2 border-amber-400" style={{ height: 280 }}>
          <iframe src={pdfUrl} className="w-full h-full bg-amber-50" title="Receipt PDF" />
          <div className="absolute top-2 right-2 group">
            <button onClick={() => setPdfOpen(true)}
              className="bg-black/70 hover:bg-black text-white rounded p-1.5 transition-colors">
              <Icon icon="mdi:fullscreen" className="w-4 h-4" />
            </button>
            <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20">
              Fullscreen
            </span>
          </div>
        </div>
      )}
      {!pdfOpen && !pdfUrl && (
        <div className="shrink-0 bg-amber-50 border-b-2 border-amber-400 flex items-center justify-center gap-2 text-black/30 text-xs font-mono" style={{ height: 64 }}>
          <Icon icon="mdi:file-pdf-box" className="w-4 h-4" /> No PDF available
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">

        {/* Counterparty */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-black text-xs font-black uppercase tracking-wider">Counterparty</h3>
            {verifiedWidget}
          </div>
          <div className="border-2 border-black rounded px-3 py-1">
            {editing && <VerifiedPicker apiBase={apiBase} dbPath={dbPath} onSelect={applyVerifiedCp} />}
            <FieldRow label="Name" value={counterpartyName}
              editing={editing} inputValue={draft.counterparty_name}
              onInput={(v) => setDraft((d) => ({ ...d, counterparty_name: v }))} />
            <FieldRow label="VAT ID" value={receipt.counterparty?.vat_id ?? null}
              editing={editing} inputValue={draft.vat_id}
              onInput={(v) => setDraft((d) => ({ ...d, vat_id: v }))} />
            <FieldRow label="Steuernr." value={receipt.counterparty?.tax_number ?? null}
              editing={editing} inputValue={draft.tax_number}
              onInput={(v) => setDraft((d) => ({ ...d, tax_number: v }))} />
            {/* Address toggle — same in view and edit */}
            <div className="py-2 border-b border-black/10">
              <button onClick={() => setAddrOpen((o) => !o)}
                className="flex items-center gap-1 text-[10px] font-bold text-black/40 hover:text-black uppercase tracking-wider transition-colors">
                <Icon icon={addrOpen ? "mdi:chevron-down" : "mdi:chevron-right"} className="w-3.5 h-3.5" />
                Address
              </button>
            </div>
            {addrOpen && (<>
              <FieldRow label="Street" value={receipt.counterparty?.address?.street}
                editing={editing} inputValue={draft.address_street}
                onInput={(v) => setDraft((d) => ({ ...d, address_street: v }))} />
              <FieldRow label="No." value={receipt.counterparty?.address?.street_number}
                editing={editing} inputValue={draft.address_street_number}
                onInput={(v) => setDraft((d) => ({ ...d, address_street_number: v }))} />
              <FieldRow label="Postcode" value={receipt.counterparty?.address?.postcode}
                editing={editing} inputValue={draft.address_postcode}
                onInput={(v) => setDraft((d) => ({ ...d, address_postcode: v }))} />
              <FieldRow label="City" value={receipt.counterparty?.address?.city}
                editing={editing} inputValue={draft.address_city}
                onInput={(v) => setDraft((d) => ({ ...d, address_city: v }))} />
              <FieldRow label="Country" value={receipt.counterparty?.address?.country}
                editing={editing} inputValue={draft.address_country}
                onInput={(v) => setDraft((d) => ({ ...d, address_country: v }))} />
            </>)}
          </div>
        </section>

        {/* Receipt */}
        <section>
          <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Receipt</h3>
          <div className="border-2 border-black rounded px-3 py-1">
            <FieldRow label="Receipt #" value={receipt.receipt_number}
              editing={editing} inputValue={draft.receipt_number}
              onInput={(v) => setDraft((d) => ({ ...d, receipt_number: v }))} />
            <FieldRow label="Date" value={receipt.receipt_date}
              editing={editing} inputValue={draft.receipt_date} placeholder="YYYY-MM-DD"
              onInput={(v) => setDraft((d) => ({ ...d, receipt_date: v }))} />
            {editing ? (
              <>
                <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
                  <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">Type</span>
                  <select value={draft.receipt_type} onChange={(e) => setDraft((d) => ({ ...d, receipt_type: e.target.value }))}
                    className="flex-1 min-w-0 text-xs font-mono text-black bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500">
                    <option value="purchase">Expense (purchase)</option>
                    <option value="sale">Revenue (sale)</option>
                  </select>
                </div>
                <CategorySelect value={draft.category} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
              </>
            ) : (
              <>
                <FieldRow label="Type" value={receipt.receipt_type} />
                <FieldRow label="Category" value={CATEGORY_META[receipt.category]?.label ?? receipt.category} />
              </>
            )}
          </div>
        </section>

        {/* Amounts */}
        <section>
          <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Amounts</h3>
          <div className="border-2 border-amber-400 rounded px-3 py-1 bg-amber-50">
            <FieldRow label="Total" value={fmt(receipt.total_amount)}
              editing={editing} inputValue={draft.total_amount}
              onInput={(v) => setDraft((d) => ({ ...d, total_amount: v }))} />
            {editing ? (
              <div className="py-2 border-b border-black/10 flex items-center justify-between">
                <span className="text-xs text-black/50 font-bold uppercase tracking-wider">Split VAT</span>
                <button onClick={() => {
                    if (!splitVat && vatSplitDrafts.length === 0)
                      setVatSplitDrafts([
                        { position: 1, vat_rate: draft.vat_percentage, vat_amount: draft.vat_amount },
                        { position: 2, vat_rate: "", vat_amount: "" },
                      ]);
                    setSplitVat((v) => !v);
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                    splitVat ? "bg-amber-400 text-black" : "bg-black/10 text-black/50 hover:bg-black/15"
                  }`}>{splitVat ? "On" : "Off"}</button>
              </div>
            ) : receiptSplits.length > 0 && (
              <div className="py-1.5 border-b border-black/10">
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-wider">Split VAT</span>
              </div>
            )}
            {!editing && receiptSplits.map((s, i) => (
              <VatSplitRow key={i} split={s} editing={false}
                draft={{ position: s.position, vat_rate: "", vat_amount: "" }}
                onChange={() => {}} onDelete={() => {}} />
            ))}
            {editing && splitVat && (<>
              {vatSplitDrafts.map((s, i) => (
                <VatSplitRow key={i} split={{ position: s.position, vat_rate: null, vat_amount: null }}
                  editing={true} draft={s}
                  onChange={(field, value) => setVatSplit(i, field, value)}
                  onDelete={() => deleteVatSplit(i)} />
              ))}
              <div className="py-1.5">
                <button onClick={addVatSplit} className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <Icon icon="mdi:plus-circle-outline" className="w-3.5 h-3.5" /> Add VAT row
                </button>
              </div>
            </>)}
            {(!editing || !splitVat) && receiptSplits.length === 0 && (<>
              <FieldRow label="VAT %"
                value={receipt.vat_percentage != null ? `${receipt.vat_percentage}%` : null}
                editing={editing} inputValue={draft.vat_percentage}
                onInput={(v) => setDraft((d) => ({ ...d, vat_percentage: v }))} />
              <FieldRow label="VAT amt" value={fmt(receipt.vat_amount)}
                editing={editing} inputValue={draft.vat_amount}
                onInput={(v) => setDraft((d) => ({ ...d, vat_amount: v }))} />
            </>)}
            <FieldRow label="Net" value={fmt(receipt.net_amount)} />
          </div>
        </section>

        {/* Items */}
        {(receipt.items?.length > 0 || editing) && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-black text-xs font-black uppercase tracking-wider">
                Items {editing
                  ? (itemDrafts.length > 0 ? `(${itemDrafts.length})` : "")
                  : (receipt.items?.length > 0 ? `(${receipt.items.length})` : "")}
              </h3>
              {editing && (
                <button onClick={addItem} className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <Icon icon="mdi:plus-circle-outline" className="w-3.5 h-3.5" /> Add item
                </button>
              )}
            </div>
            <div className="border-2 border-black rounded divide-y divide-black/10 overflow-hidden">
              {editing ? (
                itemDrafts.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-black/30 font-mono text-center">No items</div>
                ) : itemDrafts.map((d, i) => (
                  <div key={d.position}>
                    <ItemRow index={i}
                      item={{ description: d.description, position: d.position, quantity: null, unit_price: null, total_price: null, vat_rate: null, vat_amount: null, category: d.category } as ReceiptItem}
                      editing={true} draft={d}
                      onChange={(field, value) => setItem(i, field, value)}
                      onDelete={() => setConfirmDeleteIdx(i)} />
                    {confirmDeleteIdx === i && (
                      <div className="px-3 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between gap-2">
                        <span className="text-xs text-red-600 font-bold">Delete item {d.position}?</span>
                        <div className="flex gap-2">
                          <button onClick={() => deleteItem(i)} className="text-[11px] font-black bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 transition-colors">Yes</button>
                          <button onClick={() => setConfirmDeleteIdx(null)} className="text-[11px] font-black bg-white text-red-500 border border-red-400 px-2 py-0.5 rounded hover:bg-red-50 transition-colors">No</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                (receipt.items ?? []).map((item, i) => (
                  <ItemRow key={i} index={i} item={item} editing={false}
                    draft={{ position: item.position ?? i+1, description: "", vat_rate: "", vat_amount: "", total_price: "", category: "other" }}
                    onChange={() => {}} onDelete={() => {}} />
                ))
              )}
            </div>
          </section>
        )}

        {/* ID */}
        <div className="border-t border-black/10 pt-2">
          <p className="text-[10px] text-black/20 font-mono break-all">{receipt.id}</p>
        </div>
      </div>

      {/* Save bar */}
      {editing && (
        <div className="p-3 border-t-2 border-black bg-white shrink-0">
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm py-2 rounded border border-red-700 transition-colors flex items-center justify-center gap-2">
            {saving
              ? <><Icon icon="svg-spinners:12-dots-scale-rotate" className="w-4 h-4" /> Saving…</>
              : <><Icon icon="mdi:content-save-outline" className="w-4 h-4" /> Save</>
            }
          </button>
        </div>
      )}
    </aside>
  );

  // ── Fullscreen layout: PDF left + same panel right ────────────────────────
  if (pdfOpen && pdfUrl) {
    return (
      <div className="fixed inset-0 z-50 flex bg-black">
        {/* PDF side */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-3 py-2 bg-black border-b border-white/10 shrink-0 flex items-center justify-between">
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Receipt PDF</span>
          </div>
          <iframe src={pdfUrl} className="flex-1" title="Receipt PDF fullscreen" />
        </div>
        {/* Data panel — same as normal, full editing available */}
        {panelContent(true)}
      </div>
    );
  }

  return panelContent(false);
}