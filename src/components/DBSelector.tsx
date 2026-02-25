import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export type DBInfo = {
  name:       string;
  path:       string;
  dir:        string;
  size_kb:    number;
  receipts:   number;
  is_default: boolean;
};

type Props = {
  apiBase:   string;
  activeDb:  string | null;   // null = use server default
  onSelect:  (db: DBInfo | null) => void;
};

export default function DBSelector({ apiBase, activeDb, onSelect }: Props) {
  const [open,      setOpen]      = useState(false);
  const [databases, setDatabases] = useState<DBInfo[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${apiBase}/databases`);
      const data = await res.json();
      setDatabases(data.databases ?? []);
    } catch {
      setError("Could not reach server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const active = databases.find((d) => d.path === activeDb);
  const label  = active ? active.name : "default DB";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold font-mono text-black/60 hover:text-black transition-colors border border-black/10 rounded px-2 py-1 bg-white"
        title="Switch database"
      >
        <Icon icon="mdi:database-outline" className="w-3.5 h-3.5" />
        {label}
        <Icon icon="mdi:chevron-down" className="w-3 h-3" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white border-2 border-black rounded w-full max-w-lg flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b-2 border-black bg-amber-400 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider">Select Database</h2>
                <p className="text-xs text-black/60 font-mono mt-0.5">
                  ~/.finanzamt/ — scanned for .db files
                </p>
              </div>
              <button onClick={() => setOpen(false)}>
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto max-h-96">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-black/40 text-sm font-mono">
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                  Scanning…
                </div>
              )}

              {error && (
                <div className="m-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-pink-600 font-mono">
                  {error}
                </div>
              )}

              {!loading && !error && databases.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Icon icon="mdi:database-off-outline" className="w-10 h-10 text-black/20" />
                  <p className="text-black/40 text-xs font-mono">
                    No databases found in ~/.finanzamt/
                  </p>
                </div>
              )}

              {!loading && databases.map((db) => {
                const isActive = db.path === activeDb || (!activeDb && db.is_default);
                return (
                  <button
                    key={db.path}
                    onClick={() => { onSelect(db); setOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-3 border-b border-black/10 text-left transition-colors hover:bg-amber-50 ${
                      isActive ? "bg-amber-50 border-l-4 border-l-amber-500" : ""
                    }`}
                  >
                    <Icon
                      icon={isActive ? "mdi:database-check" : "mdi:database-outline"}
                      className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-600" : "text-black/30"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-black">{db.name}</span>
                        {db.is_default && (
                          <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded leading-none">
                            default
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[9px] font-black uppercase bg-amber-400 text-black px-1.5 py-0.5 rounded leading-none">
                            active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-black/40 font-mono truncate mt-0.5">{db.path}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-black text-black">{db.receipts} receipts</div>
                      <div className="text-xs text-black/40 font-mono">{db.size_kb} KB</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-black/10 bg-white flex items-center justify-between">
              <button
                onClick={load}
                className="text-xs text-black/40 hover:text-black font-mono flex items-center gap-1 transition-colors"
              >
                <Icon icon="mdi:refresh" className="w-3.5 h-3.5" />
                Refresh
              </button>
              {activeDb && (
                <button
                  onClick={() => { onSelect(null); setOpen(false); }}
                  className="text-xs font-bold text-black/40 hover:text-black transition-colors"
                >
                  Reset to default
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}