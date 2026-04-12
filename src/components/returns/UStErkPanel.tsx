import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronDown } from "../../constants/icons";
import type { Receipt, PeriodFilter } from "../Sidebar";
import { fmt } from "../Sidebar";
import { ElsterTip, VatRow, LawLink } from "./shared";

// ---------------------------------------------------------------------------
// UStErk panel — Umsatzsteuererklärung · annual VAT return · § 18 UStG
// ---------------------------------------------------------------------------
export function UStErkPanel({ allReceipts, period }: { allReceipts: Receipt[]; period: PeriodFilter }) {
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
            {t("dashboard.decl_annual")} · <LawLink law="§ 18 UStG" href="https://www.gesetze-im-internet.de/ustg_1980/__18.html" /> · USt 2 A · {year}
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
                <span className="inline-flex items-center gap-0 text-[10px] font-black uppercase tracking-wider text-black">
                  {t("dashboard.vat_taxable_supplies")}
                  <ElsterTip lines={[t("dashboard.elster_tip_taxable_supplies_uste")]} />
                </span>
              </td></tr>
              <VatRow label={t("dashboard.vat_line_19")}
                base={fmt(salesByRate["19"]?.net ?? 0)}
                tax={fmt(salesByRate["19"]?.vat ?? 0)}
                tip={<ElsterTip lines={[t("dashboard.elster_tip_uste_line22")]} />} />
              <VatRow label={t("dashboard.vat_line_7")}
                base={fmt(salesByRate["7"]?.net ?? 0)}
                tax={fmt(salesByRate["7"]?.vat ?? 0)}
                tip={<ElsterTip lines={[t("dashboard.elster_tip_uste_line25")]} />} />
              <VatRow label={t("dashboard.vat_line_0")}
                base={fmt(salesByRate["0"]?.net ?? 0)}
                tax={fmt(salesByRate["0"]?.vat ?? 0)}
                tip={<ElsterTip lines={[t("dashboard.elster_tip_uste_line28")]} />} />
              <tr><td colSpan={4} className="pt-4 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  {t("dashboard.vat_input_section")}
                </span>
              </td></tr>
              <VatRow label={t("dashboard.uste_input_regular_label")}
                tax={fmt(regularInputVat)}
                tip={<ElsterTip lines={[t("dashboard.elster_tip_uste_line79")]} />} />
              {einfuhrInputVat > 0 && (
                <VatRow label={t("dashboard.vat_einfuhr_label")}
                  tax={fmt(einfuhrInputVat)} />
              )}
              {einfuhrInputVat > 0 && (
                <VatRow label={t("dashboard.uste_input_sum_label")} bold
                  tax={fmt(inputVat)} />
              )}
              <tr><td colSpan={4} className="pt-4 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  {t("dashboard.uste_calculation_section")}
                </span>
              </td></tr>
              <VatRow label={t("dashboard.uste_prepayment_soll_label")}
                tax={`${netLiability < 0 ? "−" : ""}${fmt(Math.abs(netLiability))}`}
                tip={<ElsterTip lines={[t("dashboard.elster_tip_uste_line119")]} />} />
              <VatRow label={t("dashboard.uste_final_balance_label")} bold
                tax={fmt(0)}
                tip={<ElsterTip lines={[t("dashboard.elster_tip_uste_line120")]} />} />
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
