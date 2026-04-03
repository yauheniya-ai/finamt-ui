import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { IconChevronDown, IconClose, IconDelete, IconPlusCircle, IconSpinner } from "../constants/icons";
import type { Receipt, ReceiptItem } from "./Sidebar";
import { fmt, CATEGORY_META } from "./Sidebar";
import type { CategoryMeta } from "./Sidebar";
import { CATEGORY_SUBCATEGORIES } from "../constants";
import { useTranslation } from "react-i18next";

type Props = {
  receipt:  Receipt | null;
  apiBase:  string;
  dbPath?:  string | null;
  onSaved?: (updated: Receipt) => void;
};

const qs = (dbPath?: string | null) =>
  dbPath ? `?db=${encodeURIComponent(dbPath)}` : "";

/** Parse a user-typed decimal string that may use a comma as the decimal
 *  separator (German locale: "195,66" → 195.66).  Falls back to NaN just
 *  like the native parseFloat so callers can check with isNaN(). */
const parseDecimal = (v: string) => parseFloat(v.replace(",", "."));

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
function Tip({ label, children, pos = "bottom" }: {
  label: string; children: React.ReactNode; pos?: "bottom" | "top" | "left" | "bottom-right";
}) {
  const posClass = pos === "top" ? "bottom-full mb-1 right-0"
    : pos === "left" ? "right-full mr-1 top-1/2 -translate-y-1/2"
    : pos === "bottom-right" ? "top-full mt-1 left-0"
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[value] as CategoryMeta | undefined;

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">
        {t("preview.field_category")}
      </span>

      <div className="relative flex-1 min-w-0">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-1.5 text-xs text-black font-mono bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500 cursor-pointer"
        >
          {meta && <Icon icon={meta.icon} className="shrink-0 text-base" />}
          <span className="flex-1 text-left truncate">
            {t(`sidebar.categories.${value}`, { defaultValue: meta?.label ?? value })}
          </span>
          <IconChevronDown className={`shrink-0 text-base transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <ul
            className="absolute z-30 mt-1 w-full bg-white border border-amber-300 rounded shadow-lg max-h-56 overflow-y-auto"
            onMouseLeave={() => setOpen(false)}
          >
            {(Object.entries(CATEGORY_META) as [string, CategoryMeta][]).map(([k, v]) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => { onChange(k); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs font-mono text-left hover:bg-amber-50 transition-colors ${k === value ? "bg-amber-100 font-bold" : ""}`}
                >
                  <Icon icon={v.icon} className="shrink-0 text-base" />
                  <span>{t(`sidebar.categories.${k}`, { defaultValue: v.label })}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SubcategorySelect
// ---------------------------------------------------------------------------
function SubcategorySelect({
  category, value, onChange,
}: { category: string; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const [customInput, setCustomInput] = useState("");
  const [showCustom,  setShowCustom]  = useState(false);

  const builtIn = CATEGORY_SUBCATEGORIES[category] ?? [];
  // Collect custom entries stored in localStorage per category
  const storageKey = `finamt_subcats_${category}`;
  const getCustom = (): string[] => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { return []; }
  };
  const saveCustom = (list: string[]) =>
    localStorage.setItem(storageKey, JSON.stringify(list));

  const [extraSubs, setExtraSubs] = useState<string[]>(getCustom);

  const allSubs = [...builtIn, ...extraSubs.filter((s) => !builtIn.includes(s))];

  const handleSelect = (v: string) => {
    onChange(v);
    setShowCustom(false);
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!allSubs.includes(trimmed)) {
      const updated = [...extraSubs, trimmed];
      setExtraSubs(updated);
      saveCustom(updated);
    }
    onChange(trimmed);
    setCustomInput("");
    setShowCustom(false);
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">
        {t("preview.field_subcategory", { defaultValue: "Subcategory" })}
      </span>
      <div className="relative flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex gap-1">
          <select
            value={value}
            onChange={(e) => handleSelect(e.target.value)}
            className="flex-1 text-xs font-mono text-black bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500"
          >
            <option value="">—</option>
            {allSubs.map((s) => (
              <option key={s} value={s}>{t(`sidebar.subcategories.${s}`, { defaultValue: s })}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowCustom((o) => !o)}
            className="text-[10px] font-bold text-black/50 hover:text-black border border-black/20 hover:border-black px-2 rounded transition-colors"
            title={t("preview.subcategory_add_custom", { defaultValue: "Add custom" })}
          >
            <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
          </button>
        </div>
        {showCustom && (
          <div className="flex gap-1">
            <input
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); if (e.key === "Escape") setShowCustom(false); }}
              placeholder={t("preview.subcategory_placeholder", { defaultValue: "Custom subcategory…" })}
              className="flex-1 text-xs font-mono text-black bg-white border border-amber-400 rounded px-2 py-1 outline-none focus:border-amber-500"
            />
            <button type="button" onClick={handleAddCustom}
              className="text-[10px] font-black bg-black text-white px-2 rounded hover:bg-black/80 transition-colors">
              {t("preview.btn_add", { defaultValue: "Add" })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Currency symbol helper: $ USD, £ GBP, € EUR, otherwise 3-letter code
// ---------------------------------------------------------------------------
function currSymbol(currency: string): string {
  const sym = (() => {
    try {
      const parts = new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
        .formatToParts(0);
      return parts.find((p) => p.type === "currency")?.value ?? currency;
    } catch { return currency; }
  })();
  // Keep only if it's actually a symbol (not same as code); fallback to code
  return sym === currency || sym.length > 3 ? currency : sym;
}

// ---------------------------------------------------------------------------
// CurrencyConverter — fetches live rate from Frankfurter, reports it upward
// ---------------------------------------------------------------------------
function CurrencyConverter({
  currency,
  onRateChange,
}: {
  currency: string;
  onRateChange: (rate: number | null) => void;
}) {
  const { t } = useTranslation();
  const [rate,       setRate]       = useState<number | null>(null);
  const [rateDate,   setRateDate]   = useState<string | null>(null);
  const [customRate, setCustomRate] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Fetch live rate whenever the currency changes
  useEffect(() => {
    setRate(null); setRateDate(null); setCustomRate(""); setError(null);
    onRateChange(null);
    if (!currency || currency === "EUR") return;
    setLoading(true);
    fetch(`https://api.frankfurter.app/latest?from=${currency}&to=EUR`)
      .then((r) => r.json())
      .then((d) => { setRate(d.rates?.EUR ?? null); setRateDate(d.date ?? null); })
      .catch(() => setError("Rate unavailable"))
      .finally(() => setLoading(false));
  }, [currency]);

  // Report effective rate (custom overrides fetched) back to parent
  const effectiveRate = customRate ? parseDecimal(customRate) : rate;
  useEffect(() => { onRateChange(effectiveRate ?? null); }, [effectiveRate]);

  if (currency === "EUR") return null;

  return (
    <div className="mt-1 mb-1 rounded border border-amber-300 bg-amber-50/60 px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-black/60 mb-1.5">
        <Icon icon="mdi:swap-horizontal" className="w-3.5 h-3.5" />
        <span>{currency} → EUR</span>
        {loading && <Icon icon="svg-spinners:3-dots-fade" className="w-4 h-4 ml-1" />}
        {rateDate && !customRate && (
          <span className="ml-auto font-mono text-[10px] text-black/40">
            {t("preview.rate_as_of", { date: rateDate, defaultValue: `as of ${rateDate}` })}
          </span>
        )}
      </div>
      {error && <p className="text-red-500 text-[10px] mb-1">{error}</p>}
      <div className="flex items-center gap-2">
        <span className="text-black/50 text-[10px] shrink-0">
          {t("preview.rate_label", { defaultValue: "Rate" })}
        </span>
        <input
          type="number" step="0.00001" min="0"
          value={customRate}
          onChange={(e) => setCustomRate(e.target.value)}
          placeholder={rate != null ? rate.toFixed(5) : ""}
          className="w-28 text-xs font-mono bg-white border border-amber-300 rounded px-2 py-0.5 outline-none focus:border-amber-500"
        />
        {effectiveRate != null && (
          <span className="ml-auto text-[10px] text-black/40 font-mono">× {effectiveRate.toFixed(5)}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
type DraftItem = {
  position: number; description: string;
  vat_rate: string; vat_amount: string; total_price: string; category: string;
};

function ItemRow({ item, editing, draft, onChange, onDelete, index, currency = "EUR" }: {
  item: ReceiptItem; editing: boolean; draft: DraftItem;
  onChange: (field: keyof DraftItem, value: string) => void;
  onDelete: () => void; index: number; currency?: string;
}) {
  const { t } = useTranslation();
  const pos = item.position ?? index + 1;
  const sym = currSymbol(currency);
  if (!editing) {
    return (
      <div className="px-3 py-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-black text-black/30 font-mono shrink-0 w-4">{pos}.</span>
          <span className="text-xs text-black font-semibold flex-1 min-w-0">{item.description || "—"}</span>
          <span className="text-xs text-black font-black font-mono shrink-0">{fmt(item.total_price, currency)}</span>
        </div>
        <div className="text-xs text-black/40 font-mono mt-0.5 flex gap-2 pl-6">
          {item.vat_amount != null && <span>{fmt(item.vat_amount, currency)} {t("preview.item_vat_inline")}</span>}
          {item.vat_rate   != null && <span>{item.vat_rate}% {t("preview.item_vat_inline")}</span>}
        </div>
      </div>
    );
  }
  return (
    <div className="px-3 py-2 flex flex-col gap-1.5 bg-amber-50/50">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-black/30 font-mono w-4 shrink-0">{draft.position}.</span>
        <input value={draft.description} onChange={(e) => onChange("description", e.target.value)}
          placeholder={t("preview.item_placeholder_description")}
          className="flex-1 text-xs font-semibold text-black bg-white border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500" />
        <button onClick={onDelete} className="shrink-0 text-black/30 hover:text-red-500 transition-colors">
          <IconDelete className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 pl-6">
        {(["vat_rate", "vat_amount", "total_price"] as (keyof DraftItem)[]).map((field) => {
          const label = field === "vat_rate"
            ? t("preview.item_label_vat_pct")
            : field === "vat_amount"
              ? t("preview.item_label_vat_amt", { sym })
              : t("preview.item_label_total", { sym });
          return (
            <div key={field} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase text-black/40">{label}</span>
              <input value={draft[field] as string} onChange={(e) => onChange(field, e.target.value)}
                className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VatSplitRow
// ---------------------------------------------------------------------------
type DraftVatSplit = { position: number; vat_rate: string; vat_amount: string; net_amount: string };

function VatSplitRow({ split, editing, draft, onChange, onDelete }: {
  split: { position: number; vat_rate: number | null; vat_amount: number | null; net_amount: number | null };
  editing: boolean; draft: DraftVatSplit;
  onChange: (field: keyof DraftVatSplit, value: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  if (!editing) {
    return (
      <div className="flex items-center gap-3 py-1.5 border-b border-black/10 last:border-0">
        <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28">{t("preview.item_vat_inline")} {split.position}</span>
        <span className="flex-1 text-xs font-mono text-right text-black/70">
          {split.vat_amount != null ? fmt(split.vat_amount) : "—"}
          {split.vat_amount != null && split.vat_rate != null ? " · " : ""}
          {split.vat_rate != null ? `${split.vat_rate}%` : ""}
          {split.vat_rate != null && split.net_amount != null ? " · " : ""}
          {split.net_amount != null ? fmt(split.net_amount) : ""}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-black/10 last:border-0">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-16">{t("preview.item_vat_inline")} {draft.position}</span>
      <label className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] font-bold text-black/40 uppercase tracking-wider">{t("preview.split_vat_amt")}</span>
        <input value={draft.vat_amount} onChange={(e) => onChange("vat_amount", e.target.value)}
          placeholder="0.00" className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500" />
      </label>
      <label className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] font-bold text-black/40 uppercase tracking-wider">{t("preview.split_rate")}</span>
        <input value={draft.vat_rate} onChange={(e) => onChange("vat_rate", e.target.value)}
          placeholder="0" className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500" />
      </label>
      <label className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] font-bold text-black/40 uppercase tracking-wider">{t("preview.split_net")}</span>
        <input value={draft.net_amount} onChange={(e) => onChange("net_amount", e.target.value)}
          placeholder="0.00" className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-1.5 py-0.5 outline-none focus:border-amber-500" />
      </label>
      <button onClick={onDelete} className="shrink-0 text-black/30 hover:text-red-500 transition-colors mt-3.5">
        <IconDelete className="w-3.5 h-3.5" />
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
  address: { street_and_number: string | null; address_supplement: string | null; postcode: string | null; city: string | null; state: string | null; country: string | null };
};

function VerifiedPicker({ apiBase, dbPath, onSelect, onManage }: {
  apiBase: string; dbPath?: string | null;
  onSelect: (cp: VerifiedCp) => void;
  onManage?: () => void;
}) {
  const { t } = useTranslation();
  const [list, setList]       = useState<VerifiedCp[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${apiBase}/counterparties/verified${qs(dbPath)}`)
      .then((r) => r.json())
      .then((d) => {
        const raw: VerifiedCp[] = d.counterparties ?? [];
        const seen = new Set<string>();
        const deduped = raw.filter((cp) => {
          const key = cp.vat_id?.trim() || (cp.name ?? "");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        deduped.sort((a, b) =>
          (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
        );
        setList(deduped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <div className="py-2 border-b border-black/10">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[10px] font-bold text-black/60 hover:text-black uppercase tracking-wider transition-colors">
        <Icon icon="mdi:account-check-outline" className="w-3.5 h-3.5" />
        {t("preview.select_from_verified")}
        <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-3 h-3" />
      </button>
      {open && (
        <div className="mt-2 border border-black/10 rounded overflow-hidden">
          {onManage && !loading && (
            <button onClick={() => { setOpen(false); onManage(); }}
              className="w-full text-left px-3 py-2 text-[10px] font-bold text-black/40 hover:text-black hover:bg-black/5 flex items-center gap-1.5 border-b border-black/10 transition-colors">
              <Icon icon="mdi:table-account" className="w-3.5 h-3.5" />
              {t("preview.manage_counterparties")}
            </button>
          )}
          {loading ? (
            <div className="px-3 py-2 text-xs text-black/30 font-mono">{t("preview.loading")}</div>
          ) : list.length === 0 ? (
            <div className="px-3 py-2 text-xs text-black/30 font-mono">{t("preview.no_verified_counterparties")}</div>
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
// Counterparties Explorer — full-page overlay
// ---------------------------------------------------------------------------
type AllCp = VerifiedCp & { created_at?: string | null };
type CpDraft = {
  name: string; tax_number: string; vat_id: string; verified: boolean;
  street_and_number: string; address_supplement: string; postcode: string; city: string; state: string; country: string;
};

const cpToDraft = (cp: AllCp): CpDraft => ({
  name:               cp.name               ?? "",
  tax_number:         cp.tax_number         ?? "",
  vat_id:             cp.vat_id             ?? "",
  verified:           cp.verified,
  street_and_number:  cp.address?.street_and_number  ?? "",
  address_supplement: cp.address?.address_supplement ?? "",
  postcode:           cp.address?.postcode            ?? "",
  city:               cp.address?.city                ?? "",
  state:              cp.address?.state               ?? "",
  country:            cp.address?.country             ?? "",
});

function CounterpartiesExplorer({ apiBase, dbPath, onClose, onSelect }: {
  apiBase: string; dbPath?: string | null;
  onClose: () => void;
  onSelect?: (cp: VerifiedCp) => void;
}) {
  const { t } = useTranslation();
  const [list,     setList]     = useState<AllCp[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editDraft,setEditDraft]= useState<CpDraft | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${apiBase}/counterparties${qs(dbPath)}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setList(d.counterparties ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t("preview.cp_load_error")))
      .finally(() => setLoading(false));
  }, [apiBase, dbPath]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (cp: AllCp) => {
    setEditId(cp.id);
    setEditDraft(cpToDraft(cp));
    setDeleteId(null);
  };

  const handleSave = async (id: string) => {
    if (!editDraft) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/counterparties/${id}${qs(dbPath)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       editDraft.name       || null,
          tax_number: editDraft.tax_number || null,
          vat_id:     editDraft.vat_id     || null,
          verified:   editDraft.verified,
          address: {
            street_and_number:  editDraft.street_and_number  || null,
            address_supplement: editDraft.address_supplement || null,
            postcode:           editDraft.postcode            || null,
            city:               editDraft.city                || null,
            state:              editDraft.state               || null,
            country:            editDraft.country             || null,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Use the response body (ground-truth saved row) rather than editDraft so
      // the list always reflects exactly what is stored in the DB.
      const saved: AllCp = await res.json();
      setList((prev) => prev.map((cp) => cp.id !== id ? cp : saved));
      setEditId(null);
      setEditDraft(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}/counterparties/${id}${qs(dbPath)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setList((prev) => prev.filter((cp) => cp.id !== id));
      setDeleteId(null);
      setEditId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const inp = (label: string, field: keyof CpDraft) => (
    <label className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black uppercase tracking-wider text-black/40">{label}</span>
      <input
        value={(editDraft?.[field] as string) ?? ""}
        onChange={(e) => setEditDraft((d) => d ? { ...d, [field]: e.target.value } : d)}
        className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end pointer-events-none">
      <div className="w-full max-w-3xl bg-white flex flex-col shadow-2xl pointer-events-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black shrink-0">
          <h2 className="text-sm font-black uppercase tracking-wider">{t("preview.cp_explorer_title")}</h2>
          <button onClick={onClose} className="text-black/40 hover:text-black transition-colors p-0.5 rounded">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-mono flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => { setError(null); load(); }}
              className="text-[10px] font-black text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-2 py-0.5 rounded transition-colors whitespace-nowrap">
              {t("preview.retry")}
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="p-6 text-xs text-black/30 font-mono text-center">{t("preview.loading")}</div>
          ) : error && list.length === 0 ? null : list.length === 0 ? (
            <div className="p-6 text-xs text-black/30 font-mono text-center">{t("preview.cp_no_records")}</div>
          ) : (
            <div className="divide-y divide-black/10">
              {(() => {
                const vatCount: Record<string, number> = {};
                list.forEach((c) => {
                  if (c.vat_id?.trim()) {
                    const k = c.vat_id.trim().toLowerCase();
                    vatCount[k] = (vatCount[k] ?? 0) + 1;
                  }
                });
                const dupVatIds = new Set(
                  Object.entries(vatCount).filter(([, n]) => n > 1).map(([k]) => k)
                );
                return list.map((cp) => {
                  const isEditing = editId === cp.id;
                  const isDupVat  = !!(cp.vat_id?.trim() && dupVatIds.has(cp.vat_id.trim().toLowerCase()));
                  return (
                    <div key={cp.id} className={isEditing ? "bg-amber-50/60" : "hover:bg-black/[.02]"}>
                    {/* Summary row */}
                    <div className="px-4 py-3 flex items-start gap-3">
                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-black">{cp.name ?? "—"}</span>
                          {cp.verified && (
                            <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase leading-none">{t("preview.verified")}</span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-0.5 flex-wrap">
                          {cp.vat_id && (
                            <span className={`text-[10px] font-mono flex items-center gap-1 ${
                              isDupVat ? "text-red-500 font-bold" : "text-black/50"
                            }`}>
                              {isDupVat && <Icon icon="mdi:alert" className="w-2.5 h-2.5 shrink-0" />}
                              {cp.vat_id}
                              {isDupVat && (
                                <span className="text-[9px] font-black uppercase tracking-wider">
                                  {t("preview.dup_vat_hint", { defaultValue: "duplicate" })}
                                </span>
                              )}
                            </span>
                          )}
                          {cp.tax_number && <span className="text-[10px] text-black/40 font-mono">{cp.tax_number}</span>}
                        </div>
                        <div className="flex gap-3 mt-0.5 flex-wrap">
                          {cp.address?.street_and_number && <span className="text-[10px] text-black/40">{cp.address.street_and_number}</span>}
                          {cp.address?.address_supplement && <span className="text-[10px] text-black/40">{cp.address.address_supplement}</span>}
                          {(cp.address?.postcode || cp.address?.city) && (
                            <span className="text-[10px] text-black/40">{[cp.address.postcode, cp.address.city].filter(Boolean).join(" ")}</span>
                          )}
                          {cp.address?.state   && <span className="text-[10px] text-black/40">{cp.address.state}</span>}
                          {cp.address?.country && <span className="text-[10px] text-black/40">{cp.address.country}</span>}
                        </div>
                        <div className="mt-1 flex gap-3">
                          <span className="text-[9px] text-black/20 font-mono" title={cp.id}>{cp.id.slice(0, 8)}</span>
                          {cp.created_at && <span className="text-[9px] text-black/20 font-mono">{cp.created_at.slice(0, 10)}</span>}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        {onSelect && (
                          <button onClick={() => { onSelect(cp); onClose(); }}
                            className="text-[10px] font-bold text-black/50 hover:text-black border border-black/20 hover:border-black px-2 py-0.5 rounded transition-colors whitespace-nowrap">
                            {t("preview.select_cp")}
                          </button>
                        )}
                        <button
                          onClick={() => isEditing ? (setEditId(null), setEditDraft(null)) : startEdit(cp)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
                            isEditing
                              ? "text-black/50 border-black/20 hover:border-black hover:text-black"
                              : "text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100"
                          }`}>
                          {isEditing ? t("preview.btn_cancel") : t("preview.cp_edit")}
                        </button>
                        <button onClick={() => { setDeleteId(deleteId === cp.id ? null : cp.id); setEditId(null); setEditDraft(null); }}
                          className="text-black/30 hover:text-red-500 transition-colors shrink-0 p-0.5">
                          <IconDelete className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && editDraft && (
                      <div className="px-4 pb-4 pt-1 border-t border-amber-200 bg-amber-50/80">
                        <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-3">{t("preview.cp_edit_title")}</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {inp(t("preview.cp_field_name"),       "name")}
                          {inp(t("preview.cp_field_tax_number"), "tax_number")}
                          {inp(t("preview.cp_field_vat_id"),     "vat_id")}
                          <label className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-black/40">{t("preview.cp_field_verified")}</span>
                            <label className="flex items-center gap-2 h-7 cursor-pointer">
                              <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                                editDraft.verified ? "bg-amber-400 border-amber-500" : "bg-white border-black/30"
                              }`}>
                                {editDraft.verified && <Icon icon="mdi:check" className="w-2.5 h-2.5 text-black" />}
                              </span>
                              <input type="checkbox" className="sr-only" checked={editDraft.verified}
                                onChange={(e) => setEditDraft((d) => d ? { ...d, verified: e.target.checked } : d)} />
                              <span className="text-xs text-black/60">{editDraft.verified ? t("preview.yes") : t("preview.no")}</span>
                            </label>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {inp(t("preview.cp_field_street"),             "street_and_number")}
                          {inp(t("preview.cp_field_address_supplement"), "address_supplement")}
                          {inp(t("preview.cp_field_postcode"),           "postcode")}
                          {inp(t("preview.cp_field_city"),     "city")}
                          {inp(t("preview.cp_field_state"),    "state")}
                          {inp(t("preview.cp_field_country"),  "country")}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSave(cp.id)} disabled={saving}
                            className="text-[11px] font-black bg-black text-white px-3 py-1.5 rounded hover:bg-black/80 disabled:opacity-40 transition-colors flex items-center gap-1.5">
                            {saving && <IconSpinner className="w-3 h-3" />}
                            {t("preview.cp_save")}
                          </button>
                          <button onClick={() => { setEditId(null); setEditDraft(null); }}
                            className="text-[11px] font-black bg-white text-black border border-black/20 px-3 py-1.5 rounded hover:bg-black/5 transition-colors">
                            {t("preview.btn_cancel")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete confirm */}
                    {deleteId === cp.id && !isEditing && (
                      <div className="px-4 py-2 border-t border-red-200 bg-red-50 flex items-center justify-between gap-3">
                        <span className="text-xs text-red-600 font-bold">{t("preview.cp_delete_confirm")}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleDelete(cp.id)} disabled={deleting}
                            className="text-[11px] font-black bg-red-500 text-white px-2.5 py-1 rounded hover:bg-red-600 disabled:opacity-40 transition-colors">
                            {t("preview.yes")}
                          </button>
                          <button onClick={() => setDeleteId(null)} disabled={deleting}
                            className="text-[11px] font-black bg-white text-red-500 border border-red-400 px-2.5 py-1 rounded hover:bg-red-50 transition-colors">
                            {t("preview.no")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/10 shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-black/30 font-mono">
            {list.length} {list.length === 1 ? "entry" : "entries"}
          </span>
          <button onClick={onClose}
            className="text-xs font-bold bg-black text-white px-4 py-1.5 rounded hover:bg-black/80 transition-colors">
            {t("preview.btn_cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState() {
  const { t } = useTranslation();
  return (
    <aside className="w-[380px] shrink-0 bg-white border-l-2 border-red-500 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Icon icon="mdi:receipt-text-outline" className="w-16 h-16 text-black/10" />
      <p className="text-black/30 text-xs leading-relaxed font-mono">
        {t("preview.empty").split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
      </p>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
// Returns true if the url points to a PDF (used to decide iframe vs img)
function isPdf(url: string | null): boolean {
  if (!url) return false;
  return url.split("?")[0].toLowerCase().endsWith("/pdf") || url.includes("application/pdf");
}

export default function PreviewPanel({ receipt, apiBase, dbPath, onSaved }: Props) {
  const { t } = useTranslation();
  const [editing,          setEditing]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [savedVisible,     setSavedVisible]     = useState(false);
  const [saveErr,          setSaveErr]          = useState<string | null>(null);
  const [pdfOpen,          setPdfOpen]          = useState(false);
  const [cpExplorerOpen,   setCpExplorerOpen]   = useState(false);
  const [addrOpen,         setAddrOpen]         = useState(false);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [splitVat,         setSplitVat]         = useState(false);
  const [vatSplitDrafts,   setVatSplitDrafts]   = useState<DraftVatSplit[]>([]);
  const [itemDrafts,       setItemDrafts]       = useState<DraftItem[]>([]);
  const [verifyConfirm,    setVerifyConfirm]    = useState(false);
  const [localVerified,    setLocalVerified]    = useState<boolean | null>(null);
  const [pendingCpLink,    setPendingCpLink]    = useState<string | null>(null);
  const [reassignOpen,     setReassignOpen]     = useState(false);
  const [reassignName,     setReassignName]     = useState("");
  const [reassignVatId,    setReassignVatId]    = useState("");
  const [reassigning,      setReassigning]      = useState(false);
  const [convRate,         setConvRate]         = useState<number | null>(null);
  const [warnDismissed,    setWarnDismissed]    = useState(false);
  const [warnConfirmPending, setWarnConfirmPending] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({
    counterparty_name: "", vat_id: "", tax_number: "",
    address_street_and_number: "", address_address_supplement: "", address_postcode: "",
    address_city: "", address_state: "", address_country: "",
    receipt_number: "", receipt_date: "", receipt_type: "purchase",
    total_amount: "", vat_percentage: "", vat_amount: "", category: "", subcategory: "", currency: "",
    private_use_share: "0",
  });

  // Reset local overrides whenever we switch to a different receipt
  useEffect(() => {
    setLocalVerified(null);
    setVerifyConfirm(false);
    setEditing(false);
    setSavedVisible(false);
    setSaveErr(null);
    setConvRate(null);
    setReassignOpen(false);
    setReassignName(""); setReassignVatId("");
    setWarnDismissed(false);
    setWarnConfirmPending(false);
  }, [receipt?.id]);

  if (!receipt) return <EmptyState />;

  const counterpartyName = receipt.vendor ?? receipt.counterparty?.name ?? null;
  const pdfUrl = receipt.pdf_url ? `${apiBase}${receipt.pdf_url}${qs(dbPath)}` : null;
  const receiptSplits = ((receipt as Receipt & { vat_splits?: { position: number; vat_rate: number | null; vat_amount: number | null; net_amount: number | null }[] }).vat_splits ?? []);
  const cpVerifiedFromReceipt = !!(receipt.counterparty as (typeof receipt.counterparty & { verified?: boolean }))?.verified;
  // isVerified reflects the DB counterparty state unless the user has overridden it
  // this session. VAT-ID-based merging was removed so this is safe — verified state
  // only comes from actual user confirmation on the correct counterparty row.
  const isVerified = localVerified !== null ? localVerified : cpVerifiedFromReceipt;
  const cpId = receipt.counterparty?.id ?? null;
  // Receipt currency (default EUR)
  const rcCurrency = receipt.currency ?? "EUR";
  // Helper: if non-EUR and rate available, display EUR equivalent; otherwise original currency
  const cvt = (n: number | null | undefined) =>
    rcCurrency !== "EUR" && convRate != null && n != null
      ? fmt(n * convRate)
      : fmt(n, rcCurrency);

  // ── Edit helpers ──────────────────────────────────────────────────────────

  const startEditing = () => {
    const addr = receipt.counterparty?.address;
    setDraft({
      counterparty_name:        counterpartyName ?? "",
      vat_id:                   receipt.counterparty?.vat_id     ?? "",
      tax_number:               receipt.counterparty?.tax_number ?? "",
      address_street_and_number:  addr?.street_and_number  ?? "",
      address_address_supplement: addr?.address_supplement ?? "",
      address_postcode:           addr?.postcode            ?? "",
      address_city:             addr?.city          ?? "",
      address_state:            addr?.state         ?? "",
      address_country:          addr?.country       ?? "",
      receipt_number:        receipt.receipt_number  ?? "",
      receipt_date:          receipt.receipt_date    ?? "",
      receipt_type:          receipt.receipt_type    ?? "purchase",
      total_amount:          receipt.total_amount?.toString()   ?? "",
      vat_percentage:        receipt.vat_percentage?.toString() ?? "",
      vat_amount:            receipt.vat_amount?.toString()     ?? "",
      category:              receipt.category ?? "",
      subcategory:           receipt.subcategory ?? "",
      currency:              receipt.currency ?? "EUR",
      private_use_share:     String(Math.round((receipt.private_use_share ?? 0) * 100)),
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
        net_amount: s.net_amount?.toString() ?? "",
      })));
    } else {
      setSplitVat(false); setVatSplitDrafts([]);
    }
    setLocalVerified(null);
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
    setVatSplitDrafts((prev) => [...prev, { position: prev.length + 1, vat_rate: "", vat_amount: "", net_amount: "" }]);

  const deleteVatSplit = (i: number) =>
    setVatSplitDrafts((prev) => prev.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, position: idx + 1 })));

  const applyVerifiedCp = (cp: VerifiedCp) => {
    setDraft((d) => ({
      ...d,
      counterparty_name:        cp.name                      ?? d.counterparty_name,
      vat_id:                   cp.vat_id                    ?? d.vat_id,
      tax_number:               cp.tax_number                ?? d.tax_number,
      address_street_and_number:  cp.address?.street_and_number  ?? d.address_street_and_number,
      address_address_supplement: cp.address?.address_supplement ?? d.address_address_supplement,
      address_postcode:         cp.address?.postcode          ?? d.address_postcode,
      address_city:             cp.address?.city              ?? d.address_city,
      address_state:            cp.address?.state             ?? d.address_state,
      address_country:          cp.address?.country           ?? d.address_country,
    }));
    setPendingCpLink(cp.id);  // re-link receipt to this verified CP on next save
    setLocalVerified(true);
  };

  const handleReassign = async () => {
    if (!reassignName.trim()) return;
    setReassigning(true);
    try {
      const res = await fetch(`${apiBase}/receipts/${receipt.id}/counterparty${qs(dbPath)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:   reassignName.trim() || null,
          vat_id: reassignVatId.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setReassignOpen(false);
      setReassignName(""); setReassignVatId("");
      setEditing(false); setSaveErr(null);
      onSaved?.(updated);
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : "Reassign failed.");
    } finally {
      setReassigning(false);
    }
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
        ["subcategory", draft.subcategory],
      ] as [string, string][]) { if (v) payload[k] = v; }
      // Allow clearing subcategory when empty
      if (draft.subcategory === "") payload["subcategory"] = null;
      for (const [k, v] of [
        ["total_amount", draft.total_amount], ["vat_percentage", draft.vat_percentage], ["vat_amount", draft.vat_amount],
      ] as [string, string][]) { if (v) payload[k] = parseDecimal(v); }
      // private_use_share: store as 0–1 decimal (draft holds 0–100 percent)
      if (draft.receipt_type === "purchase") {
        const pus = parseDecimal(draft.private_use_share);
        payload.private_use_share = isNaN(pus) ? 0 : Math.max(0, Math.min(1, pus / 100));
      } else {
        payload.private_use_share = 0;
      }
      if (draft.currency) payload.currency = draft.currency.toUpperCase();
      if (draft.vat_id)     payload.vat_id     = draft.vat_id;
      if (draft.tax_number) payload.tax_number = draft.tax_number;
      if (localVerified !== null) payload.counterparty_verified = localVerified;
      if (pendingCpLink) payload.counterparty_id = pendingCpLink;
      const addr: Record<string, string> = {};
      (["street_and_number","address_supplement","postcode","city","state","country"] as const).forEach((k, i) => {
        const v = draft[["address_street_and_number","address_address_supplement","address_postcode","address_city","address_state","address_country"][i]];
        if (v) addr[k] = v;
      });
      if (Object.keys(addr).length) payload["address"] = addr;
      payload["items"] = itemDrafts.map((d) => ({
        position: d.position, description: d.description || null,
        vat_rate: d.vat_rate ? parseDecimal(d.vat_rate) : null,
        vat_amount: d.vat_amount ? parseDecimal(d.vat_amount) : null,
        total_price: d.total_price ? parseDecimal(d.total_price) : null,
        category: d.category || "other",
      }));
      payload["vat_splits"] = splitVat
        ? vatSplitDrafts.map((s) => ({
            position: s.position,
            vat_rate: s.vat_rate ? parseDecimal(s.vat_rate) : null,
            vat_amount: s.vat_amount ? parseDecimal(s.vat_amount) : null,
            net_amount: s.net_amount ? parseDecimal(s.net_amount) : null,
          }))
        : [];

      const res = await fetch(`${apiBase}/receipts/${receipt.id}${qs(dbPath)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`);
      const updated = await res.json();
      setPendingCpLink(null);
      setSavedVisible(true); setEditing(false); onSaved?.(updated);
      setTimeout(() => setSavedVisible(false), 3500);
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : t("preview.save_failed"));
    } finally { setSaving(false); }
  };

  // ── Verified checkbox widget (always shown) ─────────────────────────────
  const verifiedWidget = (
    <div className="flex items-center gap-1.5">
      {verifyConfirm ? (
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-black">
          {t("preview.confirm_verified")}
          <button onClick={() => doVerify(true)}
            className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded hover:bg-black/80 transition-colors">
            {t("preview.yes")}
          </button>
          <button onClick={() => setVerifyConfirm(false)}
            className="text-[10px] font-black bg-white text-black border border-black/30 px-1.5 py-0.5 rounded hover:bg-black/5 transition-colors">
            {t("preview.no")}
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
          {t("preview.verified")}
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
            }`}>{receipt.receipt_type === "sale" ? t("preview.badge_revenue") : t("preview.badge_expense")}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-black/60 flex items-center gap-1">
              {CATEGORY_META[receipt.category]?.icon && <Icon icon={CATEGORY_META[receipt.category].icon} className="w-3 h-3" />}
              {t(`sidebar.categories.${receipt.category}`, { defaultValue: receipt.category })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <Tip label={t("preview.tip_edit")} pos="bottom">
              <button onClick={startEditing} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors">
                <Icon icon="fe:edit" className="w-4 h-4" />
              </button>
            </Tip>
          ) : (
            <button onClick={cancelEditing} className="text-xs font-bold bg-white text-red-500 px-2.5 py-1 rounded border border-red-500 hover:bg-red-50 transition-colors">
              {t("preview.btn_cancel")}
            </button>
          )}
          {pdfOpen && (
            <Tip label={t("preview.tip_exit_fullscreen")} pos="bottom">
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
          <Icon icon="mdi:alert-outline" className="w-3.5 h-3.5 shrink-0" /> {t("preview.duplicate_banner")}
        </div>
      )}
      {(receipt.validation_warnings?.length ?? 0) > 0 && !warnDismissed && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-300 rounded text-xs text-red-700 font-mono flex flex-col gap-1">
          {!warnConfirmPending ? (
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:alert-circle-outline" className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold flex-1">{t("preview.validation_warning_title")}</span>
              <button
                onClick={() => setWarnConfirmPending(true)}
                className="ml-auto text-red-400 hover:text-red-700 focus:outline-none"
                aria-label="Dismiss"
              >
                <IconClose className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 font-bold">{t("preview.warn_suppress_confirm")}</span>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${apiBase}/receipts/${receipt.id}${qs(dbPath)}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ validation_warnings: [] }),
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      onSaved?.(updated);
                    }
                  } finally {
                    setWarnDismissed(true);
                    setWarnConfirmPending(false);
                  }
                }}
                className="px-2 py-0.5 bg-red-600 text-white rounded font-bold hover:bg-red-700 focus:outline-none shrink-0"
              >
                {t("preview.warn_suppress_yes")}
              </button>
              <button
                onClick={() => { setWarnDismissed(true); setWarnConfirmPending(false); }}
                className="px-2 py-0.5 border border-red-300 text-red-500 rounded hover:text-red-700 hover:border-red-500 focus:outline-none shrink-0"
              >
                {t("preview.warn_suppress_no")}
              </button>
            </div>
          )}
          {receipt.validation_warnings!.map((w, i) => (
            <div key={i} className="pl-5 text-red-600">{w}</div>
          ))}
        </div>
      )}
      {savedVisible && !editing && (
        <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-black font-mono flex items-center gap-2">
          <Icon icon="mdi:check" className="w-3.5 h-3.5 shrink-0" /> {t("preview.saved_banner")}
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
          {/* Do NOT render the iframe while the counterparty explorer is open.
              Browser-native PDF viewer controls render outside the page z-index
              stacking context and overlap the explorer modal's buttons. */}
          {cpExplorerOpen
            ? <div className="w-full h-full bg-amber-50" />
            : isPdf(pdfUrl)
              ? <iframe src={pdfUrl} className="w-full h-full bg-amber-50" title="Receipt PDF" />
              : <img src={pdfUrl} className="w-full h-full object-contain bg-amber-50" alt="Receipt" />
          }
          <div className="absolute top-2 right-2 group">
            <button onClick={() => setPdfOpen(true)}
              className="bg-black/70 hover:bg-black text-white rounded p-1.5 transition-colors">
              <Icon icon="mdi:fullscreen" className="w-4 h-4" />
            </button>
            <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {t("preview.tip_fullscreen")}
            </span>
          </div>
        </div>
      )}
      {!pdfOpen && !pdfUrl && (
        <div className="shrink-0 bg-amber-50 border-b-2 border-amber-400 flex items-center justify-center gap-2 text-black/30 text-xs font-mono" style={{ height: 64 }}>
          <Icon icon="mdi:file-pdf-box" className="w-4 h-4" /> {t("preview.no_pdf")}
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">

        {/* Counterparty */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-black text-xs font-black uppercase tracking-wider">{t("preview.section_counterparty")}</h3>
            {verifiedWidget}
          </div>
          <div className="border-2 border-black rounded px-3 py-1">
            {editing && <VerifiedPicker apiBase={apiBase} dbPath={dbPath} onSelect={applyVerifiedCp} onManage={() => setCpExplorerOpen(true)} />}
            {editing && (
              <div className="py-2 border-b border-black/10">
                <button onClick={() => setReassignOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-black/60 hover:text-black uppercase tracking-wider transition-colors">
                  <Icon icon="mdi:swap-horizontal" className="w-3.5 h-3.5" />
                  {t("preview.cp_reassign")}
                  <Icon icon={reassignOpen ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-3 h-3" />
                </button>
                {reassignOpen && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <p className="text-[9px] text-black/40 font-mono leading-relaxed">
                      Creates or finds a supplier and links <em>only this receipt</em> to it — the current supplier stays linked to all other receipts.
                    </p>
                    <input
                      value={reassignName}
                      onChange={(e) => setReassignName(e.target.value)}
                      placeholder={t("preview.cp_reassign_name_placeholder")}
                      className="w-full text-xs font-mono text-black bg-white border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500"
                    />
                    <input
                      value={reassignVatId}
                      onChange={(e) => setReassignVatId(e.target.value)}
                      placeholder={t("preview.cp_reassign_vat_placeholder")}
                      className="w-full text-xs font-mono text-black bg-white border border-black/20 rounded px-2 py-1 outline-none focus:border-amber-500"
                    />
                    <button onClick={handleReassign} disabled={reassigning || !reassignName.trim()}
                      className="self-start text-[11px] font-black bg-black text-white px-3 py-1 rounded hover:bg-black/80 disabled:opacity-40 transition-colors flex items-center gap-1.5">
                      {reassigning && <IconSpinner className="w-3 h-3" />}
                      {t("preview.cp_reassign_btn")}
                    </button>
                  </div>
                )}
              </div>
            )}
            <FieldRow label={t("preview.field_name")} value={counterpartyName}
              editing={editing} inputValue={draft.counterparty_name}
              onInput={(v) => setDraft((d) => ({ ...d, counterparty_name: v }))} />
            <FieldRow label={t("preview.field_vat_id")} value={receipt.counterparty?.vat_id ?? null}
              editing={editing} inputValue={draft.vat_id}
              onInput={(v) => setDraft((d) => ({ ...d, vat_id: v }))} />
            <FieldRow label={t("preview.field_tax_number")} value={receipt.counterparty?.tax_number ?? null}
              editing={editing} inputValue={draft.tax_number}
              onInput={(v) => setDraft((d) => ({ ...d, tax_number: v }))} />
            {/* Address toggle — same in view and edit */}
            <div className="py-2 border-b border-black/10">
              <button onClick={() => setAddrOpen((o) => !o)}
                className="flex items-center gap-1 text-[10px] font-bold text-black/40 hover:text-black uppercase tracking-wider transition-colors">
                <Icon icon={addrOpen ? "mdi:chevron-down" : "mdi:chevron-right"} className="w-3.5 h-3.5" />
                {t("preview.field_address")}
              </button>
            </div>
            {addrOpen && (<>
              <FieldRow label={t("preview.field_street_and_number")} value={receipt.counterparty?.address?.street_and_number}
                editing={editing} inputValue={draft.address_street_and_number}
                onInput={(v) => setDraft((d) => ({ ...d, address_street_and_number: v }))} />
              <FieldRow label={t("preview.field_address_supplement")} value={receipt.counterparty?.address?.address_supplement}
                editing={editing} inputValue={draft.address_address_supplement}
                onInput={(v) => setDraft((d) => ({ ...d, address_address_supplement: v }))} />
              <FieldRow label={t("preview.field_postcode")} value={receipt.counterparty?.address?.postcode}
                editing={editing} inputValue={draft.address_postcode}
                onInput={(v) => setDraft((d) => ({ ...d, address_postcode: v }))} />
              <FieldRow label={t("preview.field_city")} value={receipt.counterparty?.address?.city}
                editing={editing} inputValue={draft.address_city}
                onInput={(v) => setDraft((d) => ({ ...d, address_city: v }))} />
              <FieldRow label={t("preview.field_state")} value={receipt.counterparty?.address?.state}
                editing={editing} inputValue={draft.address_state}
                onInput={(v) => setDraft((d) => ({ ...d, address_state: v }))} />
              <FieldRow label={t("preview.field_country")} value={receipt.counterparty?.address?.country}
                editing={editing} inputValue={draft.address_country}
                onInput={(v) => setDraft((d) => ({ ...d, address_country: v }))} />
            </>)}
          </div>
        </section>

        {/* Receipt */}
        <section>
          <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">{t("preview.section_receipt")}</h3>
          <div className="border-2 border-black rounded px-3 py-1">
            <FieldRow label={t("preview.field_receipt_number")} value={receipt.receipt_number}
              editing={editing} inputValue={draft.receipt_number}
              onInput={(v) => setDraft((d) => ({ ...d, receipt_number: v }))} />
            <FieldRow label={t("preview.field_date")} value={receipt.receipt_date}
              editing={editing} inputValue={draft.receipt_date} placeholder="YYYY-MM-DD"
              onInput={(v) => setDraft((d) => ({ ...d, receipt_date: v }))} />
            {editing ? (
              <>
                <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
                  <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">{t("preview.field_type")}</span>
                  <select value={draft.receipt_type} onChange={(e) => setDraft((d) => ({ ...d, receipt_type: e.target.value }))}
                    className="flex-1 min-w-0 text-xs font-mono text-black bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500">
                    <option value="purchase">{t("preview.type_purchase")}</option>
                    <option value="sale">{t("preview.type_sale")}</option>
                  </select>
                </div>
                <CategorySelect value={draft.category} onChange={(v) => setDraft((d) => ({ ...d, category: v, subcategory: "" }))} />
                <SubcategorySelect category={draft.category} value={draft.subcategory} onChange={(v) => setDraft((d) => ({ ...d, subcategory: v }))} />
              </>
            ) : (
              <>
                <FieldRow label={t("preview.field_type")} value={receipt.receipt_type === "sale" ? t("preview.badge_revenue") : t("preview.badge_expense")} />
                <FieldRow label={t("preview.field_category")} value={t(`sidebar.categories.${receipt.category}`, { defaultValue: receipt.category })} />
                {receipt.subcategory && (
                  <FieldRow label={t("preview.field_subcategory", { defaultValue: "Subcategory" })} value={t(`sidebar.subcategories.${receipt.subcategory}`, { defaultValue: receipt.subcategory ?? "" })} />
                )}
              </>
            )}
          </div>
        </section>

        {/* Amounts */}
        <section>
          <h3 className="text-black text-xs font-black uppercase tracking-wider mb-2">{t("preview.section_amounts")}</h3>
          <div className="border-2 border-amber-400 rounded px-3 py-1 bg-amber-50">
            <FieldRow label={t("preview.field_total")} value={cvt(receipt.total_amount)}
              editing={editing} inputValue={draft.total_amount}
              onInput={(v) => setDraft((d) => ({ ...d, total_amount: v }))} />
            {/* Currency row */}
            <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10">
              <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-28 pt-0.5">
                {t("preview.field_currency", { defaultValue: "Currency" })}
              </span>
              {editing ? (
                <input
                  value={draft.currency}
                  onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value.toUpperCase() }))}
                  maxLength={4}
                  placeholder="EUR"
                  className="flex-1 min-w-0 text-xs text-black font-mono bg-amber-50 border border-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500 uppercase"
                />
              ) : (
                <span className="flex-1 min-w-0 text-xs text-black font-mono text-right">
                  {receipt.currency ?? "EUR"}
                </span>
              )}
            </div>
            {!editing && (
              <CurrencyConverter currency={rcCurrency} onRateChange={setConvRate} />
            )}
            {editing ? (
              <div className="py-2 border-b border-black/10 flex items-center justify-between">
                <span className="text-xs text-black/50 font-bold uppercase tracking-wider">{t("preview.split_vat")}</span>
                <button onClick={() => {
                    if (!splitVat && vatSplitDrafts.length === 0)
                      setVatSplitDrafts([
                        { position: 1, vat_rate: draft.vat_percentage, vat_amount: draft.vat_amount, net_amount: "" },
                        { position: 2, vat_rate: "", vat_amount: "", net_amount: "" },
                      ]);
                    setSplitVat((v) => !v);
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                    splitVat ? "bg-amber-400 text-black" : "bg-black/10 text-black/50 hover:bg-black/15"
                  }`}>{splitVat ? t("preview.split_on") : t("preview.split_off")}</button>
              </div>
            ) : receiptSplits.length > 0 && (
              <div className="py-1.5 border-b border-black/10">
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-wider">{t("preview.split_vat")}</span>
              </div>
            )}
            {!editing && receiptSplits.map((s, i) => (
              <VatSplitRow key={i} split={s} editing={false}
                draft={{ position: s.position, vat_rate: "", vat_amount: "", net_amount: "" }}
                onChange={() => {}} onDelete={() => {}} />
            ))}
            {editing && splitVat && (<>
              {vatSplitDrafts.map((s, i) => (
                <VatSplitRow key={i} split={{ position: s.position, vat_rate: null, vat_amount: null, net_amount: null }}
                  editing={true} draft={s}
                  onChange={(field, value) => setVatSplit(i, field, value)}
                  onDelete={() => deleteVatSplit(i)} />
              ))}
              <div className="py-1.5">
                <button onClick={addVatSplit} className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <IconPlusCircle className="w-3.5 h-3.5" /> {t("preview.add_vat_row")}
                </button>
              </div>
            </>)}
            {(!editing || !splitVat) && receiptSplits.length === 0 && (<>
              <FieldRow label={t("preview.field_vat_pct")}
                value={receipt.vat_percentage != null ? `${receipt.vat_percentage} %` : null}
                editing={editing} inputValue={draft.vat_percentage}
                onInput={(v) => setDraft((d) => ({ ...d, vat_percentage: v }))} />
              <FieldRow label={t("preview.field_vat_amt")}
                value={cvt(
                  receipt.total_amount != null && receipt.net_amount != null
                    ? receipt.total_amount - receipt.net_amount   // MWST = BRUTTO − NETTO (correct formula)
                    : receipt.vat_amount
                )}
                editing={editing} inputValue={draft.vat_amount}
                onInput={(v) => setDraft((d) => ({ ...d, vat_amount: v }))} />
            </>)}
            <FieldRow label={t("preview.field_net")} value={cvt(receipt.net_amount)} />

            {/* Private Use — edit mode slider (purchases only) */}
            {editing && draft.receipt_type === "purchase" && (
              <div className="flex items-start justify-between gap-3 py-2 border-b border-black/10 last:border-0">
                <div className="flex items-center gap-1 shrink-0 w-28">
                  <span className="text-xs text-black/50 font-bold uppercase tracking-wider leading-tight">
                    {t("preview.field_private_use")}
                  </span>
                  <Tip label={t("preview.private_use_tooltip")} pos="bottom-right">
                    <Icon icon="mdi:information-outline" className="w-3 h-3 text-black/30 cursor-default" />
                  </Tip>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0" max="100" step="1"
                      value={draft.private_use_share}
                      onChange={(e) => setDraft((d) => ({ ...d, private_use_share: e.target.value }))}
                      className="flex-1 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <input
                        type="number" min="0" max="100" step="1"
                        value={draft.private_use_share}
                        onChange={(e) => {
                          const n = parseInt(e.target.value);
                          setDraft((d) => ({ ...d, private_use_share: String(isNaN(n) ? 0 : Math.max(0, Math.min(100, n))) }));
                        }}
                        className="w-12 text-xs font-mono text-black bg-amber-50 border border-amber-300 rounded px-1.5 py-1 outline-none focus:border-amber-500 text-center"
                      />
                      <span className="text-xs text-black/50 font-mono">%</span>
                    </div>
                  </div>
                  {parseDecimal(draft.private_use_share) > 0 && (() => {
                    const gross = parseDecimal(draft.total_amount) || 0;
                    const rate  = parseDecimal(draft.vat_percentage);
                    // Correct: NETTO = BRUTTO ÷ (1 + MwSt./100) when rate is known
                    const net   = rate > 0 ? gross / (1 + rate / 100) : gross - (parseDecimal(draft.vat_amount) || 0);
                    const vat   = gross - net;
                    const biz   = (100 - parseDecimal(draft.private_use_share)) / 100;
                    const sym   = currSymbol(draft.currency || "EUR");
                    return (
                      <div className="text-[10px] font-mono text-black/40 flex gap-3">
                        <span>{t("preview.field_business_net")}: {sym} {(net * biz).toFixed(2)}</span>
                        <span>{t("preview.field_business_vat")}: {sym} {(vat * biz).toFixed(2)}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Private Use — display mode (purchases with share > 0 only) */}
            {!editing && receipt.receipt_type === "purchase" && (receipt.private_use_share ?? 0) > 0 && (
              <>
                <FieldRow
                  label={t("preview.field_private_use")}
                  value={`${((receipt.private_use_share ?? 0) * 100).toFixed(0)} %`}
                />
                {receipt.business_vat != null && (
                  <FieldRow label={t("preview.field_business_vat")} value={cvt(receipt.business_vat)} />
                )}
                {receipt.business_net != null && (
                  <FieldRow label={t("preview.field_business_net")} value={cvt(receipt.business_net)} />
                )}
              </>
            )}
          </div>
        </section>

        {/* Items */}
        {(receipt.items?.length > 0 || editing) && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-black text-xs font-black uppercase tracking-wider">
                {t("preview.section_items")} {editing
                  ? (itemDrafts.length > 0 ? `(${itemDrafts.length})` : "")
                  : (receipt.items?.length > 0 ? `(${receipt.items.length})` : "")}
              </h3>
              {editing && (
                <button onClick={addItem} className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <IconPlusCircle className="w-3.5 h-3.5" /> {t("preview.add_item")}
                </button>
              )}
            </div>
            <div className="border-2 border-black rounded divide-y divide-black/10 overflow-hidden">
              {editing ? (
                itemDrafts.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-black/30 font-mono text-center">{t("preview.no_items")}</div>
                ) : itemDrafts.map((d, i) => (
                  <div key={d.position}>
                    <ItemRow index={i}
                      item={{ description: d.description, position: d.position, quantity: null, unit_price: null, total_price: null, vat_rate: null, vat_amount: null, category: d.category } as ReceiptItem}
                      editing={true} draft={d} currency={rcCurrency}
                      onChange={(field, value) => setItem(i, field, value)}
                      onDelete={() => setConfirmDeleteIdx(i)} />
                    {confirmDeleteIdx === i && (
                      <div className="px-3 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between gap-2">
                        <span className="text-xs text-red-600 font-bold">{t("preview.delete_item", { pos: d.position })}</span>
                        <div className="flex gap-2">
                          <button onClick={() => deleteItem(i)} className="text-[11px] font-black bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 transition-colors">{t("preview.yes")}</button>
                          <button onClick={() => setConfirmDeleteIdx(null)} className="text-[11px] font-black bg-white text-red-500 border border-red-400 px-2 py-0.5 rounded hover:bg-red-50 transition-colors">{t("preview.no")}</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                (receipt.items ?? []).map((item, i) => (
                  <ItemRow key={i} index={i} item={item} editing={false} currency={rcCurrency}
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
              ? <><IconSpinner className="w-4 h-4" /> {t("preview.btn_saving")}</>
              : <><Icon icon="mdi:content-save-outline" className="w-4 h-4" /> {t("preview.btn_save")}</>
            }
          </button>
        </div>
      )}
    </aside>
  );

  // ── Fullscreen layout: PDF left + same panel right ────────────────────────
  const explorer = cpExplorerOpen && (
    <CounterpartiesExplorer
      apiBase={apiBase} dbPath={dbPath}
      onClose={() => setCpExplorerOpen(false)}
      onSelect={(cp) => { applyVerifiedCp(cp); setCpExplorerOpen(false); }}
    />
  );

  if (pdfOpen && pdfUrl) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex bg-black">
          {/* PDF side */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-3 py-2 bg-black border-b border-white/10 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tip label={t("preview.tip_exit_fullscreen")} pos="bottom-right">
                  <button onClick={() => setPdfOpen(false)} className="text-white/50 hover:text-white transition-colors p-0.5 rounded">
                    <Icon icon="mdi:arrow-left" className="w-4 h-4" />
                  </button>
                </Tip>
              </div>
            </div>
            {isPdf(pdfUrl)
              ? <iframe src={pdfUrl} className="flex-1" title="Receipt PDF fullscreen" />
              : (
                <div className="flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden">
                  <img src={pdfUrl} className="max-h-full max-w-full object-contain" alt="Receipt fullscreen" />
                </div>
              )
            }
          </div>
          {/* Data panel — same as normal, full editing available */}
          {panelContent(true)}
        </div>
        {explorer}
      </>
    );
  }

  return (
    <>
      {panelContent(false)}
      {explorer}
    </>
  );
}