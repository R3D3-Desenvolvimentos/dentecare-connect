CREATE POLICY "anon_all_conversations" ON public.conversations
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_messages" ON public.messages
  FOR ALL TO anon USING (true) WITH CHECK (true);