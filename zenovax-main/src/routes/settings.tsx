import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — FlowSpace" }] }),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) { setName(data.name || ""); setTimezone(data.timezone || "Asia/Kolkata"); }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ name, timezone }).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

        <Card title="Profile">
          <Field label="Email"><div className="text-sm text-muted-foreground">{user?.email}</div></Field>
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Timezone">
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <button onClick={save} disabled={loading}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? "Saving…" : "Save changes"}
          </button>
        </Card>

        <Card title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-xs text-muted-foreground">Currently: {theme}</div>
            </div>
            <button onClick={toggleTheme} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
          </div>
        </Card>

        <Card title="Account">
          <button onClick={signOut} className="rounded-lg border border-destructive text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/10">
            Sign out
          </button>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-6 mb-4 space-y-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
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
