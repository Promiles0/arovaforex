import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Edit, 
  Trash2, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  DollarSign,
  Lightbulb,
  Brain,
  ChevronLeft,
  ChevronRight,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface JournalEntryModalProps {
  entry: any;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const MOOD_EMOJIS = [
  { value: 1, emoji: '😰', label: 'Very Low' },
  { value: 2, emoji: '😟', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Uncertain' },
  { value: 4, emoji: '🙂', label: 'Okay' },
  { value: 5, emoji: '😊', label: 'Good' },
  { value: 6, emoji: '😃', label: 'Confident' },
  { value: 7, emoji: '😄', label: 'Very Confident' },
  { value: 8, emoji: '🤩', label: 'Highly Confident' },
  { value: 9, emoji: '🚀', label: 'Exceptional' },
  { value: 10, emoji: '💎', label: 'Perfect' },
];

export default function JournalEntryModal({
  entry,
  open,
  onClose,
  onEdit,
  onDelete,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: JournalEntryModalProps) {
  if (!entry) return null;

  const mood = MOOD_EMOJIS.find(m => m.value === entry.confidence_level) || MOOD_EMOJIS[4];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 journal-modal">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-card to-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <DialogTitle className="text-2xl font-bold pr-8">{entry.title}</DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(entry.entry_date), 'PPP')}</span>
                </div>
                {entry.outcome && (
                  <Badge
                    variant={entry.outcome === 'win' ? 'default' : entry.outcome === 'loss' ? 'destructive' : 'secondary'}
                    className={cn(
                      "capitalize",
                      entry.outcome === 'win' && "bg-success hover:bg-success/90",
                      entry.outcome === 'breakeven' && "bg-muted",
                      entry.outcome === 'open' && "bg-warning hover:bg-warning/90"
                    )}
                  >
                    {entry.outcome}
                  </Badge>
                )}
                {entry.pnl !== undefined && entry.pnl !== null && (
                  <span className={cn(
                    "font-semibold text-base",
                    entry.pnl > 0 ? "text-success" : entry.pnl < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {entry.pnl > 0 ? '+' : ''}{entry.pnl.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <Button size="icon" variant="ghost" onClick={onEdit} className="hover:bg-primary/10">
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button size="icon" variant="ghost" onClick={onDelete} className="hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="hover:bg-primary/10">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trade Details */}
              <Card className="journal-glassmorphism">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Trade Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {entry.instrument && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Instrument</p>
                        <p className="font-semibold">{entry.instrument}</p>
                      </div>
                    )}
                    {entry.direction && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Direction</p>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-md border font-semibold",
                          entry.direction === 'long' 
                            ? "bg-success/10 border-success/30 text-success" 
                            : entry.direction === 'short'
                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                            : "bg-muted border-border"
                        )}>
                          {entry.direction === 'long' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : entry.direction === 'short' ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : null}
                          <span className="capitalize">{entry.direction}</span>
                        </div>
                      </div>
                    )}
                    {entry.entry_price && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Entry Price</p>
                        <p className="font-semibold">{entry.entry_price}</p>
                      </div>
                    )}
                    {entry.exit_price && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Exit Price</p>
                        <p className="font-semibold">{entry.exit_price}</p>
                      </div>
                    )}
                    {entry.quantity && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Position Size</p>
                        <p className="font-semibold">{entry.quantity}</p>
                      </div>
                    )}
                    {entry.risk_reward_ratio !== undefined && entry.risk_reward_ratio !== null && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Risk/Reward</p>
                        <p className="font-semibold">{entry.risk_reward_ratio.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Setup Description */}
              {entry.setup_description && (
                <Card className="journal-glassmorphism">
                  <CardHeader>
                    <CardTitle className="text-lg">Trade Setup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.setup_description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Market Analysis */}
              {entry.market_analysis && (
                <Card className="journal-glassmorphism">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Market Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.market_analysis}</p>
                  </CardContent>
                </Card>
              )}

              {/* Lessons Learned */}
              {entry.lessons_learned && (
                <Card className="journal-glassmorphism border-l-4 border-l-warning">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-warning" />
                      Lessons Learned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.lessons_learned}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Mood/Confidence */}
              <Card className="journal-glassmorphism">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smile className="w-4 h-4 text-primary" />
                    Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-5xl mb-2">{mood.emoji}</div>
                  <p className="text-sm font-semibold">{mood.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{entry.confidence_level}/10</p>
                </CardContent>
              </Card>

              {/* Screenshots */}
              {entry.chart_screenshot_urls && entry.chart_screenshot_urls.length > 0 && (
                <Card className="journal-glassmorphism">
                  <CardHeader>
                    <CardTitle className="text-base">Charts & Screenshots</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {entry.chart_screenshot_urls.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Chart ${idx + 1}`}
                        className="w-full rounded-lg border border-border/50 hover:scale-105 transition-transform cursor-pointer"
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <Card className="journal-glassmorphism">
                  <CardHeader>
                    <CardTitle className="text-base">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card className="journal-glassmorphism">
                <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
                  <p>Created: {format(new Date(entry.created_at), 'PPp')}</p>
                  <p>Updated: {format(new Date(entry.updated_at), 'PPp')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
