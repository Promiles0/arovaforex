import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, MessageCircle, Share2, X, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  user_profile?: Profile;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

interface ForecastDetailModalProps {
  forecast: ExtendedForecast;
  open: boolean;
  onClose: () => void;
  onLike: (forecastId: string) => void;
  onBookmark: (forecastId: string) => void;
  onImageClick: (forecast: ExtendedForecast) => void;
}

export default function ForecastDetailModal({ 
  forecast, 
  open, 
  onClose, 
  onLike, 
  onBookmark, 
  onImageClick 
}: ForecastDetailModalProps) {
  const { toast } = useToast();

  const getBiasIcon = (bias: string | null) => {
    switch (bias) {
      case 'long': return <TrendingUp className="w-5 h-5 text-success" />;
      case 'short': return <TrendingDown className="w-5 h-5 text-destructive" />;
      case 'neutral': return <Minus className="w-5 h-5 text-warning" />;
      default: return null;
    }
  };

  const getBiasStyles = (bias: string | null) => {
    switch (bias) {
      case 'long': 
        return 'bg-success/10 text-success border-success/20 shadow-success/10';
      case 'short': 
        return 'bg-destructive/10 text-destructive border-destructive/20 shadow-destructive/10';
      case 'neutral': 
        return 'bg-warning/10 text-warning border-warning/20 shadow-warning/10';
      default: 
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: forecast.title || 'Market Forecast',
        text: forecast.commentary || forecast.description || 'Check out this market forecast',
        url: window.location.href
      });
    } catch (error) {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Forecast link copied to clipboard",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-background/95 backdrop-blur-sm border border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {forecast.currency_pair && (
                <Badge variant="outline" className="font-mono border-primary/30 text-primary bg-primary/5">
                  {forecast.currency_pair}
                </Badge>
              )}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm ${getBiasStyles(forecast.trade_bias)}`}>
                {getBiasIcon(forecast.trade_bias)}
                <span className="font-semibold tracking-wide">
                  {forecast.trade_bias?.toUpperCase() || 'NEUTRAL'}
                </span>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            <h2 className="text-xl font-bold text-foreground mt-2">
              {forecast.title || "Market Analysis"}
            </h2>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {/* User Info */}
          <div className="px-6 py-4 border-b border-border/30 bg-muted/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <span className="text-sm font-bold text-primary">
                  {forecast.user_profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {forecast.user_profile?.full_name || "Unknown"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Published {new Date(forecast.created_at).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {forecast.user_profile?.country && (
                <Badge variant="outline" className="text-xs">
                  {forecast.user_profile.country}
                </Badge>
              )}
            </div>
          </div>

          {/* Chart Image */}
          <div className="p-6">
            <div className="relative overflow-hidden rounded-lg border border-border/30 bg-muted/10 group">
              <img 
                src={forecast.image_url} 
                alt={forecast.title || "Forecast"} 
                className="w-full aspect-video object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => onImageClick(forecast)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                  onClick={() => onImageClick(forecast)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Commentary */}
          {forecast.commentary && (
            <div className="px-6 pb-6">
              <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  Market Analysis
                </h4>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {forecast.commentary}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {forecast.description && (
            <div className="px-6 pb-6">
              <div className="bg-card/50 rounded-lg p-4 border border-border/30">
                <h4 className="font-semibold mb-3 text-foreground">Additional Notes</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {forecast.description}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {forecast.tags && forecast.tags.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="font-semibold mb-3 text-foreground">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {forecast.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/30 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(forecast.id)}
                className={`flex items-center gap-2 hover:scale-105 transition-all duration-200 ${
                  forecast.is_liked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${forecast.is_liked ? 'fill-current' : ''}`} />
                <span className="font-medium">{forecast.likes_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBookmark(forecast.id)}
                className={`flex items-center gap-2 hover:scale-105 transition-all duration-200 ${
                  forecast.is_bookmarked 
                    ? 'text-primary hover:text-primary/80' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${forecast.is_bookmarked ? 'fill-current' : ''}`} />
                <span className="font-medium">
                  {forecast.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                </span>
              </Button>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium text-sm">{forecast.comments_count} comments</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}