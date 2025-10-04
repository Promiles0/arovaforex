import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, MessageCircle, Share2, X, TrendingUp, TrendingDown, Minus, ExternalLink, Trash2, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
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

interface ForecastDetailModalProps {
  forecast: ExtendedForecast;
  open: boolean;
  onClose: () => void;
  onLike: (forecastId: string) => void;
  onBookmark: (forecastId: string) => void;
  onImageClick: (forecast: ExtendedForecast) => void;
  onRefresh?: () => void;
}

export default function ForecastDetailModal({ 
  forecast, 
  open, 
  onClose, 
  onLike, 
  onBookmark, 
  onImageClick,
  onRefresh
}: ForecastDetailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  
  const isOwner = user?.id === forecast.user_id;
  const canDelete = isOwner || isAdmin;
  const canHide = isAdmin;

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
      
      onClose();
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
      
      onClose();
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
              {isAdmin && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  <Shield className="w-3 h-3 mr-1" />
                  ADMIN
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {canHide && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHideDialog(true)}
                  className="h-8 w-8 p-0 text-warning hover:text-warning hover:bg-warning/10"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
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
          <AlertDialogContent>
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
      </DialogContent>
    </Dialog>
  );
}