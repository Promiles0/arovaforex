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
        {/* Horizontal Layout Container */}
        <div className="flex flex-col sm:flex-row min-h-[200px] sm:min-h-[140px]">
          
          {/* Left Section - Chart Thumbnail */}
          <div className="relative w-full sm:w-48 md:w-56 flex-shrink-0">
            <div className="relative aspect-video sm:aspect-square w-full h-full overflow-hidden">
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
              
              {/* Image overlay action */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick(forecast);
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>

              {/* Mobile-only sentiment badge overlay */}
              <div className="absolute bottom-2 left-2 sm:hidden">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border shadow-sm backdrop-blur-sm ${getBiasStyles(forecast.trade_bias)}`}>
                  {getBiasIcon(forecast.trade_bias)}
                  <span className="ml-1 font-semibold tracking-wide">
                    {forecast.trade_bias?.toUpperCase() || 'NEUTRAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Content */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div className="space-y-3">
              {/* Tags and Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {forecast.currency_pair && (
                    <Badge 
                      variant="outline" 
                      className="font-mono text-xs font-bold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      {forecast.currency_pair}
                    </Badge>
                  )}
                  {/* Desktop sentiment badge */}
                  <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border shadow-sm transition-all duration-200 ${getBiasStyles(forecast.trade_bias)}`}>
                    {getBiasIcon(forecast.trade_bias)}
                    <span className="ml-1 font-semibold tracking-wide">
                      {forecast.trade_bias?.toUpperCase() || 'NEUTRAL'}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base lg:text-lg text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-tight">
                  {forecast.title || "Market Analysis"}
                </h3>
              </div>

              {/* Commentary Preview */}
              {forecast.commentary && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
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
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {showFullComment ? 'Show Less' : 'Read More'}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom metadata - mobile */}
            <div className="flex items-center justify-between mt-3 sm:hidden">
              {/* User Info */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                  <span className="text-xs font-bold text-primary">
                    {forecast.user_profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <span className="font-medium text-foreground text-xs">
                  {forecast.user_profile?.full_name || "Unknown"}
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(forecast.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              {/* Action buttons mobile */}
              <div className="flex items-center gap-1">
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
              </div>
            </div>
          </div>

          {/* Right Section - Desktop Metadata */}
          <div className="hidden sm:flex flex-col justify-between p-4 w-32 md:w-40 flex-shrink-0 border-l border-border/30">
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 items-end opacity-70 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(forecast.id);
                }}
                className={`h-8 w-8 p-0 hover:scale-110 transition-all duration-200 ${
                  forecast.is_liked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${forecast.is_liked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(forecast.id);
                }}
                className={`h-8 w-8 p-0 hover:scale-110 transition-all duration-200 ${
                  forecast.is_bookmarked 
                    ? 'text-primary hover:text-primary/80' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${forecast.is_bookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0 hover:scale-110 transition-all duration-200 text-muted-foreground hover:text-primary"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Stats and User Info */}
            <div className="space-y-3">
              {/* Stats */}
              <div className="flex flex-col gap-2 items-end text-muted-foreground">
                <div className="flex items-center gap-1 transition-colors hover:text-red-500">
                  <span className="text-xs font-medium">{forecast.likes_count}</span>
                  <Heart className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-1 transition-colors hover:text-primary">
                  <span className="text-xs font-medium">{forecast.comments_count}</span>
                  <MessageCircle className="w-3 h-3" />
                </div>
              </div>

              {/* User Info */}
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                    <span className="text-xs font-bold text-primary">
                      {forecast.user_profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground text-xs leading-tight">
                    {forecast.user_profile?.full_name || "Unknown"}
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {new Date(forecast.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}