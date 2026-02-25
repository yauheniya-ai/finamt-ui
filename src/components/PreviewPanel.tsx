import { useState } from "react";
import { Icon } from "@iconify/react";
import type { Receipt, ReceiptItem } from "./Sidebar";
import { fmt, formatAddress, CATEGORY_META } from "./Sidebar";

type Props = {
  receipt:  Receipt | null;
  apiBase:  string;
  dbPath?:  string | null;   // passed as ?db= to all API calls
  onSaved?: (updated: Receipt) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const qs = (dbPath?: string | null) =>
  dbPath ? `?db=${encodeURIComponent(dbPath)}` : "";

// ---------------------------------------------------------------------------
// FieldRow — display or inline-edit a single field
// ---------------------------------------------------------------------------

function FieldRow({
  label, value, editing, inputValue, onInput, placeholder,
}: {
  label:        string;
  value:        React.ReactNode;
  editing?:     boolean;
  inputValue?:  string;
  onInput?:     (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10 last:border-0">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">
        {label}
      </span>
      {editing && onInput != null ? (
        <input
          value={inputValue ?? ""}
          placeholder={placeholder}
          onChange={(e) => onInput(e.target.value)}
          className="flex-1 min-w-0 text-xs text-black font-mono bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500"
        />
      ) : (
        <span className="flex-1 min-w-0 text-xs text-black font-mono text-right break-words">
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategorySelect
// ---------------------------------------------------------------------------

function CategorySelect({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">
        Category
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs text-black font-mono bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500"
      >
        {Object.entries(CATEGORY_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ItemRow — editable line item
// ---------------------------------------------------------------------------

type DraftItem = {
  description: string;
  quantity:    string;
  unit_price:  string;
  total_price: string;
  vat_rate:    string;
  category:    string;
};

function ItemRow({
  item, editing, draft, onChange,
}: {
  item:     ReceiptItem;
  editing:  boolean;
  draft:    DraftItem;
  onChange: (field: keyof DraftItem, value: string) => void;
}) {
  if (!editing) {
    return (
      <div className="px-3 py-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-xs text-black font-semibold flex-1 min-w-0">{item.description}</span>
          <span className="text-xs text-black font-black font-mono shrink-0">{fmt(item.total_price)}</span>
        </div>
        {(item.quantity != null || item.unit_price != null || item.vat_rate != null) && (
          <div className="text-xs text-black/40 font-mono mt-0.5">
            {item.quantity != null && `${item.quantity}×`}
            {item.unit_price != null && ` ${fmt(item.unit_price)}`}
            {item.vat_rate  != null && ` · ${item.vat_rate}% VAT`}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 flex flex-col gap-1.5 bg-amber-50/50">
      <input
        value={draft.description}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="Description"
        className="w-full text-xs font-semibold text-black bg-white border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500"
      />
      <div className="grid grid-cols-4 gap-1">
        {([
          ["qty",       "quantity",    "Qty"],
          ["unit_price","unit_price",  "Unit €"],
          ["total",     "total_price", "Total €"],
          ["vat",       "vat_rate",    "VAT %"],
        ] as [string, keyof DraftItem, string][]).map(([, field, label]) => (
          <div key={field} className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase text-black/40">{label}</span>
            <input
              value={draft[field]}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF full-screen overlay
// ---------------------------------------------------------------------------

function PDFOverlay({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 py-2 bg-black border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white text-xs font-mono font-bold">Receipt PDF</span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <Icon icon="mdi:close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <iframe src={url} className="w-full h-full" title="Receipt PDF fullscreen" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <aside className="w-[380px] shrink-0 bg-white border-l-2 border-amber-400 flex flex-col items-center justify-center gap-3 p-8 text-center">
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
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [saveErr,  setSaveErr]  = useState<string | null>(null);
  const [pdfOpen,  setPdfOpen]  = useState(false);

  // ── Draft state ────────────────────────────────────────────────────────────
  const [draft, setDraft] = useState({
    counterparty_name:   "",
    vat_id:              "",
    tax_number:          "",
    address_street:      "",
    address_street_number: "",
    address_postcode:    "",
    address_city:        "",
    address_country:     "",
    receipt_number:      "",
    receipt_date:        "",
    receipt_type:        "purchase" as "purchase" | "sale",
    total_amount:        "",
    vat_percentage:      "",
    vat_amount:          "",
    category:            "",
  });

  const [itemDrafts, setItemDrafts] = useState<DraftItem[]>([]);

  if (!receipt) return <EmptyState />;

  const counterpartyName = receipt.vendor ?? receipt.counterparty?.name ?? null;
  const address          = formatAddress(receipt.counterparty?.address);
  const pdfUrl           = receipt.pdf_url ? `${apiBase}${receipt.pdf_url}${qs(dbPath)}` : null;

  // ── Edit helpers ───────────────────────────────────────────────────────────

  const startEditing = () => {
    const addr = receipt.counterparty?.address;
    setDraft({
      counterparty_name:     counterpartyName ?? "",
      vat_id:                receipt.counterparty?.vat_id     ?? "",
      tax_number:            receipt.counterparty?.tax_number ?? "",
      address_street:        addr?.street        ?? "",
      address_street_number: addr?.street_number ?? "",
      address_postcode:      addr?.postcode       ?? "",
      address_city:          addr?.city           ?? "",
      address_country:       addr?.country        ?? "",
      receipt_number:        receipt.receipt_number   ?? "",
      receipt_date:          receipt.receipt_date     ?? "",
      receipt_type:          receipt.receipt_type     ?? "purchase",
      total_amount:          receipt.total_amount?.toString()   ?? "",
      vat_percentage:        receipt.vat_percentage?.toString() ?? "",
      vat_amount:            receipt.vat_amount?.toString()     ?? "",
      category:              receipt.category ?? "",
    });
    setItemDrafts(
      (receipt.items ?? []).map((item) => ({
        description: item.description ?? "",
        quantity:    item.quantity?.toString()   ?? "",
        unit_price:  item.unit_price?.toString() ?? "",
        total_price: item.total_price?.toString() ?? "",
        vat_rate:    item.vat_rate?.toString()   ?? "",
        category:    item.category ?? "other",
      }))
    );
    setSaved(false);
    setSaveErr(null);
    setEditing(true);
  };

  const cancelEditing = () => { setEditing(false); setSaveErr(null); };

  const setItem = (i: number, field: keyof DraftItem, value: string) =>
    setItemDrafts((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      const payload: Record<string, unknown> = {};

      // Scalar fields — only include non-empty
      const scalars: [string, string][] = [
        ["counterparty_name", draft.counterparty_name],
        ["receipt_number",    draft.receipt_number],
        ["receipt_date",      draft.receipt_date],
        ["receipt_type",      draft.receipt_type],
        ["category",          draft.category],
      ];
      for (const [k, v] of scalars) if (v) payload[k] = v;

      const nums: [string, string][] = [
        ["total_amount",   draft.total_amount],
        ["vat_percentage", draft.vat_percentage],
        ["vat_amount",     draft.vat_amount],
      ];
      for (const [k, v] of nums) if (v) payload[k] = parseFloat(v);

      // Counterparty scalar fields
      if (draft.vat_id)     payload.vat_id     = draft.vat_id;
      if (draft.tax_number) payload.tax_number = draft.tax_number;

      // Address — only if any field changed
      const addrKeys = ["street","street_number","postcode","city","country"] as const;
      const addrDraftKeys = [
        "address_street","address_street_number",
        "address_postcode","address_city","address_country"
      ] as const;
      const addr: Record<string, string> = {};
      addrKeys.forEach((k, i) => { if (draft[addrDraftKeys[i]]) addr[k] = draft[addrDraftKeys[i]]; });
      if (Object.keys(addr).length) payload["address"] = addr;

      const res = await fetch(
        `${apiBase}/receipts/${receipt.id}${qs(dbPath)}`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setSaved(true);
      setEditing(false);
      onSaved?.(updated);
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {pdfOpen && pdfUrl && (
        <PDFOverlay url={pdfUrl} onClose={() => setPdfOpen(false)} />
      )}

      <aside className="w-[380px] shrink-0 bg-white border-l-2 border-black flex flex-col overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b-2 border-black bg-amber-400 flex items-start justify-between gap-2 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-black font-black truncate">
              {counterpartyName ?? receipt.id.slice(0, 16)}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
                receipt.receipt_type === "sale" ? "bg-black text-amber-400" : "bg-black/15 text-black/70"
              }`}>
                {receipt.receipt_type === "sale" ? "revenue" : "expense"}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-black/60 flex items-center gap-1">
                {CATEGORY_META[receipt.category]?.icon && (
                  <Icon icon={CATEGORY_META[receipt.category].icon} className="w-3 h-3" />
                )}
                {CATEGORY_META[receipt.category]?.label ?? receipt.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!editing ? (
              <button
                onClick={startEditing}
                className="text-xs font-bold bg-black text-white px-2.5 py-1 rounded hover:bg-black/80 transition-colors"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={cancelEditing}
                className="text-xs font-bold bg-white text-black px-2.5 py-1 rounded border border-black hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── Status banners ──────────────────────────────────────────── */}
        {receipt.duplicate && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-700 font-mono flex items-center gap-2">
            <Icon icon="mdi:alert-outline" className="w-3.5 h-3.5 shrink-0" />
            Duplicate — already in DB
          </div>
        )}
        {saved && !editing && (
          <div className="mx-4 mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-600 font-mono flex items-center gap-2">
            <Icon icon="mdi:check-circle-outline" className="w-3.5 h-3.5 shrink-0" />
            Changes saved
          </div>
        )}
        {saveErr && (
          <div className="mx-4 mt-3 px-3 py-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-600 font-mono flex items-center gap-2">
            <Icon icon="mdi:alert-circle-outline" className="w-3.5 h-3.5 shrink-0" />
            {saveErr}
          </div>
        )}

        {/* ── PDF preview ─────────────────────────────────────────────── */}
        {pdfUrl ? (
          <div className="relative shrink-0 border-b-2 border-amber-400" style={{ height: 280 }}>
            <iframe
              src={pdfUrl}
              className="w-full h-full bg-amber-50"
              title="Receipt PDF"
            />
            <button
              onClick={() => setPdfOpen(true)}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded p-1.5 transition-colors"
              title="Open fullscreen"
            >
              <Icon icon="mdi:fullscreen" className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className="shrink-0 bg-amber-50 border-b-2 border-amber-400 flex items-center justify-center gap-2 text-black/30 text-xs font-mono"
            style={{ height: 64 }}
          >
            <Icon icon="mdi:file-pdf-box" className="w-4 h-4" />
            No PDF available
          </div>
        )}

        {/* ── Scrollable body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">

          {/* Counterparty */}
          <section>
            <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Counterparty</h3>
            <div className="border-2 border-black rounded px-3 py-1">
              <FieldRow
                label="Name"  value={counterpartyName}
                editing={editing} inputValue={draft.counterparty_name}
                onInput={(v) => setDraft((d) => ({ ...d, counterparty_name: v }))}
              />
              <FieldRow
                label="Street"  value={receipt.counterparty?.address?.street}
                editing={editing} inputValue={draft.address_street}
                onInput={(v) => setDraft((d) => ({ ...d, address_street: v }))}
              />
              <FieldRow
                label="No."  value={receipt.counterparty?.address?.street_number}
                editing={editing} inputValue={draft.address_street_number}
                onInput={(v) => setDraft((d) => ({ ...d, address_street_number: v }))}
              />
              <FieldRow
                label="Postcode"  value={receipt.counterparty?.address?.postcode}
                editing={editing} inputValue={draft.address_postcode}
                onInput={(v) => setDraft((d) => ({ ...d, address_postcode: v }))}
              />
              <FieldRow
                label="City"  value={receipt.counterparty?.address?.city}
                editing={editing} inputValue={draft.address_city}
                onInput={(v) => setDraft((d) => ({ ...d, address_city: v }))}
              />
              <FieldRow
                label="Country"  value={receipt.counterparty?.address?.country}
                editing={editing} inputValue={draft.address_country}
                onInput={(v) => setDraft((d) => ({ ...d, address_country: v }))}
              />
              <FieldRow
                label="VAT ID"  value={receipt.counterparty?.vat_id ?? null}
                editing={editing} inputValue={draft.vat_id}
                onInput={(v) => setDraft((d) => ({ ...d, vat_id: v }))}
              />
              <FieldRow
                label="Steuernr."  value={receipt.counterparty?.tax_number ?? null}
                editing={editing} inputValue={draft.tax_number}
                onInput={(v) => setDraft((d) => ({ ...d, tax_number: v }))}
              />
            </div>
          </section>

          {/* Receipt */}
          <section>
            <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Receipt</h3>
            <div className="border-2 border-black rounded px-3 py-1">
              <FieldRow
                label="Receipt #"  value={receipt.receipt_number}
                editing={editing} inputValue={draft.receipt_number}
                onInput={(v) => setDraft((d) => ({ ...d, receipt_number: v }))}
              />
              <FieldRow
                label="Date"  value={receipt.receipt_date}
                editing={editing} inputValue={draft.receipt_date} placeholder="YYYY-MM-DD"
                onInput={(v) => setDraft((d) => ({ ...d, receipt_date: v }))}
              />
              {editing ? (
                <>
                  <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
                    <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">Type</span>
                    <select
                      value={draft.receipt_type}
                      onChange={(e) => setDraft((d) => ({ ...d, receipt_type: e.target.value as "purchase" | "sale" }))}
                      className="flex-1 min-w-0 text-xs font-mono text-black bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500"
                    >
                      <option value="purchase">Expense (purchase)</option>
                      <option value="sale">Revenue (sale)</option>
                    </select>
                  </div>
                  <CategorySelect
                    value={draft.category}
                    onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
                  />
                </>
              ) : (
                <>
                  <FieldRow label="Type" value={receipt.receipt_type} />
                  <FieldRow label="Category" value={
                    CATEGORY_META[receipt.category]
                      ? `${CATEGORY_META[receipt.category].label}`
                      : receipt.category
                  } />
                </>
              )}
            </div>
          </section>

          {/* Amounts */}
          <section>
            <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Amounts</h3>
            <div className="border-2 border-amber-400 rounded px-3 py-1 bg-amber-50">
              <FieldRow
                label="Total"  value={fmt(receipt.total_amount)}
                editing={editing} inputValue={draft.total_amount}
                onInput={(v) => setDraft((d) => ({ ...d, total_amount: v }))}
              />
              <FieldRow
                label="VAT %"
                value={receipt.vat_percentage != null ? `${receipt.vat_percentage}%` : null}
                editing={editing} inputValue={draft.vat_percentage}
                onInput={(v) => setDraft((d) => ({ ...d, vat_percentage: v }))}
              />
              <FieldRow
                label="VAT amt"  value={fmt(receipt.vat_amount)}
                editing={editing} inputValue={draft.vat_amount}
                onInput={(v) => setDraft((d) => ({ ...d, vat_amount: v }))}
              />
              <FieldRow label="Net" value={fmt(receipt.net_amount)} />
            </div>
          </section>

          {/* Items */}
          {(receipt.items?.length > 0 || editing) && (
            <section>
              <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">
                Items {receipt.items?.length > 0 && `(${receipt.items.length})`}
              </h3>
              <div className="border-2 border-black rounded divide-y divide-black/10 overflow-hidden">
                {(receipt.items ?? []).map((item, i) => (
                  <ItemRow
                    key={i}
                    item={item}
                    editing={editing}
                    draft={itemDrafts[i] ?? {
                      description: item.description, quantity: "",
                      unit_price: "", total_price: "", vat_rate: "", category: "other",
                    }}
                    onChange={(field, value) => setItem(i, field, value)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ID */}
          <div className="border-t border-black/10 pt-2">
            <p className="text-[10px] text-black/20 font-mono break-all">{receipt.id}</p>
          </div>
        </div>

        {/* ── Save bar ────────────────────────────────────────────────── */}
        {editing && (
          <div className="p-3 border-t-2 border-black bg-white shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm py-2 rounded border border-red-700 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Icon icon="mdi:content-save-outline" className="w-4 h-4" />
                  Save corrections
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
