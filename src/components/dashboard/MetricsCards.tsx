import { MessageSquare, Users, Activity, CalendarClock } from "lucide-react";

interface Props {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  conversationsToday: number;
}

const items = (p: Props) => [
  { label: "Total de conversas", value: p.totalConversations, icon: Users, tint: "bg-primary/15 text-primary" },
  { label: "Conversas ativas", value: p.activeConversations, icon: Activity, tint: "bg-[color:var(--success,theme(colors.emerald.500))]/15 text-emerald-500" },
  { label: "Total de mensagens", value: p.totalMessages, icon: MessageSquare, tint: "bg-blue-500/15 text-blue-500" },
  { label: "Conversas hoje", value: p.conversationsToday, icon: CalendarClock, tint: "bg-amber-500/15 text-amber-500" },
];

export function MetricsCards(props: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items(props).map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{m.value}</p>
              </div>
              <div className={`size-10 rounded-xl flex items-center justify-center ${m.tint}`}>
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
