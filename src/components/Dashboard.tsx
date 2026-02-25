import { Icon } from "@iconify/react";
import type { Receipt } from "./Sidebar";
import { CATEGORY_META, fmt } from "./Sidebar";

type Props = {
  receipts: Receipt[];
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label, value, sub, variant = "white",
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: "black" | "amber" | "white" | "red";
}) {
  const styles = {
    black: "bg-black text-amber-400 border-amber-400",
    amber: "bg-amber-400 text-black border-amber-400",
    white: "bg-white text-black border-amber-400",
    red:   "bg-red-500 text-white border-red-700",
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
// Category bar chart (reusable)
// ---------------------------------------------------------------------------

function CategoryChart({
  title, totals,
}: {
  title: string;
  totals: Record<string, number>;
}) {
  const max = Math.max(...Object.values(totals), 1);
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white border-2 border-amber-400 rounded p-4">
      <h3 className="text-black text-sm font-black uppercase tracking-wider mb-4">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-black/30 text-sm text-center py-8 font-mono">No data yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(([cat, total]) => {
            const pct  = Math.round((total / max) * 100);
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-black/60 font-bold w-24 capitalize shrink-0 flex items-center gap-1.5">
                  {meta?.icon && <Icon icon={meta.icon} className="w-3.5 h-3.5 shrink-0" />}
                  {meta?.label ?? cat}
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
// Component
// ---------------------------------------------------------------------------

export default function Dashboard({ receipts }: Props) {
  const purchases = receipts.filter((r) => r.receipt_type === "purchase");
  const sales      = receipts.filter((r) => r.receipt_type === "sale");

  const totalExpenses = purchases.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalRevenue  = sales.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const inputVat      = purchases.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
  const outputVat     = sales.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
  const netLiability  = outputVat - inputVat;

  // Separate category totals for revenue and expenses
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
      <div className="border-b-2 border-amber-400 pb-3">
        <h2 className="text-black text-xl font-black uppercase tracking-tight">Overview</h2>
        <p className="text-black/50 text-xs font-mono mt-0.5">
          {purchases.length} receipt{purchases.length !== 1 ? "s" : ""} ·{" "}
          {sales.length} invoice{sales.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard
          variant="black"
          label="Total Revenue"
          value={fmt(totalRevenue)}
          sub={`${sales.length} invoice${sales.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          variant="amber"
          label="Total Expenses"
          value={fmt(totalExpenses)}
          sub={`${purchases.length} receipt${purchases.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          variant="white"
          label="Output VAT"
          value={fmt(outputVat)}
          sub="payable"
        />
        <StatCard
          variant="white"
          label="Input VAT"
          value={fmt(inputVat)}
          sub="reclaimable"
        />
        <StatCard
          variant={netLiability > 0 ? "red" : "white"}
          label={netLiability === 0 ? "VAT Balance" : netLiability > 0 ? "VAT Payable" : "VAT Refund"}
          value={fmt(Math.abs(netLiability))}
          sub={`output ${fmt(outputVat)} − input ${fmt(inputVat)}`}
        />
      </div>

      {/* Category charts — side by side if both have data */}
      <div className={`grid gap-4 ${
        Object.keys(revenueTotals).length > 0 && Object.keys(expenseTotals).length > 0
          ? "grid-cols-2"
          : "grid-cols-1"
      }`}>
        {Object.keys(revenueTotals).length > 0 && (
          <CategoryChart title="Revenue by Category" totals={revenueTotals} />
        )}
        {Object.keys(expenseTotals).length > 0 && (
          <CategoryChart title="Spending by Category" totals={expenseTotals} />
        )}
        {receipts.length === 0 && (
          <div className="bg-white border-2 border-amber-400 rounded p-8 text-center col-span-2">
            <p className="text-black/30 text-sm font-mono">
              No data yet — upload receipts to see breakdown.
            </p>
          </div>
        )}
      </div>

      {/* VAT summary */}
      {(inputVat > 0 || outputVat > 0) && (
        <div className="bg-white border-2 border-amber-400 rounded p-4">
          <h3 className="text-black text-sm font-black uppercase tracking-wider mb-3">
            VAT Summary
          </h3>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-black/10">
              <tr>
                <td className="py-2 text-black font-bold uppercase tracking-wider">
                  Output VAT <span className="font-normal normal-case text-black/40">(payable)</span>
                </td>
                <td className="py-2 text-right font-mono font-bold text-black">{fmt(outputVat)}</td>
              </tr>
              <tr>
                <td className="py-2 text-black font-bold uppercase tracking-wider">
                  Input VAT <span className="font-normal normal-case text-black/40">(reclaimable)</span>
                </td>
                <td className="py-2 text-right font-mono font-bold text-black">{fmt(inputVat)}</td>
              </tr>
              <tr className="border-t-2 border-amber-400">
                <td className="py-2 font-bold uppercase tracking-wider text-black">
                  {netLiability > 0 ? "VAT Payable" : netLiability < 0 ? "VAT Refund" : "VAT Balance"}
                </td>
                <td className="py-2 text-right font-mono font-bold text-black">
                  {fmt(Math.abs(netLiability))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Placeholder tiles */}
      <div className="grid grid-cols-2 gap-3">
        {["Monthly Trend", "Tax Deduction Forecast"].map((title) => (
          <div
            key={title}
            className="bg-white border-2 border-amber-400 border-dashed rounded p-6 flex flex-col items-center justify-center gap-2 text-center"
          >
            <span className="text-black/30 text-sm font-black uppercase tracking-wider">{title}</span>
            <span className="text-black/20 text-xs font-mono">Coming soon</span>
          </div>
        ))}
      </div>
    </main>
  );
}