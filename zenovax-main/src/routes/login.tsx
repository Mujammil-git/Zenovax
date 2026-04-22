import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — FlowSpace" }] }),
});

function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div className="relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-medium">Flow</span>
            <span className="font-display text-3xl font-bold text-sidebar-accent">Space</span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-5xl font-semibold leading-tight">Your mind,<br/>organized.</h1>
          <p className="mt-4 text-sidebar-foreground/70 max-w-sm">Tasks, notes, habits, money, and focus — all in one beautiful AI-powered workspace.</p>
        </div>
        {/* floating cards */}
        {[
          { t: "✓ Ship landing page", c: "tasks", x: "10%", y: "20%", r: -6 },
          { t: "🔥 12-day streak", c: "habits", x: "60%", y: "15%", r: 4 },
          { t: "🍅 Focus 25:00", c: "pomodoro", x: "70%", y: "55%", r: -3 },
          { t: "📝 Daily journal", c: "notes", x: "5%", y: "65%", r: 5 },
        ].map((card, i) => (
          <motion.div
            key={i}
            className="absolute bg-white text-foreground text-sm font-medium px-4 py-3 rounded-xl shadow-lg"
            style={{ left: card.x, top: card.y, rotate: `${card.r}deg` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ delay: i * 0.15, y: { repeat: Infinity, duration: 4 + i, ease: "easeInOut" } }}
          >
            {card.t}
          </motion.div>
        ))}
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-sidebar-accent/20 blur-3xl" />
      </div>

      {/* Right panel */}
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display text-3xl font-medium">Flow</span>
            <span className="font-display text-3xl font-bold text-pomodoro">Space</span>
          </div>
          <h2 className="font-display text-3xl font-semibold">Welcome back</h2>
          <p className="text-muted-foreground mt-1">Sign in to continue.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button disabled={busy} className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50">
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            New here? <Link to="/signup" className="text-foreground font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
