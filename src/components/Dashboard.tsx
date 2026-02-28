import { Icon } from "@iconify/react";
import type { Receipt } from "./Sidebar";
import { CATEGORY_META, fmt } from "./Sidebar";

type Props = { receipts: Receipt[] };

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
// Category bar chart
// ---------------------------------------------------------------------------
function CategoryChart({ title, totals }: { title: string; totals: Record<string, number> }) {
  const max    = Math.max(...Object.values(totals), 1);
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);
  return (
    <div className="bg-white border-2 border-amber-400 rounded p-4">
      <h3 className="text-black text-sm font-black uppercase tracking-wider mb-4">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-black/70 text-sm text-center py-8 font-mono">No data yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(([cat, total]) => {
            const pct  = Math.round((total / max) * 100);
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat} className="flex items-center gap-3">
                {/* 1.5× wider than w-24 (96px) → w-36 (144px) */}
                <span className="text-xs text-black/70 font-bold w-36 capitalize shrink-0 flex items-center gap-1.5 truncate">
                  {meta?.icon && <Icon icon={meta.icon} className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{meta?.label ?? cat}</span>
                </span>
                <div className="flex-1 bg-amber-100 border border-amber-200 rounded h-3 overflow-hidden">
                  <div className="bg-black h-3 rounded transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-black font-black font-mono w-24 text-right shrink-0">
                  {fmt(total)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ELSTER-style VAT row — line | description | base (volle Euro) | tax (Euro)
// ---------------------------------------------------------------------------
function VatRow({ line, label, sublabel, base, tax, bold }: {
  line?:     string;
  label:     string;
  sublabel?: string;
  base?:     string;   // Bemessungsgrundlage (net base, full euros)
  tax?:      string;   // tax amount
  bold?:     boolean;
}) {
  const textCls = bold ? "font-bold text-black" : "text-black/70";
  return (
    <tr className="border-b border-black/10 last:border-0">
      <td className={`py-1.5 pr-3 text-[11px] font-mono font-bold text-black w-8 shrink-0`}>
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
// Main component
// ---------------------------------------------------------------------------
export default function Dashboard({ receipts }: Props) {
  const purchases    = receipts.filter((r) => r.receipt_type === "purchase");
  const sales        = receipts.filter((r) => r.receipt_type === "sale");

  const totalExpenses = purchases.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalRevenue  = sales.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const inputVat      = purchases.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
  const outputVat     = sales.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
  const netLiability  = outputVat - inputVat;

  // Revenue by category
  const revenueTotals = sales.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.total_amount ?? 0);
    return acc;
  }, {});

  // Expenses by category
  const expenseTotals = purchases.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.total_amount ?? 0);
    return acc;
  }, {});

  // ── ELSTER VAT groupings ─────────────────────────────────────────────────
  // Group sales by VAT rate → net taxable base per rate
  const salesByRate = sales.reduce<Record<string, { net: number; vat: number }>>((acc, r) => {
    if (r.vat_percentage == null) return acc;
    const key = String(r.vat_percentage);
    if (!acc[key]) acc[key] = { net: 0, vat: 0 };
    // net = total - vat; fallback to net_amount if available
    const net = r.net_amount ?? ((r.total_amount ?? 0) - (r.vat_amount ?? 0));
    acc[key].net += net;
    acc[key].vat += r.vat_amount ?? 0;
    return acc;
  }, {});



  return (
    <main className="flex-1 overflow-y-auto bg-amber-50 p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="border-b-2 border-amber-400 pb-3">
        <h2 className="text-black text-xl font-black uppercase tracking-tight">Overview</h2>
        <p className="text-black/50 text-xs font-mono mt-0.5">
          {purchases.length} receipt{purchases.length !== 1 ? "s" : ""} ·{" "}
          {sales.length} invoice{sales.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard variant="black" label="Total Revenue"
          value={fmt(totalRevenue)}
          sub={`${sales.length} invoice${sales.length !== 1 ? "s" : ""}`} />
        <StatCard variant="amber" label="Total Expenses"
          value={fmt(totalExpenses)}
          sub={`${purchases.length} receipt${purchases.length !== 1 ? "s" : ""}`} />
        <StatCard variant="black" label="Output VAT"
          value={fmt(outputVat)} sub="payable" />
        <StatCard variant="amber" label="Input VAT"
          value={fmt(inputVat)} sub="reclaimable" />
        <StatCard variant="white"
          label={netLiability === 0 ? "VAT Balance" : netLiability > 0 ? "VAT Payable" : "VAT Refund"}
          value={fmt(Math.abs(netLiability))}
          sub={`output − input`} />
      </div>

      {/* Category charts */}
      <div className={`grid gap-4 ${
        Object.keys(revenueTotals).length > 0 && Object.keys(expenseTotals).length > 0
          ? "grid-cols-2" : "grid-cols-1"
      }`}>
        {Object.keys(revenueTotals).length > 0 && (
          <CategoryChart title="Revenue by Category" totals={revenueTotals} />
        )}
        {Object.keys(expenseTotals).length > 0 && (
          <CategoryChart title="Spending by Category" totals={expenseTotals} />
        )}
        {receipts.length === 0 && (
          <div className="bg-white border-2 border-amber-400 rounded p-8 text-center col-span-2">
            <p className="text-black/70 text-sm font-mono">
              No data yet — upload receipts to see breakdown.
            </p>
          </div>
        )}
      </div>

      {/* ELSTER-style VAT advance return — always shown */}
      <div className="bg-white border-2 border-amber-400 rounded p-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-black text-sm font-black uppercase tracking-wider">
            VAT Advance Return
          </h3>
          
        </div>
        <p className="text-[10px] text-black/70 font-mono mb-4">
          Based on {receipts.length} document{receipts.length !== 1 ? "s" : ""} in current view
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="pb-1.5 pr-3 w-8" />
              <th className="pb-1.5 text-left text-[10px] font-black uppercase tracking-wider text-black">
                I. VAT Advance Return
              </th>
              <th className="pb-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-black/70 w-28 pl-6">
                Base (€)
              </th>
              <th className="pb-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-black/70 w-28 pl-4">
                Tax (€)
              </th>
            </tr>
          </thead>
          <tbody>

            {/* Taxable supplies */}
            <tr><td colSpan={4} className="pt-3 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black">
                Taxable Supplies
              </span>
            </td></tr>

            {/* 19% */}
            <VatRow
              line="81"
              label="At 19%"
              
              base={fmt(salesByRate["19"]?.net ?? 0)}
              tax={fmt(salesByRate["19"]?.vat ?? 0)}
            />
            {/* 7% */}
            <VatRow
              line="86"
              label="At 7%"
              
              base={fmt(salesByRate["7"]?.net ?? 0)}
              tax={fmt(salesByRate["7"]?.vat ?? 0)}
            />
            {/* 0% */}
            <VatRow
              line="87"
              label="At 0%"
              
              base={fmt(salesByRate["0"]?.net ?? 0)}
              tax={fmt(salesByRate["0"]?.vat ?? 0)}
            />

            {/* Deductible input VAT */}
            <tr><td colSpan={4} className="pt-4 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black">
                Deductible Input VAT
              </span>
            </td></tr>

            <VatRow
              line="66"
              label="Input VAT from supplier invoices"
              
              tax={fmt(inputVat)}
            />

            {/* Net payable */}
            <tr className="border-t-2 border-amber-400">
              <td className="pt-3 pb-2 pr-3 text-[11px] font-mono font-bold text-black w-8">83</td>
              <td className="pt-3 pb-2">
                <span className="text-xs font-bold text-black">
                  {netLiability >= 0 ? "VAT Payable" : "VAT Refund"}
                </span>
                <span className="block text-[10px] text-black/70 font-normal">
                  {netLiability >= 0
                    ? "Remaining advance payment"
                    : "Surplus (refund)"}
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

      {/* Placeholder tiles */}
      <div className="grid grid-cols-2 gap-3">
        {["Monthly Trend", "Tax Deduction Forecast"].map((title) => (
          <div key={title}
            className="bg-white border-2 border-amber-400 border-dashed rounded p-6 flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-black/70 text-sm font-black uppercase tracking-wider">{title}</span>
            <span className="text-black/70 text-xs font-mono">Coming soon</span>
          </div>
        ))}
      </div>
    </main>
  );
}