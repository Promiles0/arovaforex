import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SESSION_KEY = "visitor_session_id";
const OPT_OUT_KEY = "tracking_opt_out";

const getOrCreateSessionId = (): string => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
};

export const useVisitorTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;

    if (path.startsWith("/admin")) return;

    try {
      if (localStorage.getItem(OPT_OUT_KEY) === "true") return;
    } catch {
      // ignore
    }

    const sessionId = getOrCreateSessionId();
    const body = {
      sessionId,
      userId: user?.id ?? null,
      path,
      fullUrl: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
    };

    // Fire-and-forget
    supabase.functions.invoke("track-visit", { body }).catch(() => {
      // Silently ignore tracking failures
    });
  }, [location.pathname, user?.id]);
};
