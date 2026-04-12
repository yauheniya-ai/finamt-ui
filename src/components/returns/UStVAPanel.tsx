import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronDown } from "../../constants/icons";
import type { Receipt, PeriodFilter } from "../Sidebar";
import { fmt } from "../Sidebar";
import { ElsterTip, VatRow, LawLink } from "./shared";

// ---------------------------------------------------------------------------
// UStVA panel — Umsatzsteuer-Voranmeldung · § 18 UStG
// ---------------------------------------------------------------------------
export function UStVAPanel({ receipts, period }: { receipts: Receipt[]; period: PeriodFilter }) {
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
                <span className="inline-flex items-center gap-0 text-[10px] font-black uppercase tracking-wider text-black">
                  {t("dashboard.vat_taxable_supplies")}
                  <ElsterTip lines={[t("dashboard.elster_tip_taxable_supplies")]} />
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
                tax={fmt(inputVat)}
                tip={<ElsterTip lines={[t("dashboard.elster_tip_line66_1"), t("dashboard.elster_tip_line66_2")]} />} />
              <tr className="border-t-2 border-amber-400">
                <td className="pt-3 pb-2 pr-3 text-[11px] font-mono font-bold text-black w-8">83</td>
                <td className="pt-3 pb-2">
                  <span className="inline-flex items-center gap-0 text-xs font-bold text-black">
                    {netLiability >= 0 ? t("dashboard.vat_payable_label") : t("dashboard.vat_refund_label")}
                    <ElsterTip lines={[t("dashboard.elster_tip_line83")]} />
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
