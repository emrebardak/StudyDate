-- Migration 9 — Realtime publication (Phase 4)
--
-- Publish matches and messages so the frontend can subscribe over Realtime:
--   * matches  -> Lock System: both users' Discovery screens lock/unlock live the
--     instant a match forms or ends (docs/integration.md's Lock System pattern).
--   * messages -> ChatScreen gets live message delivery instead of poll-on-open.
--
-- Realtime does NOT bypass RLS: a subscribed client only receives change events for
-- rows its existing SELECT policies would let it read via a normal query. Both
-- tables' policies (Migration 6) are already correctly scoped for this:
--   * matches_select_participant  : auth.uid() IN (user1_id, user2_id)
--   * messages_select_participant : EXISTS (... matches row where caller is a participant)
-- No RLS changes needed here — this migration only adds the publication entries.

ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
