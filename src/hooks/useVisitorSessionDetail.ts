import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VisitorEvent = {
  id: string;
  created_at: string;
  session_id: string;
  user_id: string | null;
  path: string;
  full_url: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  event_type: string;
  element_tag: string | null;
  element_text: string | null;
  element_href: string | null;
  duration_ms: number | null;
};

export type ProfileLite = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
} | null;

export const useVisitorSessionDetail = (sessionId: string | null) => {
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [profile, setProfile] = useState<ProfileLite>(null);
  const [otherSessionsCount, setOtherSessionsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("visitor_events")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(2000);
      if (cancelled) return;
      const evts = (data ?? []) as VisitorEvent[];
      setEvents(evts);

      const uid = evts.find(e => e.user_id)?.user_id ?? null;
      if (uid) {
        const [{ data: prof }, { count }] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name, email, avatar_url").eq("user_id", uid).maybeSingle(),
          supabase.from("visitor_events").select("session_id", { count: "exact", head: true }).eq("user_id", uid),
        ]);
        if (!cancelled) {
          setProfile(prof as ProfileLite);
          setOtherSessionsCount(count ?? 0);
        }
      } else {
        setProfile(null);
        setOtherSessionsCount(0);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  return { events, profile, otherSessionsCount, loading };
};
