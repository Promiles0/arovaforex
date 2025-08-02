import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, TrendingUp, TrendingDown, Minus, MessageCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ForecastUploadModal from "@/components/forecasts/ForecastUploadModal";

interface Forecast {
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
}

interface Profile {
  full_name: string | null;
  country: string | null;
  phone_number: string | null;
}

interface ExtendedForecast extends Forecast {
  user_profile?: Profile;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export default function Forecasts() {
  const [publicForecasts, setPublicForecasts] = useState<ExtendedForecast[]>([]);
  const [arovaForecasts, setArovaForecasts] = useState<ExtendedForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<ExtendedForecast | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchForecasts();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, country, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchForecasts = async () => {
    try {
      // Fetch public forecasts
      const { data: publicData, error: publicError } = await supabase
        .from('forecasts')
        .select('*')
        .eq('forecast_type', 'public')
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      // Fetch arova forecasts
      const { data: arovaData, error: arovaError } = await supabase
        .from('forecasts')
        .select('*')
        .eq('forecast_type', 'arova')
        .order('created_at', { ascending: false });

      if (arovaError) throw arovaError;

      // Get current user for likes/bookmarks
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        // Fetch user's likes and bookmarks
        const [likesResult, bookmarksResult] = await Promise.all([
          supabase.from('forecast_likes').select('forecast_id').eq('user_id', user.id),
          supabase.from('user_bookmarks').select('forecast_id').eq('user_id', user.id)
        ]);

        const likedIds = new Set(likesResult.data?.map(like => like.forecast_id) || []);
        const bookmarkedIds = new Set(bookmarksResult.data?.map(bookmark => bookmark.forecast_id) || []);

        // Get user profiles for public forecasts
        const userIds = [...new Set((publicData || []).map(f => f.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, country, phone_number')
          .in('user_id', userIds);

        const profilesMap = new Map(
          (profilesData || []).map(p => [p.user_id, p])
        );

        // Process public forecasts
        const processedPublic = (publicData || []).map(forecast => ({
          ...forecast as Forecast,
          user_profile: profilesMap.get(forecast.user_id) || { full_name: "Unknown", country: null, phone_number: null },
          is_liked: likedIds.has(forecast.id),
          is_bookmarked: bookmarkedIds.has(forecast.id)
        })) as ExtendedForecast[];

        // Process arova forecasts
        const processedArova = (arovaData || []).map(forecast => ({
          ...forecast as Forecast,
          user_profile: { full_name: "ArovaForex", country: null, phone_number: null },
          is_liked: likedIds.has(forecast.id),
          is_bookmarked: bookmarkedIds.has(forecast.id)
        })) as ExtendedForecast[];

        setPublicForecasts(processedPublic);
        setArovaForecasts(processedArova);
      }
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast({
        title: "Error",
        description: "Failed to load forecasts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (forecastId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const forecast = [...publicForecasts, ...arovaForecasts].find(f => f.id === forecastId);
      if (!forecast) return;

      if (forecast.is_liked) {
        // Unlike
        await supabase
          .from('forecast_likes')
          .delete()
          .eq('forecast_id', forecastId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('forecast_likes')
          .insert({ forecast_id: forecastId, user_id: user.id });
      }

      // Refresh forecasts to update counts
      fetchForecasts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmark = async (forecastId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const forecast = [...publicForecasts, ...arovaForecasts].find(f => f.id === forecastId);
      if (!forecast) return;

      if (forecast.is_bookmarked) {
        // Remove bookmark
        await supabase
          .from('user_bookmarks')
          .delete()
          .eq('forecast_id', forecastId)
          .eq('user_id', user.id);
      } else {
        // Add bookmark
        await supabase
          .from('user_bookmarks')
          .insert({ forecast_id: forecastId, user_id: user.id });
      }

      // Refresh forecasts to update states
      fetchForecasts();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const getBiasIcon = (bias: string | null) => {
    switch (bias) {
      case 'long': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'short': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Minus className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getBiasColor = (bias: string | null) => {
    switch (bias) {
      case 'long': return 'border-l-green-500 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20';
      case 'short': return 'border-l-red-500 bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20';
      case 'neutral': return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/20';
      default: return 'border-l-muted bg-gradient-to-r from-muted/20 to-transparent';
    }
  };

  const ForecastImageModal = ({ forecast, open, onClose }: { forecast: ExtendedForecast; open: boolean; onClose: () => void }) => (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {forecast.currency_pair && (
                <Badge variant="outline" className="font-mono">
                  {forecast.currency_pair}
                </Badge>
              )}
              {getBiasIcon(forecast.trade_bias)}
              <span>{forecast.title || "Untitled Forecast"}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-3">
          <img 
            src={forecast.image_url} 
            alt={forecast.title || "Forecast"} 
            className="w-full h-auto rounded-lg mb-4"
          />
          {forecast.commentary && (
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Analysis:</h4>
              <p className="text-muted-foreground">{forecast.commentary}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>By {forecast.user_profile?.full_name || "Unknown"}</span>
            <span>{new Date(forecast.created_at).toLocaleString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const ForecastCard = ({ forecast }: { forecast: ExtendedForecast }) => (
    <Card className={`group hover:shadow-xl transition-all duration-300 border-l-4 ${getBiasColor(forecast.trade_bias)} hover:scale-[1.02] cursor-pointer backdrop-blur-sm`}>
      <CardContent className="p-0">
        {/* Image Preview */}
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={forecast.image_url} 
            alt={forecast.title || "Forecast"} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onClick={() => setSelectedForecast(forecast)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Quick Actions Overlay */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(forecast.id);
              }}
              className={`backdrop-blur-sm bg-background/20 hover:bg-background/40 ${forecast.is_liked ? 'text-red-500' : 'text-white'}`}
            >
              <Heart className={`w-4 h-4 ${forecast.is_liked ? 'fill-current' : ''}`} />
              <span className="ml-1 text-xs">{forecast.likes_count}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark(forecast.id);
              }}
              className={`backdrop-blur-sm bg-background/20 hover:bg-background/40 ${forecast.is_bookmarked ? 'text-blue-500' : 'text-white'}`}
            >
              <Bookmark className={`w-4 h-4 ${forecast.is_bookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          {/* Currency Pair & Bias */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {forecast.currency_pair && (
              <Badge variant="secondary" className="font-mono text-xs backdrop-blur-sm bg-background/20">
                {forecast.currency_pair}
              </Badge>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm bg-background/20">
              {getBiasIcon(forecast.trade_bias)}
              <span className="text-xs text-white font-medium">
                {forecast.trade_bias?.toUpperCase() || 'NEUTRAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4" onClick={() => setSelectedForecast(forecast)}>
          <h3 className="font-semibold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {forecast.title || "Untitled Forecast"}
          </h3>
          
          {forecast.commentary && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {forecast.commentary}
            </p>
          )}

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {forecast.user_profile?.full_name?.charAt(0) || "?"}
                </span>
              </div>
              <span className="font-medium">{forecast.user_profile?.full_name || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{forecast.comments_count}</span>
              </div>
              <span>{new Date(forecast.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Market Forecasts</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Share your market analysis and explore professional forecasts from the trading community.
        </p>
      </div>

      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="public" className="text-xs md:text-sm">Public Forecasts</TabsTrigger>
          <TabsTrigger value="arova" className="text-xs md:text-sm">Arova Forecasts</TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="space-y-6">
          {/* Upload Button */}
          <div className="flex justify-center md:justify-start">
            <ForecastUploadModal 
              profile={profile} 
              onUploadSuccess={fetchForecasts}
            />
          </div>

          {/* Public Forecasts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {publicForecasts.map((forecast) => (
              <ForecastCard key={forecast.id} forecast={forecast} />
            ))}
          </div>

          {publicForecasts.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-muted-foreground mb-4">No public forecasts available yet.</p>
                <p className="text-sm text-muted-foreground">Be the first to share your market analysis!</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="arova" className="space-y-6">
          {/* Arova Forecasts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {arovaForecasts.map((forecast) => (
              <ForecastCard key={forecast.id} forecast={forecast} />
            ))}
          </div>

          {arovaForecasts.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-muted-foreground mb-4">No Arova forecasts available yet.</p>
                <p className="text-sm text-muted-foreground">Professional forecasts will appear here.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Forecast Detail Modal */}
      {selectedForecast && (
        <ForecastImageModal 
          forecast={selectedForecast} 
          open={!!selectedForecast} 
          onClose={() => setSelectedForecast(null)} 
        />
      )}
    </div>
  );
}