import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Clock,
  Zap,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
  id: string;
  title: string;
  entry_date: string;
  entry_time?: string;
  instrument?: string;
  direction?: 'long' | 'short' | 'neutral';
  entry_price?: number;
  exit_price?: number;
  pnl?: number;
  outcome?: 'win' | 'loss' | 'breakeven' | 'open';
  external_ticket?: string;
  trade_reasoning?: string;
  lessons_learned?: string;
  notes_added?: boolean;
  auto_imported?: boolean;
  import_source?: string;
  created_at: string;
}

interface AutoEntriesTableProps {
  entries: JournalEntry[];
  isConnected: boolean;
  lastSyncAt?: string | null;
  onRefresh: () => void;
  onViewDetails: (entry: JournalEntry) => void;
}

export function AutoEntriesTable({
  entries,
  isConnected,
  lastSyncAt,
  onRefresh,
  onViewDetails,
}: AutoEntriesTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [lessons, setLessons] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleOpenNotes = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setReasoning(entry.trade_reasoning || '');
    setLessons(entry.lessons_learned || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedEntry) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          trade_reasoning: reasoning,
          lessons_learned: lessons,
          notes_added: !!(reasoning || lessons),
        })
        .eq('id', selectedEntry.id);

      if (error) throw error;

      toast({
        title: 'Notes saved',
        description: 'Your trade notes have been saved successfully.',
      });
      setSelectedEntry(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPnL = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const getImportSourceLabel = (source?: string) => {
    switch (source) {
      case 'mt4': return 'MT4';
      case 'mt5': return 'MT5';
      case 'file_upload': return 'File';
      case 'email': return 'Email';
      default: return 'Auto';
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Sync Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl p-4 flex items-center justify-between",
          "border backdrop-blur-sm",
          isConnected
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-muted/30 border-border/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isConnected ? "bg-emerald-500/10" : "bg-muted"
          )}>
            {isConnected ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Wifi className="w-5 h-5 text-emerald-500" />
              </motion.div>
            ) : (
              <WifiOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className={cn(
              "font-medium",
              isConnected ? "text-emerald-500" : "text-muted-foreground"
            )}>
              {isConnected ? 'Live Sync Active' : 'Not Connected'}
            </p>
            {lastSyncAt && (
              <p className="text-sm text-muted-foreground">
                Last sync: {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Sync Now
        </Button>
      </motion.div>

      {/* Entries Table */}
      <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Auto-Imported Trades
            </CardTitle>
            <Badge variant="secondary" className="font-mono">
              {entries.length} trades
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-24">Ticket</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {entries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "group transition-colors",
                          "hover:bg-muted/30 cursor-pointer"
                        )}
                        onClick={() => onViewDetails(entry)}
                      >
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          #{entry.external_ticket || entry.id.slice(0, 6)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{format(new Date(entry.entry_date), 'MMM d')}</span>
                            {entry.entry_time && (
                              <span className="text-muted-foreground">{entry.entry_time}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {entry.instrument || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                            entry.direction === 'long' && "bg-emerald-500/10 text-emerald-500",
                            entry.direction === 'short' && "bg-red-500/10 text-red-500",
                            entry.direction === 'neutral' && "bg-muted text-muted-foreground"
                          )}>
                            {entry.direction === 'long' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : entry.direction === 'short' ? (
                              <ArrowDownRight className="w-3 h-3" />
                            ) : null}
                            {entry.direction?.charAt(0).toUpperCase()}{entry.direction?.slice(1) || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {getImportSourceLabel(entry.import_source)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-mono font-semibold",
                            (entry.pnl || 0) > 0 && "text-emerald-500",
                            (entry.pnl || 0) < 0 && "text-red-500",
                            (entry.pnl || 0) === 0 && "text-muted-foreground"
                          )}>
                            {formatPnL(entry.pnl || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenNotes(entry)}
                            className={cn(
                              "gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity",
                              entry.notes_added 
                                ? "text-primary hover:text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {entry.notes_added ? 'Edit Notes' : 'Add Notes'}
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-2">No Auto-Imported Trades Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your broker or upload trade files to see them here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Modal */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Trade Notes
            </DialogTitle>
            <DialogDescription>
              Add your reasoning and lessons for {selectedEntry?.instrument || 'this trade'}
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              {/* Trade Summary */}
              <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedEntry.instrument}</Badge>
                  <span className={cn(
                    selectedEntry.direction === 'long' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {selectedEntry.direction}
                  </span>
                </div>
                <span className={cn(
                  "font-mono font-semibold",
                  (selectedEntry.pnl || 0) > 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {formatPnL(selectedEntry.pnl || 0)}
                </span>
              </div>

              {/* Reasoning */}
              <div className="space-y-2">
                <Label htmlFor="reasoning">Why did you take this trade?</Label>
                <Textarea
                  id="reasoning"
                  placeholder="Describe your trade reasoning..."
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Lessons */}
              <div className="space-y-2">
                <Label htmlFor="lessons">What did you learn?</Label>
                <Textarea
                  id="lessons"
                  placeholder="Record your lessons learned..."
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEntry(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
