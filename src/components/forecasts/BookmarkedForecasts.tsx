import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookmarkedForecast {
  id: string;
  title: string | null;
  currency_pair: string | null;
  trade_bias: 'long' | 'short' | 'neutral' | null;
  created_at: string;
  user_profile?: {
    full_name: string | null;
  };
}

interface BookmarkedForecastsProps {
  onForecastClick: (forecast: BookmarkedForecast) => void;
}

export default function BookmarkedForecasts({ onForecastClick }: BookmarkedForecastsProps) {
  const [bookmarkedForecasts, setBookmarkedForecasts] = useState<BookmarkedForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBookmarkedForecasts = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Get bookmarked forecast IDs
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('user_bookmarks')
        .select('forecast_id')
        .eq('user_id', user.id);

      if (bookmarksError) throw bookmarksError;

      if (!bookmarks || bookmarks.length === 0) {
        setBookmarkedForecasts([]);
        return;
      }

      const forecastIds = bookmarks.map(b => b.forecast_id);

      // Get forecast details
      const { data: forecasts, error: forecastsError } = await supabase
        .from('forecasts')
        .select('id, title, currency_pair, trade_bias, created_at, user_id')
        .in('id', forecastIds)
        .order('created_at', { ascending: false });

      if (forecastsError) throw forecastsError;

      // Get user profiles for the forecasts
      const userIds = [...new Set((forecasts || []).map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      const processedForecasts = (forecasts || []).map(forecast => ({
        ...forecast,
        user_profile: profilesMap.get(forecast.user_id) || { full_name: "Unknown" }
      })) as BookmarkedForecast[];

      setBookmarkedForecasts(processedForecasts);
    } catch (error) {
      console.error('Error fetching bookmarked forecasts:', error);
      toast({
        title: "Error",
        description: "Failed to load bookmarked forecasts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBiasIcon = (bias: string | null) => {
    switch (bias) {
      case 'long': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'short': return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'neutral': return <Minus className="w-3 h-3 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchBookmarkedForecasts()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Bookmarked</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading bookmarks...
          </div>
        ) : bookmarkedForecasts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No bookmarked forecasts yet
          </div>
        ) : (
          bookmarkedForecasts.map((forecast) => (
            <DropdownMenuItem
              key={forecast.id}
              className="p-3 cursor-pointer"
              onClick={() => onForecastClick(forecast)}
            >
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {forecast.currency_pair && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {forecast.currency_pair}
                      </Badge>
                    )}
                    {getBiasIcon(forecast.trade_bias)}
                  </div>
                </div>
                <div className="text-sm font-medium truncate">
                  {forecast.title || "Untitled Forecast"}
                </div>
                <div className="text-xs text-muted-foreground">
                  By {forecast.user_profile?.full_name || "Unknown"} • {new Date(forecast.created_at).toLocaleDateString()}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}