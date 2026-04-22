import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2, X } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import toast from "react-hot-toast";

export const Route = createFileRoute("/money")({
  component: MoneyPage,
  head: () => ({ meta: [{ title: "Money — FlowSpace" }] }),
});

interface Txn { id: string; amount: number; type: "income" | "expense"; category: string; description: string; txn_date: string; }

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Salary", "Other"];
const PIE_COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#64748b"];

function MoneyPage() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("transactions").select("*").order("txn_date", { ascending: false }).limit(200);
    if (data) setTxns(data as Txn[]);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthTxns = txns.filter((t) => t.txn_date >= monthStart);
  const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expense;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthTxns]);

  const last7 = useMemo(() => {
    const map: Record<string, { day: string; income: number; expense: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = format(d, "yyyy-MM-dd");
      map[k] = { day: format(d, "EEE"), income: 0, expense: 0 };
    }
    txns.forEach((t) => {
      if (map[t.txn_date]) {
        if (t.type === "income") map[t.txn_date].income += Number(t.amount);
        else map[t.txn_date].expense += Number(t.amount);
      }
    });
    return Object.values(map);
  }, [txns]);

  const add = async (input: Omit<Txn, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("transactions").insert({ ...input, user_id: user.id }).select().single();
    if (data) { setTxns((t) => [data as Txn, ...t]); toast.success("Added"); }
    setShowAdd(false);
  };

  const remove = async (id: string) => {
    setTxns((t) => t.filter((x) => x.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            <span className="text-money">Money</span>
          </h1>
          <p className="text-muted-foreground mt-1">{format(new Date(), "MMMM yyyy")}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-money text-white px-4 py-2 text-sm font-medium hover:opacity-90">
          <Plus className="size-4" /> Add transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Stat icon={<TrendingUp className="text-emerald-500" />} label="Income" value={`$${income.toFixed(2)}`} />
        <Stat icon={<TrendingDown className="text-rose-500" />} label="Expenses" value={`$${expense.toFixed(2)}`} />
        <Stat icon={<Wallet className="text-money" />} label="Net" value={`$${net.toFixed(2)}`} accent={net >= 0 ? "text-emerald-500" : "text-rose-500"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg font-semibold mb-4">Spending by category</h3>
          {byCategory.length === 0 ? (
            <div className="h-64 grid place-items-center text-sm text-muted-foreground">No expenses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-lg font-semibold mb-4">Last 7 days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="day" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} />
              <Tooltip />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold">Recent transactions</h3>
        </div>
        {txns.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No transactions yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence>
              {txns.slice(0, 30).map((t) => (
                <motion.li key={t.id} layout exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4 p-4 group hover:bg-muted/40">
                  <div className={`size-10 rounded-lg grid place-items-center ${t.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                    {t.type === "income" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.description || t.category}</div>
                    <div className="text-xs text-muted-foreground">{t.category} · {t.txn_date}</div>
                  </div>
                  <div className={`font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "income" ? "+" : "−"}${Number(t.amount).toFixed(2)}
                  </div>
                  <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {showAdd && <AddTxn onClose={() => setShowAdd(false)} onAdd={add} />}
    </AppShell>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="size-8 rounded-lg bg-muted grid place-items-center">{icon}</div>
      </div>
      <div className={`mt-3 font-display text-3xl font-semibold ${accent || ""}`}>{value}</div>
    </div>
  );
}

function AddTxn({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Omit<Txn, "id">) => void }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-semibold">New transaction</h3>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>

        <div className="inline-flex w-full rounded-lg bg-muted p-1 mb-4">
          {(["expense", "income"] as const).map((k) => (
            <button key={k} onClick={() => setType(k)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md ${type === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {k === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring text-2xl font-display" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none" />
        </div>

        <button onClick={() => onAdd({ type, amount: Number(amount), category, description, txn_date: date })}
          disabled={!amount || Number(amount) <= 0}
          className="w-full mt-5 rounded-lg bg-money text-white py-2.5 font-medium disabled:opacity-50">
          Add transaction
        </button>
      </motion.div>
    </div>
  );
}
