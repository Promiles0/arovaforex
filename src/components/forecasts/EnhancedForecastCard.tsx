import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, TrendingUp, TrendingDown, Minus, MessageCircle, Share2, Eye, User } from "lucide-react";
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

  const getSentimentStyles = (bias: string | null) => {
    switch (bias) {
      case 'long': 
        return {
          badge: 'bg-success/10 text-success border-success/30',
          icon: <TrendingUp className="w-3 h-3" />,
          label: 'LONG'
        };
      case 'short': 
        return {
          badge: 'bg-destructive/10 text-destructive border-destructive/30',
          icon: <TrendingDown className="w-3 h-3" />,
          label: 'SHORT'
        };
      case 'neutral': 
        return {
          badge: 'bg-warning/10 text-warning border-warning/30',
          icon: <Minus className="w-3 h-3" />,
          label: 'NEUTRAL'
        };
      default: 
        return {
          badge: 'bg-muted/10 text-muted-foreground border-muted/30',
          icon: <Minus className="w-3 h-3" />,
          label: 'NEUTRAL'
        };
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
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Forecast link copied to clipboard",
      });
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

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const shouldShowReadMore = forecast.commentary && forecast.commentary.length > 200;
  const displayComment = shouldShowReadMore && !showFullComment 
    ? truncateText(forecast.commentary, 200)
    : forecast.commentary;

  const sentiment = getSentimentStyles(forecast.trade_bias);

  return (
    <Card 
      className="group relative overflow-hidden bg-card hover:bg-card/95 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card hover:scale-[1.02] cursor-pointer animate-fade-in w-full max-w-[450px] mx-auto"
      onClick={() => onCardClick(forecast)}
    >
      <CardContent className="p-0">
        {/* Horizontal Layout: 40% Chart + 60% Content */}
        <div className="flex h-[180px]">
          
          {/* Left Section - Chart Thumbnail (40%) */}
          <div 
            className="relative w-[40%] flex-shrink-0 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(forecast);
            }}
          >
            <img 
              src={forecast.image_url} 
              alt={`${forecast.currency_pair || 'Market'} analysis chart`} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Chart hover indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Right Section - Content (60%) */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            
            {/* Top Content */}
            <div className="space-y-3">
              {/* Market Pair & Timeframe */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {forecast.currency_pair && (
                    <Badge 
                      variant="outline" 
                      className="font-mono text-xs font-bold border-primary/30 text-primary bg-primary/5 px-2 py-1"
                    >
                      {forecast.currency_pair}
                    </Badge>
                  )}
                  {/* Sentiment Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${sentiment.badge}`}>
                    {sentiment.icon}
                    <span>{sentiment.label}</span>
                  </div>
                </div>
                
                {/* Confidence Level */}
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Confidence</div>
                  <div className="text-sm font-semibold text-primary">85%</div>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-tight">
                {forecast.title || `${forecast.currency_pair || 'Market'} Analysis`}
              </h3>

              {/* Analysis Preview */}
              {forecast.commentary && (
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
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
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium mt-1"
                    >
                      {showFullComment ? 'Show Less' : 'Read More'}
                    </Button>
                  )}
                </div>
              )}

              {/* Target/Entry Points */}
              <div className="text-xs text-muted-foreground">
                <span>Target: 1.2450 • Entry: 1.2380 • 4H</span>
              </div>
            </div>

            {/* Bottom Metadata */}
            <div className="flex items-center justify-between mt-4">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="text-xs font-bold text-primary">
                    {forecast.user_profile?.full_name?.charAt(0)?.toUpperCase() || <User className="w-3 h-3" />}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-foreground text-xs leading-tight">
                    {forecast.user_profile?.full_name || "Analyst"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {getTimeAgo(forecast.created_at)}
                  </div>
                </div>
              </div>

              {/* Engagement Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(forecast.id);
                  }}
                  className={`h-8 w-8 p-0 transition-all duration-200 min-w-[44px] ${
                    forecast.is_liked 
                      ? 'text-destructive hover:text-destructive/80' 
                      : 'text-muted-foreground hover:text-destructive'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <Heart className={`w-3 h-3 ${forecast.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium">{forecast.likes_count}</span>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(forecast.id);
                  }}
                  className={`h-8 w-8 p-0 transition-all duration-200 min-w-[44px] ${
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
                  className="h-8 w-8 p-0 transition-all duration-200 text-muted-foreground hover:text-primary min-w-[44px]"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
                
                <div className="flex items-center gap-1 text-muted-foreground ml-1">
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">{forecast.comments_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}