import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ForecastUploadModal from "@/components/forecasts/ForecastUploadModal";
import EnhancedForecastCard from "@/components/forecasts/EnhancedForecastCard";
import EnhancedImageModal from "@/components/forecasts/EnhancedImageModal";
import ForecastDetailModal from "@/components/forecasts/ForecastDetailModal";
import SentimentFilter from "@/components/forecasts/SentimentFilter";

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
  const [selectedImageForecast, setSelectedImageForecast] = useState<ExtendedForecast | null>(null);
  const [selectedDetailForecast, setSelectedDetailForecast] = useState<ExtendedForecast | null>(null);
  const [publicSentimentFilter, setPublicSentimentFilter] = useState<string | null>(null);
  const [arovaSentimentFilter, setArovaSentimentFilter] = useState<string | null>(null);

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

  // Filter forecasts based on sentiment
  const filteredPublicForecasts = useMemo(() => {
    if (!publicSentimentFilter) return publicForecasts;
    return publicForecasts.filter(forecast => forecast.trade_bias === publicSentimentFilter);
  }, [publicForecasts, publicSentimentFilter]);

  const filteredArovaForecasts = useMemo(() => {
    if (!arovaSentimentFilter) return arovaForecasts;
    return arovaForecasts.filter(forecast => forecast.trade_bias === arovaSentimentFilter);
  }, [arovaForecasts, arovaSentimentFilter]);

  // Calculate sentiment counts
  const publicSentimentCounts = useMemo(() => {
    const counts = { long: 0, short: 0, neutral: 0, total: publicForecasts.length };
    publicForecasts.forEach(forecast => {
      if (forecast.trade_bias === 'long') counts.long++;
      else if (forecast.trade_bias === 'short') counts.short++;
      else counts.neutral++;
    });
    return counts;
  }, [publicForecasts]);

  const arovaSentimentCounts = useMemo(() => {
    const counts = { long: 0, short: 0, neutral: 0, total: arovaForecasts.length };
    arovaForecasts.forEach(forecast => {
      if (forecast.trade_bias === 'long') counts.long++;
      else if (forecast.trade_bias === 'short') counts.short++;
      else counts.neutral++;
    });
    return counts;
  }, [arovaForecasts]);

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

          {/* Sentiment Filter */}
          {publicForecasts.length > 0 && (
            <SentimentFilter
              activeFilter={publicSentimentFilter}
              onFilterChange={setPublicSentimentFilter}
              counts={publicSentimentCounts}
            />
          )}

          {/* Public Forecasts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {filteredPublicForecasts.map((forecast) => (
              <EnhancedForecastCard 
                key={forecast.id} 
                forecast={forecast}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onImageClick={setSelectedImageForecast}
                onCardClick={setSelectedDetailForecast}
              />
            ))}
          </div>

          {filteredPublicForecasts.length === 0 && publicForecasts.length > 0 && (
            <div className="text-center py-12">
              <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-muted-foreground mb-4">No forecasts match your filter.</p>
                <p className="text-sm text-muted-foreground">Try selecting a different sentiment or clear the filter.</p>
              </div>
            </div>
          )}

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
          {/* Sentiment Filter */}
          {arovaForecasts.length > 0 && (
            <SentimentFilter
              activeFilter={arovaSentimentFilter}
              onFilterChange={setArovaSentimentFilter}
              counts={arovaSentimentCounts}
            />
          )}

          {/* Arova Forecasts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {filteredArovaForecasts.map((forecast) => (
              <EnhancedForecastCard 
                key={forecast.id} 
                forecast={forecast}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onImageClick={setSelectedImageForecast}
                onCardClick={setSelectedDetailForecast}
              />
            ))}
          </div>

          {filteredArovaForecasts.length === 0 && arovaForecasts.length > 0 && (
            <div className="text-center py-12">
              <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-muted-foreground mb-4">No forecasts match your filter.</p>
                <p className="text-sm text-muted-foreground">Try selecting a different sentiment or clear the filter.</p>
              </div>
            </div>
          )}

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

      {/* Enhanced Image Modal */}
      {selectedImageForecast && (
        <EnhancedImageModal 
          forecast={selectedImageForecast} 
          open={!!selectedImageForecast} 
          onClose={() => setSelectedImageForecast(null)} 
        />
      )}

      {/* Forecast Detail Modal */}
      {selectedDetailForecast && (
        <ForecastDetailModal 
          forecast={selectedDetailForecast} 
          open={!!selectedDetailForecast} 
          onClose={() => setSelectedDetailForecast(null)}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onImageClick={setSelectedImageForecast}
        />
      )}
    </div>
  );
}