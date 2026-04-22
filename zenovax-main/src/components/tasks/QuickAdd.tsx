import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

export function QuickAdd({
  onAdd,
  placeholder = "Add a task and press Enter...",
}: {
  onAdd: (title: string) => Promise<unknown>;
  placeholder?: string;
}) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.trim()) return;
    setBusy(true);
    try {
      await onAdd(v.trim());
      setV("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not add task");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
      <Plus className="size-4 text-muted-foreground" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm py-1"
        disabled={busy}
      />
      {v && (
        <button className="text-xs font-medium px-3 py-1 rounded-md bg-primary text-primary-foreground" disabled={busy}>
          Add
        </button>
      )}
    </form>
  );
}
