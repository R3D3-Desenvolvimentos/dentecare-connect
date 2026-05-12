import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/Header";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ConversationsChart } from "@/components/dashboard/ConversationsChart";
import { IntentsChart } from "@/components/dashboard/IntentsChart";
import { ConversationsTable } from "@/components/dashboard/ConversationsTable";
import { ConversationDetail } from "@/components/dashboard/ConversationDetail";
import {
  enrichConversations,
  formatDuration,
  type ConversationRow,
  type EnrichedConversation,
  type Intent,
  type Message,
} from "@/lib/conversation-analysis";

export const Route = createFileRoute("/")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <Dashboard />;
}

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
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>([]);
  const [selected, setSelected] = useState<EnrichedConversation | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [convRes, msgRes, recentRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false }),
      supabase.from("messages").select("*"),
      supabase
        .from("conversations")
        .select("started_at")
        .gte("started_at", sevenDaysAgo.toISOString()),
    ]);

    const rows: ConversationRow[] = convRes.data ?? [];
    const messages: Message[] = msgRes.data ?? [];
    const byConv = new Map<string, Message[]>();
    for (const m of messages) {
      const arr = byConv.get(m.conversation_id) ?? [];
      arr.push(m);
      byConv.set(m.conversation_id, arr);
    }
    setConversations(enrichConversations(rows, byConv));
    setTotalMessages(messages.length);
    if (recentRes.data) setChartData(buildLast7Days(recentRes.data));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
  }, [loadAll]);

  const todayStart = startOfToday();

  const intentCounts = useMemo<Record<Intent, number>>(() => {
    const acc: Record<Intent, number> = { agendamento: 0, orcamento: 0, emergencia: 0, duvida: 0 };
    for (const c of conversations) acc[c.intent] += 1;
    return acc;
  }, [conversations]);

  const avgResponseLabel = useMemo(() => {
    const values = conversations.map((c) => c.avgResponseMs).filter((v): v is number => v !== null);
    if (values.length === 0) return "—";
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return formatDuration(avg);
  }, [conversations]);

  const needsAttentionCount = conversations.filter((c) => c.needsAttention).length;

  const metrics = {
    totalConversations: conversations.length,
    activeConversations: conversations.filter((c) => c.status === "active").length,
    totalMessages,
    conversationsToday: conversations.filter((c) => new Date(c.started_at) >= todayStart).length,
    needsAttentionCount,
    avgResponseLabel,
  };

  const handleSelect = (c: EnrichedConversation) => {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversationsChart data={chartData} />
          <IntentsChart data={intentCounts} />
        </div>
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
