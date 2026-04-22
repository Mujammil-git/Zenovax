import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[] | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addTask = async (input: Partial<Task> & { title: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setTasks((t) => [data as Task, ...t]);
    return data as Task;
  };

  const updateTask = async (id: string, patch: Partial<Task>) => {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } as Task : x)));
    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) await load();
  };

  const deleteTask = async (id: string) => {
    setTasks((t) => t.filter((x) => x.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  return { tasks, loading, addTask, updateTask, deleteTask, reload: load };
}
