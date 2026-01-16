import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useArovaAssistant } from "@/hooks/useArovaAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Bot, Sparkles } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { cn } from "@/lib/utils";

const ArovaAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isTyping,
    sendMessage,
    canSaveHistory,
    isLoading,
  } = useArovaAssistant();

  // Don't render if user not logged in
  if (!user) return null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all duration-300 hover:scale-110",
            "flex items-center justify-center"
          )}
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 w-[360px] sm:w-[400px] h-[500px] z-50",
          "flex flex-col shadow-2xl border-border",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-5 duration-200"
        )}>
          {/* Header */}
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

          {/* Messages Area */}
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

          {/* Input Area */}
          <div className="p-3 border-t border-border">
            <ChatInput
              onSend={sendMessage}
              disabled={isTyping || isLoading}
            />
            
            {/* Subscription Notice for Free Users */}
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
