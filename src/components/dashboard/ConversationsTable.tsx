import { useMemo, useState } from "react";
import { AlertTriangle, Search, Phone as PhoneIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration, type EnrichedConversation, type Sentiment } from "@/lib/conversation-analysis";

const STATUSES = ["all", "active", "waiting", "closed"] as const;
type StatusFilter = (typeof STATUSES)[number];

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  waiting: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const statusLabel: Record<string, string> = {
  active: "Ativa",
  waiting: "Aguardando",
  closed: "Encerrada",
};

const sentimentStyles: Record<Sentiment, { className: string; label: string }> = {
  positive: { className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20", label: "Positivo" },
  negative: { className: "bg-red-500/15 text-red-500 border-red-500/20", label: "Negativo" },
  neutral: { className: "bg-muted text-muted-foreground border-border", label: "Neutro" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m atrás`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

interface Props {
  conversations: EnrichedConversation[];
  onSelect: (c: EnrichedConversation) => void;
  selectedId?: string;
  loading?: boolean;
}

export function ConversationsTable({ conversations, onSelect, selectedId, loading }: Props) {
  const [nameQuery, setNameQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const hasFilters =
    nameQuery !== "" || phoneQuery !== "" || status !== "all" || startDate !== "" || endDate !== "";

  const clearAll = () => {
    setNameQuery("");
    setPhoneQuery("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const filtered = useMemo(() => {
    const n = nameQuery.trim().toLowerCase();
    const p = phoneQuery.trim().toLowerCase();
    const start = startDate ? new Date(startDate + "T00:00:00").getTime() : null;
    const end = endDate ? new Date(endDate + "T23:59:59").getTime() : null;

    const list = conversations.filter((c) => {
      if (n && !c.contact_name.toLowerCase().includes(n)) return false;
      if (p && !c.phone_number.toLowerCase().includes(p)) return false;
      if (status !== "all" && c.status !== status) return false;
      const t = new Date(c.started_at).getTime();
      if (start !== null && t < start) return false;
      if (end !== null && t > end) return false;
      return true;
    });
    // Attention first, then last_message_at desc
    return list.sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
  }, [conversations, nameQuery, phoneQuery, status, startDate, endDate]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 p-5 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">Conversas</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} conversa(s)</p>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="size-4 mr-1" /> Limpar filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por telefone..."
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Data início"
            aria-label="Data início"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Data fim"
            aria-label="Data fim"
          />
        </div>
        <div className="flex flex-wrap rounded-md border border-border bg-background p-1 w-fit">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Todas" : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="px-5">Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sentimento</TableHead>
              <TableHead className="text-right">Mensagens</TableHead>
              <TableHead className="text-right">Tempo resp.</TableHead>
              <TableHead className="text-right pr-5">Última msg</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skel-${i}`} style={{ animationDelay: `${i * 50}ms` }}>
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell className="text-right pr-5"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhuma conversa encontrada
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.map((c) => {
              const s = sentimentStyles[c.sentiment];
              return (
                <TableRow
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`cursor-pointer ${selectedId === c.id ? "bg-primary/5" : ""}`}
                >
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {c.needsAttention && (
                        <span title="Requer atenção" className="flex size-6 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                          <AlertTriangle className="size-3.5" />
                        </span>
                      )}
                      <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
                        {c.contact_name.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{c.contact_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{c.phone_number}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        statusStyles[c.status] ?? statusStyles.closed
                      }`}
                    >
                      {statusLabel[c.status] ?? c.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
                      {s.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.message_count}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatDuration(c.avgResponseMs)}
                  </TableCell>
                  <TableCell className="text-right pr-5 text-muted-foreground">
                    {formatTime(c.last_message_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
