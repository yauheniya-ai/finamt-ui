import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DBInfo = {
  name:       string;
  path:       string;
  root:       string;
  size_kb:    number;
  receipts:   number;
  is_default: boolean;
  is_active:  boolean;
  exists:     boolean;
};

type Props = {
  apiBase:  string;
  activeDb: string | null;   // null = server default
  onSelect: (db: DBInfo | null) => void;
};

// ---------------------------------------------------------------------------
// Validation — mirrors backend rules
// ---------------------------------------------------------------------------

const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function validateName(name: string): string | null {
  if (!name.trim()) return "Name cannot be empty.";
  if (!NAME_RE.test(name))
    return "Lowercase letters, digits, hyphens, underscores only. Must start with a letter or digit.";
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DBSelector({ apiBase, activeDb, onSelect }: Props) {
  const { t } = useTranslation();

  const [open,      setOpen]      = useState(false);
  const [projects,  setProjects]  = useState<DBInfo[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [fetchErr,  setFetchErr]  = useState<string | null>(null);

  // "Add project" inline form
  const [adding,    setAdding]    = useState(false);
  const [newName,   setNewName]   = useState("");
  const [nameErr,   setNameErr]   = useState<string | null>(null);
  const [creating,  setCreating]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Load project list ────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const qs  = activeDb ? `?active_db=${encodeURIComponent(activeDb)}` : "";
      const res  = await fetch(`${apiBase}/projects${qs}`);
      const data = await res.json();
      setProjects(data.projects ?? []);
    } catch {
      setFetchErr(t("db.error_load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open]);

  // Focus input when add form opens
  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 50);
  }, [adding]);

  // ── Create project ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    const trimmed = newName.trim().toLowerCase();
    const err = validateName(trimmed);
    if (err) { setNameErr(err); return; }

    setCreating(true);
    setNameErr(null);
    try {
      const res  = await fetch(`${apiBase}/projects`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const d = await res.json();
        setNameErr(d.detail ?? t("db.error_create"));
        return;
      }
      const created: DBInfo = await res.json();
      setAdding(false);
      setNewName("");
      await load();
      onSelect(created);
      setOpen(false);
    } catch {
      setNameErr(t("db.error_create"));
    } finally {
      setCreating(false);
    }
  };

  // ── Delete project ───────────────────────────────────────────────────────
  const handleDelete = async (name: string) => {
    try {
      await fetch(`${apiBase}/projects/${encodeURIComponent(name)}?keep_pdfs=true`, {
        method: "DELETE",
      });
      setConfirmDelete(null);
      const deleted = projects.find(p => p.name === name);
      await load();
      if (deleted && deleted.path === activeDb) onSelect(null);
    } catch {
      setFetchErr(t("db.error_delete"));
    }
  };

  const closeModal = () => {
    setOpen(false);
    setAdding(false);
    setNewName("");
    setNameErr(null);
    setConfirmDelete(null);
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const active = projects.find((p) => p.path === activeDb);
  const label  = active ? active.name : t("db.default");

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold font-mono text-black/60 hover:text-black transition-colors border border-black/10 rounded px-2 py-1 bg-white"
        title={t("db.switch")}
      >
        <Icon icon="mdi:database-outline" className="w-3.5 h-3.5" />
        {label}
        <Icon icon="mdi:chevron-down" className="w-3 h-3" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={closeModal}>
          <div className="bg-white border-2 border-black rounded w-full max-w-lg flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="px-5 py-4 border-b-2 border-black bg-amber-400 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider">{t("db.title")}</h2>
                <p className="text-xs text-black/60 font-mono mt-0.5">~/.finamt/</p>
              </div>
              <button onClick={closeModal}><Icon icon="mdi:close" className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto max-h-96">

              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-black/40 text-sm font-mono">
                  <Icon icon="svg-spinners:12-dots-scale-rotate" className="w-5 h-5" />
                  {t("db.scanning")}
                </div>
              )}

              {fetchErr && (
                <div className="m-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-pink-600 font-mono">
                  {fetchErr}
                </div>
              )}

              {!loading && !fetchErr && projects.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Icon icon="mdi:database-off-outline" className="w-10 h-10 text-black/20" />
                  <p className="text-black/40 text-xs font-mono">{t("db.no_projects")}</p>
                </div>
              )}

              {!loading && projects.map((proj) => {
                const isActive     = proj.path === activeDb || (!activeDb && proj.is_default);
                const isConfirming = confirmDelete === proj.name;

                return (
                  <div key={proj.path} className={`border-b border-black/10 last:border-0 ${isActive ? "bg-amber-50 border-l-4 border-l-amber-500" : ""}`}>

                    <div className="flex items-center gap-3 px-5 py-3">
                      {/* Select area */}
                      <button
                        onClick={() => { onSelect(proj); setOpen(false); }}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <Icon
                          icon={isActive ? "mdi:database-check" : "mdi:database-outline"}
                          className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-600" : "text-black/30"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-black">{proj.name}</span>
                            {proj.is_default && (
                              <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded leading-none">
                                {t("db.badge_default")}
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[9px] font-black uppercase bg-amber-400 text-black px-1.5 py-0.5 rounded leading-none">
                                {t("db.badge_active")}
                              </span>
                            )}
                            {!proj.exists && (
                              <span className="text-[9px] font-black uppercase bg-black/10 text-black/40 px-1.5 py-0.5 rounded leading-none">
                                {t("db.badge_empty")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-black/40 font-mono truncate mt-0.5">{proj.path}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs font-black text-black">
                            {proj.receipts} {t("db.receipts")}
                          </div>
                          <div className="text-xs text-black/40 font-mono">{proj.size_kb} KB</div>
                        </div>
                      </button>

                      {/* Delete — disabled for default */}
                      {!proj.is_default && (
                        <button
                          onClick={() => setConfirmDelete(isConfirming ? null : proj.name)}
                          className="shrink-0 text-black/20 hover:text-red-500 transition-colors ml-1"
                          title={t("db.delete")}
                        >
                          <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Delete confirmation */}
                    {isConfirming && (
                      <div className="mx-5 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded flex items-center justify-between gap-3">
                        <span className="text-xs text-red-600 font-bold">
                          {t("db.confirm_delete", { name: proj.name })}
                        </span>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleDelete(proj.name)}
                            className="text-[11px] font-black bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 transition-colors"
                          >
                            {t("db.confirm_yes")}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[11px] font-black bg-white text-red-500 border border-red-300 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                          >
                            {t("db.confirm_no")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add project inline form */}
              {adding && (
                <div className="px-5 py-4 border-t border-black/10 bg-amber-50/60">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/50 mb-2">
                    {t("db.new_project_label")}
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      ref={inputRef}
                      value={newName}
                      onChange={(e) => { setNewName(e.target.value.toLowerCase()); setNameErr(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                        if (e.key === "Escape") { setAdding(false); setNewName(""); setNameErr(null); }
                      }}
                      placeholder={t("db.new_project_placeholder")}
                      className="flex-1 text-xs font-mono text-black bg-white border border-amber-300 rounded px-2 py-1.5 outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="shrink-0 text-xs font-bold bg-black text-white px-3 py-1.5 rounded hover:bg-black/80 disabled:opacity-40 transition-colors flex items-center gap-1"
                    >
                      {creating
                        ? <><Icon icon="svg-spinners:12-dots-scale-rotate" className="w-3.5 h-3.5" /> {t("db.creating")}</>
                        : t("db.create")
                      }
                    </button>
                    <button
                      onClick={() => { setAdding(false); setNewName(""); setNameErr(null); }}
                      className="shrink-0 text-black/30 hover:text-black transition-colors"
                    >
                      <Icon icon="mdi:close" className="w-4 h-4" />
                    </button>
                  </div>
                  {nameErr && (
                    <p className="text-[10px] text-red-500 font-mono mt-1.5">{nameErr}</p>
                  )}
                  <p className="text-[10px] text-black/30 font-mono mt-1.5">
                    {t("db.name_hint")}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-black/10 bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={load}
                  className="text-xs text-black/40 hover:text-black font-mono flex items-center gap-1 transition-colors"
                >
                  <Icon icon="mdi:refresh" className="w-3.5 h-3.5" />
                  {t("db.refresh")}
                </button>
                {!adding && (
                  <button
                    onClick={() => { setAdding(true); setConfirmDelete(null); }}
                    className="text-xs font-bold text-black/50 hover:text-black flex items-center gap-1.5 transition-colors"
                  >
                    <Icon icon="mdi:plus-circle-outline" className="w-3.5 h-3.5" />
                    {t("db.add_project")}
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}