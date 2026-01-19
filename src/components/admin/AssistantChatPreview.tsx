import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  Copy,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { findAllMatches, type DetailedMatchResult, type KnowledgeEntry } from "@/lib/aiAssistant";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: Date;
  matchInfo?: DetailedMatchResult | null;
}

interface AssistantChatPreviewProps {
  knowledgeBase: KnowledgeEntry[];
  onEditEntry: (entry: KnowledgeEntry) => void;
}

const MATCH_THRESHOLD = 8;

const WELCOME_MESSAGES = {
  free: "👋 Welcome to Arova! I'm your AI assistant. As a free user, I can help answer your questions. What would you like to know?",
  professional: "👋 Welcome back to Arova! I'm your AI assistant with full access. I remember our previous conversations. How can I help you today?",
};

const FALLBACK_RESPONSE = "I'm not sure I understand that question. Could you rephrase it? You can ask about:\n\n• Platform features (wallet, calculator, live room)\n• Trading education (risk management, position sizing)\n• General support\n\nOr contact support@arovaforex.com for personalized help. 😊";

export function AssistantChatPreview({ knowledgeBase, onEditEntry }: AssistantChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [simulatedTier, setSimulatedTier] = useState<"free" | "professional">("free");
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lastMatchInfo, setLastMatchInfo] = useState<DetailedMatchResult | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message on tier change
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      sender: "assistant",
      content: WELCOME_MESSAGES[simulatedTier],
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setLastMatchInfo(null);
    setResponseTime(null);
  }, [simulatedTier]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    const startTime = performance.now();

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    const activeEntries = knowledgeBase.filter(e => e.active);
    const matches = findAllMatches(userMessage.content, activeEntries);
    const bestMatch = matches[0];
    const isMatched = bestMatch && bestMatch.score >= MATCH_THRESHOLD;

    const endTime = performance.now();
    setResponseTime(endTime - startTime);

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      sender: "assistant",
      content: isMatched ? bestMatch.entry.answer : FALLBACK_RESPONSE,
      timestamp: new Date(),
      matchInfo: isMatched ? bestMatch : null,
    };

    setLastMatchInfo(isMatched ? bestMatch : null);
    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleClearChat = () => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      sender: "assistant",
      content: WELCOME_MESSAGES[simulatedTier],
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setLastMatchInfo(null);
    setResponseTime(null);
  };

  const handleExportChat = () => {
    const chatLog = messages
      .map(m => `[${m.timestamp.toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.content}`)
      .join("\n\n");
    
    navigator.clipboard.writeText(chatLog);
    toast.success("Chat log copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-primary" />
            Live Chat Preview
          </CardTitle>
          <CardDescription>
            Test the assistant as a user would experience it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Simulate as:</Label>
              <Select value={simulatedTier} onValueChange={(v) => setSimulatedTier(v as "free" | "professional")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free User</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                id="debug-panel" 
                checked={showDebugPanel}
                onCheckedChange={setShowDebugPanel}
              />
              <Label htmlFor="debug-panel" className="flex items-center gap-1">
                {showDebugPanel ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Debug Panel
              </Label>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportChat}>
                <Copy className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearChat}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Chat + Debug Panel */}
      <div className={`grid gap-6 ${showDebugPanel ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {/* Chat Window */}
        <Card className="flex flex-col h-[500px]">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Arova Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {simulatedTier === "professional" ? "Chat history enabled" : "Free tier"}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {simulatedTier === "professional" ? "PRO" : "FREE"}
              </Badge>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                disabled={isTyping}
              />
              <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Debug Panel */}
        {showDebugPanel && (
          <Card className="h-[500px] overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Debug Panel
              </CardTitle>
            </CardHeader>

            <ScrollArea className="h-[calc(100%-60px)] p-4">
              {lastMatchInfo ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-emerald-500">MATCHED</span>
                    </div>
                  </div>

                  {/* Timing */}
                  {responseTime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Response Time: {responseTime.toFixed(0)}ms
                    </div>
                  )}

                  {/* Match Details */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Matched Intent:</p>
                    <Badge variant="outline" className="text-sm">
                      {lastMatchInfo.entry.intent}
                    </Badge>
                  </div>

                  {/* Score Breakdown */}
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Score Breakdown:</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Base</p>
                        <p className="font-bold">{lastMatchInfo.baseScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Priority ×</p>
                        <p className="font-bold">{lastMatchInfo.priorityMultiplier.toFixed(2)}</p>
                      </div>
                      <div className="text-center p-2 bg-primary/10 rounded border border-primary/30">
                        <p className="text-xs text-muted-foreground">Final</p>
                        <p className="font-bold text-primary">{lastMatchInfo.score.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Matched Keywords */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Matched Keywords:</p>
                    <div className="flex flex-wrap gap-1">
                      {lastMatchInfo.matchedKeywords.map((kw, i) => (
                        <Badge key={i} className="bg-primary/20 text-primary">
                          ✓ {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditEntry(lastMatchInfo.entry)}
                    className="w-full"
                  >
                    Edit This Entry
                  </Button>
                </div>
              ) : messages.length > 1 ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="font-semibold text-destructive">UNMATCHED</span>
                    </div>
                  </div>

                  {responseTime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Response Time: {responseTime.toFixed(0)}ms
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    No knowledge base entry matched the user's query with sufficient score (threshold: {MATCH_THRESHOLD}).
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Consider adding a new entry to the knowledge base to handle this type of query.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Bot className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Send a message to see match analysis
                  </p>
                </div>
              )}
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}
