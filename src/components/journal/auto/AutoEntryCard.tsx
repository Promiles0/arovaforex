import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { NotesEditor } from './NotesEditor';

interface AutoEntryCardProps {
  entry: {
    id: string;
    title: string;
    entry_date: string;
    entry_time?: string;
    instrument?: string;
    direction?: 'long' | 'short' | 'neutral';
    entry_price?: number;
    exit_price?: number;
    pnl?: number;
    risk_reward_ratio?: number;
    outcome?: 'win' | 'loss' | 'breakeven' | 'open';
    external_ticket?: string;
    trade_reasoning?: string;
    lessons_learned?: string;
    notes_added?: boolean;
    auto_imported?: boolean;
    created_at: string;
  };
  onViewDetails?: () => void;
  onSaveNotes?: (reasoning: string, lessons: string) => Promise<void>;
  isSyncing?: boolean;
}

export function AutoEntryCard({
  entry,
  onViewDetails,
  onSaveNotes,
  isSyncing = false,
}: AutoEntryCardProps) {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [reasoning, setReasoning] = useState(entry.trade_reasoning || '');
  const [lessons, setLessons] = useState(entry.lessons_learned || '');
  const [isSaving, setIsSaving] = useState(false);

  const isProfit = (entry.pnl || 0) > 0;
  const isLoss = (entry.pnl || 0) < 0;
  const hasNotes = entry.notes_added || !!entry.trade_reasoning || !!entry.lessons_learned;

  const handleSaveNotes = async () => {
    if (!onSaveNotes) return;
    setIsSaving(true);
    try {
      await onSaveNotes(reasoning, lessons);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPnL = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        "border border-border/50 hover:border-border",
        "bg-card/50 backdrop-blur-sm hover:bg-card"
      )}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {entry.external_ticket && (
                <span className="text-xs font-mono text-muted-foreground">
                  #{entry.external_ticket}
                </span>
              )}
              {entry.auto_imported && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 border-primary/20"
                >
                  <Zap className="w-3 h-3 mr-0.5" />
                  Auto
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSyncing && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              )}
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
            </div>
          </div>

          {/* Date and Outcome */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {entry.entry_date} {entry.entry_time && `• ${entry.entry_time}`}
            </span>
            {entry.outcome && (
              <Badge
                variant={entry.outcome === 'win' ? 'default' : entry.outcome === 'loss' ? 'destructive' : 'secondary'}
                className={cn(
                  "capitalize",
                  entry.outcome === 'win' && "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
                  entry.outcome === 'loss' && "bg-destructive/20 text-destructive hover:bg-destructive/30"
                )}
              >
                {entry.outcome}
              </Badge>
            )}
          </div>

          {/* Instrument and Direction */}
          <div className="flex items-center gap-3 mb-3">
            {entry.instrument && (
              <span className="font-semibold text-lg">{entry.instrument}</span>
            )}
            {entry.direction && (
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1",
                  entry.direction === 'long' && "border-emerald-500/30 text-emerald-500",
                  entry.direction === 'short' && "border-red-500/30 text-red-500"
                )}
              >
                {entry.direction === 'long' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {entry.direction.charAt(0).toUpperCase() + entry.direction.slice(1)}
              </Badge>
            )}
          </div>

          {/* Entry/Exit Prices */}
          {(entry.entry_price || entry.exit_price) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span>Entry: ${entry.entry_price?.toLocaleString()}</span>
              {entry.exit_price && (
                <>
                  <span>→</span>
                  <span>Exit: ${entry.exit_price?.toLocaleString()}</span>
                </>
              )}
            </div>
          )}

          {/* P&L and R/R */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {entry.pnl !== undefined && entry.pnl !== null && (
                <span className={cn(
                  "text-lg font-bold flex items-center gap-1",
                  isProfit && "text-emerald-500",
                  isLoss && "text-destructive"
                )}>
                  {isProfit ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : isLoss ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : null}
                  {formatPnL(entry.pnl)}
                </span>
              )}
            </div>
            {entry.risk_reward_ratio !== undefined && (
              <span className="text-sm text-muted-foreground">
                R/R: {entry.risk_reward_ratio.toFixed(2)}
              </span>
            )}
          </div>

          {/* Notes Section */}
          <div className="border-t pt-3">
            <button
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                {hasNotes ? '📝 View your notes' : '⚠️ Add your notes below'}
              </span>
              <motion.div
                animate={{ rotate: isNotesExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isNotesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-4">
                    <NotesEditor
                      label="Why did you take this trade?"
                      placeholder="Click to add your reasoning..."
                      value={reasoning}
                      onChange={setReasoning}
                    />
                    <NotesEditor
                      label="What did you learn?"
                      placeholder="Click to add lessons learned..."
                      value={lessons}
                      onChange={setLessons}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            {isNotesExpanded && (reasoning !== entry.trade_reasoning || lessons !== entry.lessons_learned) && (
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : '💾 Save Notes'}
              </Button>
            )}
            {!isNotesExpanded && <div />}
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
