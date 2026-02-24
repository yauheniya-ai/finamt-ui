export default function Header() {
  return (
    <header className="bg-white border-b-2 border-red-500 px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-4">
          <h1 className="relative isolate inline-block text-2xl font-black font-mono text-black
                        before:absolute before:inset-0 before:bg-amber-400 before:-rotate-3 before:z-[-1]">
            finanzamt
          </h1>
          <span className="text-black/70 text-sm font-medium">
            a Python library for extracting key information from receipts and preparing essential German tax return statements
          </span>
        </div>
        <div className="flex items-center gap-2">
          <code className="bg-black text-white text-xs font-mono px-2.5 py-0.5 rounded">
            pip install finanzamt
          </code>
        </div>
      </div>
    </header>
  );
}