import { useState } from "react";
import { Icon } from "@iconify/react";
import { IconChevronDown } from "../constants/icons";
import { useTranslation } from "react-i18next";
import type { Receipt, PeriodFilter, TaxpayerProfile } from "./Sidebar";
import { CATEGORY_META, CASHFLOW_ONLY_CATS, fmt, displayName } from "./Sidebar";
import type { CategoryMeta } from "./Sidebar";

type Props = { receipts: Receipt[]; allReceipts: Receipt[]; period: PeriodFilter; taxpayer?: TaxpayerProfile | null; onEditTaxpayer?: () => void };

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
                    className={`w-3.5 h-3.5 text-black shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Supplier breakdown */}
                {isOpen && (
                  <div className="ml-[9.5rem] mb-2 flex flex-col gap-1 border-l-2 border-amber-200 pl-3">
                    {supplierEntries.map(([name, amt]) => (
                      <div key={name} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-black/70 font-mono truncate">{name}</span>
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
    <tr className="border-b border-amber-100 last:border-0">
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
  nettomethode: boolean;
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
    gewinnvortrag:             number;   // auto-computed from prior years
    /** Net cash from cashflow-only items (tax_settlement, capital_movement)
     *  in the reporting year.  Positive = net refund / inflow received.
     *  Shown as a separate Passiva line so the balance sheet stays balanced. */
    steuerpositionen:          number;
    summeEigenkapital:         number;
    summePassiva:              number;
    ausgeglichen:              boolean;
    differenz:                 number;
  };
};

const r2 = (n: number) => Math.round(n * 100) / 100;

function computeJab(
  allReceipts:   Receipt[],
  gründungsjahr: number,
  stammkapital:  number,
  eingezahlt:    number,
  nettomethode:  boolean,
  year:          number,
): JabResult {
  // Split receipts into prior years (for vortrag + opening cash)
  // and the reporting year (for GuV).
  let umsatzerlöse = 0, sonstigeBetriebserlöse = 0;
  let materialaufwand = 0, sonstigeBetriebsausgaben = 0;
  let priorNet = 0; // cumulative net result from Gründungsjahr to year-1
  // Net cash from cashflow-only receipts (tax_settlement, capital_movement)
  // in the reporting year only.  Prior-year cashflow IS folded into priorNet
  // so that opening-cash and gewinnvortrag stay correct for subsequent years.
  let cashflowNetCurrent = 0;

  for (const r of allReceipts) {
    if (!r.receipt_date) continue;
    const ry = parseInt(r.receipt_date.slice(0, 4), 10);
    if (ry < gründungsjahr || ry > year) continue;
    const net = r.net_amount ?? ((r.total_amount ?? 0) - (r.vat_amount ?? 0));
    const cat = r.category ?? "other";
    const isPurchase = r.receipt_type === "purchase";
    const cashImpact = isPurchase ? -net : net;

    // Cashflow-only items (tax settlements, capital movements):
    // — excluded from GuV entirely
    // — their cash impact is tracked separately so it reaches the bank balance
    if (CASHFLOW_ONLY_CATS.has(cat)) {
      if (ry < year) priorNet += cashImpact; // carry into opening cash of next year
      else           cashflowNetCurrent += cashImpact;
      continue;
    }

    if (ry < year) {
      // Accumulate into Gewinnvortrag and opening-cash carry-forward.
      priorNet += isPurchase ? -net : net;
    } else {
      // Current reporting year → GuV.
      if (isPurchase) {
        if (MATERIAL_CATS_JAB.has(cat)) materialaufwand          += net;
        else                            sonstigeBetriebsausgaben += net;
      } else {
        if (INCOME_CATS_JAB.has(cat))   umsatzerlöse             += net;
        else                            sonstigeBetriebserlöse   += net;
      }
    }
  }

  umsatzerlöse             = r2(umsatzerlöse);
  sonstigeBetriebserlöse   = r2(sonstigeBetriebserlöse);
  materialaufwand          = r2(materialaufwand);
  sonstigeBetriebsausgaben = r2(sonstigeBetriebsausgaben);
  priorNet                 = r2(priorNet);
  cashflowNetCurrent       = r2(cashflowNetCurrent);

  const gesamtleistung = r2(umsatzerlöse + sonstigeBetriebserlöse);
  const gesamtaufwand  = r2(materialaufwand + sonstigeBetriebsausgaben);
  const jahresergebnis = r2(gesamtleistung - gesamtaufwand);

  // Opening cash for the reporting year:
  //   Capital was injected ONCE in the Gründungsjahr.
  //   Each subsequent year's opening cash = prior year's closing cash
  //   = eingezahlt + cumulative net result of all prior years
  //     (priorNet now also contains prior-year cashflow-only flows).
  const openingCash  = r2(eingezahlt + priorNet);
  // kassenbestand: P&L flows + cashflow-only flows (refunds/payments to Finanzamt etc.)
  const kassenbestand = r2(Math.max(openingCash + gesamtleistung - gesamtaufwand + cashflowNetCurrent, 0));

  const ausstehend = r2(stammkapital - eingezahlt);
  const ausstehendeEinlagenAktiva = nettomethode ? 0 : ausstehend;
  const summeAktiva = r2(kassenbestand + ausstehendeEinlagenAktiva);

  const nichtEingefordert = nettomethode ? ausstehend : 0;
  // Gewinnvortrag = cumulative result of all years BEFORE the reporting year
  // (includes prior cashflow-only items so it mirrors the actual opening cash).
  const gewinnvortrag     = priorNet;
  const summeEigenkapital = r2(stammkapital - nichtEingefordert + gewinnvortrag + jahresergebnis);
  // cashflow-only items of the reporting year appear here as a dedicated Passiva position
  // so the balance sheet stays balanced without distorting the GuV.
  const steuerpositionen  = cashflowNetCurrent;
  const summePassiva      = r2(summeEigenkapital + steuerpositionen);

  const differenz    = r2(summeAktiva - summePassiva);
  const ausgeglichen = Math.abs(differenz) < 0.005;

  return {
    guv: {
      umsatzerlöse, sonstigeBetriebserlöse, gesamtleistung,
      materialaufwand, sonstigeBetriebsausgaben, gesamtaufwand, jahresergebnis,
    },
    bilanz: {
      kassenbestand, ausstehendeEinlagenAktiva, summeAktiva,
      stammkapital, nichtEingefordert,
      jahresergebnis, gewinnvortrag, steuerpositionen,
      summeEigenkapital, summePassiva, ausgeglichen, differenz,
    },
  };
}

function JahresabschlussPanel({ allReceipts, period, taxpayer, onEditTaxpayer }: {
  allReceipts:     Receipt[];
  period:          PeriodFilter;
  taxpayer?:       TaxpayerProfile | null;
  onEditTaxpayer?: () => void;
}) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  // Derive the reporting year from the sidebar period — the user should not enter it manually.
  const year = period.mode === "all" ? currentYear - 1 : period.year;

  const [open, setOpen] = useState(false);
  const [s, setS] = useState<JabSettings>({
    nettomethode: true,
  });

  // Company facts come from taxpayer profile (persisted in DB).
  // Fall back to sensible defaults so the panel is always usable.
  const gründungsjahr = Math.min(taxpayer?.gründungsjahr ?? year, year);
  const stammkapital  = taxpayer?.stammkapital ?? 25000;
  const eingezahlt    = taxpayer?.eingezahlt   ?? 12500;

  const jab  = computeJab(allReceipts, gründungsjahr, stammkapital, eingezahlt, s.nettomethode, year);
  const { guv, bilanz } = jab;

  const fE = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const negFmt = (n: number) => (n < 0 ? `(${fE(Math.abs(n))})` : fE(n));

  const ausstehend = r2(stammkapital - eingezahlt);
  const isGründungsjahr = year === gründungsjahr;

  return (
    <div className="bg-white border-2 border-amber-400 rounded">

      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-black text-sm font-black tracking-wide">{t("dashboard.jab_title")}</h3>
          <p className="text-[10px] text-black font-mono mt-0.5">
            Bilanz + GuV · <LawLink law="§§ 242–256a HGB" href="https://www.gesetze-im-internet.de/hgb/__242.html" /> · Kleinstkapitalgesellschaft (<LawLink law="§ 267a HGB" href="https://www.gesetze-im-internet.de/hgb/__267a.html" />)
          </p>
        </div>
        <IconChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4 flex flex-col gap-5">

          {/* Period badge — shows the year derived from the sidebar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_year")}</span>
            <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{year}</span>
            {period.mode === "all" && (
              <span className="text-[10px] text-black font-mono">← {t("dashboard.jab_year_hint_all")}</span>
            )}
          </div>

          {/* Settings — company facts (read-only, edit via taxpayer profile) */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Read-only company facts */}
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_gründungsjahr")}</span>
                <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{gründungsjahr}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_stammkapital")}</span>
                <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{fE(stammkapital)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_eingezahlt")}</span>
                <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{fE(eingezahlt)}</span>
              </div>
            </div>
            {/* Nettomethode toggle */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_method")}</span>
              <div className="flex gap-2 items-center">
                {([true, false] as const).map((v) => (
                  <button key={String(v)}
                    onClick={() => setS((p) => ({ ...p, nettomethode: v }))}
                    className={`text-[10px] px-2 py-1 rounded border font-bold transition-colors ${
                      s.nettomethode === v
                        ? "bg-black text-amber-400 border-black"
                        : "bg-white text-black border-amber-300 hover:border-black"
                    }`}
                  >
                    {v ? t("dashboard.jab_netto") : t("dashboard.jab_brutto")}
                  </button>
                ))}
              </div>
            </div>
            {/* Edit link */}
            {onEditTaxpayer && (
              <button
                onClick={onEditTaxpayer}
                className="text-[10px] font-bold text-black underline underline-offset-2 hover:text-amber-700 transition-colors pb-0.5"
              >
                {t("sidebar.taxpayer_edit_btn")} →
              </button>
            )}
          </div>

          {/* Gründungsjahr / partially paid-in note */}
          {ausstehend > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-[11px] font-mono text-black/70 leading-relaxed">
              <strong className="text-black">{t("dashboard.jab_gruendung_title")}</strong>{" "}
              {t("dashboard.jab_gruendung_note", {
                stammkapital: fE(stammkapital),
                eingezahlt:   fE(eingezahlt),
                ausstehend:   fE(ausstehend),
              })}
              {s.nettomethode && (
                <><br />{t("dashboard.jab_nettomethode_note")}</>
              )}
            </div>
          )}
          {!isGründungsjahr && jab.bilanz.gewinnvortrag !== 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded p-2 text-[11px] font-mono text-black/70">
              {t("dashboard.jab_vortrag_computed", {
                years: gründungsjahr === year - 1
                  ? `${gründungsjahr}`
                  : `${gründungsjahr}\u2013${year - 1}`,
                amount: negFmt(jab.bilanz.gewinnvortrag),
              })}
            </div>
          )}

          {/* GuV */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-black mb-2">
              {t("dashboard.jab_guv_title")} · § 275 Abs. 2 HGB (Gesamtkostenverfahren)
            </h4>
            <table className="w-full text-xs font-mono border-collapse">
              <tbody>
                <tr className="border-b border-amber-100">
                  <td className="py-1 pl-2 text-black">{t("dashboard.jab_umsatzerlöse")}</td>
                  <td className="py-1 text-right">{fE(guv.umsatzerlöse)}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1 pl-2 text-black">{t("dashboard.jab_sonstige_erlöse")}</td>
                  <td className="py-1 text-right">{fE(guv.sonstigeBetriebserlöse)}</td>
                </tr>
                <tr className="border-b-2 border-amber-200">
                  <td className="py-1 pl-2 font-bold text-black">= {t("dashboard.jab_gesamtleistung")}</td>
                  <td className="py-1 text-right font-bold text-black">{fE(guv.gesamtleistung)}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1 pl-2 text-black">− {t("dashboard.jab_materialaufwand")}</td>
                  <td className="py-1 text-right text-black">{fE(guv.materialaufwand)}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1 pl-2 text-black">− {t("dashboard.jab_sonstige_aufwendungen")}</td>
                  <td className="py-1 text-right text-black">{fE(guv.sonstigeBetriebsausgaben)}</td>
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
                <p className="text-[10px] font-black uppercase tracking-wider text-black mb-1.5">
                  {t("dashboard.jab_aktiva")}
                </p>
                <table className="w-full text-xs font-mono border-collapse">
                  <tbody>
                    <tr className="border-b border-amber-100">
                      <td className="py-1 text-black/70">A. {t("dashboard.jab_anlagevermögen")}</td>
                      <td className="py-1 text-right">0,00 €</td>
                    </tr>
                    <tr className="border-b border-amber-100">
                      <td className="py-1 text-black/70">B. {t("dashboard.jab_umlaufvermögen")}</td>
                      <td />
                    </tr>
                    <tr className="border-b border-amber-100">
                      <td className="py-1 pl-4 text-black/70">III. {t("dashboard.jab_kassenbestand")}</td>
                      <td className="py-1 text-right font-bold">{fE(bilanz.kassenbestand)}</td>
                    </tr>
                    {!s.nettomethode && bilanz.ausstehendeEinlagenAktiva > 0 && (
                      <tr className="border-b border-amber-100">
                        <td className="py-1 text-black/70">C. {t("dashboard.jab_ausstehende_aktiva")}</td>
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
                <p className="text-[10px] font-black uppercase tracking-wider text-black mb-1.5">
                  {t("dashboard.jab_passiva")}
                </p>
                <table className="w-full text-xs font-mono border-collapse">
                  <tbody>
                    <tr className="border-b border-amber-100">
                      <td className="py-1 text-black/70">A. {t("dashboard.jab_eigenkapital")}</td>
                      <td />
                    </tr>
                    <tr className="border-b border-amber-100">
                      <td className="py-1 pl-3 text-black/70">I. {t("dashboard.jab_gezeichnetes_kapital")}</td>
                      <td className="py-1 text-right">{fE(bilanz.stammkapital)}</td>
                    </tr>
                    {s.nettomethode && bilanz.nichtEingefordert > 0 && (
                      <tr className="border-b border-amber-100">
                        <td className="py-1 pl-3 text-black/70 italic">./. {t("dashboard.jab_nicht_eingefordert")}</td>
                        <td className="py-1 text-right text-red-700">({fE(bilanz.nichtEingefordert)})</td>
                      </tr>
                    )}
                    <tr className="border-b border-amber-100">
                      <td className="py-1 pl-3 text-black/70">III. {t("dashboard.jab_jahresergebnis_passiva")}</td>
                      <td className={`py-1 text-right ${bilanz.jahresergebnis < 0 ? "text-red-700" : ""}`}>
                        {negFmt(bilanz.jahresergebnis)}
                      </td>
                    </tr>
                    {bilanz.gewinnvortrag !== 0 && (
                      <tr className="border-b border-amber-100">
                        <td className="py-1 pl-3 text-black/70">IV. {t("dashboard.jab_gewinnvortrag")}</td>
                        <td className={`py-1 text-right ${bilanz.gewinnvortrag < 0 ? "text-red-700" : ""}`}>
                          {negFmt(bilanz.gewinnvortrag)}
                        </td>
                      </tr>
                    )}
                    {bilanz.steuerpositionen !== 0 && (
                      <tr className="border-b border-amber-100">
                        <td className="py-1 text-black/70">
                          B. {t("dashboard.jab_steuerpositionen")}
                        </td>
                        <td className={`py-1 text-right ${bilanz.steuerpositionen < 0 ? "text-red-700" : ""}`}>
                          {negFmt(bilanz.steuerpositionen)}
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

            <p className="text-[10px] text-black font-mono mt-3 leading-relaxed">
              ℹ {t("dashboard.jab_disclaimer")}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Law reference link
// ---------------------------------------------------------------------------
function LawLink({ law, href }: { law: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-0.5 hover:text-amber-700 transition-colors underline underline-offset-2 decoration-dotted"
    >
      {law}
      <Icon icon="mdi:open-in-new" className="w-2.5 h-2.5 inline-block" />
    </a>
  );
}

// ---------------------------------------------------------------------------
// UStVA panel — collapsible
// ---------------------------------------------------------------------------
function UStVAPanel({ receipts, period }: { receipts: Receipt[]; period: PeriodFilter }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const monthNames = t("sidebar.months", { returnObjects: true }) as string[];
  const declType = period.mode === "month" ? t("dashboard.decl_monthly")
    : period.mode === "quarter" ? t("dashboard.decl_quarterly")
    : t("dashboard.decl_annual");
  const periodTag = period.mode === "month" ? `${monthNames[period.month - 1]} ${period.year}`
    : period.mode === "quarter" ? `Q${period.quarter} ${period.year}`
    : period.mode === "year" ? String(period.year)
    : String(new Date().getFullYear() - 1);

  const purchases   = receipts.filter((r) => r.receipt_type === "purchase");
  const sales       = receipts.filter((r) => r.receipt_type === "sale");
  const regularInputVat = purchases.reduce((s, r) => s + (r.business_vat ?? r.vat_amount ?? 0), 0);
  const einfuhrInputVat = purchases.reduce((s, r) => s + (r.einfuhr_vat ?? 0), 0);
  const inputVat    = regularInputVat + einfuhrInputVat;
  const outputVat   = sales.reduce((s, r) => s + (r.business_vat ?? r.vat_amount ?? 0), 0);
  const netLiability = outputVat - inputVat;

  const salesByRate = sales.reduce<Record<string, { net: number; vat: number }>>((acc, r) => {
    if (r.vat_percentage == null) return acc;
    const key = String(r.vat_percentage);
    if (!acc[key]) acc[key] = { net: 0, vat: 0 };
    const net = r.business_net ?? r.net_amount ?? ((r.total_amount ?? 0) / (1 + (r.vat_percentage ?? 0) / 100));
    const vat = r.business_vat ?? r.vat_amount ?? ((r.total_amount ?? 0) - net);
    acc[key].net += net;
    acc[key].vat += vat;
    return acc;
  }, {});

  return (
    <div className="bg-white border-2 border-amber-400 rounded">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-black text-sm font-black tracking-wide">{t("dashboard.vat_title")}</h3>
          <p className="text-[10px] text-black font-mono mt-0.5">
            {declType} · <LawLink law="§ 18 UStG" href="https://www.gesetze-im-internet.de/ustg_1980/__18.html" /> · {periodTag}
          </p>
        </div>
        <IconChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4">
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
              <tr><td colSpan={4} className="pt-4 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  {t("dashboard.vat_input_section")}
                </span>
              </td></tr>
              <VatRow line="66" label={t("dashboard.vat_input_label")}
                tax={fmt(inputVat)} />
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Umsatzsteuererklärung panel — annual VAT return · §18 UStG
// ---------------------------------------------------------------------------
function UStErkPanel({ allReceipts, period }: { allReceipts: Receipt[]; period: PeriodFilter }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentYear  = new Date().getFullYear();
  const year         = period.mode === "all" ? currentYear - 1 : period.year;
  const yearReceipts = allReceipts.filter((r) => r.receipt_date?.startsWith(String(year)));

  const purchases    = yearReceipts.filter((r) => r.receipt_type === "purchase");
  const sales        = yearReceipts.filter((r) => r.receipt_type === "sale");
  const regularInputVat = purchases.reduce((s, r) => s + (r.business_vat ?? r.vat_amount ?? 0), 0);
  const einfuhrInputVat = purchases.reduce((s, r) => s + (r.einfuhr_vat ?? 0), 0);
  const inputVat     = regularInputVat + einfuhrInputVat;
  const outputVat    = sales.reduce((s, r) => s + (r.business_vat ?? r.vat_amount ?? 0), 0);
  const netLiability = outputVat - inputVat;

  const salesByRate = sales.reduce<Record<string, { net: number; vat: number }>>((acc, r) => {
    if (r.vat_percentage == null) return acc;
    const key = String(r.vat_percentage);
    if (!acc[key]) acc[key] = { net: 0, vat: 0 };
    const net = r.business_net ?? r.net_amount ?? ((r.total_amount ?? 0) / (1 + (r.vat_percentage ?? 0) / 100));
    const vat = r.business_vat ?? r.vat_amount ?? ((r.total_amount ?? 0) - net);
    acc[key].net += net;
    acc[key].vat += vat;
    return acc;
  }, {});

  return (
    <div className="bg-white border-2 border-amber-400 rounded">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-black text-sm font-black tracking-wide">{t("dashboard.uste_title")}</h3>
          <p className="text-[10px] text-black font-mono mt-0.5">
            {t("dashboard.decl_annual")} · <LawLink law="§ 18 UStG" href="https://www.gesetze-im-internet.de/ustg_1980/__18.html" /> · {year}
          </p>
        </div>
        <IconChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4 flex flex-col gap-4">

          {/* Year badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_year")}</span>
            <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{year}</span>
            {period.mode === "all" && (
              <span className="text-[10px] text-black font-mono">← {t("dashboard.jab_year_hint_all")}</span>
            )}
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="pb-1.5 pr-3 w-8" />
                <th className="pb-1.5 text-left text-[10px] font-black uppercase tracking-wider text-black">
                  {t("dashboard.uste_col_section")}
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
              <tr><td colSpan={4} className="pt-4 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  {t("dashboard.vat_input_section")}
                </span>
              </td></tr>
              <VatRow line="122" label={t("dashboard.uste_input_regular_label")}
                tax={fmt(regularInputVat)} />
              {einfuhrInputVat > 0 && (
                <VatRow line="124" label={t("dashboard.vat_einfuhr_label")}
                  tax={fmt(einfuhrInputVat)} />
              )}
              {einfuhrInputVat > 0 && (
                <VatRow line="131" label={t("dashboard.uste_input_sum_label")} bold
                  tax={fmt(inputVat)} />
              )}
              <tr className="border-t-2 border-amber-400">
                <td className="pt-3 pb-2 pr-3 text-[11px] font-mono font-bold text-black w-8">83</td>
                <td className="pt-3 pb-2">
                  <span className="text-xs font-bold text-black">
                    {netLiability >= 0 ? t("dashboard.vat_payable_label") : t("dashboard.vat_refund_label")}
                  </span>
                  <span className="block text-[10px] text-black/70 font-normal">
                    {netLiability >= 0 ? t("dashboard.uste_payable_sub") : t("dashboard.uste_refund_sub")}
                  </span>
                </td>
                <td />
                <td className="pt-3 pb-2 text-right font-mono text-sm font-black text-black whitespace-nowrap pl-4 w-28">
                  {netLiability < 0 ? "−" : ""}{fmt(Math.abs(netLiability))}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-[10px] text-black font-mono leading-relaxed">
            ℹ {t("dashboard.uste_disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gewerbesteuererklärung panel — §§ 14 ff. GewStG
// ---------------------------------------------------------------------------
function computeGewerbeertrag(allReceipts: Receipt[], year: number): number {
  let revenue = 0, expenses = 0;
  for (const r of allReceipts) {
    if (!r.receipt_date) continue;
    const ry = parseInt(r.receipt_date.slice(0, 4), 10);
    if (ry !== year) continue;
    // Exclude cashflow-only categories from trade-tax base (§ 7 GewStG)
    if (CASHFLOW_ONLY_CATS.has(r.category ?? "other")) continue;
    const net = r.net_amount ?? ((r.total_amount ?? 0) - (r.vat_amount ?? 0));
    if (r.receipt_type === "purchase") expenses += net;
    else revenue += net;
  }
  return Math.round((revenue - expenses) * 100) / 100;
}

function GewStPanel({ allReceipts, period, taxpayer, onEditTaxpayer }: {
  allReceipts:     Receipt[];
  period:          PeriodFilter;
  taxpayer?:       TaxpayerProfile | null;
  onEditTaxpayer?: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hebesatz = taxpayer?.hebesatz ?? 400;

  const currentYear = new Date().getFullYear();
  const year = period.mode === "all" ? currentYear - 1 : period.year;

  const gewerbeertrag        = computeGewerbeertrag(allReceipts, year);
  // Round down to full 100 € — § 11 Abs. 1 GewStG
  const gewerbeertragRounded = Math.floor(Math.max(gewerbeertrag, 0) / 100) * 100;
  const steuermessbetrag     = Math.round(gewerbeertragRounded * 0.035 * 100) / 100;
  const gewerbesteuer        = Math.round(steuermessbetrag * (hebesatz / 100) * 100) / 100;

  const fE = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div className="bg-white border-2 border-amber-400 rounded">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-black text-sm font-black tracking-wide">{t("dashboard.gewst_title")}</h3>
          <p className="text-[10px] text-black font-mono mt-0.5">
            {t("dashboard.decl_annual")} · <LawLink law="§§ 14 ff. GewStG" href="https://www.gesetze-im-internet.de/gewstg/__14.html" /> · {year}
          </p>
        </div>
        <IconChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4 flex flex-col gap-4">

          {/* Year badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_year")}</span>
            <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{year}</span>
            {period.mode === "all" && (
              <span className="text-[10px] text-black font-mono">← {t("dashboard.jab_year_hint_all")}</span>
            )}
          </div>

          {/* Hebesatz display + edit link */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.gewst_hebesatz")}</span>
              <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{hebesatz} %</span>
            </div>
            {onEditTaxpayer && (
              <button
                onClick={onEditTaxpayer}
                className="text-[10px] font-bold text-black underline underline-offset-2 hover:text-amber-700 transition-colors pb-0.5"
              >
                {t("sidebar.taxpayer_edit_btn")} →
              </button>
            )}
          </div>

          {/* Allgemeine Angaben */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-black">{t("dashboard.gewst_allgemeine_angaben")}</span>
            <table className="w-full text-xs font-mono border-collapse">
              <tbody>
                <tr className="border-b border-amber-100">
                  <td className="py-1 text-black/40 text-[10px] w-8">3</td>
                  <td className="py-1 text-black/70">{t("dashboard.gewst_firma")}</td>
                  <td className="py-1 text-right text-black font-bold">{taxpayer?.name || "—"}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1 text-black/40 text-[10px] w-8">4</td>
                  <td className="py-1 text-black/70">{t("dashboard.gewst_gegenstand")}</td>
                  <td className="py-1 text-right text-black">{taxpayer?.gegenstand || "—"}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1 text-black/40 text-[10px] w-8">14</td>
                  <td className="py-1 text-black/70">{t("dashboard.gewst_rechtsform")}</td>
                  <td className="py-1 text-right text-black">{taxpayer?.rechtsform || "GmbH"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Angaben zur Betriebsstätte */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-black">{t("dashboard.gewst_betriebsstaette")}</span>
            <table className="w-full text-xs font-mono border-collapse">
              <tbody>
                {(
                  [
                    [26, "gewst_mehrere_gemeinden",   "betriebsstaette_mehrere"],
                    [27, "gewst_erstreckt_gemeinden", "betriebsstaette_erstreckt"],
                    [28, "gewst_verlegt",             "betriebsstaette_verlegt"],
                  ] as [number, string, keyof TaxpayerProfile][]
                ).map(([zeile, labelKey, field]) => {
                  const val = taxpayer?.[field];
                  const jaOrNein = val ? "Ja" : "Nein";
                  return (
                    <tr key={zeile} className="border-b border-amber-100">
                      <td className="py-1 text-black/40 text-[10px] w-8">{zeile}</td>
                      <td className="py-1 text-black/70">{t(`dashboard.${labelKey}`)}</td>
                      <td className="py-1 text-right">
                        <span className={`font-bold ${val ? "text-amber-700" : "text-black"}`}>{jaOrNein}</span>
                        {onEditTaxpayer && <button onClick={onEditTaxpayer} className="ml-2 text-[9px] text-black/40 underline hover:text-amber-700">✎</button>}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b border-amber-100">
                  <td className="py-1 text-black/40 text-[10px] w-8">31</td>
                  <td className="py-1 text-black/70">{t("dashboard.gewst_plz")}</td>
                  <td className="py-1 text-right text-black">{taxpayer?.postcode || "—"}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1 text-black/40 text-[10px] w-8">32</td>
                  <td className="py-1 text-black/70">{t("dashboard.gewst_ort")}</td>
                  <td className="py-1 text-right text-black">{taxpayer?.city || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Gewinn aus Gewerbebetrieb + computation */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-black">{t("dashboard.gewst_gewinn_section")}</span>
            <table className="w-full text-xs font-mono border-collapse">
              <tbody>
                <tr className="border-b border-amber-100">
                  <td className="py-1.5 text-black/40 text-[10px] w-8">39</td>
                  <td className="py-1.5 text-black">{t("dashboard.gewst_gewerbeertrag")}</td>
                  <td className="py-1.5 text-right text-black">{fE(gewerbeertrag)}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1.5 w-8" />
                  <td className="py-1.5 text-black/70 pl-4">{t("dashboard.gewst_rounded")}</td>
                  <td className="py-1.5 text-right text-black/70">{fE(gewerbeertragRounded)}</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-1.5 w-8" />
                  <td className="py-1.5 text-black">× {t("dashboard.gewst_steuermesszahl")} (3,5 %)</td>
                  <td className="py-1.5 text-right text-black">{fE(steuermessbetrag)}</td>
                </tr>
                <tr className="border-t-2 border-amber-300">
                  <td className="py-2 w-8" />
                  <td className="py-2 font-black text-black text-sm">
                    × {t("dashboard.gewst_hebesatz")} ({hebesatz} %) = {t("dashboard.gewst_gewerbesteuer")}
                  </td>
                  <td className={`py-2 text-right font-black text-sm ${gewerbesteuer === 0 ? "text-black/60" : "text-black"}`}>
                    {fE(gewerbesteuer)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {gewerbeertrag <= 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded p-2 text-[11px] font-mono text-black/70">
              {t("dashboard.gewst_no_liability")}
            </div>
          )}

          <p className="text-[10px] text-black font-mono leading-relaxed">
            ℹ {t("dashboard.gewst_disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Körperschaftsteuererklärung panel — § 31 KStG · Formular KSt 1
// ---------------------------------------------------------------------------
function KStPanel({ allReceipts, period }: { allReceipts: Receipt[]; period: PeriodFilter }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentYear  = new Date().getFullYear();
  const year         = period.mode === "all" ? currentYear - 1 : period.year;
  const yearReceipts = allReceipts.filter((r) => r.receipt_date?.startsWith(String(year)));

  const purchases = yearReceipts.filter((r) => r.receipt_type === "purchase" && !CASHFLOW_ONLY_CATS.has(r.category));
  const sales     = yearReceipts.filter((r) => r.receipt_type === "sale"     && !CASHFLOW_ONLY_CATS.has(r.category));

  // Net income = revenue net − expenses net (cashflow-only categories excluded)
  const revenueNet  = sales.reduce((s, r) => {
    const net = r.business_net ?? r.net_amount ?? ((r.total_amount ?? 0) / (1 + (r.vat_percentage ?? 19) / 100));
    return s + net;
  }, 0);
  const expenseNet  = purchases.reduce((s, r) => {
    const net = r.business_net ?? r.net_amount ?? ((r.total_amount ?? 0) / (1 + (r.vat_percentage ?? 19) / 100));
    return s + net;
  }, 0);

  const zve                = Math.round((revenueNet - expenseNet) * 100) / 100;
  const koerperschaftsteuer = Math.round(Math.max(zve, 0) * 0.15 * 100) / 100;        // 15 % § 23 KStG
  const solidaritaet       = Math.round(koerperschaftsteuer * 0.055 * 100) / 100;     // 5,5 % SolZG
  const gesamtbelastung    = Math.round((koerperschaftsteuer + solidaritaet) * 100) / 100;

  const fE = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div className="bg-white border-2 border-amber-400 rounded">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-black text-sm font-black tracking-wide">{t("dashboard.kst_title")}</h3>
          <p className="text-[10px] text-black font-mono mt-0.5">
            {t("dashboard.decl_annual")} · <LawLink law="§ 31 KStG" href="https://www.gesetze-im-internet.de/kstg_1977/__31.html" /> · KSt 1 · {year}
          </p>
        </div>
        <IconChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4 flex flex-col gap-4">

          {/* Year badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_year")}</span>
            <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{year}</span>
            {period.mode === "all" && (
              <span className="text-[10px] text-black font-mono">← {t("dashboard.jab_year_hint_all")}</span>
            )}
          </div>

          {/* Computation table */}
          <table className="w-full text-xs font-mono border-collapse">
            <tbody>
              <tr className="border-b border-amber-100">
                <td className="py-1.5 text-black">{t("dashboard.kst_zve")}</td>
                <td className="py-1.5 text-right text-black">{fE(zve)}</td>
              </tr>
              <tr className="border-b border-amber-100">
                <td className="py-1.5 text-black">× {t("dashboard.kst_rate")} (15 %)</td>
                <td className="py-1.5 text-right text-black">{fE(koerperschaftsteuer)}</td>
              </tr>
              <tr className="border-b border-amber-200">
                <td className="py-1.5 text-black/70 pl-4">
                  + {t("dashboard.kst_solz")} ({t("dashboard.kst_solz_rate", { pct: "5,5" })})
                </td>
                <td className="py-1.5 text-right text-black/70">{fE(solidaritaet)}</td>
              </tr>
              <tr className="border-t-2 border-amber-300">
                <td className="py-2 font-black text-black text-sm">
                  = {t("dashboard.kst_total")}
                </td>
                <td className={`py-2 text-right font-black text-sm ${gesamtbelastung === 0 ? "text-black/60" : "text-black"}`}>
                  {fE(gesamtbelastung)}
                </td>
              </tr>
            </tbody>
          </table>

          {zve <= 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded p-2 text-[11px] font-mono text-black/70">
              {t("dashboard.kst_no_liability")}
            </div>
          )}

          <p className="text-[10px] text-black font-mono leading-relaxed">
            ℹ {t("dashboard.kst_disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Dashboard({ receipts, allReceipts, period, taxpayer, onEditTaxpayer }: Props) {
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

  // All purchases/sales for VAT (includes cashflow-only — VAT is transaction-level)
  const allPurchases = receipts.filter((r) => r.receipt_type === "purchase");
  const allSales     = receipts.filter((r) => r.receipt_type === "sale");
  // P&L-only (cashflow categories excluded from Revenue/Expense stat cards + charts)
  const purchases = allPurchases.filter((r) => !CASHFLOW_ONLY_CATS.has(r.category));
  const sales     = allSales.filter((r) => !CASHFLOW_ONLY_CATS.has(r.category));

  const totalExpenses = purchases.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalRevenue  = sales.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const inputVat      = allPurchases.reduce((s, r) => s + (r.business_vat ?? r.vat_amount ?? 0), 0);
  const outputVat     = allSales.reduce((s, r) => s + (r.business_vat ?? r.vat_amount ?? 0), 0);
  const netLiability  = outputVat - inputVat;

  const revenueTotals = sales.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.total_amount ?? 0);
    return acc;
  }, {});

  const expenseTotals = purchases.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.total_amount ?? 0);
    return acc;
  }, {});

  return (
    <main className="flex-1 overflow-y-auto bg-amber-50 p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="border-b-2 border-amber-400 pb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-black text-xl font-black uppercase tracking-tight">{t("dashboard.title")}</h2>
          <p className="text-black text-xs font-mono mt-0.5">{periodLabel}</p>
        </div>
        {taxpayer?.name && (
          <div className="text-right shrink-0">
            <p className="text-black text-xs font-bold font-mono">
              {taxpayer.name}
              {(taxpayer.vat_id || taxpayer.tax_number) && (
                <span className="text-black font-normal ml-1.5">
                  ({[taxpayer.vat_id, taxpayer.tax_number].filter(Boolean).join(" • ")})
                </span>
              )}
            </p>
            <div className="flex items-baseline justify-end gap-2 mt-0.5">
              {(taxpayer.street || taxpayer.address_supplement || taxpayer.city) && (
                <p className="text-black text-[11px] font-mono">
                  {[taxpayer.street, taxpayer.address_supplement, [taxpayer.postcode, taxpayer.city].filter(Boolean).join(" "), taxpayer.state, taxpayer.country].filter(Boolean).join(", ")}
                </p>
              )}
              {onEditTaxpayer && (
                <button
                  onClick={onEditTaxpayer}
                  className="text-[10px] text-black hover:text-amber-700 font-bold underline underline-offset-2 shrink-0"
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

      {/* UMSATZSTEUER-VORANMELDUNG */}
      <UStVAPanel receipts={receipts} period={period} />

      {/* UMSATZSTEUERERKLÄRUNG */}
      <UStErkPanel allReceipts={allReceipts} period={period} />

      {/* GEWERBESTEUERERKLÄRUNG */}
      <GewStPanel allReceipts={allReceipts} period={period} taxpayer={taxpayer} onEditTaxpayer={onEditTaxpayer} />

      {/* KÖRPERSCHAFTSTEUERERKLÄRUNG */}
      <KStPanel allReceipts={allReceipts} period={period} />

      {/* Jahresabschluss */}
      <JahresabschlussPanel allReceipts={allReceipts} period={period} taxpayer={taxpayer} onEditTaxpayer={onEditTaxpayer} />

      {/* Tax return tiles */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { key: "eur", icon: "mdi:calculator-variant-outline" },
          { key: "est", icon: "mdi:account-cash-outline" },
        ]).map(({ key, icon }) => (
          <div key={key}
            className="bg-white border-2 border-amber-400 border-dashed rounded p-6 flex flex-col items-center justify-center gap-2 text-center">
            <Icon icon={icon} className="w-7 h-7 text-black/70" />
            <span className="text-black/70 text-sm font-black uppercase tracking-wider">{t(`dashboard.tile_${key}_title`)}</span>
            <span className="text-black text-[10px] font-mono">{t(`dashboard.tile_${key}_sub`)}</span>
            <span className="text-black text-xs font-mono">{t("dashboard.coming_soon")}</span>
          </div>
        ))}
      </div>
    </main>
  );
}