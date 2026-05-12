import type { Tables } from "@/integrations/supabase/types";

export type Message = Tables<"messages">;
export type ConversationRow = Tables<"conversations">;

export type Sentiment = "positive" | "negative" | "neutral";
export type Intent = "agendamento" | "orcamento" | "emergencia" | "duvida";

export interface EnrichedConversation extends ConversationRow {
  sentiment: Sentiment;
  needsAttention: boolean;
  intent: Intent;
  avgResponseMs: number | null;
}

const POSITIVE = ["obrigado", "obrigada", "ótimo", "otimo", "perfeito", "excelente", "adorei"];
const NEGATIVE = ["ruim", "péssimo", "pessimo", "horrível", "horrivel", "decepcionado", "problema"];
const ATTENTION = ["urgente", "dor", "emergência", "emergencia", "sangramento", "humano", "atendente", "pessoa real"];

const INTENT_KEYWORDS: Record<Exclude<Intent, "duvida">, string[]> = {
  agendamento: ["agendar", "marcar", "consulta", "horário", "horario", "disponível", "disponivel"],
  orcamento: ["preço", "preco", "valor", "quanto", "custo", "orçamento", "orcamento"],
  emergencia: ["dor", "urgente", "sangramento", "quebrou", "caiu"],
};

function normalize(s: string): string {
  return s.toLowerCase();
}

function containsAny(text: string, words: string[]): boolean {
  const t = normalize(text);
  return words.some((w) => t.includes(w));
}

export function classifySentiment(inboundLast3: Message[]): Sentiment {
  const text = inboundLast3.map((m) => m.content).join(" ");
  if (!text) return "neutral";
  if (containsAny(text, POSITIVE)) return "positive";
  if (containsAny(text, NEGATIVE)) return "negative";
  return "neutral";
}

export function detectAttention(inbound: Message[]): boolean {
  return inbound.some((m) => containsAny(m.content, ATTENTION));
}

export function classifyIntent(inbound: Message[]): Intent {
  const counts: Record<Exclude<Intent, "duvida">, number> = { agendamento: 0, orcamento: 0, emergencia: 0 };
  for (const m of inbound) {
    for (const key of Object.keys(INTENT_KEYWORDS) as Array<Exclude<Intent, "duvida">>) {
      if (containsAny(m.content, INTENT_KEYWORDS[key])) counts[key] += 1;
    }
  }
  let best: Exclude<Intent, "duvida"> | null = null;
  let max = 0;
  (Object.keys(counts) as Array<Exclude<Intent, "duvida">>).forEach((k) => {
    if (counts[k] > max) {
      max = counts[k];
      best = k;
    }
  });
  return best ?? "duvida";
}

export function avgResponseTimeMs(messages: Message[]): number | null {
  // Messages must be sorted asc by sent_at.
  const diffs: number[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const cur = messages[i];
    const next = messages[i + 1];
    if (cur.direction === "inbound" && next.direction === "outbound") {
      diffs.push(new Date(next.sent_at).getTime() - new Date(cur.sent_at).getTime());
    }
  }
  if (diffs.length === 0) return null;
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const min = Math.round(ms / 60000);
  if (min < 1) return "<1 min";
  if (min < 60) return `~${min} min`;
  const h = Math.round(min / 60);
  return `~${h}h`;
}

export function enrichConversations(
  conversations: ConversationRow[],
  messagesByConv: Map<string, Message[]>,
): EnrichedConversation[] {
  return conversations.map((c) => {
    const msgs = (messagesByConv.get(c.id) ?? []).slice().sort(
      (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
    );
    const inbound = msgs.filter((m) => m.direction === "inbound");
    const lastInbound3 = inbound.slice(-3);
    return {
      ...c,
      sentiment: classifySentiment(lastInbound3),
      needsAttention: detectAttention(inbound),
      intent: classifyIntent(inbound),
      avgResponseMs: avgResponseTimeMs(msgs),
    };
  });
}
