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
      className="group relative overflow-hidden bg-card hover:bg-card/80 border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer animate-fade-in w-full min-h-[300px] lg:min-h-[320px]"
      onClick={() => onCardClick(forecast)}
    >
      <CardContent className="p-0 h-full">
        {/* Large Horizontal Layout: 50% Chart + 50% Content */}
        <div className="flex h-full min-h-[300px] lg:min-h-[320px]">
          
          {/* Left Section - Large Chart (50%) */}
          <div 
            className="relative w-1/2 flex-shrink-0 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(forecast);
            }}
          >
            <img 
              src={forecast.image_url} 
              alt={`${forecast.currency_pair || 'Market'} analysis chart`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[250px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Chart hover indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black/70 backdrop-blur-sm rounded-full p-3">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Right Section - Organized Content (50%) */}
          <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between min-h-[300px]">
            
            {/* Top Content Area */}
            <div className="space-y-4">
              
              {/* Currency Pair & Sentiment Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  {/* Large Currency Pair */}
                  {forecast.currency_pair && (
                    <div className="text-xl lg:text-2xl font-bold text-foreground font-mono tracking-wider">
                      {forecast.currency_pair}
                    </div>
                  )}
                  
                  {/* Sentiment Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border-2 ${sentiment.badge}`}>
                    {sentiment.icon}
                    <span>{sentiment.label}</span>
                  </div>
                </div>
                
                {/* Confidence Level */}
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Confidence</div>
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="w-12 h-1 bg-muted rounded-full mt-1">
                    <div className="w-[85%] h-full bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Title/Description */}
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight mb-2">
                  {forecast.title || `${forecast.currency_pair || 'Market'} Technical Analysis`}
                </h3>
              </div>

              {/* Full Analysis Preview */}
              {forecast.commentary && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Analysis</div>
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
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {showFullComment ? 'Show Less' : 'Read More'}
                    </Button>
                  )}
                </div>
              )}

              {/* Entry/Target Levels */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg border border-border/30">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Entry Point</div>
                  <div className="text-sm font-bold text-foreground">1.2380</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Target</div>
                  <div className="text-sm font-bold text-success">1.2450</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Stop Loss</div>
                  <div className="text-sm font-bold text-destructive">1.2320</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Timeframe</div>
                  <div className="text-sm font-bold text-foreground">4H</div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Author & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              {/* Author Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/30 to-primary/20 flex items-center justify-center border-2 border-primary/30">
                  <span className="text-sm font-bold text-primary">
                    {forecast.user_profile?.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {forecast.user_profile?.full_name || "Analyst"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {getTimeAgo(forecast.created_at)}
                  </div>
                </div>
              </div>

              {/* Engagement Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(forecast.id);
                  }}
                  className={`h-10 px-3 transition-all duration-200 ${
                    forecast.is_liked 
                      ? 'text-destructive hover:text-destructive/80 bg-destructive/10' 
                      : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${forecast.is_liked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{forecast.likes_count}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(forecast.id);
                  }}
                  className={`h-10 w-10 p-0 transition-all duration-200 ${
                    forecast.is_bookmarked 
                      ? 'text-primary hover:text-primary/80 bg-primary/10' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${forecast.is_bookmarked ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-10 w-10 p-0 transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1 text-muted-foreground ml-2 px-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{forecast.comments_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}