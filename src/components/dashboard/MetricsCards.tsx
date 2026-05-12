import { MessageSquare, Users, Activity, CalendarClock, AlertTriangle, Timer } from "lucide-react";

interface Props {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  conversationsToday: number;
  needsAttentionCount: number;
  avgResponseLabel: string;
}

export function MetricsCards(p: Props) {
  const items = [
    { label: "Total de conversas", value: p.totalConversations, icon: Users, tint: "bg-primary/15 text-primary" },
    { label: "Conversas ativas", value: p.activeConversations, icon: Activity, tint: "bg-emerald-500/15 text-emerald-500" },
    { label: "Total de mensagens", value: p.totalMessages, icon: MessageSquare, tint: "bg-blue-500/15 text-blue-500" },
    { label: "Conversas hoje", value: p.conversationsToday, icon: CalendarClock, tint: "bg-amber-500/15 text-amber-500" },
    { label: "Requer atenção", value: p.needsAttentionCount, icon: AlertTriangle, tint: "bg-red-500/15 text-red-500", highlight: true },
    { label: "Tempo médio de resposta", value: p.avgResponseLabel, icon: Timer, tint: "bg-violet-500/15 text-violet-500" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {items.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className={`rounded-2xl border p-5 shadow-sm ${
              m.highlight && typeof m.value === "number" && m.value > 0
                ? "border-red-500/40 bg-red-500/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight ${
                    m.highlight && typeof m.value === "number" && m.value > 0 ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {m.value}
                </p>
              </div>
              <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${m.tint}`}>
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
