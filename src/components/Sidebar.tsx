import { useState, useRef } from "react";

export type Receipt = {
  id: string;
  filename: string;
  content_type: string;
  file_url: string;
  category: string;
  extracted: {
    vendor: string | null;
    vendor_address: string | null;
    receipt_number: string | null;
    receipt_date: string | null;
    total_amount: number | null;
    vat_percentage: number | null;
    vat_amount: number | null;
    currency: string;
    notes: string;
    line_items: { description: string; quantity: number | null; unit_price: number | null; total_price: number; category: string; vat_rate: number | null }[];
  };
};

type Props = {
  receipts: Receipt[];
  selectedId: string | null;
  onSelect: (receipt: Receipt) => void;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
};

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  material:          { label: "Materials",         icon: "📦" },
  equipment:         { label: "Equipment",         icon: "🖥️" },
  software:          { label: "Software",          icon: "💾" },
  internet:          { label: "Internet",          icon: "🌐" },
  telecommunication: { label: "Telecommunication", icon: "📱" },
  travel:            { label: "Travel",            icon: "✈️" },
  education:         { label: "Education",         icon: "📚" },
  utilities:         { label: "Utilities",         icon: "⚡" },
  insurance:         { label: "Insurance",         icon: "🛡️" },
  taxes:             { label: "Taxes",             icon: "🏛️" },
  other:             { label: "Other",             icon: "📄" },
};

function fmt(amount: number | null, currency = "EUR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
}

export default function Sidebar({ receipts, selectedId, onSelect, onUpload, onDelete, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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
    if (file) onUpload(file);
    e.target.value = "";
  };

  return (
    <aside className="w-60 shrink-0 bg-white border-r-2 border-amber-400 flex flex-col overflow-hidden">
      {/* Upload */}
      <div className="p-3 border-b border-black/10">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-2 px-3 rounded border border-amber-600 transition-colors"
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-3 3m3-3l3 3" />
              </svg>
              Upload Receipt
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

      {/* Count */}
      <div className="px-4 py-2 text-xs text-black/40 font-mono bg-amber-50 border-b border-black/10">
        {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
      </div>

      {/* Category groups */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          const isOpen = !collapsed.has(cat);
          const catTotal = items.reduce((s, r) => s + (r.extracted.total_amount ?? 0), 0);

          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-50 transition-colors border-b border-black/5"
              >
                <span className="flex items-center gap-1.5 text-black text-xs font-bold uppercase tracking-wider">
                  <span>{meta.icon}</span>
                  {meta.label}
                  <span className="bg-black text-white text-xs rounded-full px-1.5 py-0.5 font-mono leading-none">
                    {items.length}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-700 text-xs font-mono font-bold">{fmt(catTotal)}</span>
                  <svg className={`w-3 h-3 text-black/30 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              {isOpen && items.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className={`flex items-start justify-between px-4 py-2 border-l-4 cursor-pointer group transition-colors ${
                    selectedId === r.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-transparent hover:bg-amber-50/50 hover:border-amber-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-black truncate">
                      {r.extracted.vendor || r.filename}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-black/40 font-mono">{r.extracted.receipt_date ?? "no date"}</span>
                      <span className="text-xs text-amber-700 font-mono font-bold">
                        {fmt(r.extracted.total_amount, r.extracted.currency)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all shrink-0 mt-0.5"
                    title="Delete"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {receipts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="text-4xl">🧾</span>
            <p className="text-black/40 text-xs leading-relaxed">
              No receipts yet.<br />Upload one to get started.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}