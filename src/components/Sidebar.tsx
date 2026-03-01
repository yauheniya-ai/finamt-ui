import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
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
  position:    number | null;
  description: string;
  quantity:    number | null;
  unit_price:  number | null;
  total_price: number | null;
  vat_rate:    number | null;
  vat_amount:  number | null;
  category:    string;
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
  services:          { label: "services",   icon: "mdi:briefcase" },
  consulting:        { label: "consulting", icon: "mdi:head-lightbulb-outline" },
  products:          { label: "products",   icon: "mdi:package-variant-closed" },
  licensing:         { label: "licensing",  icon: "mdi:file-certificate-outline" },
  // ── Expense categories (purchases) ──────────────────────────────────────
  material:          { label: "material",  icon: "solar:box-bold" },
  equipment:         { label: "equipment",  icon: "teenyicons:computer-outline" },
  software:          { label: "software",   icon: "heroicons:cpu-chip-16-solid" },
  internet:          { label: "internet",   icon: "mdi:internet" },
  telecommunication: { label: "telecommunication",    icon: "streamline-flex:satellite-dish-solid" },
  travel:            { label: "travel",     icon: "mdi:airplane" },
  education:         { label: "education",  icon: "wpf:books" },
  utilities:         { label: "utilities",  icon: "roentgen:electricity" },
  insurance:         { label: "insurance",  icon: "carbon:manage-protection" },
  taxes:             { label: "taxes",      icon: "boxicons:bank-filled" },
  other:             { label: "other",      icon: "flowbite:folder-plus-solid" },
};

// Revenue-side categories — used to split sidebar sections
const REVENUE_CATS = new Set(["services", "consulting", "products", "licensing"]);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function fmt(amount: number | null | undefined, currency = "EUR"): string {
  if (amount == null) return "—";
  const locale = i18n.language === "en" ? "en-US" : "de-DE";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
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
  const { t } = useTranslation();
  return (
    <div
      className="absolute right-0 top-6 z-20 bg-white border-2 border-black rounded shadow-lg p-3 flex flex-col gap-2 w-44"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-bold text-black leading-snug">
        {t("sidebar.delete_confirm.title")}
      </p>
      <p className="text-[10px] text-black/50 font-mono leading-relaxed">
        {t("sidebar.delete_confirm.hint")}
      </p>
      <div className="flex gap-1.5 mt-1">
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 rounded transition-colors"
        >
          {t("sidebar.delete_confirm.confirm")}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-black/5 hover:bg-black/10 text-black text-xs font-bold py-1 rounded transition-colors"
        >
          {t("sidebar.delete_confirm.cancel")}
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
  cat: _cat, meta, items, isOpen, selectedId, confirmingId,
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
  const { t } = useTranslation();
  const catTotal = items.reduce((s, r) => s + (r.total_amount ?? 0), 0);

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-red-50 transition-colors border-b border-black/5"
      >
        <span className="flex items-center gap-1.5 text-black text-xs font-bold uppercase tracking-wider min-w-0">
          <Icon icon={meta.icon} className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate" title={t(`sidebar.categories.${meta.label}`, meta.label)}>{t(`sidebar.categories.${meta.label}`, meta.label)}</span>
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
                {r.receipt_date ?? t("sidebar.no_date")}
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

function SectionDivider({ label, count, total, isRevenue }: { label: string; count: number; total: number; isRevenue: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5">
      <span className="flex items-center gap-1.5">
        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isRevenue ? "bg-black text-amber-400" : "bg-amber-400 text-black"}`}>
          {label}
        </span>
        <span className="bg-black text-white text-xs rounded-full px-1.5 py-0.5 font-mono font-bold leading-none">
          {count}
        </span>
      </span>
      <span className="text-[10px] font-mono font-bold">{fmt(total)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// MONTHS rendered via t("sidebar.months") array

export default function Sidebar({
  receipts, selectedId, onSelect, onUpload, onDelete, uploading, error,
  period, onPeriodChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsed,    setCollapsed]    = useState<Set<string>>(new Set());
  const { t } = useTranslation();
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

  const renderGroup = (cat: string, meta: { label: string; icon: string }, type: "purchase" | "sale") => {
    const items = (grouped[cat] ?? []).filter((r) => r.receipt_type === type);
    if (!items.length) return null;
    return (
      <CategoryGroup
        key={`${type}-${cat}`}
        cat={cat}
        meta={meta}
        items={items}
        isOpen={!collapsed.has(`${type}-${cat}`)}
        selectedId={selectedId}
        confirmingId={confirmingId}
        onToggle={() => toggle(`${type}-${cat}`)}
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
          {(["purchase", "sale"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setUploadType(type)}
              className={`flex-1 py-1 transition-colors ${
                uploadType === type
                  ? "bg-black text-white"
                  : "bg-white text-black/40 hover:bg-red-50"
              }`}
            >
              {type === "purchase" ? t("sidebar.expense") : t("sidebar.revenue")}
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
              <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-4 h-4" />
              {t("sidebar.processing")}
            </>
          ) : (
            <>
              <Icon icon="mdi:upload" className="w-4 h-4" />
              {uploadType === "sale" ? t("sidebar.upload_invoice") : t("sidebar.upload_receipt")}
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
              {t(`sidebar.period.${m}`, m)}
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
            {(t("sidebar.months", { returnObjects: true }) as string[]).map((name: string, i: number) => (
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
            <SectionDivider label={t("sidebar.revenue")} count={sales.length} total={saleTotal} isRevenue={true} />
            {revenueCats.map(([cat, meta]) => renderGroup(cat, meta, "sale"))}
            {/* Revenue items that fell into expense categories */}
            {expenseCats.map(([cat, meta]) => renderGroup(cat, meta, "sale"))}
          </>
        )}

        {/* Expense section */}
        {purchases.length > 0 && (
          <>
            <SectionDivider label={t("sidebar.expenses")} count={purchases.length} total={purchaseTotal} isRevenue={false} />
            {expenseCats.map(([cat, meta]) => renderGroup(cat, meta, "purchase"))}
          </>
        )}

        {receipts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <Icon icon="mdi:receipt-text-outline" className="w-10 h-10 text-black/20" />
            <p className="text-black/40 text-xs leading-relaxed">
              {t("sidebar.no_receipts")}<br />{t("sidebar.no_receipts_hint")}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
