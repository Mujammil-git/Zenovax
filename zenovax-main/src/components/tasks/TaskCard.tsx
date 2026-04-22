import { format, isPast, isToday, parseISO } from "date-fns";
import { Trash2, Calendar as CalIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { Task } from "@/hooks/useTasks";

const priorityColor: Record<string, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onClick,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onClick?: () => void;
}) {
  const done = task.status === "done";
  const due = task.due_date ? parseISO(task.due_date) : null;
  const overdue = due && !done && isPast(due) && !isToday(due);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      className="group bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`mt-0.5 size-5 rounded-full border-2 grid place-items-center transition ${
            done ? "bg-foreground border-foreground" : "border-muted-foreground/40 hover:border-foreground"
          }`}
        >
          {done && (
            <svg viewBox="0 0 16 16" className="size-3 text-background" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {due && (
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                overdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
              }`}>
                <CalIcon className="size-3" />
                {format(due, "MMM d")}
              </span>
            )}
            {task.tags?.map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`size-2.5 rounded-full ${priorityColor[task.priority]}`} title={task.priority} />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
