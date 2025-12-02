import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface Profile {
  full_name: string | null;
  country: string | null;
  phone_number: string | null;
}

interface ExtendedForecast {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  forecast_type: 'arova' | 'public';
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  currency_pair: string | null;
  trade_bias: 'long' | 'short' | 'neutral' | null;
  commentary: string | null;
  hidden: boolean;
  user_profile?: Profile;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

interface ForecastComparisonProps {
  forecasts: ExtendedForecast[];
  open: boolean;
  onClose: () => void;
  onRemove: (forecastId: string) => void;
}

export default function ForecastComparison({ forecasts, open, onClose, onRemove }: ForecastComparisonProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const getBiasStyles = (bias: string | null) => {
    switch (bias) {
      case 'long': return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', icon: <TrendingUp className="w-4 h-4" /> };
      case 'short': return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30', icon: <TrendingDown className="w-4 h-4" /> };
      case 'neutral': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', icon: <Minus className="w-4 h-4" /> };
      default: return { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/30', icon: <Minus className="w-4 h-4" /> };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (forecasts.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 bg-background/95 backdrop-blur-md border border-border/50">
        <DialogHeader className="p-4 md:p-6 pb-4 border-b border-border/30">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Maximize2 className="w-5 h-5 text-primary" />
              <span>Compare Forecasts ({forecasts.length})</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            View selected forecasts side-by-side. Click on a forecast to zoom in.
          </DialogDescription>
        </DialogHeader>

        {/* Mobile: Swipeable view */}
        <div className="md:hidden">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="p-4"
              >
                {forecasts[activeIndex] && (
                  <ComparisonCard 
                    forecast={forecasts[activeIndex]} 
                    onRemove={onRemove}
                    getBiasStyles={getBiasStyles}
                    getTimeAgo={getTimeAgo}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation */}
            <div className="flex items-center justify-between px-4 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {activeIndex + 1} / {forecasts.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveIndex(Math.min(forecasts.length - 1, activeIndex + 1))}
                disabled={activeIndex === forecasts.length - 1}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop: Side-by-side grid */}
        <ScrollArea className="hidden md:block max-h-[calc(95vh-120px)]">
          <div className={`grid gap-4 p-6 ${
            forecasts.length === 2 ? 'grid-cols-2' : 
            forecasts.length === 3 ? 'grid-cols-3' : 
            'grid-cols-2 lg:grid-cols-4'
          }`}>
            {forecasts.map((forecast) => (
              <ComparisonCard 
                key={forecast.id}
                forecast={forecast} 
                onRemove={onRemove}
                getBiasStyles={getBiasStyles}
                getTimeAgo={getTimeAgo}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ComparisonCardProps {
  forecast: ExtendedForecast;
  onRemove: (id: string) => void;
  getBiasStyles: (bias: string | null) => { bg: string; text: string; border: string; icon: React.ReactNode };
  getTimeAgo: (date: string) => string;
}

function ComparisonCard({ forecast, onRemove, getBiasStyles, getTimeAgo }: ComparisonCardProps) {
  const bias = getBiasStyles(forecast.trade_bias);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border/50 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {forecast.currency_pair && (
            <Badge variant="outline" className="font-mono text-xs">
              {forecast.currency_pair}
            </Badge>
          )}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${bias.bg} ${bias.text} ${bias.border}`}>
            {bias.icon}
            <span>{forecast.trade_bias?.toUpperCase() || 'NEUTRAL'}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(forecast.id)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Zoomable Image */}
      <div className="relative aspect-video bg-muted/5">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          centerOnInit
          wheel={{ step: 0.1 }}
          doubleClick={{ mode: "reset" }}
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full flex items-center justify-center"
          >
            <img 
              src={forecast.image_url} 
              alt={forecast.title || "Forecast"} 
              className="w-full h-full object-contain select-none"
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Details */}
      <div className="p-3 space-y-2">
        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
          {forecast.title || `${forecast.currency_pair || 'Market'} Analysis`}
        </h4>
        {forecast.commentary && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {forecast.commentary}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <span>{forecast.user_profile?.full_name || "Analyst"}</span>
          <span>{getTimeAgo(forecast.created_at)}</span>
        </div>
      </div>
    </motion.div>
  );
}
