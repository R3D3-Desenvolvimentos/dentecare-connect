import { MessageSquare, Users, Activity, CalendarClock, AlertTriangle, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function AnimatedNumber({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value, duration]);

  return <>{display}</>;
}

interface Props {
  loading?: boolean;
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  conversationsToday: number;
  needsAttentionCount: number;
  avgResponseLabel: string;
}

export function MetricsCards({ loading, ...p }: Props) {
  const items = [
    { label: "Total de conversas", value: p.totalConversations, icon: Users, tint: "bg-primary/15 text-primary" },
    { label: "Conversas ativas", value: p.activeConversations, icon: Activity, tint: "bg-emerald-500/15 text-emerald-500" },
    { label: "Total de mensagens", value: p.totalMessages, icon: MessageSquare, tint: "bg-blue-500/15 text-blue-500" },
    { label: "Conversas hoje", value: p.conversationsToday, icon: CalendarClock, tint: "bg-amber-500/15 text-amber-500" },
    { label: "Requer atenção", value: p.needsAttentionCount, icon: AlertTriangle, tint: "bg-red-500/15 text-red-500", highlight: true },
    { label: "Tempo médio de resposta", value: p.avgResponseLabel, icon: Timer, tint: "bg-violet-500/15 text-violet-500" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {items.map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-14" />
              </div>
              <Skeleton className="size-9 rounded-xl shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {items.map((m, i) => {
        const Icon = m.icon;
        const isHighlighted = m.highlight && typeof m.value === "number" && m.value > 0;
        return (
          <div
            key={m.label}
            className={`rounded-2xl border p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500 ${
              isHighlighted ? "border-red-500/40 bg-red-500/5" : "border-border bg-card"
            }`}
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
                  isHighlighted ? "text-red-500" : "text-foreground"
                }`}>
                  {typeof m.value === "number"
                    ? <AnimatedNumber value={m.value} />
                    : m.value}
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
