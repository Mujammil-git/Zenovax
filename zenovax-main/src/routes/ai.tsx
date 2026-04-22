import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Send, User } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/ai")({
  component: AIPage,
  head: () => ({ meta: [{ title: "AI Assistant — FlowSpace" }] }),
});

interface Msg { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  "Plan my ideal day",
  "How do I beat procrastination?",
  "Suggest 3 habits to start this week",
  "Summarize my open tasks",
];

function AIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const convRef = useRef<string>(typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming || !user) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    await supabase.from("ai_messages").insert({ user_id: user.id, conversation_id: convRef.current, role: "user", content: text });

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (res.status === 429) { toast.error("Rate limit — try again shortly"); setStreaming(false); return; }
      if (res.status === 402) { toast.error("AI credits exhausted"); setStreaming(false); return; }
      if (!res.ok || !res.body) { toast.error("AI failed"); setStreaming(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let assistant = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: assistant }; return c; });
            }
          } catch { /* ignore */ }
        }
      }
      await supabase.from("ai_messages").insert({ user_id: user.id, conversation_id: convRef.current, role: "assistant", content: assistant });
    } catch {
      toast.error("Connection error");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold flex items-center gap-2">
          <Sparkles className="size-7 text-ai" /> <span className="text-ai">AI Assistant</span>
        </h1>
        <p className="text-muted-foreground mt-1">Powered by Gemini · Your productivity copilot</p>
      </div>

      <div className="bg-card border border-border rounded-2xl flex flex-col h-[calc(100vh-220px)] min-h-[500px] overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-ai to-notes grid place-items-center mb-4">
                <Sparkles className="size-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2">How can I help today?</h2>
              <p className="text-muted-foreground text-sm mb-6">Ask anything about productivity, planning, or your goals.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="text-left p-3 rounded-lg border border-border hover:border-ai hover:bg-ai/5 text-sm transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="size-8 rounded-lg bg-gradient-to-br from-ai to-notes grid place-items-center shrink-0">
                    <Sparkles className="size-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {m.content || (streaming ? <span className="inline-block size-2 bg-foreground/60 rounded-full animate-pulse" /> : "")}
                </div>
                {m.role === "user" && (
                  <div className="size-8 rounded-lg bg-muted grid place-items-center shrink-0">
                    <User className="size-4" />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="p-4 border-t border-border flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…"
            disabled={streaming}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ai" />
          <button type="submit" disabled={streaming || !input.trim()}
            className="rounded-lg bg-ai text-white px-4 grid place-items-center disabled:opacity-50 hover:opacity-90">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
