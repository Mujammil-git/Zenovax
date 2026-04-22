import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { useTasks, type Task, type TaskStatus, type TaskPriority } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks — FlowSpace" }] }),
});

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "pending", label: "Pending", color: "bg-tasks" },
  { key: "in_progress", label: "In Progress", color: "bg-pomodoro" },
  { key: "done", label: "Done", color: "bg-habits" },
];

function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [view, setView] = useState<"list" | "board">("list");
  const [filter, setFilter] = useState<"all" | TaskPriority>("all");
  const [selected, setSelected] = useState<Task | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.priority === filter)),
    [tasks, filter]
  );

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], done: [] };
    filtered.forEach((t) => g[t.status].push(t));
    return g;
  }, [filtered]);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Tasks</h1>
          <p className="text-muted-foreground mt-1">{tasks.length} total · {tasks.filter(t => t.status !== "done").length} active</p>
        </div>
        <div className="flex gap-2">
          <Toggle current={view} setCurrent={setView} options={[{ k: "list", l: "List" }, { k: "board", l: "Board" }]} />
          <Toggle current={filter} setCurrent={setFilter as (v: string) => void}
            options={[{ k: "all", l: "All" }, { k: "high", l: "High" }, { k: "medium", l: "Med" }, { k: "low", l: "Low" }]} />
        </div>
      </div>

      <div className="mb-6 max-w-2xl">
        <QuickAdd onAdd={(title) => addTask({ title })} />
      </div>

      {view === "list" ? (
        <div className="space-y-6">
          {COLUMNS.map((c) => (
            <section key={c.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`size-2 rounded-full ${c.color}`} />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.label} <span className="ml-1 text-foreground">{grouped[c.key].length}</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {grouped[c.key].map((t) => (
                    <TaskCard key={t.id} task={t}
                      onToggle={() => updateTask(t.id, { status: t.status === "done" ? "pending" : "done" })}
                      onDelete={() => deleteTask(t.id)}
                      onClick={() => setSelected(t)} />
                  ))}
                </AnimatePresence>
              </div>
              {grouped[c.key].length === 0 && (
                <div className="text-sm text-muted-foreground italic">Nothing here.</div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((c) => (
            <div key={c.key} className="bg-muted/40 rounded-xl p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${c.color}`} />
                  <span className="text-sm font-semibold">{c.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{grouped[c.key].length}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {grouped[c.key].map((t) => (
                    <TaskCard key={t.id} task={t}
                      onToggle={() => updateTask(t.id, { status: t.status === "done" ? "pending" : "done" })}
                      onDelete={() => deleteTask(t.id)}
                      onClick={() => setSelected(t)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailPanel task={selected} onClose={() => setSelected(null)}
          onSave={async (patch) => { await updateTask(selected.id, patch); toast.success("Saved"); setSelected(null); }} />
      )}
    </AppShell>
  );
}

function Toggle<T extends string>({ current, setCurrent, options }: {
  current: T; setCurrent: (v: T) => void;
  options: { k: T; l: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button key={o.k} onClick={() => setCurrent(o.k)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
            current === o.k ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function DetailPanel({ task, onClose, onSave }: {
  task: Task; onClose: () => void; onSave: (patch: Partial<Task>) => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-card h-full shadow-xl border-l border-border flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display text-xl font-semibold">Edit task</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </Field>
          </div>
          <Field label="Due date">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none" />
          </Field>
        </div>
        <div className="p-5 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={() => onSave({ title, description, priority, status, due_date: dueDate || null })}
            className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
