import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, Calendar, FileText, Flame,
  Wallet, Timer, Sparkles, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/money", label: "Money", icon: Wallet },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/ai", label: "AI Assistant", icon: Sparkles },
];

export function Sidebar() {
  const loc = useLocation();
  const nav2 = useNavigate();
  const { user, signOut } = useAuth();
  const initial = (user?.user_metadata?.name || user?.email || "U")[0].toUpperCase();

  const handleLogout = async () => {
    await signOut();
    nav2({ to: "/login" });
  };

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground h-screen sticky top-0 px-4 py-6">
      <Link to="/dashboard" className="flex items-baseline gap-1 px-2 mb-8">
        <span className="font-display text-2xl font-medium">Flow</span>
        <span className="font-display text-2xl font-bold text-sidebar-accent">Space</span>
      </Link>

      <div className="flex items-center gap-3 px-2 py-3 mb-6 rounded-xl bg-sidebar-hover">
        <div className="size-9 rounded-full bg-sidebar-accent text-black font-semibold grid place-items-center">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{user?.user_metadata?.name || "You"}</div>
          <div className="text-xs text-sidebar-muted truncate">{user?.email}</div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {nav.map((n, i) => {
          const active = loc.pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <motion.div
              key={n.to}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
        <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-white">
          <Settings className="size-4" /> Settings
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-white text-left">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
