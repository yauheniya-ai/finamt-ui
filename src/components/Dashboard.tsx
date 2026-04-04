import { useState } from "react";
import { Icon } from "@iconify/react";
import { IconChevronDown } from "../constants/icons";
import { useTranslation } from "react-i18next";
import type { Receipt, PeriodFilter, TaxpayerProfile } from "./Sidebar";
import { CATEGORY_META, fmt, displayName } from "./Sidebar";
import type { CategoryMeta } from "./Sidebar";

type Props = { receipts: Receipt[]; period: PeriodFilter; taxpayer?: TaxpayerProfile | null; onEditTaxpayer?: () => void };

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ label, value, sub, variant = "white" }: {
  label: string; value: string; sub?: string;
  variant?: "black" | "amber" | "white";
}) {
  const styles = {
    black: "bg-black text-amber-400 border-black",
    amber: "bg-amber-400 text-black border-amber-400",
    white: "bg-white text-black border-amber-400",
  };
  return (
    <div className={`border-2 rounded p-4 flex flex-col gap-1 ${styles[variant]}`}>
      <span className="text-xs uppercase tracking-wider font-bold opacity-70">{label}</span>
      <span className="text-2xl font-black font-mono">{value}</span>
      {sub && <span className="text-xs opacity-60">{sub}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category bar chart (with per-supplier drill-down)
// ---------------------------------------------------------------------------
function CategoryChart({ title, totals, receipts }: {
  title: string;
  totals: Record<string, number>;
  receipts: Receipt[];
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const max    = Math.max(...Object.values(totals), 1);
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  return (
    <div className="bg-white border-2 border-amber-400 rounded p-4">
      <h3 className="text-black text-sm font-black uppercase tracking-wider mb-4">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-black/70 text-sm text-center py-8 font-mono">{t("dashboard.no_data")}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {sorted.map(([cat, total]) => {
            const pct  = Math.round((total / max) * 100);
            const meta = CATEGORY_META[cat] as CategoryMeta | undefined;
            const isOpen = expanded.has(cat);

            // aggregate by supplier within this category
            const supplierTotals = receipts
              .filter((r) => (r.category in CATEGORY_META ? r.category : "other") === cat)
              .reduce<Record<string, number>>((acc, r) => {
                const name = displayName(r);
                acc[name] = (acc[name] ?? 0) + (r.total_amount ?? 0);
                return acc;
              }, {});
            const supplierEntries = Object.entries(supplierTotals).sort(([, a], [, b]) => b - a);
            return (
              <div key={cat}>
                {/* Category row */}
                <div
                  className="flex items-center gap-3 py-2 rounded cursor-pointer hover:bg-amber-50"
                  onClick={() => toggle(cat)}
                >
                  <span className="text-xs text-black/70 font-bold w-36 capitalize shrink-0 flex items-center gap-1.5 truncate">
                    {meta?.icon && <Icon icon={meta.icon} className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">
                      {t(`sidebar.categories.${cat}`, { defaultValue: meta?.label ?? cat })}
                    </span>
                  </span>
                  <div className="flex-1 bg-amber-100 border border-amber-200 rounded h-3 overflow-hidden">
                    <div className="bg-black h-3 rounded transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-black font-black font-mono w-24 text-right shrink-0">
                    {fmt(total)}
                  </span>
                  <IconChevronDown
                    className={`w-3.5 h-3.5 text-black/30 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Supplier breakdown */}
                {isOpen && (
                  <div className="ml-[9.5rem] mb-2 flex flex-col gap-1 border-l-2 border-amber-200 pl-3">
                    {supplierEntries.map(([name, amt]) => (
                      <div key={name} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-black/60 font-mono truncate">{name}</span>
                        <span className="text-[11px] text-black font-mono font-bold shrink-0">{fmt(amt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ELSTER-style VAT row — line | description | base | tax
// ---------------------------------------------------------------------------
function VatRow({ line, label, sublabel, base, tax, bold }: {
  line?:     string;
  label:     string;
  sublabel?: string;
  base?:     string;
  tax?:      string;
  bold?:     boolean;
}) {
  const textCls = bold ? "font-bold text-black" : "text-black/70";
  return (
    <tr className="border-b border-black/10 last:border-0">
      <td className="py-1.5 pr-3 text-[11px] font-mono font-bold text-black w-8 shrink-0">
        {line ?? ""}
      </td>
      <td className={`py-1.5 text-xs ${textCls} flex-1`}>
        {label}
        {sublabel && <span className="block text-[10px] text-black/70 font-normal">{sublabel}</span>}
      </td>
      <td className={`py-1.5 text-right font-mono text-xs ${textCls} whitespace-nowrap pl-6 w-28`}>
        {base ?? ""}
      </td>
      <td className={`py-1.5 text-right font-mono text-xs ${bold ? "font-bold text-black" : "text-black/70"} whitespace-nowrap pl-4 w-28`}>
        {tax ?? ""}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Jahresabschluss (Bilanz + GuV) — § 267a HGB Kleinstkapitalgesellschaft
// ---------------------------------------------------------------------------
const MATERIAL_CATS_JAB = new Set(["material", "equipment"]);
const INCOME_CATS_JAB   = new Set(["services", "consulting", "products", "licensing"]);

type JabSettings = {
  year:          number;
  stammkapital:  number;
  eingezahlt:    number;
  vortrag:       number;
  nettomethode:  boolean;
};

type JabResult = {
  guv: {
    umsatzerlöse:             number;
    sonstigeBetriebserlöse:   number;
    gesamtleistung:           number;
    materialaufwand:          number;
    sonstigeBetriebsausgaben: number;
    gesamtaufwand:            number;
    jahresergebnis:           number;
  };
  bilanz: {
    kassenbestand:             number;
    ausstehendeEinlagenAktiva: number;
    summeAktiva:               number;
    stammkapital:              number;
    nichtEingefordert:         number;
    jahresergebnis:            number;
    gewinnvortrag:             number;
    summeEigenkapital:         number;
    summePassiva:              number;
    ausgeglichen:              boolean;
    differenz:                 number;
  };
};

const r2 = (n: number) => Math.round(n * 100) / 100;

function computeJab(allReceipts: Receipt[], s: JabSettings): JabResult {
  let umsatzerlöse = 0, sonstigeBetriebserlöse = 0;
  let materialaufwand = 0, sonstigeBetriebsausgaben = 0;

  for (const r of allReceipts) {
    if (!r.receipt_date) continue;
    if (parseInt(r.receipt_date.slice(0, 4), 10) !== s.year) continue;
    const net = r.net_amount ?? ((r.total_amount ?? 0) - (r.vat_amount ?? 0));
    const cat = r.category ?? "other";
    if (r.receipt_type === "purchase") {
      if (MATERIAL_CATS_JAB.has(cat)) materialaufwand          += net;
      else                            sonstigeBetriebsausgaben += net;
    } else {
      if (INCOME_CATS_JAB.has(cat))   umsatzerlöse             += net;
      else                            sonstigeBetriebserlöse   += net;
    }
  }

  umsatzerlöse             = r2(umsatzerlöse);
  sonstigeBetriebserlöse   = r2(sonstigeBetriebserlöse);
  materialaufwand          = r2(materialaufwand);
  sonstigeBetriebsausgaben = r2(sonstigeBetriebsausgaben);

  const gesamtleistung = r2(umsatzerlöse + sonstigeBetriebserlöse);
  const gesamtaufwand  = r2(materialaufwand + sonstigeBetriebsausgaben);
  const jahresergebnis = r2(gesamtleistung - gesamtaufwand);

  // Aktiva ----------------------------------------------------------------
  // Opening cash = paid-in capital (Gründungsjahr model: initial Einlage)
  // Revenue received − expenses paid on top of that.
  // Note: vortrag is equity, not cash — do NOT add it here.
  const kassenbestand = r2(Math.max(s.eingezahlt + gesamtleistung - gesamtaufwand, 0));
  const ausstehend    = r2(s.stammkapital - s.eingezahlt);
  const ausstehendeEinlagenAktiva = s.nettomethode ? 0 : ausstehend;
  const summeAktiva   = r2(kassenbestand + ausstehendeEinlagenAktiva);

  // Passiva ---------------------------------------------------------------
  // Nettomethode (§ 272 I S. 2 HGB): deduct nicht-eingeforderte Einlagen
  //   from equity → Bilanzsumme = eingezahltes Kapital only.
  // Bruttomethode (§ 272 I S. 1 HGB): show as Aktiva asset, full Stammkapital
  //   on Passiva → Bilanzsumme = full Stammkapital.
  const nichtEingefordert = s.nettomethode ? ausstehend : 0;
  const summeEigenkapital = r2(s.stammkapital - nichtEingefordert + jahresergebnis + s.vortrag);
  const summePassiva      = summeEigenkapital; // simplified: no Rückstellungen/Verbindlichkeiten

  const differenz    = r2(summeAktiva - summePassiva);
  const ausgeglichen = Math.abs(differenz) < 0.005;

  return {
    guv: {
      umsatzerlöse, sonstigeBetriebserlöse, gesamtleistung,
      materialaufwand, sonstigeBetriebsausgaben, gesamtaufwand, jahresergebnis,
    },
    bilanz: {
      kassenbestand, ausstehendeEinlagenAktiva, summeAktiva,
      stammkapital: s.stammkapital, nichtEingefordert,
      jahresergebnis, gewinnvortrag: s.vortrag,
      summeEigenkapital, summePassiva, ausgeglichen, differenz,
    },
  };
}

function JahresabschlussPanel({ receipts }: { receipts: Receipt[] }) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<JabSettings>({
    year:         currentYear - 1,
    stammkapital: 25000,
    eingezahlt:   12500,
    vortrag:      0,
    nettomethode: true,
  });

  const jab  = computeJab(receipts, s);
  const { guv, bilanz } = jab;

  const fE = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const negFmt = (n: number) => (n < 0 ? `(${fE(Math.abs(n))})` : fE(n));

  const numField = (key: keyof JabSettings, label: string, step = 500) => (
    <label key={key} className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase text-black/50">{label}</span>
      <input
        type="number" step={step}
        value={s[key] as number}
        onChange={(e) => setS((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
        className="w-full border border-amber-300 rounded px-2 py-1 text-xs font-mono bg-amber-50 focus:outline-none focus:border-black"
      />
    </label>
  );

  const ausstehend = r2(s.stammkapital - s.eingezahlt);

  return (
    <div className="bg-white border-2 border-amber-400 rounded">

      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-black text-sm font-black uppercase tracking-wider">{t("dashboard.jab_title")}</h3>
          <p className="text-[10px] text-black/50 font-mono mt-0.5">{t("dashboard.jab_subtitle")}</p>
        </div>
        <IconChevronDown className={`w-4 h-4 text-black/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4 flex flex-col gap-5">

          {/* Settings */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-black/50">{t("dashboard.jab_year")}</span>
              <input
                type="number" step={1}
                value={s.year}
                onChange={(e) => setS((p) => ({ ...p, year: parseInt(e.target.value, 10) || currentYear - 1 }))}
                className="w-full border border-amber-300 rounded px-2 py-1 text-xs font-mono bg-amber-50 focus:outline-none focus:border-black"
              />
            </label>
            {numField("stammkapital", t("dashboard.jab_stammkapital"))}
            {numField("eingezahlt",   t("dashboard.jab_eingezahlt"))}
            {numField("vortrag",      t("dashboard.jab_vortrag"), 100)}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-black/50">{t("dashboard.jab_method")}</span>
              <div className="flex gap-2 items-center pt-1">
                {([true, false] as const).map((v) => (
                  <button key={String(v)}
                    onClick={() => setS((p) => ({ ...p, nettomethode: v }))}
                    className={`text-[10px] px-2 py-1 rounded border font-bold transition-colors ${
                      s.nettomethode === v
                        ? "bg-black text-amber-400 border-black"
                        : "bg-white text-black/50 border-amber-300 hover:border-black"
                    }`}
                  >
                    {v ? t("dashboard.jab_netto") : t("dashboard.jab_brutto")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gründungsjahr / partially paid-in note */}
          {ausstehend > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-[11px] font-mono text-black/70 leading-relaxed">
              <strong className="text-black">{t("dashboard.jab_gruendung_title")}</strong>{" "}
              {t("dashboard.jab_gruendung_note", {
                stammkapital: fE(s.stammkapital),
                eingezahlt:   fE(s.eingezahlt),
                ausstehend:   fE(ausstehend),
              })}
              {s.nettomethode && (
                <><br />{t("dashboard.jab_nettomethode_note")}</>
              )}
            </div>
          )}

          {/* GuV */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-black mb-2">
              {t("dashboard.jab_guv_title")} · § 275 Abs. 2 HGB (Gesamtkostenverfahren)
            </h4>
            <table className="w-full text-xs font-mono border-collapse">
              <tbody>
                <tr className="border-b border-black/10">
                  <td className="py-1 pl-2 text-black/60">{t("dashboard.jab_umsatzerlöse")}</td>
                  <td className="py-1 text-right">{fE(guv.umsatzerlöse)}</td>
                </tr>
                <tr className="border-b border-black/10">
                  <td className="py-1 pl-2 text-black/60">{t("dashboard.jab_sonstige_erlöse")}</td>
                  <td className="py-1 text-right">{fE(guv.sonstigeBetriebserlöse)}</td>
                </tr>
                <tr className="border-b-2 border-amber-200">
                  <td className="py-1 pl-2 font-bold text-black">= {t("dashboard.jab_gesamtleistung")}</td>
                  <td className="py-1 text-right font-bold text-black">{fE(guv.gesamtleistung)}</td>
                </tr>
                <tr className="border-b border-black/10">
                  <td className="py-1 pl-2 text-black/60">− {t("dashboard.jab_materialaufwand")}</td>
                  <td className="py-1 text-right text-black/60">{fE(guv.materialaufwand)}</td>
                </tr>
                <tr className="border-b border-black/10">
                  <td className="py-1 pl-2 text-black/60">− {t("dashboard.jab_sonstige_aufwendungen")}</td>
                  <td className="py-1 text-right text-black/60">{fE(guv.sonstigeBetriebsausgaben)}</td>
                </tr>
                <tr className="border-t-2 border-amber-300">
                  <td className="py-2 pl-2 font-black text-black text-sm">= {t("dashboard.jab_jahresergebnis")}</td>
                  <td className={`py-2 text-right font-black text-sm ${
                    guv.jahresergebnis >= 0 ? "text-black" : "text-red-700"}`}>
                    {negFmt(guv.jahresergebnis)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bilanz — two-column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-black mb-3">
              {t("dashboard.jab_bilanz_title")} · § 266 HGB
            </h4>
            <div className="grid grid-cols-2 gap-6">

              {/* AKTIVA */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">
                  {t("dashboard.jab_aktiva")}
                </p>
                <table className="w-full text-xs font-mono border-collapse">
                  <tbody>
                    <tr className="border-b border-black/10">
                      <td className="py-1 text-black/50">A. {t("dashboard.jab_anlagevermögen")}</td>
                      <td className="py-1 text-right">0,00 €</td>
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="py-1 text-black/50">B. {t("dashboard.jab_umlaufvermögen")}</td>
                      <td />
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="py-1 pl-4 text-black/70">III. {t("dashboard.jab_kassenbestand")}</td>
                      <td className="py-1 text-right font-bold">{fE(bilanz.kassenbestand)}</td>
                    </tr>
                    {!s.nettomethode && bilanz.ausstehendeEinlagenAktiva > 0 && (
                      <tr className="border-b border-black/10">
                        <td className="py-1 text-black/50">C. {t("dashboard.jab_ausstehende_aktiva")}</td>
                        <td className="py-1 text-right font-bold">{fE(bilanz.ausstehendeEinlagenAktiva)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-amber-300">
                      <td className="py-1.5 font-black text-black">{t("dashboard.jab_summe_aktiva")}</td>
                      <td className="py-1.5 text-right font-black text-black">{fE(bilanz.summeAktiva)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PASSIVA */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-black/40 mb-1.5">
                  {t("dashboard.jab_passiva")}
                </p>
                <table className="w-full text-xs font-mono border-collapse">
                  <tbody>
                    <tr className="border-b border-black/10">
                      <td className="py-1 text-black/50">A. {t("dashboard.jab_eigenkapital")}</td>
                      <td />
                    </tr>
                    <tr className="border-b border-black/10">
                      <td className="py-1 pl-3 text-black/70">I. {t("dashboard.jab_gezeichnetes_kapital")}</td>
                      <td className="py-1 text-right">{fE(bilanz.stammkapital)}</td>
                    </tr>
                    {s.nettomethode && bilanz.nichtEingefordert > 0 && (
                      <tr className="border-b border-black/10">
                        <td className="py-1 pl-3 text-black/50 italic">./. {t("dashboard.jab_nicht_eingefordert")}</td>
                        <td className="py-1 text-right text-red-700">({fE(bilanz.nichtEingefordert)})</td>
                      </tr>
                    )}
                    <tr className="border-b border-black/10">
                      <td className="py-1 pl-3 text-black/70">III. {t("dashboard.jab_jahresergebnis_passiva")}</td>
                      <td className={`py-1 text-right ${bilanz.jahresergebnis < 0 ? "text-red-700" : ""}`}>
                        {negFmt(bilanz.jahresergebnis)}
                      </td>
                    </tr>
                    {bilanz.gewinnvortrag !== 0 && (
                      <tr className="border-b border-black/10">
                        <td className="py-1 pl-3 text-black/70">IV. {t("dashboard.jab_gewinnvortrag")}</td>
                        <td className={`py-1 text-right ${bilanz.gewinnvortrag < 0 ? "text-red-700" : ""}`}>
                          {negFmt(bilanz.gewinnvortrag)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-amber-300">
                      <td className="py-1.5 font-black text-black">{t("dashboard.jab_summe_passiva")}</td>
                      <td className="py-1.5 text-right font-black text-black">{fE(bilanz.summePassiva)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Balance check */}
            <div className={`mt-3 px-3 py-2 rounded text-[11px] font-mono font-bold border ${
              bilanz.ausgeglichen
                ? "bg-green-50 border-green-300 text-green-800"
                : "bg-red-50 border-red-300 text-red-800"
            }`}>
              {bilanz.ausgeglichen
                ? "✓ " + t("dashboard.jab_balanced")
                : `✗ ${t("dashboard.jab_unbalanced", { diff: fE(Math.abs(bilanz.differenz)) })}`}
            </div>

            <p className="text-[10px] text-black/40 font-mono mt-3 leading-relaxed">
              ℹ {t("dashboard.jab_disclaimer")}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Dashboard({ receipts, period, taxpayer, onEditTaxpayer }: Props) {
  const { t } = useTranslation();

  // ── Period label ────────────────────────────────────────────────────────
  const monthNames = t("sidebar.months", { returnObjects: true }) as string[];
  const periodLabel = period.mode === "all"
    ? t("dashboard.period_all")
    : period.mode === "year"
    ? t("dashboard.period_year", { year: period.year })
    : period.mode === "quarter"
    ? t("dashboard.period_quarter", { quarter: period.quarter, year: period.year })
    : t("dashboard.period_month", { month: monthNames[period.month - 1], year: period.year });

  const purchases    = receipts.filter((r) => r.receipt_type === "purchase");
  const sales        = receipts.filter((r) => r.receipt_type === "sale");

  const totalExpenses = purchases.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalRevenue  = sales.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const inputVat      = purchases.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
  const outputVat     = sales.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
  const netLiability  = outputVat - inputVat;

  const revenueTotals = sales.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.total_amount ?? 0);
    return acc;
  }, {});

  const expenseTotals = purchases.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.total_amount ?? 0);
    return acc;
  }, {});

  const salesByRate = sales.reduce<Record<string, { net: number; vat: number }>>((acc, r) => {
    if (r.vat_percentage == null) return acc;
    const key = String(r.vat_percentage);
    if (!acc[key]) acc[key] = { net: 0, vat: 0 };
    const net = r.net_amount ?? ((r.total_amount ?? 0) - (r.vat_amount ?? 0));
    acc[key].net += net;
    acc[key].vat += r.vat_amount ?? 0;
    return acc;
  }, {});

  return (
    <main className="flex-1 overflow-y-auto bg-amber-50 p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="border-b-2 border-amber-400 pb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-black text-xl font-black uppercase tracking-tight">{t("dashboard.title")}</h2>
          <p className="text-black/50 text-xs font-mono mt-0.5">{periodLabel}</p>
        </div>
        {taxpayer?.name && (
          <div className="text-right shrink-0">
            <p className="text-black text-xs font-bold font-mono">
              {taxpayer.name}
              {(taxpayer.vat_id || taxpayer.tax_number) && (
                <span className="text-black/50 font-normal ml-1.5">
                  ({[taxpayer.vat_id, taxpayer.tax_number].filter(Boolean).join(" • ")})
                </span>
              )}
            </p>
            <div className="flex items-baseline justify-end gap-2 mt-0.5">
              {(taxpayer.street || taxpayer.address_supplement || taxpayer.city) && (
                <p className="text-black/50 text-[11px] font-mono">
                  {[taxpayer.street, taxpayer.address_supplement, [taxpayer.postcode, taxpayer.city].filter(Boolean).join(" "), taxpayer.state, taxpayer.country].filter(Boolean).join(", ")}
                </p>
              )}
              {onEditTaxpayer && (
                <button
                  onClick={onEditTaxpayer}
                  className="text-[10px] text-black/30 hover:text-black font-bold underline underline-offset-2 shrink-0"
                >
                  {t("sidebar.taxpayer_edit_btn")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard variant="black" label={t("dashboard.stat_revenue")}
          value={fmt(totalRevenue)}
          sub={sales.length === 1 ? t("dashboard.count_invoices", { n: sales.length }) : t("dashboard.count_invoices_plural", { n: sales.length })} />
        <StatCard variant="amber" label={t("dashboard.stat_expenses")}
          value={fmt(totalExpenses)}
          sub={purchases.length === 1 ? t("dashboard.count_receipts", { n: purchases.length }) : t("dashboard.count_receipts_plural", { n: purchases.length })} />
        <StatCard variant="black" label={t("dashboard.stat_output_vat")}
          value={fmt(outputVat)} sub={t("dashboard.stat_payable")} />
        <StatCard variant="amber" label={t("dashboard.stat_input_vat")}
          value={fmt(inputVat)} sub={t("dashboard.stat_reclaimable")} />
        <StatCard variant="white"
          label={netLiability === 0 ? t("dashboard.stat_vat_balance") : netLiability > 0 ? t("dashboard.stat_vat_payable") : t("dashboard.stat_vat_refund")}
          value={fmt(Math.abs(netLiability))}
          sub={t("dashboard.stat_output_minus_input")} />
      </div>

      {/* Category charts */}
      <div className={`grid gap-4 ${
        Object.keys(revenueTotals).length > 0 && Object.keys(expenseTotals).length > 0
          ? "grid-cols-2" : "grid-cols-1"
      }`}>
        {Object.keys(revenueTotals).length > 0 && (
          <CategoryChart title={t("dashboard.chart_revenue")} totals={revenueTotals} receipts={sales} />
        )}
        {Object.keys(expenseTotals).length > 0 && (
          <CategoryChart title={t("dashboard.chart_expenses")} totals={expenseTotals} receipts={purchases} />
        )}
        {receipts.length === 0 && (
          <div className="bg-white border-2 border-amber-400 rounded p-8 text-center col-span-2">
            <p className="text-black/70 text-sm font-mono">
              {t("dashboard.no_data_hint")}
            </p>
          </div>
        )}
      </div>

      {/* ELSTER-style VAT advance return */}
      <div className="bg-white border-2 border-amber-400 rounded p-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-black text-sm font-black uppercase tracking-wider">
            {t("dashboard.vat_title")}
          </h3>
        </div>
        <p className="text-[10px] text-black/70 font-mono mb-4">
          {receipts.length === 1
            ? t("dashboard.vat_doc_count", { count: receipts.length })
            : t("dashboard.vat_doc_count_plural", { count: receipts.length })}
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="pb-1.5 pr-3 w-8" />
              <th className="pb-1.5 text-left text-[10px] font-black uppercase tracking-wider text-black">
                {t("dashboard.vat_col_section")}
              </th>
              <th className="pb-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-black/70 w-28 pl-6">
                {t("dashboard.vat_col_base")}
              </th>
              <th className="pb-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-black/70 w-28 pl-4">
                {t("dashboard.vat_col_tax")}
              </th>
            </tr>
          </thead>
          <tbody>

            {/* Taxable supplies */}
            <tr><td colSpan={4} className="pt-3 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black">
                {t("dashboard.vat_taxable_supplies")}
              </span>
            </td></tr>

            <VatRow line="81" label={t("dashboard.vat_line_19")}
              base={fmt(salesByRate["19"]?.net ?? 0)}
              tax={fmt(salesByRate["19"]?.vat ?? 0)} />
            <VatRow line="86" label={t("dashboard.vat_line_7")}
              base={fmt(salesByRate["7"]?.net ?? 0)}
              tax={fmt(salesByRate["7"]?.vat ?? 0)} />
            <VatRow line="87" label={t("dashboard.vat_line_0")}
              base={fmt(salesByRate["0"]?.net ?? 0)}
              tax={fmt(salesByRate["0"]?.vat ?? 0)} />

            {/* Deductible input VAT */}
            <tr><td colSpan={4} className="pt-4 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black">
                {t("dashboard.vat_input_section")}
              </span>
            </td></tr>

            <VatRow line="66" label={t("dashboard.vat_input_label")}
              tax={fmt(inputVat)} />

            {/* Net payable / refund */}
            <tr className="border-t-2 border-amber-400">
              <td className="pt-3 pb-2 pr-3 text-[11px] font-mono font-bold text-black w-8">83</td>
              <td className="pt-3 pb-2">
                <span className="text-xs font-bold text-black">
                  {netLiability >= 0 ? t("dashboard.vat_payable_label") : t("dashboard.vat_refund_label")}
                </span>
                <span className="block text-[10px] text-black/70 font-normal">
                  {netLiability >= 0 ? t("dashboard.vat_payable_sub") : t("dashboard.vat_refund_sub")}
                </span>
              </td>
              <td />
              <td className="pt-3 pb-2 text-right font-mono text-sm font-black text-black whitespace-nowrap pl-4 w-28">
                {netLiability < 0 ? "−" : ""}{fmt(Math.abs(netLiability))}
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Jahresabschluss */}
      <JahresabschlussPanel receipts={receipts} />

      {/* Tax return tiles */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { key: "eur", icon: "mdi:calculator-variant-outline" },
          { key: "ust", icon: "mdi:file-percent-outline" },
          { key: "est", icon: "mdi:account-cash-outline" },
          { key: "gst", icon: "mdi:domain" },
        ]).map(({ key, icon }) => (
          <div key={key}
            className="bg-white border-2 border-amber-400 border-dashed rounded p-6 flex flex-col items-center justify-center gap-2 text-center">
            <Icon icon={icon} className="w-7 h-7 text-black/20" />
            <span className="text-black/70 text-sm font-black uppercase tracking-wider">{t(`dashboard.tile_${key}_title`)}</span>
            <span className="text-black/40 text-[10px] font-mono">{t(`dashboard.tile_${key}_sub`)}</span>
            <span className="text-black/40 text-xs font-mono">{t("dashboard.coming_soon")}</span>
          </div>
        ))}
      </div>
    </main>
  );
}