import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  streamId?: string;
  className?: string;
}

export const AICatchUp = ({ streamId, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const fetchRecap = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("live-chat-recap", {
        body: { streamId, limit: 80 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data?.summary || "No recap available.");
      setCount(data?.messageCount ?? null);
      setOpen(true);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Couldn't generate recap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        size="sm"
        variant="outline"
        onClick={fetchRecap}
        disabled={loading}
        className="w-full gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:bg-primary/15"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        )}
        {loading ? "Reading the room…" : open ? "Refresh recap" : "What did I miss?"}
      </Button>

      {open && summary && (
        <Card className="p-3 bg-muted/40 border-primary/20 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              AI Recap{count ? ` · last ${count} messages` : ""}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={fetchRecap}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
          <div className="prose prose-xs dark:prose-invert max-w-none text-xs prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
};
