import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Pin, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({ meta: [{ title: "Notes — FlowSpace" }] }),
});

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  color: string;
  updated_at: string;
}

const COLORS = ["default", "yellow", "pink", "blue", "green"];
const colorBg: Record<string, string> = {
  default: "bg-card",
  yellow: "bg-amber-50 dark:bg-amber-950/30",
  pink: "bg-rose-50 dark:bg-rose-950/30",
  blue: "bg-sky-50 dark:bg-sky-950/30",
  green: "bg-emerald-50 dark:bg-emerald-950/30",
};

function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Note | null>(null);

  const load = async () => {
    const { data } = await supabase.from("notes").select("*")
      .order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    if (data) setNotes(data as Note[]);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const filtered = useMemo(() => {
    if (!q) return notes;
    const t = q.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(t) || n.content.toLowerCase().includes(t));
  }, [q, notes]);

  const create = async () => {
    if (!user) return;
    const { data } = await supabase.from("notes").insert({ user_id: user.id, title: "Untitled", content: "" }).select().single();
    if (data) { setNotes((n) => [data as Note, ...n]); setActive(data as Note); }
  };

  const update = async (id: string, patch: Partial<Note>) => {
    setNotes((n) => n.map((x) => x.id === id ? { ...x, ...patch } as Note : x));
    await supabase.from("notes").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const remove = async (id: string) => {
    setNotes((n) => n.filter((x) => x.id !== id));
    if (active?.id === id) setActive(null);
    await supabase.from("notes").delete().eq("id", id);
    toast.success("Note deleted");
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            <span className="text-notes">Notes</span>
          </h1>
          <p className="text-muted-foreground mt-1">{notes.length} notes</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring text-sm" />
          </div>
          <button onClick={create} className="inline-flex items-center gap-1.5 rounded-lg bg-notes text-white px-4 py-2 text-sm font-medium hover:opacity-90">
            <Plus className="size-4" /> New
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center">
          <FileText className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No notes yet. Create your first note.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((n) => (
              <motion.div key={n.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActive(n)}
                className={`${colorBg[n.color] || colorBg.default} border border-border rounded-xl p-4 cursor-pointer hover:shadow-md transition group`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1">{n.title || "Untitled"}</h3>
                  {n.pinned && <Pin className="size-3.5 text-notes shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-5 whitespace-pre-wrap">{n.content || "No content"}</p>
                <div className="text-xs text-muted-foreground mt-3">{new Date(n.updated_at).toLocaleDateString()}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {active && <Editor note={active} onClose={() => setActive(null)} onUpdate={update} onDelete={remove} />}
    </AppShell>
  );
}

function Editor({ note, onClose, onUpdate, onDelete }: {
  note: Note; onClose: () => void;
  onUpdate: (id: string, patch: Partial<Note>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color);
  const [pinned, setPinned] = useState(note.pinned);

  useEffect(() => {
    const t = setTimeout(() => onUpdate(note.id, { title, content, color, pinned }), 500);
    return () => clearTimeout(t);
  }, [title, content, color, pinned]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <motion.div initial={{ x: 400 }} animate={{ x: 0 }}
        className={`w-full max-w-2xl ${colorBg[color]} h-full shadow-xl border-l border-border flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={`size-5 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"} ${colorBg[c]}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPinned(!pinned)} className={`p-2 rounded-lg hover:bg-muted ${pinned ? "text-notes" : "text-muted-foreground"}`}>
              <Pin className="size-4" />
            </button>
            <button onClick={() => onDelete(note.id)} className="p-2 rounded-lg hover:bg-muted text-destructive">
              <Trash2 className="size-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="size-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
            className="w-full bg-transparent text-3xl font-display font-semibold outline-none mb-4" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start writing…"
            className="w-full bg-transparent outline-none resize-none min-h-[60vh] leading-relaxed" />
        </div>
      </motion.div>
    </div>
  );
}
