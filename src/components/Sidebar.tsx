import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { Icon } from "@iconify/react";
import { CATEGORY_META } from "../constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Address = {
  street_and_number:  string | null;
  address_supplement: string | null;
  postcode:           string | null;
  city:               string | null;
  state:              string | null;
  country:            string | null;
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

export { CATEGORY_META } from "../constants";
export type { CategoryMeta } from "../constants";

export type Receipt = {
  id:             string;
  receipt_type:   "purchase" | "sale";
  vendor:         string | null;
  counterparty:   Counterparty | null;
  receipt_number: string | null;
  receipt_date:   string | null;
  total_amount:      number | null;
  vat_percentage:    number | null;
  vat_amount:        number | null;
  net_amount:        number | null;
  private_use_share: number;          // 0–1; default 0
  business_net:      number | null;
  business_vat:      number | null;
  currency:          string;
  category:       string;
  subcategory:    string | null;
  items:          ReceiptItem[];
  pdf_url:        string | null;
  duplicate?:     boolean;
  message?:       string;
};

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
  return [addr.street_and_number, addr.address_supplement, addr.postcode && addr.city ? `${addr.postcode} ${addr.city}` : addr.postcode || addr.city, addr.state, addr.country].filter(Boolean).join(", ") || null;
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
      className="absolute right-0 top-6 z-20 bg-white border-1 border-black rounded shadow-lg p-3 flex flex-col gap-2 w-55"
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
  onUpload:        (files: File[], type: "purchase" | "sale") => void;
  onDelete:        (id: string) => void;
  uploading:       boolean;
  progressStep?:   string | null;
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

  // Group receipts by supplier name
  const supplierMap = items.reduce<Record<string, Receipt[]>>((acc, r) => {
    const key = displayName(r);
    (acc[key] ??= []).push(r);
    return acc;
  }, {});
  const supplierEntries = Object.entries(supplierMap).sort(([a], [b]) => a.localeCompare(b));

  // Track which supplier sub-groups are expanded (all closed by default)
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const toggleSupplier = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

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
          <span className="text-black text-xs font-mono font-black">{fmt(catTotal)}</span>
          <Icon
            icon="mdi:chevron-right"
            className={`w-3.5 h-3.5 text-black/30 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        </span>
      </button>

      {isOpen && supplierEntries.map(([supplierName, supplierItems]) => {
        const supplierTotal = supplierItems.reduce((s, r) => s + (r.total_amount ?? 0), 0);
        const isSupplierOpen = expandedSuppliers.has(supplierName);
        const hasSelectedItem = supplierItems.some((r) => r.id === selectedId);

        return (
          <div key={supplierName}>
            {/* Supplier sub-header — compact row, total intentionally larger than per-receipt amounts */}
            <button
              onClick={(e) => toggleSupplier(supplierName, e)}
              className={`w-full flex items-center justify-between pl-3 pr-3 py-1 text-left transition-colors border-b border-black/5 ${
                hasSelectedItem ? "bg-red-50/60" : "hover:bg-red-50/40"
              }`}
            >
              <span className="flex items-center gap-1 min-w-0">
                <span className="text-[11px] font-black text-black/30 font-mono tabular-nums w-4 text-right shrink-0">
                  {supplierItems.length}
                </span>
                <span className="text-[10px] font-bold text-black/70 truncate">{supplierName}</span>
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-bold font-mono text-black">{fmt(supplierTotal)}</span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`w-3 h-3 text-black/30 transition-transform ${isSupplierOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {/* Individual receipts under this supplier — single line: date · number · amount */}
            {isSupplierOpen && supplierItems.map((r) => (
              <div
                key={r.id}
                onClick={() => onSelect(r)}
                className={`relative flex items-center justify-between pl-7 pr-3 py-1 border-l-4 cursor-pointer group transition-colors ${
                  selectedId === r.id
                    ? "border-red-500 bg-red-50"
                    : "border-transparent hover:bg-red-50/50 hover:border-red-200"
                }`}
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-[11px] text-black/50 font-mono shrink-0">
                    {r.receipt_date ?? t("sidebar.no_date")}
                  </span>
                  <span className="text-[11px] text-black/30 font-mono truncate min-w-0">
                    {r.receipt_number ?? ""}
                  </span>
                </div>
                <span className="text-[11px] text-black/60 font-mono font-bold shrink-0 ml-2">
                  {fmt(r.total_amount)}
                </span>

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
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section divider
// ---------------------------------------------------------------------------

function SectionDivider({ label, count, total, isRevenue, isOpen, onToggle }: { label: string; count: number; total: number; isRevenue: boolean; isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-black/5 transition-colors"
    >
      <span className="flex items-center gap-1.5">
        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isRevenue ? "bg-black text-amber-400" : "bg-amber-400 text-black"}`}>
          {label}
        </span>
        <span className="bg-black text-white text-xs rounded-full px-1.5 py-0.5 font-mono font-bold leading-none">
          {count}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-xs font-mono font-black">{fmt(total)}</span>
        <Icon
          icon="mdi:chevron-down"
          className={`w-3.5 h-3.5 text-black/30 transition-transform ${isOpen ? "" : "-rotate-90"}`}
        />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// MONTHS rendered via t("sidebar.months") array

export default function Sidebar({
  receipts, selectedId, onSelect, onUpload, onDelete, uploading, progressStep, error,
  period, onPeriodChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsed,    setCollapsed]    = useState<Set<string>>(new Set());
  const [revenueOpen,  setRevenueOpen]  = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(true);
  const { t } = useTranslation();
  const [uploadType,   setUploadType]   = useState<"purchase" | "sale">("purchase");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const grouped = receipts.reduce<Record<string, Receipt[]>>((acc, r) => {
    // Normalize any category not in CATEGORY_META to "other" so it always renders
    const cat = r.category in CATEGORY_META ? r.category : "other";
    (acc[cat] ??= []).push(r);
    return acc;
  }, {});

  const toggle = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onUpload(files, uploadType);
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

  // Category entries preserving CATEGORY_META order
  const allCats = Object.entries(CATEGORY_META);

  const renderGroup = (cat: string, meta: { label: string; icon: string }, type: "purchase" | "sale") => {
    const items = (grouped[cat] ?? [])
      .filter((r) => r.receipt_type === type)
      .sort((a, b) => {
        const nameA = displayName(a).toLowerCase();
        const nameB = displayName(b).toLowerCase();
        if (nameA !== nameB) return nameA < nameB ? -1 : 1;
        // Same name → latest date first
        const dA = a.receipt_date ?? "";
        const dB = b.receipt_date ?? "";
        return dB.localeCompare(dA);
      });
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
    <aside className="w-70 shrink-0 bg-white border-r-2 border-red-500 flex flex-col overflow-hidden">

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
              {progressStep ?? "..."}
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
          multiple
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
            <SectionDivider label={t("sidebar.revenue")} count={sales.length} total={saleTotal} isRevenue={true} isOpen={revenueOpen} onToggle={() => setRevenueOpen((v) => !v)} />
            {revenueOpen && allCats.map(([cat, meta]) => renderGroup(cat, meta, "sale"))}
          </>
        )}

        {/* Expense section */}
        {purchases.length > 0 && (
          <>
            <SectionDivider label={t("sidebar.expenses")} count={purchases.length} total={purchaseTotal} isRevenue={false} isOpen={expensesOpen} onToggle={() => setExpensesOpen((v) => !v)} />
            {expensesOpen && allCats.map(([cat, meta]) => renderGroup(cat, meta, "purchase"))}
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