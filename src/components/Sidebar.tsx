import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Address = {
  street:        string | null;
  street_number: string | null;
  postcode:      string | null;
  city:          string | null;
  country:       string | null;
};

export type Counterparty = {
  id:         string;
  name:       string | null;
  address:    Address | null;
  tax_number: string | null;
  vat_id:     string | null;
};

export type ReceiptItem = {
  description: string;
  quantity:    number | null;
  unit_price:  number | null;
  total_price: number | null;
  category:    string;
  vat_rate:    number | null;
};

export type Receipt = {
  id:             string;
  receipt_type:   "purchase" | "sale";
  vendor:         string | null;
  counterparty:   Counterparty | null;
  receipt_number: string | null;
  receipt_date:   string | null;
  total_amount:   number | null;
  vat_percentage: number | null;
  vat_amount:     number | null;
  net_amount:     number | null;
  category:       string;
  items:          ReceiptItem[];
  pdf_url:        string | null;
  duplicate?:     boolean;
  message?:       string;
};

// ---------------------------------------------------------------------------
// Shared metadata
// ---------------------------------------------------------------------------

export const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  material:          { label: "Materials",  icon: "solar:box-bold" },
  equipment:         { label: "Equipment",  icon: "teenyicons:computer-outline" },
  software:          { label: "Software",   icon: "hugeicons:software" },
  internet:          { label: "Internet",   icon: "mdi:internet" },
  telecommunication: { label: "Telecom",    icon: "grommet-icons:satellite" },
  travel:            { label: "Travel",     icon: "mdi:airplane" },
  education:         { label: "Education",  icon: "wpf:books" },
  utilities:         { label: "Utilities",  icon: "roentgen:electricity" },
  insurance:         { label: "Insurance",  icon: "carbon:manage-protection" },
  taxes:             { label: "Taxes",      icon: "boxicons:bank-filled" },
  other:             { label: "Other",      icon: "icon-park-solid:other" },
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function fmt(amount: number | null | undefined, currency = "EUR"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
}

export function displayName(r: Receipt): string {
  return r.vendor ?? r.counterparty?.name ?? r.id.slice(0, 8);
}

export function formatAddress(addr: Address | null | undefined): string | null {
  if (!addr) return null;
  const line1 = [addr.street, addr.street_number].filter(Boolean).join(" ");
  const line2 = [addr.postcode, addr.city].filter(Boolean).join(" ");
  return [line1, line2, addr.country].filter(Boolean).join(", ") || null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  receipts:   Receipt[];
  selectedId: string | null;
  onSelect:   (receipt: Receipt) => void;
  onUpload:   (file: File, type: "purchase" | "sale") => void;
  onDelete:   (id: string) => void;
  uploading:  boolean;
  error?:     string | null;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Sidebar({
  receipts, selectedId, onSelect, onUpload, onDelete, uploading, error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [uploadType, setUploadType] = useState<"purchase" | "sale">("purchase");

  const grouped = receipts.reduce<Record<string, Receipt[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  const toggle = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, uploadType);
    e.target.value = "";
  };

  return (
    <aside className="w-60 shrink-0 bg-white border-r-2 border-red-500 flex flex-col overflow-hidden">

      {/* Upload */}
      <div className="p-3 border-b border-black/10 flex flex-col gap-2">
        <div className="flex rounded border border-black/10 overflow-hidden text-xs font-bold">
          {(["purchase", "sale"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setUploadType(t)}
              className={`flex-1 py-1 transition-colors ${
                uploadType === t
                  ? "bg-black text-white"
                  : "bg-white text-black/40 hover:bg-red-50"
              }`}
            >
              {t === "purchase" ? "Expense" : "Revenue"}
            </button>
          ))}
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-2 px-3 rounded border border-red-700 transition-colors"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Processing…
            </>
          ) : (
            <>
              <Icon icon="mdi:upload" className="w-4 h-4" />
              Upload {uploadType === "sale" ? "Invoice" : "Receipt"}
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/tiff,application/pdf"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-pink-600 font-mono leading-relaxed">
          {error}
        </div>
      )}

      {/* Count bar */}
      <div className="px-4 py-2 text-xs text-black/40 font-mono bg-red-50 border-b border-black/10">
        {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
      </div>

      {/* Category groups */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          const isOpen   = !collapsed.has(cat);
          const catTotal = items.reduce((s, r) => s + (r.total_amount ?? 0), 0);

          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-red-50 transition-colors border-b border-black/5"
              >
                <span className="flex items-center gap-1.5 text-black text-xs font-bold uppercase tracking-wider">
                  <Icon icon={meta.icon} className="w-3.5 h-3.5 shrink-0" />
                  {meta.label}
                  <span className="bg-black text-white text-xs rounded-full px-1.5 py-0.5 font-mono leading-none">
                    {items.length}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-red-500 text-xs font-mono font-bold">{fmt(catTotal)}</span>
                  <Icon
                    icon="mdi:chevron-right"
                    className={`w-3.5 h-3.5 text-black/30 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </span>
              </button>

              {isOpen && items.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className={`flex items-start justify-between px-4 py-2 border-l-4 cursor-pointer group transition-colors ${
                    selectedId === r.id
                      ? "border-red-500 bg-red-50"
                      : "border-transparent hover:bg-red-50/50 hover:border-red-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`shrink-0 text-[9px] font-black uppercase px-1 py-0.5 rounded leading-none ${
                        r.receipt_type === "sale"
                          ? "bg-red-500 text-white"
                          : "bg-black/10 text-black/50"
                      }`}>
                        {r.receipt_type === "sale" ? "rev" : "exp"}
                      </span>
                      <span className="text-xs font-semibold text-black truncate">
                        {displayName(r)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-black/40 font-mono">
                        {r.receipt_date ?? "no date"}
                      </span>
                      <span className="text-xs text-red-500 font-mono font-bold">
                        {fmt(r.total_amount)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0 mt-0.5"
                    title="Delete"
                  >
                    <Icon icon="mdi:close" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {receipts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <Icon icon="mdi:receipt-text-outline" className="w-10 h-10 text-black/20" />
            <p className="text-black/40 text-xs leading-relaxed">
              No receipts yet.<br />Upload one to get started.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}