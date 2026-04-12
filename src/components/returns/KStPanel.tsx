import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronDown } from "../../constants/icons";
import type { Receipt, PeriodFilter } from "../Sidebar";
import { CASHFLOW_ONLY_CATS } from "../Sidebar";
import { LawLink, ElsterTip } from "./shared";

// ---------------------------------------------------------------------------
// Körperschaftsteuererklärung panel — § 31 KStG
// Flow: Anlage GK → Anlage ZVE → KSt 1 (Steuerberechnung)
// ---------------------------------------------------------------------------

/** Small section-header used inside the expanded panel */
function AnlageHeader({ title, law, href }: { title: string; law: string; href: string }) {
  return (
    <div className="flex items-baseline gap-2 border-b-2 border-black pb-1 mt-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-black">{title}</span>
      <span className="text-[10px] font-mono text-black/50">
        · <LawLink law={law} href={href} />
      </span>
    </div>
  );
}

/** Lightweight sub-section divider row within a table (used inside Anlage ZVE) */
function ZveSubHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} className="pt-3 pb-0.5 text-[9px] font-black uppercase tracking-widest text-black/40 font-mono border-b border-amber-200">
        {title}
      </td>
    </tr>
  );
}

/** A single computation row: label | value (right-aligned) */
function KRow({
  label, value, bold, dim, indent, tip,
}: {
  label: string; value: string; bold?: boolean; dim?: boolean; indent?: boolean; tip?: React.ReactNode;
}) {
  const base = bold ? "font-black text-black text-sm" : dim ? "text-black/40" : "text-black";
  return (
    <tr className="border-b border-amber-100 last:border-0">
      <td className={`py-1.5 text-xs font-mono ${base} ${indent ? "pl-4" : ""}`}>
        <span className="inline-flex items-center gap-0">{label}{tip}</span>
      </td>
      <td className={`py-1.5 text-right text-xs font-mono ${bold ? "font-black text-black" : dim ? "text-black/40" : "text-black"} whitespace-nowrap pl-6 w-36`}>
        {value}
      </td>
    </tr>
  );
}

