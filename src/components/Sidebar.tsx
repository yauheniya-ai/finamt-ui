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
  // ── Revenue categories (sales) ──────────────────────────────────────────
  services:          { label: "Services",   icon: "mdi:briefcase-outline" },
  consulting:        { label: "Consulting", icon: "mdi:head-lightbulb-outline" },
  products:          { label: "Products",   icon: "mdi:package-variant-closed" },
  licensing:         { label: "Licensing",  icon: "mdi:file-certificate-outline" },
  // ── Expense categories (purchases) ──────────────────────────────────────
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

// Revenue-side categories — used to split sidebar sections
const REVENUE_CATS = new Set(["services", "consulting", "products", "licensing"]);

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
// Period filter
// ---------------------------------------------------------------------------

export type PeriodMode = "all" | "year" | "quarter" | "month";

export type PeriodFilter = {
  mode:    PeriodMode;
  year:    number;
  quarter: number;  // 1–4
  month:   number;  // 1–12
};

export const DEFAULT_PERIOD: PeriodFilter = {
  mode:    "all",
  year:    new Date().getFullYear(),
  quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  month:   new Date().getMonth() + 1,
};

export function filterByPeriod(receipts: Receipt[], period: PeriodFilter): Receipt[] {
  if (period.mode === "all") return receipts;
  return receipts.filter((r) => {
    if (!r.receipt_date) return false;
    const d = new Date(r.receipt_date);
    if (isNaN(d.getTime())) return false;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const q = Math.ceil(m / 3);
    if (period.mode === "year")    return y === period.year;
    if (period.mode === "quarter") return y === period.year && q === period.quarter;
    if (period.mode === "month")   return y === period.year && m === period.month;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Delete confirmation popover
// ---------------------------------------------------------------------------

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="absolute right-0 top-6 z-20 bg-white border-2 border-black rounded shadow-lg p-3 flex flex-col gap-2 w-44"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-bold text-black leading-snug">
        Delete from database?
      </p>
      <p className="text-[10px] text-black/50 font-mono leading-relaxed">
        This cannot be undone. The PDF archive is kept.
      </p>
      <div className="flex gap-1.5 mt-1">
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 rounded transition-colors"
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-black/5 hover:bg-black/10 text-black text-xs font-bold py-1 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  receipts:        Receipt[];
  selectedId:      string | null;
  onSelect:        (receipt: Receipt) => void;
  onUpload:        (file: File, type: "purchase" | "sale") => void;
  onDelete:        (id: string) => void;
  uploading:       boolean;
  error?:          string | null;
  period:          PeriodFilter;
  onPeriodChange:  (p: PeriodFilter) => void;
};

// ---------------------------------------------------------------------------
// Category group — shared between revenue and expense sections
// ---------------------------------------------------------------------------

function CategoryGroup({
  cat, meta, items, isOpen, selectedId, confirmingId,
  onToggle, onSelect, onDeleteClick, onDeleteConfirm, onDeleteCancel,
}: {
  cat:             string;
  meta:            { label: string; icon: string };
  items:           Receipt[];
  isOpen:          boolean;
  selectedId:      string | null;
  confirmingId:    string | null;
  onToggle:        () => void;
  onSelect:        (r: Receipt) => void;
  onDeleteClick:   (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel:  () => void;
}) {
  const catTotal = items.reduce((s, r) => s + (r.total_amount ?? 0), 0);

  return (
    <div>
      <button
        onClick={onToggle}
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
          <span className="text-black text-xs font-mono font-bold">{fmt(catTotal)}</span>
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
          className={`relative flex items-start justify-between px-4 py-2 border-l-4 cursor-pointer group transition-colors ${
            selectedId === r.id
              ? "border-red-500 bg-red-50"
              : "border-transparent hover:bg-red-50/50 hover:border-red-200"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`shrink-0 text-[9px] font-black uppercase px-1 py-0.5 rounded leading-none ${
                r.receipt_type === "sale"
                  ? "bg-black text-amber-400"
                  : "bg-amber-400 text-black"
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
              <span className="text-xs text-black font-mono font-bold">
                {fmt(r.total_amount)}
              </span>
            </div>
          </div>

          {/* Delete button + confirmation popover */}
          <div className="relative ml-2 shrink-0 mt-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteClick(r.id); }}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
              title="Delete"
            >
              <Icon icon="mdi:close" className="w-3.5 h-3.5" />
            </button>

            {confirmingId === r.id && (
              <DeleteConfirm
                onConfirm={() => onDeleteConfirm(r.id)}
                onCancel={onDeleteCancel}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section divider
// ---------------------------------------------------------------------------

function SectionDivider({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-black">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
        {label}
      </span>
      <span className="text-[10px] font-mono text-white/50">
        {count} · {fmt(total)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Sidebar({
  receipts, selectedId, onSelect, onUpload, onDelete, uploading, error,
  period, onPeriodChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsed,    setCollapsed]    = useState<Set<string>>(new Set());
  const [uploadType,   setUploadType]   = useState<"purchase" | "sale">("purchase");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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

  const handleDeleteClick  = (id: string) => setConfirmingId(id);
  const handleDeleteCancel = () => setConfirmingId(null);
  const handleDeleteConfirm = (id: string) => {
    setConfirmingId(null);
    onDelete(id);
  };

  // Counts + totals for section headers
  const purchases = receipts.filter((r) => r.receipt_type === "purchase");
  const sales      = receipts.filter((r) => r.receipt_type === "sale");
  const purchaseTotal = purchases.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const saleTotal     = sales.reduce((s, r) => s + (r.total_amount ?? 0), 0);

  // Category entries split by section, preserving CATEGORY_META order
  const revenueCats  = Object.entries(CATEGORY_META).filter(([cat]) => REVENUE_CATS.has(cat));
  const expenseCats  = Object.entries(CATEGORY_META).filter(([cat]) => !REVENUE_CATS.has(cat));

  const renderGroup = (cat: string, meta: { label: string; icon: string }) => {
    const items = grouped[cat];
    if (!items?.length) return null;
    return (
      <CategoryGroup
        key={cat}
        cat={cat}
        meta={meta}
        items={items}
        isOpen={!collapsed.has(cat)}
        selectedId={selectedId}
        confirmingId={confirmingId}
        onToggle={() => toggle(cat)}
        onSelect={onSelect}
        onDeleteClick={handleDeleteClick}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={handleDeleteCancel}
      />
    );
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="#fff" d="M12,23a9.63,9.63,0,0,1-8-9.5,9.51,9.51,0,0,1,6.79-9.1A1.66,1.66,0,0,0,12,2.81h0a1.67,1.67,0,0,0-1.94-1.64A11,11,0,0,0,12,23Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg>
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

      {/* Period filter */}
      <div className="px-3 py-2 border-b border-black/10 bg-white flex flex-col gap-1.5">
        {/* Mode tabs */}
        <div className="flex rounded border border-black/10 overflow-hidden text-[10px] font-bold">
          {(["all", "year", "quarter", "month"] as PeriodMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onPeriodChange({ ...period, mode: m })}
              className={`flex-1 py-1 capitalize transition-colors ${
                period.mode === m
                  ? "bg-black text-white"
                  : "bg-white text-black/40 hover:bg-red-50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Year selector — shown for all modes except "all" */}
        {period.mode !== "all" && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPeriodChange({ ...period, year: period.year - 1 })}
              className="text-black/40 hover:text-black transition-colors"
            >
              <Icon icon="mdi:chevron-left" className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center text-xs font-black font-mono">{period.year}</span>
            <button
              onClick={() => onPeriodChange({ ...period, year: period.year + 1 })}
              className="text-black/40 hover:text-black transition-colors"
            >
              <Icon icon="mdi:chevron-right" className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quarter picker */}
        {period.mode === "quarter" && (
          <div className="flex gap-1">
            {[1,2,3,4].map((q) => (
              <button
                key={q}
                onClick={() => onPeriodChange({ ...period, quarter: q })}
                className={`flex-1 py-0.5 text-[10px] font-black rounded transition-colors ${
                  period.quarter === q
                    ? "bg-red-500 text-white"
                    : "bg-black/5 text-black/50 hover:bg-black/10"
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
        )}

        {/* Month picker */}
        {period.mode === "month" && (
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((name, i) => (
              <button
                key={i}
                onClick={() => onPeriodChange({ ...period, month: i + 1 })}
                className={`py-0.5 text-[10px] font-black rounded transition-colors ${
                  period.month === i + 1
                    ? "bg-red-500 text-white"
                    : "bg-black/5 text-black/50 hover:bg-black/10"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">

        {/* Revenue section */}
        {sales.length > 0 && (
          <>
            <SectionDivider label="Revenue" count={sales.length} total={saleTotal} />
            {revenueCats.map(([cat, meta]) => renderGroup(cat, meta))}
            {/* Revenue items that fell into expense categories */}
            {expenseCats.map(([cat, meta]) => {
              const items = (grouped[cat] ?? []).filter((r) => r.receipt_type === "sale");
              if (!items.length) return null;
              return (
                <CategoryGroup
                  key={`sale-${cat}`}
                  cat={cat}
                  meta={meta}
                  items={items}
                  isOpen={!collapsed.has(`sale-${cat}`)}
                  selectedId={selectedId}
                  confirmingId={confirmingId}
                  onToggle={() => toggle(`sale-${cat}`)}
                  onSelect={onSelect}
                  onDeleteClick={handleDeleteClick}
                  onDeleteConfirm={handleDeleteConfirm}
                  onDeleteCancel={handleDeleteCancel}
                />
              );
            })}
          </>
        )}

        {/* Expense section */}
        {purchases.length > 0 && (
          <>
            <SectionDivider label="Expenses" count={purchases.length} total={purchaseTotal} />
            {expenseCats.map(([cat, meta]) => {
              const items = (grouped[cat] ?? []).filter((r) => r.receipt_type === "purchase");
              if (!items.length) return null;
              return (
                <CategoryGroup
                  key={`purchase-${cat}`}
                  cat={cat}
                  meta={meta}
                  items={items}
                  isOpen={!collapsed.has(`purchase-${cat}`)}
                  selectedId={selectedId}
                  confirmingId={confirmingId}
                  onToggle={() => toggle(`purchase-${cat}`)}
                  onSelect={onSelect}
                  onDeleteClick={handleDeleteClick}
                  onDeleteConfirm={handleDeleteConfirm}
                  onDeleteCancel={handleDeleteCancel}
                />
              );
            })}
          </>
        )}

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