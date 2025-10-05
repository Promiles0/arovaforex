import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface JournalEntryCardProps {
  entry: {
    id: string;
    title: string;
    entry_date: string;
    instrument?: string;
    direction?: 'long' | 'short' | 'neutral';
    outcome?: 'win' | 'loss' | 'breakeven' | 'open';
    setup_description?: string;
    pnl?: number;
    risk_reward_ratio?: number;
    tags?: string[];
    created_at: string;
  };
  onClick: () => void;
}

const outcomeColors = {
  win: 'border-success bg-gradient-to-br from-success/10 to-success/5',
  loss: 'border-destructive bg-gradient-to-br from-destructive/10 to-destructive/5',
  breakeven: 'border-muted-foreground bg-gradient-to-br from-muted/10 to-muted/5',
  open: 'border-warning bg-gradient-to-br from-warning/10 to-warning/5',
};

const outcomeBorderLeft = {
  win: 'border-l-4 border-l-success',
  loss: 'border-l-4 border-l-destructive',
  breakeven: 'border-l-4 border-l-muted-foreground',
  open: 'border-l-4 border-l-warning',
};

export default function JournalEntryCard({ entry, onClick }: JournalEntryCardProps) {
  const outcomeColor = outcomeColors[entry.outcome || 'open'];
  const borderColor = outcomeBorderLeft[entry.outcome || 'open'];

  return (
    <Card
      onClick={onClick}
      className={cn(
        "journal-entry-card group cursor-pointer overflow-hidden relative",
        "hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out",
        "border border-border/40 backdrop-blur-sm",
        outcomeColor,
        borderColor
      )}
    >
      {/* Hover Glow Effect */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
        entry.outcome === 'win' && "bg-gradient-radial from-success/20 via-transparent to-transparent",
        entry.outcome === 'loss' && "bg-gradient-radial from-destructive/20 via-transparent to-transparent",
      )} />

      <CardContent className="p-4 sm:p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg truncate mb-1 group-hover:text-primary transition-colors">
              {entry.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{entry.entry_date}</span>
              <span className="text-muted-foreground/60">•</span>
              <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          
          {entry.outcome && (
            <Badge
              variant={entry.outcome === 'win' ? 'default' : entry.outcome === 'loss' ? 'destructive' : 'secondary'}
              className={cn(
                "ml-2 capitalize shrink-0",
                entry.outcome === 'win' && "bg-success hover:bg-success/90",
                entry.outcome === 'breakeven' && "bg-muted",
                entry.outcome === 'open' && "bg-warning hover:bg-warning/90"
              )}
            >
              {entry.outcome}
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="space-y-3">
          {/* Instrument & Direction */}
          <div className="flex items-center gap-3 text-sm">
            {entry.instrument && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/50 border border-border/50">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{entry.instrument}</span>
              </div>
            )}
            
            {entry.direction && (
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md border",
                entry.direction === 'long' 
                  ? "bg-success/10 border-success/30 text-success" 
                  : entry.direction === 'short'
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-muted border-border"
              )}>
                {entry.direction === 'long' ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : entry.direction === 'short' ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : null}
                <span className="font-medium capitalize text-xs">{entry.direction}</span>
              </div>
            )}
          </div>

          {/* Setup Description Preview */}
          {entry.setup_description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {entry.setup_description}
            </p>
          )}

          {/* Footer - Stats & Tags */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs">
              {entry.pnl !== undefined && entry.pnl !== null && (
                <div className={cn(
                  "flex items-center gap-1 font-semibold",
                  entry.pnl > 0 ? "text-success" : entry.pnl < 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{entry.pnl > 0 ? '+' : ''}{entry.pnl.toFixed(2)}</span>
                </div>
              )}
              
              {entry.risk_reward_ratio !== undefined && entry.risk_reward_ratio !== null && (
                <div className="text-muted-foreground">
                  R/R: <span className="font-medium">{entry.risk_reward_ratio.toFixed(2)}</span>
                </div>
              )}
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                {entry.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                    +{entry.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Click to view details</p>
            <div className="w-8 h-0.5 bg-primary mx-auto rounded-full animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
