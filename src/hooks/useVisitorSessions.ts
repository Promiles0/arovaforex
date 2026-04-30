import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SessionSummary = {
  session_id: string;
  user_id: string | null;
  first_seen: string;
  last_seen: string;
  pageviews: number;
  clicks: number;
  total_duration_ms: number;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  referrer: string | null;
  last_path: string | null;
};

export type Range = "today" | "7d" | "30d";

const startFor = (r: Range): Date => {
  const d = new Date();
  if (r === "today") d.setHours(0, 0, 0, 0);
  else if (r === "7d") d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d;
};

export const useVisitorSessions = (range: Range) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const since = startFor(range).toISOString();
    const { data, error } = await supabase
      .from("visitor_sessions_summary" as never)
      .select("*")
      .gte("last_seen", since)
      .order("last_seen", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      setSessions([]);
      setLoading(false);
      return;
    }

    const list = (data ?? []) as SessionSummary[];
    setSessions(list);

    const userIds = Array.from(new Set(list.map(s => s.user_id).filter(Boolean))) as string[];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", userIds);
      const map: typeof profiles = {};
      (profs ?? []).forEach((p: { user_id: string; full_name: string | null; email: string | null; avatar_url: string | null }) => {
        map[p.user_id] = { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url };
      });
      setProfiles(map);
    } else {
      setProfiles({});
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return { sessions, profiles, loading, reload: load };
};
