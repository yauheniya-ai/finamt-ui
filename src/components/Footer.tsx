import { Icon } from "@iconify/react";

export default function Footer() {
  return (
    <footer className="bg-amber-400 px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-5 text-xs text-black/70">
        
        {/* Logo */}
        <span
          className="relative isolate inline-block font-mono text-white
                     before:absolute before:inset-0 before:bg-red-500
                     before:-rotate-3 before:z-[-1]"
        >
          finamt
        </span>

        {/* PyPI */}
        <a
          href="https://pypi.org/project/finanzamt/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-red-500 transition-colors"
        >
          <Icon icon="simple-icons:pypi" className="w-4 h-4" />
          PyPI
        </a>

        {/* GitHub */}
        <a
          href="https://github.com/yauheniya-ai/finanzamt"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-red-500 transition-colors"
        >
          <Icon icon="mdi:github" className="w-4 h-4" />
          GitHub
        </a>

        {/* API Docs */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-red-500 transition-colors"
        >
          <Icon icon="file-icons:swagger" className="w-4 h-4" />
          API Docs
        </a>

        {/* RTD */}
        <a
          href="https://docs.readthedocs.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-red-500 transition-colors"
        >
          <Icon icon="simple-icons:readthedocs" className="w-4 h-4" />
          Documentation
        </a>

      </div>

      <div className="text-xs text-black/70 font-mono">
        <span>
          © {new Date().getFullYear()} —{" "}
          <a
            href="https://github.com/yauheniya-ai/finanzamt/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="hover:text-red-500 transition-colors"
          >
            MIT LICENSE
          </a>
        </span>
      </div>
    </footer>
  );
}