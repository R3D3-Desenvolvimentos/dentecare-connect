import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/Header";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ConversationsChart } from "@/components/dashboard/ConversationsChart";
import { ConversationsTable, type Conversation } from "@/components/dashboard/ConversationsTable";
import { ConversationDetail } from "@/components/dashboard/ConversationDetail";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildLast7Days(rows: { started_at: string }[]) {
  const days: { day: string; key: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      count: 0,
    });
  }
  for (const r of rows) {
    const key = new Date(r.started_at).toISOString().slice(0, 10);
    const slot = days.find((s) => s.key === key);
    if (slot) slot.count += 1;
  }
  return days.map(({ day, count }) => ({ day, count }));
}

function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [convRes, msgRes, recentRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, contact_name, phone_number, status, message_count, last_message_at, started_at")
        .order("last_message_at", { ascending: false }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase
        .from("conversations")
        .select("started_at")
        .gte("started_at", sevenDaysAgo.toISOString()),
    ]);

    if (convRes.data) setConversations(convRes.data as Conversation[]);
    if (typeof msgRes.count === "number") setTotalMessages(msgRes.count);
    if (recentRes.data) setChartData(buildLast7Days(recentRes.data));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
  }, [loadAll]);

  const todayStart = startOfToday();
  const metrics = {
    totalConversations: conversations.length,
    activeConversations: conversations.filter((c) => c.status === "active").length,
    totalMessages,
    conversationsToday: conversations.filter((c) => new Date(c.started_at) >= todayStart).length,
  };

  const handleSelect = (c: Conversation) => {
    setSelected(c);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard de atendimento</h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real das conversas do agente WhatsApp
          </p>
        </div>
        <MetricsCards {...metrics} />
        <ConversationsChart data={chartData} />
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
            Carregando conversas...
          </div>
        ) : (
          <ConversationsTable
            conversations={conversations}
            onSelect={handleSelect}
            selectedId={selected?.id}
          />
        )}
      </main>
      <ConversationDetail conversation={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
