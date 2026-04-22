import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    nav({ to: user ? "/dashboard" : "/login" });
  }, [user, loading, nav]);
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="size-10 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
    </div>
  );
}
