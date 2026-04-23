-- Restrict who can subscribe to per-user notification topics on Supabase Realtime.
-- Topic convention: "notifications:<auth.uid()>"
-- Only the matching authenticated user may join their own topic.

-- Make sure RLS is on for realtime.messages (Supabase manages this table).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior version of the policy so this migration is idempotent.
DROP POLICY IF EXISTS "Users can subscribe to own notification topic"
  ON realtime.messages;

-- Allow a user to read realtime broadcast/presence messages on a topic
-- ONLY when the topic equals "notifications:<their own uid>".
CREATE POLICY "Users can subscribe to own notification topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'notifications:' || (auth.uid())::text
  );
