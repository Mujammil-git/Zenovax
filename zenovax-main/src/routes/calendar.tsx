import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, addMonths, subMonths, isSameMonth, isSameDay, parseISO,
} from "date-fns";
import toast from "react-hot-toast";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "Calendar — FlowSpace" }] }),
});

interface Ev { id: string; title: string; description: string; start_at: string; end_at: string; color: string; all_day: boolean; }

const COLORS = ["red", "blue", "green", "purple", "orange"];
const colorBg: Record<string, string> = {
  red: "bg-rose-500", blue: "bg-sky-500", green: "bg-emerald-500", purple: "bg-violet-500", orange: "bg-amber-500",
};

function CalendarPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<Ev[]>([]);
  const [editing, setEditing] = useState<Partial<Ev> | null>(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [cursor]);

  const load = async () => {
    const { data } = await supabase.from("events").select("*")
      .gte("start_at", gridStart.toISOString()).lte("start_at", gridEnd.toISOString())
      .order("start_at");
    if (data) setEvents(data as Ev[]);
  };
  useEffect(() => { if (user) load(); }, [user, cursor]);

  const eventsOnDay = (d: Date) => events.filter((e) => isSameDay(parseISO(e.start_at), d));

  const save = async (e: Partial<Ev> & { title: string; start_at: string; end_at: string }) => {
    if (!user) return;
    if (editing?.id) {
      await supabase.from("events").update(e).eq("id", editing.id);
    } else {
      await supabase.from("events").insert({ ...e, user_id: user.id });
    }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    setEditing(null);
    load();
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            <span className="text-calendar">Calendar</span>
          </h1>
          <p className="text-muted-foreground mt-1">{format(cursor, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(subMonths(cursor, 1))} className="p-2 rounded-lg border border-border hover:bg-muted"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted">Today</button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-2 rounded-lg border border-border hover:bg-muted"><ChevronRight className="size-4" /></button>
          <button onClick={() => setEditing({ start_at: new Date().toISOString(), end_at: new Date().toISOString() })}
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-calendar text-white px-4 py-2 text-sm font-medium hover:opacity-90">
            <Plus className="size-4" /> Event
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[minmax(110px,auto)]">
          {days.map((d) => {
            const dayEvents = eventsOnDay(d);
            const inMonth = isSameMonth(d, cursor);
            const today = isSameDay(d, new Date());
            return (
              <button key={d.toISOString()} onClick={() => setEditing({ start_at: d.toISOString(), end_at: d.toISOString() })}
                className={`text-left p-2 border-b border-r border-border hover:bg-muted/40 transition ${inMonth ? "" : "bg-muted/20"}`}>
                <div className={`text-xs font-medium mb-1 inline-flex items-center justify-center size-6 rounded-full ${today ? "bg-calendar text-white" : inMonth ? "text-foreground" : "text-muted-foreground"}`}>
                  {format(d, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setEditing(e); }}
                      className={`${colorBg[e.color] || "bg-sky-500"} text-white text-[11px] truncate px-1.5 py-0.5 rounded`}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {editing && (
        <EventModal event={editing} onClose={() => setEditing(null)} onSave={save}
          onDelete={editing.id ? () => remove(editing.id!) : undefined} />
      )}
    </AppShell>
  );
}

function EventModal({ event, onClose, onSave, onDelete }: {
  event: Partial<Ev>; onClose: () => void;
  onSave: (e: Partial<Ev> & { title: string; start_at: string; end_at: string }) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(event.title || "");
  const [description, setDescription] = useState(event.description || "");
  const [color, setColor] = useState(event.color || "blue");
  const initStart = event.start_at ? format(parseISO(event.start_at), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const initEnd = event.end_at ? format(parseISO(event.end_at), "yyyy-MM-dd'T'HH:mm") : initStart;
  const [start, setStart] = useState(initStart);
  const [end, setEnd] = useState(initEnd);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-semibold">{event.id ? "Edit event" : "New event"}</h3>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="space-y-3">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">Start
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2 text-sm" />
            </label>
            <label className="text-xs text-muted-foreground">End
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)}
                className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2 text-sm" />
            </label>
          </div>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={`size-7 rounded-full ${colorBg[c]} ${color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          {onDelete && <button onClick={onDelete} className="rounded-lg border border-border p-2.5 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>}
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={() => onSave({ title, description, color, start_at: new Date(start).toISOString(), end_at: new Date(end).toISOString() })}
            disabled={!title.trim()}
            className="flex-1 rounded-lg bg-calendar text-white py-2.5 text-sm font-medium disabled:opacity-50">Save</button>
        </div>
      </motion.div>
    </div>
  );
}
