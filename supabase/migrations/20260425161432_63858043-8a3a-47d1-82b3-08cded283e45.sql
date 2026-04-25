-- Tighten realtime.messages SELECT policy to remove broadcast/public wildcards
DROP POLICY IF EXISTS "Users can subscribe to own notification channels" ON realtime.messages;

CREATE POLICY "Users can subscribe to own notification channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Only allow channels scoped to the authenticated user's ID
  topic LIKE '%' || (auth.uid())::text || '%'
);