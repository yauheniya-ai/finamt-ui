import type { Receipt } from "./Sidebar";
import { CATEGORY_META, CATEGORY_COLORS, fmt } from "./Sidebar";

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
// Component
// ---------------------------------------------------------------------------

export default function Dashboard({ receipts }: Props) {
  const purchases = receipts.filter((r) => r.receipt_type === "purchase");
  const sales      = receipts.filter((r) => r.receipt_type === "sale");

  const totalExpenses  = purchases.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalRevenue   = sales.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const inputVat       = purchases.reduce((s, r) => s + (r.vat_amount ?? 0), 0);   // Vorsteuer
  const outputVat      = sales.reduce((s, r) => s + (r.vat_amount ?? 0), 0);       // Umsatzsteuer
  const netLiability   = outputVat - inputVat;   // > 0 = you owe; < 0 = refund

  // Category totals over all receipts
  const categoryTotals = receipts.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.total_amount ?? 0);
    return acc;
  }, {});
  const maxCat = Math.max(...Object.values(categoryTotals), 1);

  const recent = [...receipts]
    .sort((a, b) => (b.receipt_date ?? "").localeCompare(a.receipt_date ?? ""))
    .slice(0, 5);

  return (
    <main className="flex-1 overflow-y-auto bg-amber-50 p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="border-b-2 border-amber-400 pb-3">
        <h2 className="text-black text-xl font-black uppercase tracking-tight">Overview</h2>
        <p className="text-black/50 text-xs font-mono mt-0.5">
          {receipts.length} receipt{receipts.length !== 1 ? "s" : ""} ·{" "}
          {purchases.length} expense{purchases.length !== 1 ? "s" : ""} ·{" "}
          {sales.length} invoice{sales.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard
          variant="black"
          label="Total Revenue"
          value={fmt(totalRevenue)}
          sub={`${sales.length} sales invoice${sales.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          variant="amber"
          label="Total Expenses"
          value={fmt(totalExpenses)}
          sub={`${purchases.length} purchase receipt${purchases.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          variant="white"
          label="Input VAT"
          value={fmt(inputVat)}
          sub="reclaimable"
        />
        <StatCard
          variant="white"
          label="Output VAT"
          value={fmt(outputVat)}
          sub="payable"
        />
        <StatCard
          variant={netLiability === 0 ? "white" : netLiability > 0 ? "red" : "white"}
          label={
            netLiability === 0 
              ? "VAT balance" 
              : netLiability > 0 
                ? "VAT liability" 
                : "VAT refund"
          }
          value={fmt(Math.abs(netLiability))}
          sub={`output ${fmt(outputVat)} − input ${fmt(inputVat)}`}
        />

      </div>

      {/* Category bar chart */}
      <div className="bg-white border-2 border-amber-400 rounded p-4">
        <h3 className="text-black text-sm font-black uppercase tracking-wider mb-4">
          Spending by Category
        </h3>
        {Object.keys(categoryTotals).length === 0 ? (
          <p className="text-black/30 text-sm text-center py-8 font-mono">
            No data yet — upload receipts to see breakdown.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => {
                const pct   = Math.round((total / maxCat) * 100);
                const color = CATEGORY_COLORS[cat] ?? "bg-black";
                const meta  = CATEGORY_META[cat];

                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-black/60 font-bold w-24 capitalize shrink-0 flex items-center gap-1">
                      <span>{meta?.icon}</span>
                      {meta?.label ?? cat}
                    </span>
                    <div className="flex-1 bg-amber-100 border border-amber-200 rounded h-3 overflow-hidden">
                      <div
                        className={`${color} h-3 rounded transition-all`}
                        style={{ width: `${pct}%` }}
                      />
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

      {/* VAT summary table */}
      {(inputVat > 0 || outputVat > 0) && (
        <div className="bg-white border-2 border-amber-400 rounded p-4">
          <h3 className="text-black text-sm font-black uppercase tracking-wider mb-3">
            UStVA Summary
          </h3>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-black/10">
              <tr>
                <td className="py-2 text-black/50 font-bold uppercase tracking-wider">Umsatzsteuer (output VAT)</td>
                <td className="py-2 text-right font-mono font-black text-black">{fmt(outputVat)}</td>
              </tr>
              <tr>
                <td className="py-2 text-black/50 font-bold uppercase tracking-wider">Vorsteuer (input VAT)</td>
                <td className="py-2 text-right font-mono font-black text-black">− {fmt(inputVat)}</td>
              </tr>
              <tr className="border-t-2 border-amber-400">
                <td className="py-2 font-black uppercase tracking-wider text-black">
                  {netLiability >= 0 ? "Zahllast (you owe)" : "Erstattung (you get back)"}
                </td>
                <td className={`py-2 text-right font-black font-mono text-lg ${
                  netLiability > 0 ? "text-red-500" : "text-green-600"
                }`}>
                  {fmt(Math.abs(netLiability))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Recent receipts */}
      <div className="bg-white border-2 border-amber-400 rounded p-4">
        <h3 className="text-black text-sm font-black uppercase tracking-wider mb-3">
          Recent Receipts
        </h3>
        {recent.length === 0 ? (
          <p className="text-black/30 text-sm text-center py-4 font-mono">Nothing here yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-amber-400 text-black">
                {["Type", "Counterparty", "Date", "Category", "Amount"].map((h, i) => (
                  <th key={h} className={`pb-2 font-black uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-black/10 hover:bg-amber-50 transition-colors">
                  <td className="py-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      r.receipt_type === "sale"
                        ? "bg-amber-400 text-black"
                        : "bg-black/10 text-black/60"
                    }`}>
                      {r.receipt_type === "sale" ? "rev" : "exp"}
                    </span>
                  </td>
                  <td className="py-2 text-black font-bold truncate max-w-[140px]">
                    {r.vendor ?? r.counterparty?.name ?? "—"}
                  </td>
                  <td className="py-2 text-black/50 font-mono">{r.receipt_date ?? "—"}</td>
                  <td className="py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-bold ${
                      CATEGORY_COLORS[r.category] ?? "bg-black"
                    }`}>
                      {CATEGORY_META[r.category]?.label ?? r.category}
                    </span>
                  </td>
                  <td className="py-2 text-black font-black font-mono text-right">
                    {fmt(r.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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