export function KStPanel({ allReceipts, period }: { allReceipts: Receipt[]; period: PeriodFilter }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentYear  = new Date().getFullYear();
  const year         = period.mode === "all" ? currentYear - 1 : period.year;
  const yearReceipts = allReceipts.filter((r) => r.receipt_date?.startsWith(String(year)));

  const purchases = yearReceipts.filter((r) => r.receipt_type === "purchase" && !CASHFLOW_ONLY_CATS.has(r.category));
  const sales     = yearReceipts.filter((r) => r.receipt_type === "sale"     && !CASHFLOW_ONLY_CATS.has(r.category));

  const revenueNet = sales.reduce((s, r) => {
    const net = r.business_net ?? r.net_amount ?? ((r.total_amount ?? 0) / (1 + (r.vat_percentage ?? 19) / 100));
    return s + net;
  }, 0);
  const expenseNet = purchases.reduce((s, r) => {
    const net = r.business_net ?? r.net_amount ?? ((r.total_amount ?? 0) / (1 + (r.vat_percentage ?? 19) / 100));
    return s + net;
  }, 0);

  // Anlage GK — ELSTER: volle Geldbeträge (whole euros, § 60 Abs. 2 EStDV)
  const steuerbilanzgewinn = Math.round(revenueNet - expenseNet); // full euros
  const hinzurechnungen    = 0; // manual — show as 0
  const einkuenfteGK       = steuerbilanzgewinn + hinzurechnungen;

  // Anlage ZVE
  const gesamtbetrag  = einkuenfteGK;
  const verlustabzug  = 0; // manual
  const spendenabzug  = 0; // manual
  const einkommen     = gesamtbetrag - verlustabzug - spendenabzug;
  const zve           = einkommen; // no Freibetrag for GmbH

  // KSt 1 — Steuerberechnung (also whole euros)
  const koerperschaftsteuer = Math.round(Math.max(zve, 0) * 0.15); // § 23 KStG
  const solidaritaet        = Math.round(koerperschaftsteuer * 0.055); // SolZG
  const gesamtbelastung     = koerperschaftsteuer + solidaritaet;

  // Anlage Verluste — triggered when Gesamtbetrag der Einkünfte is negative (§ 10d EStG)
  const verlustJahr    = gesamtbetrag < 0 ? Math.abs(gesamtbetrag) : 0;
  const anfangsbestand = 0; // prior-year Endbestand — manual entry in ELSTER
  const endbestand     = anfangsbestand + verlustJahr;

  // Formatter for ELSTER whole-euro fields (no decimal separator)
  const fE = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
  const negFmt = (n: number) => (n < 0 ? `−${fE(Math.abs(n))}` : fE(n));

  return (
    <div className="bg-white border-2 border-amber-400 rounded">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h3 className="text-black text-sm font-black tracking-wide">{t("dashboard.kst_title")}</h3>
          <p className="text-[10px] text-black font-mono mt-0.5">
            {t("dashboard.decl_annual")} · <LawLink law="§ 31 KStG" href="https://www.gesetze-im-internet.de/kstg_1977/__31.html" /> · KSt 1 + Anlage GK + Anlage ZVE · {year}
          </p>
        </div>
        <IconChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4 flex flex-col gap-5">

          {/* Year badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-black">{t("dashboard.jab_year")}</span>
            <span className="text-xs font-black font-mono text-black bg-amber-100 border border-amber-300 rounded px-2 py-0.5">{year}</span>
            {period.mode === "all" && (
              <span className="text-[10px] text-black font-mono">← {t("dashboard.jab_year_hint_all")}</span>
            )}
          </div>

          {/* ── KSt 1 — Steuerberechnung ───────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <AnlageHeader
              title={t("dashboard.kst_kst1_title")}
              law="§ 23 KStG"
              href="https://www.gesetze-im-internet.de/kstg_1977/__23.html"
            />
            <table className="w-full border-collapse">
              <tbody>
                <KRow label={`${t("dashboard.kst_zve_label")} × ${t("dashboard.kst_rate")} (15 %)`} value={fE(koerperschaftsteuer)} />
                <KRow
                  label={`+ ${t("dashboard.kst_solz")} (${t("dashboard.kst_solz_rate", { pct: "5,5" })})`}
                  value={fE(solidaritaet)}
                  indent
                />
                <tr className="border-t-2 border-amber-300">
                  <td className="py-2 text-sm font-black text-black font-mono">= {t("dashboard.kst_total")}</td>
                  <td className={`py-2 text-right text-sm font-black font-mono whitespace-nowrap pl-6 w-36 ${gesamtbelastung === 0 ? "text-black/60" : "text-black"}`}>
                    {fE(gesamtbelastung)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {zve <= 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded p-2 text-[11px] font-mono text-black/70">
              {t("dashboard.kst_no_liability")}
            </div>
          )}

          {/* ── Anlage GK ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <AnlageHeader
              title={t("dashboard.kst_anlage_gk_title")}
              law="§ 7 KStG"
              href="https://www.gesetze-im-internet.de/kstg_1977/__7.html"
            />
            <table className="w-full border-collapse">
              <tbody>
                <KRow
                  label={t("dashboard.kst_steuerbilanzgewinn")}
                  value={negFmt(steuerbilanzgewinn)}
                  tip={<ElsterTip lines={[
                    t("dashboard.kst_steuerbilanz_note"),
                    t("dashboard.kst_steuerbilanz_note_2"),
                    t("dashboard.kst_steuerbilanz_note_3"),
                    t("dashboard.kst_steuerbilanz_note_4"),
                    t("dashboard.kst_steuerbilanz_note_5"),
                  ]} />}
                />
                <KRow
                  label={t("dashboard.kst_hinzurechnungen")}
                  value={t("dashboard.kst_manual_zero")}
                  dim
                  indent
                />
                <tr className="border-t-2 border-amber-300">
                  <td className="py-2 text-xs font-black text-black font-mono">{t("dashboard.kst_einkuenfte_gk")}</td>
                  <td className="py-2 text-right text-xs font-black font-mono whitespace-nowrap pl-6 w-36 text-black">
                    {negFmt(einkuenfteGK)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Anlage Verluste (shown when loss year) ─────────────────── */}
          {gesamtbetrag < 0 && (
            <div className="flex flex-col gap-2">
              <AnlageHeader
                title={t("dashboard.kst_anlage_verluste_title")}
                law="§ 10d EStG"
                href="https://www.gesetze-im-internet.de/estg/__10d.html"
              />
              <p className="text-[10px] font-mono text-black/50 leading-relaxed">{t("dashboard.kst_anlage_verluste_subtitle")}</p>
              <table className="w-full border-collapse">
                <tbody>
                  <KRow
                    label={t("dashboard.kst_vlv_anfangsbestand")}
                    value={t("dashboard.kst_manual_zero")}
                    dim
                    tip={<ElsterTip lines={[
                      t("dashboard.kst_vlv_anfangsbestand_note"),
                      t("dashboard.kst_vlv_anfangsbestand_note_2"),
                    ]} />}
                  />
                  <KRow
                    label={t("dashboard.kst_vlv_verlust_jahr")}
                    value={fE(verlustJahr)}
                    tip={<ElsterTip lines={[t("dashboard.kst_vlv_verlust_jahr_note")]} />}
                  />
                  <tr className="border-t-2 border-amber-300">
                    <td className="py-2 text-xs font-black text-black font-mono">{t("dashboard.kst_vlv_endbestand")}</td>
                    <td className="py-2 text-right text-xs font-black font-mono whitespace-nowrap pl-6 w-36 text-black">
                      {fE(endbestand)}
                    </td>
                  </tr>
                  <KRow label={t("dashboard.kst_vlv_para8d")}          value="—" dim />
                  <KRow label={t("dashboard.kst_vlv_beitrittsgebiet")} value="—" dim />
                </tbody>
              </table>
              <div className="bg-amber-50 border border-amber-300 rounded p-2 text-[11px] font-mono text-black/70">
                {t("dashboard.kst_vlv_endbestand_note")}
              </div>
            </div>
          )}

          {/* ── Anlage ZVE ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <AnlageHeader
              title={t("dashboard.kst_anlage_zve_title")}
              law="§ 8 KStG"
              href="https://www.gesetze-im-internet.de/kstg_1977/__8.html"
            />
            <table className="w-full border-collapse">
              <tbody>

                {/* A: Ermittlung der Summe der Einkünfte (Z. 1–15) */}
                <ZveSubHeader title={t("dashboard.kst_zve_summe_title")} />
                <KRow label={t("dashboard.kst_zve_row1")}   value="—" dim />
                <KRow
                  label={t("dashboard.kst_zve_row2")}
                  value={negFmt(einkuenfteGK)}
                  tip={<ElsterTip lines={[
                    t("dashboard.kst_zve_row2_note"),
                    t("dashboard.kst_zve_row2_note_2"),
                  ]} />}
                />
                <KRow label={t("dashboard.kst_zve_row3_7")}  value="—" dim />
                <KRow label={t("dashboard.kst_zve_row8_14")} value="—" dim />
                <tr className="border-t-2 border-amber-300">
                  <td className="py-2 text-xs font-black text-black font-mono">{t("dashboard.kst_zve_row15")}</td>
                  <td className="py-2 text-right text-xs font-black font-mono whitespace-nowrap pl-6 w-36 text-black">{negFmt(einkuenfteGK)}</td>
                </tr>

                {/* B: Ermittlung des Gesamtbetrags der Einkünfte (Z. 16–27) */}
                <ZveSubHeader title={t("dashboard.kst_zve_gesamtbetrag_title")} />
                <KRow label={t("dashboard.kst_zve_row16_26")} value="—" dim />
                <tr className="border-t-2 border-amber-300">
                  <td className="py-2 text-xs font-black text-black font-mono">{t("dashboard.kst_zve_row27")}</td>
                  <td className="py-2 text-right text-xs font-black font-mono whitespace-nowrap pl-6 w-36 text-black">{negFmt(gesamtbetrag)}</td>
                </tr>

                {/* C: Ermittlung des ZVE (Z. 28–33) */}
                <ZveSubHeader title={t("dashboard.kst_zve_einkommen_title")} />
                <KRow
                  label={t("dashboard.kst_zve_row28")}
                  value={t("dashboard.kst_manual_zero")}
                  dim
                  tip={<ElsterTip lines={[
                    t("dashboard.kst_zve_row28_note"),
                    t("dashboard.kst_zve_row28_note_2"),
                  ]} />}
                />
                <KRow label={t("dashboard.kst_zve_row29_31")} value="—" dim />
                <tr className="border-t border-amber-200">
                  <td className="py-1.5 text-xs font-bold text-black font-mono">{t("dashboard.kst_zve_row32")}</td>
                  <td className="py-1.5 text-right text-xs font-bold font-mono whitespace-nowrap pl-6 w-36 text-black">{negFmt(einkommen)}</td>
                </tr>
                <tr className="border-t-2 border-amber-300">
                  <td className="py-2 text-xs font-black text-black font-mono">{t("dashboard.kst_zve_row33")}</td>
                  <td className="py-2 text-right text-xs font-black font-mono whitespace-nowrap pl-6 w-36 text-black">{negFmt(zve)}</td>
                </tr>

                {/* D: Weitere Angaben (Z. 34–36) */}
                <ZveSubHeader title={t("dashboard.kst_zve_weitere_title")} />
                <KRow label={t("dashboard.kst_zve_row34_36")} value="—" dim />

              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-black font-mono leading-relaxed">
            ℹ {t("dashboard.kst_disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
