import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { EnrichedConversation } from "@/lib/conversation-analysis";

interface Msg {
  id: string;
  content: string;
  direction: string;
  sent_at: string;
}

interface Props {
  conversation: EnrichedConversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationDetail({ conversation, open, onOpenChange }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversation || !open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, content, direction, sent_at")
        .eq("conversation_id", conversation.id)
        .order("sent_at", { ascending: true });
      if (!cancelled) {
        setMessages(data ?? []);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Msg]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversation, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md w-full">
        {conversation && (
          <>
            <SheetHeader className="border-b border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-primary/15 text-primary flex items-center justify-center text-base font-semibold">
                  {conversation.contact_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left">
                  <SheetTitle className="text-base">{conversation.contact_name}</SheetTitle>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3" />
                    {conversation.phone_number}
                  </p>
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto bg-muted/30 p-4 space-y-2">
              {loading && <p className="text-center text-sm text-muted-foreground">Carregando...</p>}
              {!loading && messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Sem mensagens.</p>
              )}
              {messages.map((m) => {
                const outbound = m.direction === "outbound";
                return (
                  <div key={m.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        outbound
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card text-foreground border border-border rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          outbound ? "text-primary-foreground/70" : "text-muted-foreground"
                        } text-right`}
                      >
                        {new Date(m.sent_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
