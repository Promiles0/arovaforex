import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useArovaAssistant } from "@/hooks/useArovaAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Bot, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { cn } from "@/lib/utils";

const POSITION_KEY = "arova-assistant-position";
const DRAGGED_KEY = "arova-assistant-dragged";

function getSuggestions(pathname: string): string[] {
  if (pathname.includes("/dashboard")) {
    return [
      "📊 What do the currency strength indicators mean?",
      "📈 How do I read the top movers section?",
      "🎯 Explain today's P&L vs last week",
      "💹 What does the win rate show?",
      "🔄 How often does data refresh?",
    ];
  }
  if (pathname.includes("/journal")) {
    return [
      "✍️ How do I create a journal entry?",
      "🔗 How to connect broker account?",
      "📝 What should I write in notes?",
      "⚡ How does auto-sync work?",
      "🔍 How to filter trade history?",
    ];
  }
  if (pathname.includes("/backtesting")) {
    return [
      "📊 How to use drawing tools?",
      "⏯️ Explain replay controls",
      "🎯 How to place practice trades?",
      "📏 What indicators can I add?",
      "💾 Can I save my analysis?",
    ];
  }
  if (pathname.includes("/forecasts")) {
    return [
      "🔮 How accurate are forecasts?",
      "📊 What timeframes available?",
      "💡 How to use forecasts?",
      "📈 Can I customize settings?",
      "⏰ When are forecasts updated?",
    ];
  }
  if (pathname.includes("/signals")) {
    return [
      "📡 How to receive signals?",
      "🎯 What's the win rate?",
      "⏰ When are signals sent?",
      "💰 How to manage trades?",
      "📊 Can I backtest signals?",
    ];
  }
  if (pathname.includes("/calculator")) {
    return [
      "🧮 Calculate position size?",
      "💰 What's risk/reward calculator?",
      "📊 How to use pip calculator?",
      "💱 Change currency settings?",
      "📈 What's lot size?",
    ];
  }
  if (pathname.includes("/calendar")) {
    return [
      "📅 How to export calendar?",
      "💹 What do colors mean?",
      "📊 Filter by profit/loss?",
      "🗓️ How do weekly summaries work?",
      "📈 Show monthly trends?",
    ];
  }
  return [
    "💡 How to start using journal?",
    "📊 Explain market overview",
    "🎯 Manual vs auto journal?",
    "📈 Connect MetaTrader?",
    "🔍 Analyze performance?",
  ];
}

const ArovaAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const {
    messages,
    isTyping,
    sendMessage,
    canSaveHistory,
    isLoading,
  } = useArovaAssistant();

  // Drag state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const totalDragRef = useRef(0);

  // Suggestion state
  const [isHovering, setIsHovering] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasDragged = useRef(!!localStorage.getItem(DRAGGED_KEY));

  const suggestions = getSuggestions(location.pathname);

  // Initialize position
  useEffect(() => {
    const saved = localStorage.getItem(POSITION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition({
          x: Math.min(parsed.x, window.innerWidth - 70),
          y: Math.min(parsed.y, window.innerHeight - 70),
        });
      } catch {
        setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
      }
    } else {
      setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    }
  }, []);

  // Recalculate on resize
  useEffect(() => {
    const onResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        return {
          x: Math.min(prev.x, window.innerWidth - 70),
          y: Math.min(prev.y, window.innerHeight - 70),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-rotate suggestions
  useEffect(() => {
    if (!isHovering || isOpen) return;
    const interval = setInterval(() => {
      setSuggestionIdx(prev => (prev + 1) % suggestions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovering, isOpen, suggestions.length]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    totalDragRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    totalDragRef.current += Math.abs(dx) + Math.abs(dy);
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    setPosition(prev => {
      if (!prev) return prev;
      const pad = 10;
      const sz = 56;
      return {
        x: Math.max(pad, Math.min(prev.x + dx, window.innerWidth - sz - pad)),
        y: Math.max(pad, Math.min(prev.y + dy, window.innerHeight - sz - pad)),
      };
    });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    setPosition(prev => {
      if (prev) localStorage.setItem(POSITION_KEY, JSON.stringify(prev));
      return prev;
    });

    if (totalDragRef.current >= 5) {
      localStorage.setItem(DRAGGED_KEY, "true");
      hasDragged.current = true;
    } else {
      setIsOpen(prev => !prev);
    }
  }, []);

  const handleSuggestionClick = useCallback((text: string) => {
    setIsHovering(false);
    setIsOpen(true);
    sendMessage(text);
  }, [sendMessage]);

  if (!user || !position) return null;

  // Calculate chat window position
  const isMobile = window.innerWidth < 768;
  const chatStyle: React.CSSProperties = isMobile
    ? { position: "fixed", left: "0.5rem", right: "0.5rem", bottom: "5rem", zIndex: 50 }
    : {
        position: "fixed",
        zIndex: 50,
        width: "400px",
        ...(position.x > window.innerWidth / 2
          ? { right: `${window.innerWidth - position.x + 8}px` }
          : { left: `${position.x}px` }),
        ...(position.y > window.innerHeight / 2
          ? { bottom: `${window.innerHeight - position.y + 8}px` }
          : { top: `${position.y + 64}px` }),
      };

  return (
    <>
      {/* Draggable button wrapper */}
      <div
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 50,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => {
          clearTimeout(hoverTimeoutRef.current);
          setIsHovering(true);
        }}
        onMouseLeave={() => {
          hoverTimeoutRef.current = setTimeout(() => setIsHovering(false), 2000);
        }}
        className="touch-none select-none"
      >
        {/* Drag hint */}
        {!hasDragged.current && !isOpen && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card border border-border px-3 py-1 rounded-lg text-xs text-foreground whitespace-nowrap animate-bounce pointer-events-none">
            👆 Drag me!
          </div>
        )}

        {/* Suggestion bubble */}
        {isHovering && !isOpen && !isDragging && (
          <div
            className="absolute bottom-full right-0 mb-3 pointer-events-auto animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              handleSuggestionClick(suggestions[suggestionIdx]);
            }}
          >
            <div className="bg-card/95 backdrop-blur-lg border border-primary/30 rounded-xl px-4 py-3 shadow-lg shadow-primary/10 cursor-pointer hover:bg-accent/50 transition-all max-w-[260px] md:max-w-xs">
              <p className="text-foreground text-xs md:text-sm leading-relaxed">
                {suggestions[suggestionIdx]}
              </p>
            </div>
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-card/95 ml-auto mr-4" />
          </div>
        )}

        {/* Main button */}
        <Button
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-transform duration-200",
            isDragging ? "scale-110 opacity-80" : "hover:scale-110",
            "flex items-center justify-center"
          )}
          size="icon"
        >
          {isOpen ? (
            <X className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          )}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card style={chatStyle} className={cn(
          "flex flex-col shadow-2xl border-border",
          isMobile ? "h-[70vh]" : "h-[500px]",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}>
          <CardHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                    Arova Assistant
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isTyping ? "Typing..." : "Always here to help"}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-4 py-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-muted-foreground">Loading chat...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      sender={msg.sender}
                      message={msg.message}
                      timestamp={msg.timestamp}
                    />
                  ))}
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>

          <div className="p-3 border-t border-border">
            <ChatInput onSend={sendMessage} disabled={isTyping || isLoading} />
            {!canSaveHistory && (
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                💡 Upgrade to Professional to save chat history
              </p>
            )}
          </div>
        </Card>
      )}
    </>
  );
};

export default ArovaAssistant;
