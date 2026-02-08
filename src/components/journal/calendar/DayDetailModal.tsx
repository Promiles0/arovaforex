import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayData, JournalEntry } from '@/hooks/useCalendarData';

interface DayDetailModalProps {
  day: DayData | null;
  open: boolean;
  onClose: () => void;
  onViewEntry: (entry: JournalEntry) => void;
}

const EntryCard = ({ 
  entry, 
  index, 
  onClick 
}: { 
  entry: JournalEntry; 
  index: number;
  onClick: () => void;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={onClick}
    className={cn(
      "w-full p-4 rounded-xl text-left transition-all",
      "border border-border/30 hover:border-border/50",
      "bg-gradient-to-br from-muted/30 to-muted/10",
      "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate">{entry.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          {entry.instrument && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {entry.instrument}
            </span>
          )}
          {entry.direction && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded capitalize",
              entry.direction === 'long' && "bg-emerald-500/10 text-emerald-400",
              entry.direction === 'short' && "bg-red-500/10 text-red-400"
            )}>
              {entry.direction}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-right flex-shrink-0">
        <span className={cn(
          "text-sm font-bold font-mono block",
          (entry.pnl || 0) > 0 && "text-emerald-400",
          (entry.pnl || 0) < 0 && "text-red-400",
          (entry.pnl || 0) === 0 && "text-muted-foreground"
        )}>
          {(entry.pnl || 0) >= 0 ? '+' : ''}{(entry.pnl || 0).toFixed(2)}
        </span>
        {entry.outcome && (
          <span className={cn(
            "text-xs capitalize",
            entry.outcome === 'win' && "text-emerald-400",
            entry.outcome === 'loss' && "text-red-400",
            entry.outcome === 'breakeven' && "text-muted-foreground"
          )}>
            {entry.outcome}
          </span>
        )}
      </div>
    </div>
    
    <div className="flex items-center justify-end mt-3 text-primary text-xs">
      View Details <ArrowRight className="w-3 h-3 ml-1" />
    </div>
  </motion.button>
);

export const DayDetailModal = ({ day, open, onClose, onViewEntry }: DayDetailModalProps) => {
  if (!day) return null;
  
  const formattedDate = format(parseISO(day.date), 'EEEE, MMMM d, yyyy');
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className={cn(
          "p-6 pb-4 border-b",
          day.pnl > 0 && "bg-gradient-to-r from-emerald-500/10 to-transparent",
          day.pnl < 0 && "bg-gradient-to-r from-red-500/10 to-transparent"
        )}>
          <DialogTitle className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span>{formattedDate}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View trades and performance details for {formattedDate}
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Day Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-3"
          >
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <DollarSign className={cn(
                "w-4 h-4 mx-auto mb-1",
                day.pnl > 0 ? "text-emerald-400" : day.pnl < 0 ? "text-red-400" : "text-muted-foreground"
              )} />
              <p className="text-xs text-muted-foreground">P&L</p>
              <p className={cn(
                "text-sm font-bold font-mono",
                day.pnl > 0 && "text-emerald-400",
                day.pnl < 0 && "text-red-400"
              )}>
                {day.pnl >= 0 ? '+' : ''}{day.pnl.toFixed(2)}
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Target className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Trades</p>
              <p className="text-sm font-bold">{day.trades}</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <TrendingUp className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <p className="text-xs text-muted-foreground">Wins</p>
              <p className="text-sm font-bold text-emerald-400">{day.wins}</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <TrendingDown className="w-4 h-4 mx-auto text-red-400 mb-1" />
              <p className="text-xs text-muted-foreground">Losses</p>
              <p className="text-sm font-bold text-red-400">{day.losses}</p>
            </div>
          </motion.div>
          
          {/* Entries List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Trades ({day.trades})
            </h4>
            
            <div className="space-y-2">
              {day.entries.map((entry, index) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onClick={() => onViewEntry(entry)}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
