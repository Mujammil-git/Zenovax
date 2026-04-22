import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { format, subDays } from "date-fns";
import toast from "react-hot-toast";

export const Route = createFileRoute("/focus")({
  component: FocusPage,
  head: () => ({ meta: [{ title: "Focus — FlowSpace" }] }),
});

const PRESETS = [
  { label: "Pomodoro", min: 25 },
  { label: "Short", min: 15 },
  { label: "Deep work", min: 50 },
  { label: "Break", min: 5 },
];

interface Session { id: string; duration_minutes: number; completed_at: string; }

function FocusPage() {
  const { user } = useAuth();
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const since = subDays(new Date(), 7).toISOString();
    const { data } = await supabase.from("focus_sessions").select("*").gte("completed_at", since).order("completed_at", { ascending: false });
    if (data) setSessions(data as Session[]);
  };
  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          complete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const complete = async () => {
    if (!user) return;
    await supabase.from("focus_sessions").insert({ user_id: user.id, duration_minutes: duration });
    toast.success(`🎉 ${duration} minute session complete!`);
    load();
  };

  const setPreset = (m: number) => { setDuration(m); setRemaining(m * 60); setRunning(false); };
  const reset = () => { setRemaining(duration * 60); setRunning(false); };

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const progress = 1 - remaining / (duration * 60);

  const totalToday = sessions.filter((s) => s.completed_at.startsWith(format(new Date(), "yyyy-MM-dd")))
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalWeek = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">
          <span className="text-pomodoro">Focus</span>
        </h1>
        <p className="text-muted-foreground mt-1">Deep work, one session at a time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 md:p-12 grid place-items-center">
          <div className="relative size-72 grid place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3" />
              <motion.circle cx="50" cy="50" r="46" fill="none" stroke="var(--accent-pomodoro)" strokeWidth="3"
                strokeDasharray={2 * Math.PI * 46} strokeDashoffset={(1 - progress) * 2 * Math.PI * 46}
                strokeLinecap="round" />
            </svg>
            <div className="text-center">
              <div className="font-mono text-6xl font-semibold tabular-nums">{mm}:{ss}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{PRESETS.find((p) => p.min === duration)?.label || "Custom"}</div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={() => setRunning(!running)}
              className="size-14 rounded-full bg-pomodoro text-white grid place-items-center hover:scale-105 transition shadow-lg">
              {running ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
            </button>
            <button onClick={reset} className="size-14 rounded-full border border-border grid place-items-center hover:bg-muted">
              <RotateCcw className="size-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-8 justify-center">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setPreset(p.min)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${duration === p.min ? "bg-pomodoro text-white" : "bg-muted hover:bg-muted/70"}`}>
                {p.label} · {p.min}m
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm text-muted-foreground">Today</div>
            <div className="font-display text-3xl font-semibold mt-1">{totalToday}<span className="text-base font-normal text-muted-foreground"> min</span></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm text-muted-foreground">This week</div>
            <div className="font-display text-3xl font-semibold mt-1">{totalWeek}<span className="text-base font-normal text-muted-foreground"> min</span></div>
            <div className="text-xs text-muted-foreground mt-1">{sessions.length} sessions</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Timer className="size-4 text-pomodoro" /> Recent</h4>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sessions yet</p>
            ) : (
              <ul className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span>{s.duration_minutes} min</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(s.completed_at), "MMM d, HH:mm")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
