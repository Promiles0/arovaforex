import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CoachThread {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

export interface CoachMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-chat`;

export function useCoach() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<CoachThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load threads
  const loadThreads = useCallback(async () => {
    if (!user) return;
    setLoadingThreads(true);
    const { data, error } = await supabase
      .from("coach_threads")
      .select("id, title, last_message_at, created_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Failed to load conversations");
    } else {
      setThreads((data as CoachThread[]) || []);
    }
    setLoadingThreads(false);
  }, [user]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Load messages for active thread
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("coach_messages")
        .select("id, thread_id, role, content, created_at")
        .eq("thread_id", activeThreadId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load messages");
      } else {
        setMessages((data as CoachMessage[]) || []);
      }
      setLoadingMessages(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeThreadId]);

  const createThread = useCallback(
    async (title = "New conversation") => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("coach_threads")
        .insert({ user_id: user.id, title })
        .select("id, title, last_message_at, created_at")
        .single();
      if (error || !data) {
        toast.error("Couldn't create conversation");
        return null;
      }
      const thread = data as CoachThread;
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
      setMessages([]);
      return thread;
    },
    [user]
  );

  const renameThread = useCallback(async (threadId: string, title: string) => {
    const { error } = await supabase
      .from("coach_threads")
      .update({ title })
      .eq("id", threadId);
    if (error) {
      toast.error("Rename failed");
      return;
    }
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, title } : t)));
  }, []);

  const deleteThread = useCallback(
    async (threadId: string) => {
      const { error } = await supabase.from("coach_threads").delete().eq("id", threadId);
      if (error) {
        toast.error("Delete failed");
        return;
      }
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    },
    [activeThreadId]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !text.trim() || isStreaming) return;

      let threadId = activeThreadId;
      let isNewThread = false;
      if (!threadId) {
        const seedTitle = text.trim().slice(0, 50);
        const t = await createThread(seedTitle);
        if (!t) return;
        threadId = t.id;
        isNewThread = true;
      }

      // Optimistic user message
      const userMsg: CoachMessage = {
        id: crypto.randomUUID(),
        thread_id: threadId,
        role: "user",
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Persist user message
      const { error: insertErr } = await supabase.from("coach_messages").insert({
        thread_id: threadId,
        user_id: user.id,
        role: "user",
        content: text.trim(),
      });
      if (insertErr) {
        toast.error("Failed to send message");
        return;
      }

      // Auto-rename brand new "New conversation" threads from first prompt
      if (isNewThread) {
        const autoTitle = text.trim().slice(0, 50);
        renameThread(threadId, autoTitle);
      }

      setIsStreaming(true);

      // Build history (last 20)
      const history = [...messages, userMsg]
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistantId = crypto.randomUUID();
      let soFar = "";
      const upsertAssistant = (chunk: string) => {
        soFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m) => (m.id === assistantId ? { ...m, content: soFar } : m));
          }
          return [
            ...prev,
            {
              id: assistantId,
              thread_id: threadId!,
              role: "assistant",
              content: soFar,
              created_at: new Date().toISOString(),
            },
          ];
        });
      };

      try {
        const controller = new AbortController();
        abortRef.current = controller;
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;

        const resp = await fetch(COACH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Request failed" }));
          if (resp.status === 429) toast.error("Slow down — too many requests in a row.");
          else if (resp.status === 402) toast.error("AI usage limit reached. Add credits to continue.");
          else toast.error(err.error || `Coach error ${resp.status}`);
          throw new Error(err.error || `Error ${resp.status}`);
        }
        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let done = false;
        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }

        // Persist assistant message
        if (soFar) {
          await supabase.from("coach_messages").insert({
            thread_id: threadId,
            user_id: user.id,
            role: "assistant",
            content: soFar,
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("coach send error", err);
        if (!soFar) {
          upsertAssistant("Sorry — I couldn't respond just now. Try again in a moment.");
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        // Refresh thread order (last_message_at bumped via trigger)
        loadThreads();
      }
    },
    [user, activeThreadId, isStreaming, messages, createThread, renameThread, loadThreads]
  );

  return {
    threads,
    activeThreadId,
    setActiveThreadId,
    messages,
    loadingThreads,
    loadingMessages,
    isStreaming,
    createThread,
    renameThread,
    deleteThread,
    sendMessage,
    stopStreaming,
  };
}
