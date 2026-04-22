import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isToday, parseISO, format, subDays } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckSquare, Flame, Wallet, Timer } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — FlowSpace" }] }),
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { user } = useAuth();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [stats, setStats] = useState({ habitStreak: 0, netToday: 0, focusToday: 0 });
  const name = user?.user_metadata?.name || (user?.email || "there").split("@")[0];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const since = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const [logs, txns, sessions] = await Promise.all([
        supabase.from("habit_logs").select("log_date").gte("log_date", since),
        supabase.from("transactions").select("amount,type,txn_date").eq("txn_date", today),
        supabase.from("focus_sessions").select("duration_minutes").gte("completed_at", today + "T00:00:00"),
      ]);
      const dates = new Set((logs.data || []).map((l: { log_date: string }) => l.log_date));
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        if (dates.has(d)) streak++;
        else if (i > 0) break;
      }
      const net = (txns.data || []).reduce((s: number, t: { amount: number; type: string }) =>
        s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
      const focus = (sessions.data || []).reduce((s: number, x: { duration_minutes: number }) => s + x.duration_minutes, 0);
      setStats({ habitStreak: streak, netToday: net, focusToday: focus });
    })();
  }, [user]);

  const todayTasks = tasks.filter((t) => t.due_date && isToday(parseISO(t.due_date)));
  const focusTasks = tasks.filter((t) => t.status !== "done").slice(0, 3);
  const completedToday = todayTasks.filter((t) => t.status === "done").length;
  const pct = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            {greeting()}, <span className="text-pomodoro">{name}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <div className="md:w-96">
          <QuickAdd onAdd={(title) => addTask({ title })} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/tasks"><StatCard icon={<CheckSquare className="text-tasks" />} label="Tasks today" value={`${completedToday}/${todayTasks.length}`} sub={`${pct}% complete`} /></Link>
        <Link to="/habits"><StatCard icon={<Flame className="text-habits" />} label="Habit streak" value={`${stats.habitStreak}d`} sub={stats.habitStreak ? "Keep going!" : "Start today"} /></Link>
        <Link to="/money"><StatCard icon={<Wallet className="text-money" />} label="Net today" value={`$${stats.netToday.toFixed(0)}`} sub="Income − expense" /></Link>
        <Link to="/focus"><StatCard icon={<Timer className="text-pomodoro" />} label="Focus today" value={`${stats.focusToday}m`} sub="Deep work" /></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section title="Today's Focus" hint="Top 3 tasks to ship today">
            {focusTasks.length === 0 ? (
              <Empty msg="No tasks yet — add one above to get going." />
            ) : (
              <div className="flex flex-col gap-2">
                {focusTasks.map((t) => (
                  <TaskCard key={t.id} task={t}
                    onToggle={() => updateTask(t.id, { status: t.status === "done" ? "pending" : "done" })}
                    onDelete={() => deleteTask(t.id)} />
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Focus time" icon={<Timer className="size-4 text-pomodoro" />}>
            <Link to="/focus" className="block bg-card border border-border rounded-xl p-5 text-center hover:border-pomodoro transition">
              <div className="font-mono text-4xl font-semibold">25:00</div>
              <p className="text-xs text-muted-foreground mt-1">Pomodoro ready</p>
              <div className="mt-4 w-full rounded-lg bg-pomodoro text-white py-2 text-sm font-medium">Start session</div>
            </Link>
          </Section>

          <Section title="AI Insight" icon={<Sparkles className="size-4 text-ai" />}>
            <Link to="/ai" className="block bg-card border border-border rounded-xl p-5 hover:border-ai transition">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ai font-medium">
                <Sparkles className="size-3.5" /> Daily tip
              </div>
              <p className="mt-2 text-sm leading-relaxed">
                Begin with your highest-priority task before checking messages. A focused first hour sets the tone for the day.
              </p>
              <p className="mt-3 text-xs text-ai font-medium">Open AI Assistant →</p>
            </Link>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-foreground/20 transition cursor-pointer h-full">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="size-8 rounded-lg bg-muted grid place-items-center">{icon}</div>
      </div>
      <div className="mt-3 font-display text-2xl md:text-3xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Section({ title, hint, icon, children }: { title: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display text-lg font-semibold">{title}</h2>
        </div>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">{msg}</div>;
}
