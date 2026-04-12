import { Icon } from "@iconify/react";
import elsterLogo from "../../assets/elster.svg";

// ---------------------------------------------------------------------------
// ELSTER tip icon with tooltip
// ---------------------------------------------------------------------------
export function ElsterTip({ lines }: { lines: string[] }) {
  return (
    <span className="relative group inline-flex items-center align-middle ml-1">
      <img src={elsterLogo} alt="ELSTER" className="w-3 h-3 inline-block cursor-default opacity-70 group-hover:opacity-100 transition-opacity" />
      <span className="pointer-events-none absolute bottom-full mb-1.5 left-0 w-72 bg-black text-white text-[10px] leading-relaxed font-normal normal-case tracking-normal px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-30 whitespace-normal">
        {lines.map((line, i) => (
          <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
        ))}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// ELSTER-style VAT row — line | description | base | tax
// ---------------------------------------------------------------------------
export function VatRow({ line, label, sublabel, base, tax, bold, tip }: {
  line?:     string;
  label:     string;
  sublabel?: string;
  base?:     string;
  tax?:      string;
  bold?:     boolean;
  tip?:      React.ReactNode;
}) {
  const textCls = bold ? "font-bold text-black" : "text-black/70";
  return (
    <tr className="border-b border-amber-100 last:border-0">
      <td className="py-1.5 pr-3 text-[11px] font-mono font-bold text-black w-8 shrink-0">
        {line ?? ""}
      </td>
      <td className={`py-1.5 text-xs ${textCls} flex-1`}>
        <span className="inline-flex items-center gap-0">{label}{tip}</span>
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
// Law reference link
// ---------------------------------------------------------------------------
export function LawLink({ law, href }: { law: string; href: string }) {
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
