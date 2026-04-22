import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, CheckSquare, Calendar, FileText, Sparkles } from "lucide-react";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/calendar", icon: Calendar, label: "Cal" },
  { to: "/notes", icon: FileText, label: "Notes" },
  { to: "/ai", icon: Sparkles, label: "AI" },
];

export function MobileNav() {
  const loc = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-sidebar text-sidebar-foreground border-t border-white/10 flex justify-around py-2">
      {items.map((n) => {
        const active = loc.pathname.startsWith(n.to);
        const Icon = n.icon;
        return (
          <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${active ? "text-sidebar-accent" : "text-sidebar-foreground/70"}`}>
            <Icon className="size-5" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
