import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { Intent } from "@/lib/conversation-analysis";

interface Props {
  data: Record<Intent, number>;
  loading?: boolean;
}

const META: Record<Intent, { label: string; color: string }> = {
  agendamento: { label: "Agendamento", color: "#3b82f6" },
  orcamento: { label: "Orçamento", color: "#10b981" },
  emergencia: { label: "Emergência", color: "#ef4444" },
  duvida: { label: "Dúvida", color: "#f59e0b" },
};

export function IntentsChart({ data, loading }: Props) {
  const items = (Object.keys(META) as Intent[]).map((k) => ({
    name: META[k].label,
    value: data[k],
    color: META[k].color,
  }));
  const total = items.reduce((a, b) => a + b.value, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Distribuição por intenção</h2>
        <p className="text-sm text-muted-foreground">Classificação automática das conversas</p>
      </div>
      <div className="h-64 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-8">
            <div className="relative shrink-0">
              <Skeleton className="size-36 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="size-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              {[80, 60, 90, 70].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-3 rounded" style={{ width: `${w}px` }} />
                </div>
              ))}
            </div>
          </div>
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div>
        ) : (
          <div className="animate-in fade-in duration-700 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  label={(e: { percent?: number }) =>
                    e.percent !== undefined && e.percent > 0 ? `${Math.round(e.percent * 100)}%` : ""
                  }
                >
                  {items.map((it) => (
                    <Cell key={it.name} fill={it.color} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
