import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Flame, Check, Trash2, X } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import toast from "react-hot-toast";

export const Route = createFileRoute("/habits")({
  component: HabitsPage,
  head: () => ({ meta: [{ title: "Habits — FlowSpace" }] }),
});

interface Habit { id: string; name: string; icon: string; color: string; target_per_week: number; }
interface Log { id: string; habit_id: string; log_date: string; }

const ICONS = ["🔥", "💧", "📚", "🏃", "🧘", "💪", "🌱", "✍️", "😴", "🍎"];
const todayStr = () => format(new Date(), "yyyy-MM-dd");

function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    const since = format(subDays(new Date(), 60), "yyyy-MM-dd");
    const [h, l] = await Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("*").gte("log_date", since),
    ]);
    if (h.data) setHabits(h.data as Habit[]);
    if (l.data) setLogs(l.data as Log[]);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const toggle = async (habit: Habit) => {
    if (!user) return;
    const t = todayStr();
    const existing = logs.find((x) => x.habit_id === habit.id && x.log_date === t);
    if (existing) {
      setLogs((l) => l.filter((x) => x.id !== existing.id));
      await supabase.from("habit_logs").delete().eq("id", existing.id);
    } else {
      const { data } = await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: habit.id, log_date: t }).select().single();
      if (data) { setLogs((l) => [...l, data as Log]); toast.success(`${habit.icon} ${habit.name}!`); }
    }
  };

  const addHabit = async (name: string, icon: string) => {
    if (!user || !name.trim()) return;
    const { data } = await supabase.from("habits").insert({ user_id: user.id, name, icon }).select().single();
    if (data) setHabits((h) => [...h, data as Habit]);
    setShowAdd(false);
  };

  const deleteHabit = async (id: string) => {
    setHabits((h) => h.filter((x) => x.id !== id));
    await supabase.from("habits").delete().eq("id", id);
  };

  const streakOf = (habitId: string) => {
    const set = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date));
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (set.has(d)) s++;
      else if (i > 0) break;
    }
    return s;
  };

  const days = eachDayOfInterval({ start: subDays(new Date(), 41), end: new Date() });

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            <span className="text-habits">Habits</span>
          </h1>
          <p className="text-muted-foreground mt-1">Build momentum, one day at a time</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-habits text-white px-4 py-2 text-sm font-medium hover:opacity-90">
          <Plus className="size-4" /> New habit
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center">
          <Flame className="size-10 mx-auto text-habits mb-3" />
          <p className="text-muted-foreground">No habits yet. Start building one today.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {habits.map((h) => {
              const streak = streakOf(h.id);
              const doneToday = logs.some((l) => l.habit_id === h.id && l.log_date === todayStr());
              const set = new Set(logs.filter((l) => l.habit_id === h.id).map((l) => l.log_date));
              return (
                <motion.div key={h.id} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => toggle(h)}
                      className={`size-12 rounded-xl grid place-items-center text-2xl transition ${doneToday ? "bg-habits text-white scale-105" : "bg-muted hover:scale-105"}`}>
                      {doneToday ? <Check className="size-6" /> : h.icon}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{h.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Flame className="size-3 text-habits" /> {streak} day streak
                      </div>
                    </div>
                    <button onClick={() => deleteHabit(h.id)} className="text-muted-foreground hover:text-destructive p-2">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-[repeat(42,minmax(0,1fr))] gap-1">
                    {days.map((d) => {
                      const k = format(d, "yyyy-MM-dd");
                      const done = set.has(k);
                      return <div key={k} title={k} className={`aspect-square rounded-sm ${done ? "bg-habits" : "bg-muted"}`} />;
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addHabit} />}
    </AppShell>
  );
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, icon: string) => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🔥");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">New habit</h3>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 30 minutes"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring mb-4" />
        <div className="grid grid-cols-10 gap-1.5 mb-5">
          {ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)}
              className={`aspect-square rounded-lg text-xl grid place-items-center transition ${icon === i ? "bg-habits text-white" : "bg-muted hover:bg-muted/70"}`}>
              {i}
            </button>
          ))}
        </div>
        <button onClick={() => onAdd(name, icon)} disabled={!name.trim()}
          className="w-full rounded-lg bg-habits text-white py-2.5 font-medium disabled:opacity-50">Create habit</button>
      </motion.div>
    </div>
  );
}
