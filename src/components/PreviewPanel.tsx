import { useState } from "react";
import type { Receipt } from "./Sidebar";
import { fmt, formatAddress, CATEGORY_META } from "./Sidebar";

type Props = {
  receipt:    Receipt | null;
  apiBase:    string;
  onSave?:    (id: string, fields: Record<string, unknown>) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldRow({
  label, value, editing, inputValue, onInput,
}: {
  label:       string;
  value:       React.ReactNode;
  editing?:    boolean;
  inputValue?: string;
  onInput?:    (v: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-black/10 last:border-0">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-24">
        {label}
      </span>
      {editing && onInput != null ? (
        <input
          value={inputValue ?? ""}
          onChange={(e) => onInput(e.target.value)}
          className="flex-1 text-xs text-black font-mono text-right bg-amber-50 border border-amber-300 rounded px-2 py-0.5 outline-none focus:border-amber-500"
        />
      ) : (
        <span className="text-xs text-black font-mono text-right">{value ?? "—"}</span>
      )}
    </div>
  );
}

function Badge({ label, variant = "neutral" }: { label: string; variant?: "purchase" | "sale" | "neutral" }) {
  const styles = {
    purchase: "bg-black/10 text-black/60",
    sale:     "bg-amber-400 text-black",
    neutral:  "bg-black text-white",
  };
  return (
    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${styles[variant]}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <aside className="w-72 shrink-0 bg-white border-l-2 border-amber-400 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-5xl opacity-20">🧾</span>
      <p className="text-black/30 text-xs leading-relaxed font-mono">
        Select a receipt from the sidebar<br />to preview it here.
      </p>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PreviewPanel({ receipt, apiBase, onSave }: Props) {
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [saveErr, setSaveErr]   = useState<string | null>(null);

  // Editable draft — mirrors mutable fields accepted by PATCH /receipts/{id}
  const [draft, setDraft] = useState({
    counterparty_name: "",
    receipt_number:    "",
    receipt_date:      "",
    total_amount:      "",
    vat_percentage:    "",
    vat_amount:        "",
    category:          "",
    receipt_type:      "",
  });

  if (!receipt) return <EmptyState />;

  const counterpartyName = receipt.vendor ?? receipt.counterparty?.name ?? null;
  const address          = formatAddress(receipt.counterparty?.address);

  // -------------------------------------------------------------------------
  // Edit helpers
  // -------------------------------------------------------------------------

  const startEditing = () => {
    setDraft({
      counterparty_name: counterpartyName ?? "",
      receipt_number:    receipt.receipt_number ?? "",
      receipt_date:      receipt.receipt_date ?? "",
      total_amount:      receipt.total_amount?.toString() ?? "",
      vat_percentage:    receipt.vat_percentage?.toString() ?? "",
      vat_amount:        receipt.vat_amount?.toString() ?? "",
      category:          receipt.category ?? "",
      receipt_type:      receipt.receipt_type ?? "purchase",
    });
    setSaved(false);
    setSaveErr(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveErr(null);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    setSaveErr(null);
    try {
      // Build payload — only send non-empty fields
      const payload: Record<string, unknown> = {};
      if (draft.counterparty_name) payload.counterparty_name = draft.counterparty_name;
      if (draft.receipt_number)    payload.receipt_number    = draft.receipt_number;
      if (draft.receipt_date)      payload.receipt_date      = draft.receipt_date;
      if (draft.total_amount)      payload.total_amount      = parseFloat(draft.total_amount);
      if (draft.vat_percentage)    payload.vat_percentage    = parseFloat(draft.vat_percentage);
      if (draft.vat_amount)        payload.vat_amount        = parseFloat(draft.vat_amount);
      if (draft.category)          payload.category          = draft.category;
      if (draft.receipt_type)      payload.receipt_type      = draft.receipt_type;
      await onSave(receipt.id, payload);
      setSaved(true);
      setEditing(false);
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <aside className="w-72 shrink-0 bg-white border-l-2 border-black flex flex-col overflow-hidden">

      {/* Header strip */}
      <div className="px-4 py-3 border-b-2 border-black bg-amber-400 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-black font-mono font-bold truncate">
            {counterpartyName ?? receipt.id.slice(0, 16)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              label={receipt.receipt_type === "sale" ? "revenue" : "expense"}
              variant={receipt.receipt_type === "sale" ? "sale" : "purchase"}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">
              {CATEGORY_META[receipt.category]?.icon} {CATEGORY_META[receipt.category]?.label ?? receipt.category}
            </span>
          </div>
        </div>

        {/* Edit / Cancel button */}
        {!editing ? (
          <button
            onClick={startEditing}
            className="shrink-0 text-xs font-bold bg-black text-white px-2 py-1 rounded hover:bg-black/80 transition-colors"
          >
            Edit
          </button>
        ) : (
          <button
            onClick={cancelEditing}
            className="shrink-0 text-xs font-bold bg-white text-black px-2 py-1 rounded border border-black hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Duplicate warning */}
      {receipt.duplicate && (
        <div className="mx-3 mt-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-700 font-mono">
          ⚠ Duplicate — already in DB
        </div>
      )}

      {/* Save success */}
      {saved && !editing && (
        <div className="mx-3 mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-600 font-mono">
          ✓ Changes saved
        </div>
      )}

      {/* Save error */}
      {saveErr && (
        <div className="mx-3 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-pink-600 font-mono">
          {saveErr}
        </div>
      )}

      {/* PDF preview */}
      {receipt.pdf_url ? (
        <div
          className="bg-amber-50 border-b-2 border-amber-400 flex items-center justify-center overflow-hidden"
          style={{ height: 200 }}
        >
          <iframe
            src={`${apiBase}${receipt.pdf_url}`}
            className="w-full h-full"
            title="Receipt PDF"
          />
        </div>
      ) : (
        <div
          className="bg-amber-50 border-b-2 border-amber-400 flex items-center justify-center text-black/20 text-xs font-mono"
          style={{ height: 80 }}
        >
          No PDF available
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Counterparty */}
        <section>
          <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Counterparty</h3>
          <div className="border-2 border-black rounded px-3 py-1 bg-white">
            <FieldRow
              label="Name"
              value={counterpartyName}
              editing={editing}
              inputValue={draft.counterparty_name}
              onInput={(v) => setDraft((d) => ({ ...d, counterparty_name: v }))}
            />
            <FieldRow label="Address" value={address} />
            {receipt.counterparty?.vat_id && (
              <FieldRow label="VAT ID" value={receipt.counterparty.vat_id} />
            )}
            {receipt.counterparty?.tax_number && (
              <FieldRow label="Steuernr." value={receipt.counterparty.tax_number} />
            )}
          </div>
        </section>

        {/* Receipt header */}
        <section>
          <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Receipt</h3>
          <div className="border-2 border-black rounded px-3 py-1 bg-white">
            <FieldRow
              label="Receipt #"
              value={receipt.receipt_number}
              editing={editing}
              inputValue={draft.receipt_number}
              onInput={(v) => setDraft((d) => ({ ...d, receipt_number: v }))}
            />
            <FieldRow
              label="Date"
              value={receipt.receipt_date}
              editing={editing}
              inputValue={draft.receipt_date}
              onInput={(v) => setDraft((d) => ({ ...d, receipt_date: v }))}
            />
            {editing ? (
              <div className="flex items-start justify-between gap-2 py-2 border-b border-black/10">
                <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-24">Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  className="flex-1 text-xs text-black font-mono text-right bg-amber-50 border border-amber-300 rounded px-2 py-0.5 outline-none focus:border-amber-500"
                >
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <FieldRow label="Category" value={
                CATEGORY_META[receipt.category]
                  ? `${CATEGORY_META[receipt.category].icon} ${CATEGORY_META[receipt.category].label}`
                  : receipt.category
              } />
            )}
          </div>
        </section>

        {/* Amounts */}
        <section>
          <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">Amounts</h3>
          <div className="border-2 border-amber-400 rounded px-3 py-1 bg-amber-50">
            <FieldRow
              label="Total"
              value={fmt(receipt.total_amount)}
              editing={editing}
              inputValue={draft.total_amount}
              onInput={(v) => setDraft((d) => ({ ...d, total_amount: v }))}
            />
            <FieldRow
              label="VAT %"
              value={receipt.vat_percentage != null ? `${receipt.vat_percentage}%` : null}
              editing={editing}
              inputValue={draft.vat_percentage}
              onInput={(v) => setDraft((d) => ({ ...d, vat_percentage: v }))}
            />
            <FieldRow
              label="VAT amt"
              value={fmt(receipt.vat_amount)}
              editing={editing}
              inputValue={draft.vat_amount}
              onInput={(v) => setDraft((d) => ({ ...d, vat_amount: v }))}
            />
            <FieldRow label="Net" value={fmt(receipt.net_amount)} />
          </div>
        </section>

        {/* Line items */}
        {receipt.items?.length > 0 && (
          <section>
            <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">
              Items ({receipt.items.length})
            </h3>
            <div className="border-2 border-black rounded divide-y divide-black/10">
              {receipt.items.map((item, i) => (
                <div key={i} className="px-3 py-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-black font-semibold truncate flex-1">
                      {item.description}
                    </span>
                    <span className="text-xs text-black font-black font-mono shrink-0">
                      {fmt(item.total_price)}
                    </span>
                  </div>
                  {(item.quantity != null || item.unit_price != null || item.vat_rate != null) && (
                    <div className="text-xs text-black/40 font-mono mt-0.5">
                      {item.quantity != null && `${item.quantity}×`}
                      {item.unit_price != null && ` ${fmt(item.unit_price)}`}
                      {item.vat_rate  != null && ` · ${item.vat_rate}% VAT`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ID */}
        <div className="pt-1 border-t border-black/10">
          <p className="text-[10px] text-black/20 font-mono break-all">{receipt.id}</p>
        </div>
      </div>

      {/* Save bar (only shown in edit mode) */}
      {editing && (
        <div className="p-3 border-t-2 border-black bg-white">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm py-2 rounded border border-red-700 transition-colors"
          >
            {saving ? "Saving…" : "Save corrections"}
          </button>
        </div>
      )}
    </aside>
  );
}