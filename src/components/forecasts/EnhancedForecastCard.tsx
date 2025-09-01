import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, TrendingUp, TrendingDown, Minus, MessageCircle, Share2, Download, ExternalLink } from "lucide-react";
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

interface EnhancedForecastCardProps {
  forecast: ExtendedForecast;
  onLike: (forecastId: string) => void;
  onBookmark: (forecastId: string) => void;
  onImageClick: (forecast: ExtendedForecast) => void;
  onCardClick: (forecast: ExtendedForecast) => void;
}

export default function EnhancedForecastCard({ 
  forecast, 
  onLike, 
  onBookmark, 
  onImageClick, 
  onCardClick 
}: EnhancedForecastCardProps) {
  const [showFullComment, setShowFullComment] = useState(false);
  const { toast } = useToast();

  const getBiasIcon = (bias: string | null) => {
    switch (bias) {
      case 'long': return <TrendingUp className="w-3 h-3" />;
      case 'short': return <TrendingDown className="w-3 h-3" />;
      case 'neutral': return <Minus className="w-3 h-3" />;
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: forecast.title || 'Market Forecast',
        text: forecast.commentary || forecast.description || 'Check out this market forecast',
        url: window.location.href
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Forecast link copied to clipboard",
      });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const shouldShowReadMore = forecast.commentary && forecast.commentary.length > 120;
  const displayComment = shouldShowReadMore && !showFullComment 
    ? truncateText(forecast.commentary, 120)
    : forecast.commentary;

  return (
    <Card 
      className="group relative overflow-hidden bg-card hover:bg-card/80 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer animate-fade-in"
      onClick={() => onCardClick(forecast)}
    >
      <CardContent className="p-0">
        {/* Header with Currency Pair and Bias */}
        <div className="relative p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {forecast.currency_pair && (
                <Badge 
                  variant="outline" 
                  className="font-mono text-xs font-bold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  {forecast.currency_pair}
                </Badge>
              )}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border shadow-sm transition-all duration-200 ${getBiasStyles(forecast.trade_bias)}`}>
                {getBiasIcon(forecast.trade_bias)}
                <span className="ml-1 font-semibold tracking-wide">
                  {forecast.trade_bias?.toUpperCase() || 'NEUTRAL'}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(forecast.id);
                }}
                className={`h-7 w-7 p-0 hover:scale-110 transition-all duration-200 ${
                  forecast.is_liked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`w-3 h-3 ${forecast.is_liked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(forecast.id);
                }}
                className={`h-7 w-7 p-0 hover:scale-110 transition-all duration-200 ${
                  forecast.is_bookmarked 
                    ? 'text-primary hover:text-primary/80' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${forecast.is_bookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-7 w-7 p-0 hover:scale-110 transition-all duration-200 text-muted-foreground hover:text-primary"
              >
                <Share2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-tight mb-2">
            {forecast.title || "Market Analysis"}
          </h3>
        </div>

        {/* Chart Image */}
        <div className="relative mx-4 mb-4 overflow-hidden rounded-lg border border-border/30 bg-muted/10">
          <div className="relative aspect-video w-full">
            <img 
              src={forecast.image_url} 
              alt={forecast.title || "Forecast"} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(forecast);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Image overlay actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(forecast);
                }}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Commentary Preview */}
        {forecast.commentary && (
          <div className="px-4 mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayComment}
            </p>
            {shouldShowReadMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullComment(!showFullComment);
                }}
                className="mt-2 h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
              >
                {showFullComment ? 'Show Less' : 'Read More'}
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <span className="text-xs font-bold text-primary">
                  {forecast.user_profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground text-xs leading-none">
                  {forecast.user_profile?.full_name || "Unknown"}
                </span>
                <span className="text-muted-foreground text-xs mt-0.5">
                  {new Date(forecast.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1 transition-colors hover:text-red-500">
                <Heart className="w-3 h-3" />
                <span className="text-xs font-medium">{forecast.likes_count}</span>
              </div>
              <div className="flex items-center gap-1 transition-colors hover:text-primary">
                <MessageCircle className="w-3 h-3" />
                <span className="text-xs font-medium">{forecast.comments_count}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}