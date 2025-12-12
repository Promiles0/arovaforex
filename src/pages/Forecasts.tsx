import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ForecastUploadModal from "@/components/forecasts/ForecastUploadModal";
import EnhancedForecastCard from "@/components/forecasts/EnhancedForecastCard";
import EnhancedImageModal from "@/components/forecasts/EnhancedImageModal";
import ForecastDetailModal from "@/components/forecasts/ForecastDetailModal";
import ForecastComparison from "@/components/forecasts/ForecastComparison";
import SentimentFilter from "@/components/forecasts/SentimentFilter";
import ForecastSkeleton from "@/components/forecasts/ForecastSkeleton";
import { useArovaForecastNotifications } from "@/hooks/useArovaForecastNotifications";
import { Plus, GitCompare, X } from "lucide-react";

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
  hidden: boolean;
}

interface Profile {
  full_name: string | null;
  telegram_handle: string | null;
  email: string | null;
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState("public");
  
  // Comparison feature state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<ExtendedForecast[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const { toast } = useToast();

  const fetchForecasts = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchForecasts();
    fetchProfile();
  }, [fetchForecasts]);

  // Real-time notifications for new Arova forecasts
  useArovaForecastNotifications(fetchForecasts);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, telegram_handle, email, country, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  // Handle compare mode selection
  const handleCompareToggle = (forecast: ExtendedForecast) => {
    if (!compareMode) {
      setSelectedDetailForecast(forecast);
      return;
    }
    
    const isSelected = selectedForComparison.some(f => f.id === forecast.id);
    if (isSelected) {
      setSelectedForComparison(prev => prev.filter(f => f.id !== forecast.id));
    } else if (selectedForComparison.length < 4) {
      setSelectedForComparison(prev => [...prev, forecast]);
    } else {
      toast({
        title: "Maximum reached",
        description: "You can compare up to 4 forecasts at a time",
      });
    }
  };

  const isSelectedForComparison = (forecastId: string) => {
    return selectedForComparison.some(f => f.id === forecastId);
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
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center md:text-left">
          <div className="h-9 w-64 bg-muted/50 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3, 4, 5, 6].map(i => <ForecastSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center md:text-left"
      >
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mb-2">
          Market Forecasts
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Share your market analysis and explore professional forecasts from the trading community.
        </p>
      </motion.div>

      {/* Compare Mode Toggle & Selection Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={compareMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setCompareMode(!compareMode);
            if (compareMode) {
              setSelectedForComparison([]);
            }
          }}
          className="gap-2"
        >
          <GitCompare className="w-4 h-4" />
          {compareMode ? "Exit Compare" : "Compare Forecasts"}
        </Button>

        {compareMode && selectedForComparison.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Badge variant="secondary" className="gap-1">
              {selectedForComparison.length} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForComparison([])}
              className="h-7 px-2"
            >
              <X className="w-3 h-3" />
            </Button>
            {selectedForComparison.length >= 2 && (
              <Button
                size="sm"
                onClick={() => setShowComparisonModal(true)}
                className="gap-1"
              >
                <GitCompare className="w-3 h-3" />
                Compare ({selectedForComparison.length})
              </Button>
            )}
          </motion.div>
        )}

        {compareMode && (
          <span className="text-xs text-muted-foreground">
            Click on forecast cards to select them for comparison (max 4)
          </span>
        )}
      </div>

      {/* Tabs with animated indicator */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="relative grid grid-cols-2 p-1 bg-muted/30 rounded-lg mb-8 max-w-md mx-auto md:mx-0 border border-border/30 h-auto">
          {/* Animated background indicator */}
          <motion.div
            className="absolute h-[calc(100%-8px)] bg-gradient-to-r from-primary to-primary/80 rounded-md shadow-md top-1 left-1"
            animate={{
              x: activeTab === 'public' ? 0 : 'calc(100% + 4px)',
            }}
            style={{ width: 'calc(50% - 6px)' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          
          <TabsTrigger 
            value="public" 
            className="relative z-10 data-[state=active]:text-primary-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Public Forecasts
          </TabsTrigger>
          <TabsTrigger 
            value="arova"
            className="relative z-10 data-[state=active]:text-primary-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Arova Forecasts
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">

        <TabsContent value="public" className="space-y-6">
          <motion.div
            key="public-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Sentiment Filter */}
            {publicForecasts.length > 0 && (
              <SentimentFilter
                activeFilter={publicSentimentFilter}
                onFilterChange={setPublicSentimentFilter}
                counts={publicSentimentCounts}
              />
            )}

            {/* Forecast Grid */}
            {filteredPublicForecasts.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {filteredPublicForecasts.map((forecast) => (
                  <motion.div
                    key={forecast.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className={`relative ${compareMode && isSelectedForComparison(forecast.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl' : ''}`}
                  >
                    {compareMode && isSelectedForComparison(forecast.id) && (
                      <div className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {selectedForComparison.findIndex(f => f.id === forecast.id) + 1}
                      </div>
                    )}
                    <EnhancedForecastCard
                      forecast={forecast}
                      onLike={handleLike}
                      onBookmark={handleBookmark}
                      onImageClick={setSelectedImageForecast}
                      onCardClick={handleCompareToggle}
                      onRefresh={fetchForecasts}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg">
                  {publicSentimentFilter 
                    ? `No ${publicSentimentFilter} forecasts found. Try changing the filter.`
                    : 'No public forecasts yet. Be the first to share your analysis!'
                  }
                </p>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="arova" className="space-y-6">
          <motion.div
            key="arova-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {arovaForecasts.length > 0 && (
              <SentimentFilter
                activeFilter={arovaSentimentFilter}
                onFilterChange={setArovaSentimentFilter}
                counts={arovaSentimentCounts}
              />
            )}

            {filteredArovaForecasts.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {filteredArovaForecasts.map((forecast) => (
                  <motion.div
                    key={forecast.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className={`relative ${compareMode && isSelectedForComparison(forecast.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl' : ''}`}
                  >
                    {compareMode && isSelectedForComparison(forecast.id) && (
                      <div className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {selectedForComparison.findIndex(f => f.id === forecast.id) + 1}
                      </div>
                    )}
                    <EnhancedForecastCard
                      forecast={forecast}
                      onLike={handleLike}
                      onBookmark={handleBookmark}
                      onImageClick={setSelectedImageForecast}
                      onCardClick={handleCompareToggle}
                      onRefresh={fetchForecasts}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg">
                  {arovaSentimentFilter 
                    ? `No ${arovaSentimentFilter} forecasts found. Try changing the filter.`
                    : 'No Arova forecasts available at the moment.'
                  }
                </p>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>
      </AnimatePresence>
      </Tabs>

      <motion.button
        onClick={() => setShowUploadModal(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-8 right-8 z-30 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-2xl shadow-primary/50 flex items-center justify-center text-primary-foreground hover:shadow-primary/70 transition-shadow group"
      >
        <Plus className="w-7 h-7" />
        <span className="absolute right-full mr-3 px-3 py-2 bg-card border border-border text-foreground text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Submit Forecast
        </span>
      </motion.button>

      {showUploadModal && (
        <ForecastUploadModal 
          profile={profile} 
          onUploadSuccess={() => {
            fetchForecasts();
            setShowUploadModal(false);
          }}
        />
      )}

      {selectedImageForecast && (
        <EnhancedImageModal 
          forecast={selectedImageForecast} 
          open={!!selectedImageForecast} 
          onClose={() => setSelectedImageForecast(null)} 
        />
      )}

      {selectedDetailForecast && (
        <ForecastDetailModal 
          forecast={selectedDetailForecast} 
          open={!!selectedDetailForecast} 
          onClose={() => setSelectedDetailForecast(null)}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onImageClick={setSelectedImageForecast}
          onRefresh={fetchForecasts}
        />
      )}

      {/* Forecast Comparison Modal */}
      <ForecastComparison
        forecasts={selectedForComparison}
        open={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        onRemove={(id) => setSelectedForComparison(prev => prev.filter(f => f.id !== id))}
      />
    </div>
  );
}