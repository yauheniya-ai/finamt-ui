import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronDown } from "../../constants/icons";
import type { Receipt, PeriodFilter } from "../Sidebar";
import { CASHFLOW_ONLY_CATS } from "../Sidebar";
import { LawLink } from "./shared";

// ---------------------------------------------------------------------------
// Körperschaftsteuererklärung panel — § 31 KStG · Formular KSt 1
// ---------------------------------------------------------------------------
export function KStPanel({ allReceipts, period }: { allReceipts: Receipt[]; period: PeriodFilter }) {
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

  const zve                 = Math.round((revenueNet - expenseNet) * 100) / 100;
  const koerperschaftsteuer = Math.round(Math.max(zve, 0) * 0.15 * 100) / 100;       // 15 % § 23 KStG
  const solidaritaet        = Math.round(koerperschaftsteuer * 0.055 * 100) / 100;   // 5,5 % SolZG
  const gesamtbelastung     = Math.round((koerperschaftsteuer + solidaritaet) * 100) / 100;

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
