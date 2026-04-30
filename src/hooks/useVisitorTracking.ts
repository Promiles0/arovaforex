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

const isOptedOut = (): boolean => {
  try { return localStorage.getItem(OPT_OUT_KEY) === "true"; } catch { return false; }
};

const send = (body: Record<string, unknown>, useBeacon = false) => {
  if (useBeacon && navigator.sendBeacon) {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visit`;
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    } catch { /* fall through */ }
  }
  supabase.functions.invoke("track-visit", { body }).catch(() => {});
};

export const useVisitorTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastPathRef = useRef<string | null>(null);
  const pageStartRef = useRef<number>(Date.now());
  const userIdRef = useRef<string | null>(null);

  useEffect(() => { userIdRef.current = user?.id ?? null; }, [user?.id]);

  // Pageview + pageleave for previous page
  useEffect(() => {
    const path = location.pathname;
    if (lastPathRef.current === path) return;

    if (path.startsWith("/admin")) {
      lastPathRef.current = path;
      return;
    }

    if (isOptedOut()) return;

    const sessionId = getOrCreateSessionId();

    // Emit pageleave for previous path
    if (lastPathRef.current && !lastPathRef.current.startsWith("/admin")) {
      const duration = Date.now() - pageStartRef.current;
      send({
        sessionId,
        userId: userIdRef.current,
        path: lastPathRef.current,
        eventType: "pageleave",
        durationMs: duration,
        userAgent: navigator.userAgent,
      });
    }

    lastPathRef.current = path;
    pageStartRef.current = Date.now();

    send({
      sessionId,
      userId: userIdRef.current,
      path,
      fullUrl: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      eventType: "pageview",
    });
  }, [location.pathname]);

  // Click tracking + unload pageleave
  useEffect(() => {
    if (isOptedOut()) return;

    const onClick = (e: MouseEvent) => {
      const path = lastPathRef.current;
      if (!path || path.startsWith("/admin")) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find nearest meaningful element
      const el = (target.closest("button, a, [role=button], [data-track]") as HTMLElement) || target;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el.closest("[data-no-track], [data-sensitive]")) return;

      const text = (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 80);
      const href = el.getAttribute("href");

      send({
        sessionId: getOrCreateSessionId(),
        userId: userIdRef.current,
        path,
        eventType: "click",
        elementTag: tag,
        elementText: text || null,
        elementHref: href,
        userAgent: navigator.userAgent,
      });
    };

    const onHide = () => {
      const path = lastPathRef.current;
      if (!path || path.startsWith("/admin")) return;
      const duration = Date.now() - pageStartRef.current;
      send({
        sessionId: getOrCreateSessionId(),
        userId: userIdRef.current,
        path,
        eventType: "pageleave",
        durationMs: duration,
        userAgent: navigator.userAgent,
      }, true);
      pageStartRef.current = Date.now();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);
};
