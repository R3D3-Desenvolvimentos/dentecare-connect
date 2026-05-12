import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface Conversation {
  id: string;
  contact_name: string;
  phone_number: string;
  status: string;
  message_count: number;
  last_message_at: string;
  started_at: string;
}

const STATUSES = ["all", "active", "waiting", "closed"] as const;

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
  conversations: Conversation[];
  onSelect: (c: Conversation) => void;
  selectedId?: string;
}

export function ConversationsTable({ conversations, onSelect, selectedId }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      const matchesQ = !q || c.contact_name.toLowerCase().includes(q) || c.phone_number.toLowerCase().includes(q);
      const matchesS = status === "all" || c.status === status;
      return matchesQ && matchesS;
    });
  }, [conversations, query, status]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Conversas</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} conversa(s)</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nome ou telefone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 sm:w-64"
            />
          </div>
          <div className="flex rounded-md border border-border bg-background p-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors capitalize ${
                  status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "Todas" : statusLabel[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="px-5">Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Mensagens</TableHead>
              <TableHead className="text-right pr-5">Última mensagem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhuma conversa encontrada
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => onSelect(c)}
                className={`cursor-pointer ${selectedId === c.id ? "bg-primary/5" : ""}`}
              >
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
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
                <TableCell className="text-right tabular-nums">{c.message_count}</TableCell>
                <TableCell className="text-right pr-5 text-muted-foreground">
                  {formatTime(c.last_message_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
