import type { Receipt } from "./Sidebar";

type Props = {
  receipts: Receipt[];
};

const CATEGORY_COLORS: Record<string, string> = {
  material:          "bg-amber-500",
  equipment:         "bg-amber-700",
  software:          "bg-amber-400",
  internet:          "bg-amber-300",
  telecommunication: "bg-amber-600",
  travel:            "bg-red-400",
  education:         "bg-red-600",
  utilities:         "bg-red-500",
  insurance:         "bg-red-300",
  taxes:             "bg-red-700",
  other:             "bg-black",
};

function fmt(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
}

export default function Dashboard({ receipts }: Props) {
  const totalAmount = receipts.reduce((s, r) => s + (r.extracted.total_amount ?? 0), 0);
  const totalVat    = receipts.reduce((s, r) => s + (r.extracted.vat_amount ?? 0), 0);

  const categoryTotals = receipts.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + (r.extracted.total_amount ?? 0);
    return acc;
  }, {});
  const maxCat = Math.max(...Object.values(categoryTotals), 1);

  const recent = [...receipts].slice(-5).reverse();

  return (
    <main className="flex-1 overflow-y-auto bg-amber-50 p-6 flex flex-col gap-6">
      <div className="border-b-2 border-amber-400 pb-3">
        <h2 className="text-black text-xl font-black uppercase tracking-tight">
          Overview
        </h2>
        <p className="text-black/50 text-xs font-mono mt-0.5">
          Tax year summary · all amounts in EUR
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">

        <div className="border-2 border-amber-400 bg-black text-amber-400 rounded p-4 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider font-bold opacity-70">
            Total Revenue
          </span>
          <span className="text-2xl font-black font-mono">
            {fmt(totalAmount)}
          </span>
          <span className="text-xs opacity-70">
            {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="border-2 border-amber-400 bg-amber-400 text-black rounded p-4 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider font-bold opacity-70">
            Total Expenses
          </span>
          <span className="text-2xl font-black font-mono">
            {fmt(totalAmount)}
          </span>
          <span className="text-xs opacity-70">
            {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* 3 - VAT (White, black text) */}
        <div className="border-2 border-amber-400 bg-white text-black rounded p-4 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider font-bold opacity-70">
            Total VAT (MwSt)
          </span>
          <span className="text-2xl font-black font-mono">
            {fmt(totalVat)}
          </span>
          <span className="text-xs opacity-70">
            recoverable input tax
          </span>
        </div>

        {/* 4 - Net */}
        <div className="border-2 border-amber-400 bg-white text-black rounded p-4 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider font-bold opacity-70">
            Net (excl. VAT)
          </span>
          <span className="text-2xl font-black font-mono">
            {fmt(totalAmount - totalVat)}
          </span>
        </div>

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
                const pct = Math.round((total / maxCat) * 100);
                const color = CATEGORY_COLORS[cat] ?? "bg-black";

                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-black/60 font-bold w-24 capitalize shrink-0">
                      {cat}
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

      {/* Recent receipts */}
      <div className="bg-white border-2 border-amber-400 rounded p-4">
        <h3 className="text-black text-sm font-black uppercase tracking-wider mb-3">
          Recent Receipts
        </h3>

        {recent.length === 0 ? (
          <p className="text-black/30 text-sm text-center py-4 font-mono">
            Nothing here yet.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-amber-400 text-black">
                <th className="text-left pb-2 font-black uppercase tracking-wider">
                  Vendor
                </th>
                <th className="text-left pb-2 font-black uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left pb-2 font-black uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left pb-2 font-black uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="text-right pb-2 font-black uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {recent.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-black/10 hover:bg-amber-50 transition-colors"
                >
                  <td className="py-2 text-black font-bold">
                    {r.extracted.vendor || "—"}
                  </td>
                  <td className="py-2 text-black/50 font-mono">
                    {r.extracted.receipt_date ?? "—"}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-white text-xs font-bold ${
                        CATEGORY_COLORS[r.category] ?? "bg-black"
                      }`}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="py-2 text-black/40 font-mono">
                    {r.extracted.receipt_number ?? "—"}
                  </td>
                  <td className="py-2 text-black font-black font-mono text-right">
                    {r.extracted.total_amount != null
                      ? fmt(r.extracted.total_amount, r.extracted.currency)
                      : "—"}
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
            className="bg-white border-2 border-amber-500 border-dashed rounded p-6 flex flex-col items-center justify-center gap-2 text-center"
          >
            <span className="text-black/30 text-sm font-black uppercase tracking-wider">
              {title}
            </span>
            <span className="text-black/20 text-xs font-mono">
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}