import { useEffect, useRef } from "react";
import { Sparkles, Brain, Target, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SEO } from "@/components/seo/SEO";
import { useCoach } from "@/hooks/useCoach";
import { CoachThreadList } from "@/components/coach/CoachThreadList";
import { CoachMessage } from "@/components/coach/CoachMessage";
import { CoachComposer } from "@/components/coach/CoachComposer";
import { useAuth } from "@/hooks/useAuth";

const SUGGESTIONS = [
  { icon: Brain, label: "Review my last week of trades" },
  { icon: Target, label: "Help me build a pre-trade checklist" },
  { icon: MessageSquare, label: "Why do I keep losing on Fridays?" },
  { icon: Sparkles, label: "Critique my risk management" },
];

const Coach = () => {
  const { user } = useAuth();
  const {
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
  } = useCoach();

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleNew = () => {
    setActiveThreadId(null);
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  const showEmpty = !activeThreadId && messages.length === 0;

  return (
    <>
      <SEO
        title="AI Trading Coach | Arova"
        description="Your personal AI trading mentor. Get tailored coaching based on your journal, ask questions, and build better habits."
      />
      <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
        {/* Threads sidebar */}
        <Card className="hidden md:flex w-72 flex-col flex-shrink-0 overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Arova Coach</h2>
                <p className="text-[10px] text-muted-foreground">Your AI mentor</p>
              </div>
            </div>
          </div>
          <CoachThreadList
            threads={threads}
            activeId={activeThreadId}
            loading={loadingThreads}
            onSelect={setActiveThreadId}
            onNew={handleNew}
            onRename={renameThread}
            onDelete={deleteThread}
          />
        </Card>

        {/* Conversation panel */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold flex-1 truncate">
              {threads.find((t) => t.id === activeThreadId)?.title || "Arova Coach"}
            </h2>
            <Button size="sm" variant="outline" onClick={handleNew}>
              New
            </Button>
          </div>

          <ScrollArea className="flex-1" ref={scrollRef as never}>
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              {showEmpty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">
                    Hi {user?.user_metadata?.full_name?.split(" ")[0] || "trader"} 👋
                  </h1>
                  <p className="text-muted-foreground max-w-md mb-8">
                    I'm your personal trading coach. I read your journal, spot patterns, and help you sharpen your edge.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleSuggestion(s.label)}
                        className="text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group"
                      >
                        <s.icon className="w-4 h-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm">{s.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : loadingMessages ? (
                <div className="text-sm text-muted-foreground py-12 text-center">Loading conversation…</div>
              ) : (
                messages.map((m) => <CoachMessage key={m.id} message={m} />)
              )}
            </div>
          </ScrollArea>

          <CoachComposer
            onSend={sendMessage}
            isStreaming={isStreaming}
            onStop={stopStreaming}
            disabled={!user}
          />
        </Card>
      </div>
    </>
  );
};

export default Coach;
