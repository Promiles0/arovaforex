import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, TrendingUp, TrendingDown, Minus, MessageCircle, Share2, Eye, User, Edit, Trash2, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { UserDisplayName } from "@/components/common/UserDisplayName";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  full_name: string | null;
  telegram_handle: string | null;
  email: string | null;
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

interface EnhancedForecastCardProps {
  forecast: ExtendedForecast;
  onLike: (forecastId: string) => void;
  onBookmark: (forecastId: string) => void;
  onImageClick: (forecast: ExtendedForecast) => void;
  onCardClick: (forecast: ExtendedForecast) => void;
  onRefresh?: () => void;
}

export default function EnhancedForecastCard({ 
  forecast, 
  onLike, 
  onBookmark, 
  onImageClick, 
  onCardClick,
  onRefresh
}: EnhancedForecastCardProps) {
  const [showFullComment, setShowFullComment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  
  const isOwner = user?.id === forecast.user_id;
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;
  const canHide = isAdmin;

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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('forecasts')
        .delete()
        .eq('id', forecast.id);

      if (error) throw error;

      if (isAdmin) {
        await supabase.rpc('log_admin_action', {
          p_action: 'delete_forecast',
          p_target_type: 'forecast',
          p_target_id: forecast.id,
          p_details: { title: forecast.title, currency_pair: forecast.currency_pair }
        });
      }

      toast({
        title: "Success",
        description: "Forecast deleted successfully",
      });
      
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting forecast:', error);
      toast({
        title: "Error",
        description: "Failed to delete forecast",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  const handleHide = async () => {
    try {
      const { error } = await supabase
        .from('forecasts')
        .update({ hidden: !forecast.hidden })
        .eq('id', forecast.id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        p_action: forecast.hidden ? 'unhide_forecast' : 'hide_forecast',
        p_target_type: 'forecast',
        p_target_id: forecast.id,
        p_details: { title: forecast.title }
      });

      toast({
        title: "Success",
        description: forecast.hidden ? "Forecast unhidden" : "Forecast hidden",
      });
      
      onRefresh?.();
    } catch (error) {
      console.error('Error toggling forecast visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update forecast visibility",
        variant: "destructive",
      });
    }
    setShowHideDialog(false);
  };

  return (
    <>
    <Card 
      className="group relative overflow-hidden bg-card hover:bg-card/80 border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer animate-fade-in w-full min-h-[280px] lg:min-h-[300px]"
      onClick={() => onCardClick(forecast)}
    >
      <CardContent className="p-0">
        {/* Vertical Layout: Chart on top, content below */}
        <div className="flex flex-col">
          
          {/* Top Section - Large Chart (Full Width) */}
          <div 
            className="relative w-full h-48 lg:h-56 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(forecast);
            }}
          >
            <img 
              src={forecast.image_url} 
              alt={`${forecast.currency_pair || 'Market'} analysis chart`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Chart hover indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black/70 backdrop-blur-sm rounded-full p-3">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Bottom Section - All Content */}
          <div className="p-5 lg:p-6 space-y-4">
            
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
                
                {/* Admin/Owner Controls */}
                {(canEdit || canDelete || canHide) && (
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        ADMIN
                      </Badge>
                    )}
                    {canHide && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHideDialog(true);
                        }}
                        className="h-8 w-8 p-0 text-warning hover:text-warning hover:bg-warning/10"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteDialog(true);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
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
                    <UserDisplayName profile={forecast.user_profile} userId={forecast.user_id} showFallback={false} />
                    {!forecast.user_profile?.telegram_handle && !forecast.user_profile?.full_name && "Analyst"}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Forecast</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this forecast? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hide/Unhide Confirmation Dialog */}
      <AlertDialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {forecast.hidden ? 'Unhide' : 'Hide'} Forecast
            </AlertDialogTitle>
            <AlertDialogDescription>
              {forecast.hidden 
                ? 'This forecast will become visible to all users again.'
                : 'This forecast will be hidden from regular users but remain accessible to admins.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleHide}>
              {forecast.hidden ? 'Unhide' : 'Hide'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
    </>
  );
}