import { useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "assistant";
  message: string;
  timestamp: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  sender: "assistant",
  message:
    "Hey there! 👋 I'm your **Arova Assistant** — powered by AI. Ask me anything about the platform, trading concepts, or how to use any feature!",
  timestamp: new Date().toISOString(),
};

export function useArovaAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const buildHistory = useCallback(
    (msgs: Message[]) =>
      msgs
        .filter((m) => m.id !== "welcome")
        .slice(-20)
        .map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.message,
        })),
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        message: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Save user message to DB (fire and forget)
      if (user) {
        supabase
          .from("assistant_chat_messages")
          .insert({
            user_id: user.id,
            session_id: user.id,
            sender: "user",
            message: text.trim(),
          })
          .then();
      }

      const assistantId = crypto.randomUUID();
      let assistantSoFar = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m) =>
              m.id === assistantId ? { ...m, message: assistantSoFar } : m
            );
          }
          return [
            ...prev,
            {
              id: assistantId,
              sender: "assistant" as const,
              message: assistantSoFar,
              timestamp: new Date().toISOString(),
            },
          ];
        });
      };

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const allMessages = [...messages, userMsg];
        const history = buildHistory(allMessages);

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error || `Error ${resp.status}`);
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Flush remaining
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              /* ignore */
            }
          }
        }

        // Save assistant response
        if (user && assistantSoFar) {
          supabase
            .from("assistant_chat_messages")
            .insert({
              user_id: user.id,
              session_id: user.id,
              sender: "assistant",
              message: assistantSoFar,
            })
            .then();
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Chat error:", err);
        const errorMessage = err instanceof Error ? err.message : "Something went wrong";
        toast.error(errorMessage);

        if (!assistantSoFar) {
          upsertAssistant("Sorry, I couldn't process your request right now. Please try again. 🙏");
        }
      } finally {
        setIsTyping(false);
        abortRef.current = null;
      }
    },
    [messages, isTyping, user, buildHistory]
  );

  return {
    messages,
    isTyping,
    sendMessage,
    canSaveHistory: true,
    isLoading,
  };
}
