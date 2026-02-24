import type { Receipt } from "./Sidebar";

type Props = {
  receipt: Receipt | null;
  apiBase: string;
};

function fmt(amount: number | null, currency = "EUR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-black/10 last:border-0">
      <span className="text-xs text-black/50 font-bold uppercase tracking-wider shrink-0 w-24">{label}</span>
      <span className="text-xs text-black font-mono text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function PreviewPanel({ receipt, apiBase }: Props) {
  if (!receipt) {
    return (
      <aside className="w-72 shrink-0 bg-white border-l-2 border-amber-400 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-5xl opacity-20">🧾</span>
        <p className="text-black/30 text-xs leading-relaxed font-mono">
          Select a receipt from the sidebar to preview it here.
        </p>
      </aside>
    );
  }

  const { extracted, file_url, filename, category, content_type } = receipt;
  const isPdf = content_type === "application/pdf";
  const net =
    extracted.total_amount != null && extracted.vat_amount != null
      ? extracted.total_amount - extracted.vat_amount
      : null;

  return (
    <aside className="w-72 shrink-0 bg-white border-l-2 border-black flex flex-col overflow-hidden">
      {/* Header strip */}
      <div className="px-4 py-3 border-b-2 border-black bg-amber-400">
        <p className="text-xs text-black font-mono font-bold truncate" title={filename}>{filename}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-black uppercase tracking-wider text-black/70">{category}</span>
        </div>
      </div>

      {/* Preview image / PDF */}
      <div className="bg-amber-50 border-b-2 border-amber-400 flex items-center justify-center overflow-hidden" style={{ height: "200px" }}>
        {isPdf ? (
          <iframe src={`${apiBase}${file_url}`} className="w-full h-full" title="Receipt PDF" />
        ) : (
          <img
            src={`${apiBase}${file_url}`}
            alt="Receipt preview"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Extracted fields */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-black text-xs font-black uppercase tracking-wider mb-3">Extracted Data</h3>

        <div className="border-2 border-black rounded px-3 py-1 mb-4 bg-white">
          <FieldRow label="Vendor"    value={extracted.vendor} />
          <FieldRow label="Address"   value={extracted.vendor_address} />
          <FieldRow label="Receipt #" value={extracted.receipt_number} />
          <FieldRow label="Date"      value={extracted.receipt_date} />
        </div>

        <div className="border-2 border-amber-400 rounded px-3 py-1 mb-4 bg-amber-50">
          <FieldRow label="Total"   value={fmt(extracted.total_amount, extracted.currency)} />
          <FieldRow label="VAT %"   value={extracted.vat_percentage != null ? `${extracted.vat_percentage}%` : null} />
          <FieldRow label="VAT amt" value={fmt(extracted.vat_amount, extracted.currency)} />
          <FieldRow label="Net"     value={fmt(net, extracted.currency)} />
        </div>

        {/* Line items */}
        {extracted.line_items?.length > 0 && (
          <>
            <h4 className="text-black text-xs font-black uppercase tracking-wider mb-2">Line Items</h4>
            <div className="border-2 border-black rounded divide-y divide-black/10 mb-4">
              {extracted.line_items.map((item, i) => (
                <div key={i} className="px-3 py-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-black font-semibold truncate flex-1">{item.description}</span>
                    <span className="text-xs text-black font-black font-mono ml-2 shrink-0">
                      {fmt(item.total_price, extracted.currency)}
                    </span>
                  </div>
                  {(item.quantity != null || item.unit_price != null) && (
                    <div className="text-xs text-black/40 font-mono mt-0.5">
                      {item.quantity != null && `${item.quantity}×`}
                      {item.unit_price != null && ` ${fmt(item.unit_price, extracted.currency)}`}
                      {item.vat_rate != null && ` · ${item.vat_rate}% VAT`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes */}
        {extracted.notes && (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-xs text-black/50 font-mono leading-relaxed">
            {extracted.notes}
          </div>
        )}
      </div>
    </aside>
  );
}