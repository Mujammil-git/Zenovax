import { AppShell } from "@/components/layout/AppShell";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({ title, icon: Icon, accent, blurb }: {
  title: string; icon: LucideIcon; accent: string; blurb: string;
}) {
  return (
    <AppShell>
      <div className="max-w-2xl">
        <div className={`size-14 rounded-2xl grid place-items-center ${accent} text-white mb-6`}>
          <Icon className="size-7" />
        </div>
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{blurb}</p>
        <div className="mt-8 bg-card border border-dashed border-border rounded-xl p-8">
          <p className="text-sm text-muted-foreground">
            This module is part of the FlowSpace roadmap. The foundation, design system, auth, dashboard,
            and Tasks module are live — ask in chat to build out this module next.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
