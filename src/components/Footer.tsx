export default function Footer() {
  return (
    <footer className="bg-amber-400 px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-5 text-xs text-black/70">
        <span className="relative isolate inline-block font-mono text-white
                      before:absolute before:inset-0 before:bg-red-500 before:-rotate-3 before:z-[-1]">
          finanzamt
        </span>
        
        <a href="https://pypi.org/project/finanzamt/" target="_blank" rel="noreferrer" className="hover:text-red-500 transition-colors">PyPI</a>
        <a href="https://github.com/yauheniya-ai/finanzamt" target="_blank" rel="noreferrer" className="hover:text-red-500 transition-colors">GitHub</a>
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-red-500 transition-colors">API Docs</a>
      </div>
      <div className="text-xs text-black/70 font-mono">
        <span>© {new Date().getFullYear()} — Yauheniya Varabyova</span>
      </div>
    </footer>
  );
}