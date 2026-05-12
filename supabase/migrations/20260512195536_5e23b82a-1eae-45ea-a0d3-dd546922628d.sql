
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','waiting','closed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, sent_at);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view conversations" ON public.conversations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (true);
