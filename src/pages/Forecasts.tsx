import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, Eye, Calendar, TrendingUp } from "lucide-react";

const mockForecasts = [
  {
    id: 1,
    title: "EUR/USD Weekly Technical Analysis",
    image: "/placeholder.svg",
    publishedAt: "2024-01-15T10:00:00Z",
    likes: 45,
    bookmarks: 12,
    views: 234,
    pair: "EUR/USD",
    timeframe: "1W",
    outlook: "Bullish"
  },
  {
    id: 2,
    title: "GBP/JPY Support & Resistance Levels",
    image: "/placeholder.svg",
    publishedAt: "2024-01-14T14:30:00Z",
    likes: 38,
    bookmarks: 8,
    views: 189,
    pair: "GBP/JPY",
    timeframe: "4H",
    outlook: "Bearish"
  },
  {
    id: 3,
    title: "USD/CAD Market Structure Analysis",
    image: "/placeholder.svg",
    publishedAt: "2024-01-13T09:15:00Z",
    likes: 52,
    bookmarks: 15,
    views: 301,
    pair: "USD/CAD",
    timeframe: "1D",
    outlook: "Neutral"
  }
];

export default function Forecasts() {
  const [likedForecasts, setLikedForecasts] = useState<Set<number>>(new Set());
  const [bookmarkedForecasts, setBookmarkedForecasts] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    const newLikes = new Set(likedForecasts);
    if (newLikes.has(id)) {
      newLikes.delete(id);
    } else {
      newLikes.add(id);
    }
    setLikedForecasts(newLikes);
  };

  const toggleBookmark = (id: number) => {
    const newBookmarks = new Set(bookmarkedForecasts);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
    } else {
      newBookmarks.add(id);
    }
    setBookmarkedForecasts(newBookmarks);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getOutlookColor = (outlook: string) => {
    switch (outlook.toLowerCase()) {
      case "bullish":
        return "bg-success/10 text-success border-success/20";
      case "bearish":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-success" />
            Market Forecasts
          </h1>
          <p className="text-muted-foreground mt-1">
            Professional technical analysis and market insights - Free for all members
          </p>
        </div>
      </div>

      {/* Forecasts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockForecasts.map((forecast) => (
          <Card key={forecast.id} className="border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="aspect-video bg-muted/30 relative group cursor-pointer">
              <img 
                src={forecast.image} 
                alt={forecast.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Button variant="secondary" size="sm">
                  View Analysis
                </Button>
              </div>
              
              {/* Pair Badge */}
              <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-border">
                {forecast.pair}
              </Badge>
              
              {/* Outlook Badge */}
              <Badge className={`absolute top-3 right-3 ${getOutlookColor(forecast.outlook)}`}>
                {forecast.outlook}
              </Badge>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg leading-tight">{forecast.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(forecast.publishedAt)}
                <Badge variant="outline" className="ml-auto">
                  {forecast.timeframe}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {forecast.views}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(forecast.id)}
                    className={`h-8 w-8 p-0 ${
                      likedForecasts.has(forecast.id) 
                        ? "text-red-500 hover:text-red-600" 
                        : "text-muted-foreground hover:text-red-500"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedForecasts.has(forecast.id) ? "fill-current" : ""}`} />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[20px]">
                    {forecast.likes + (likedForecasts.has(forecast.id) ? 1 : 0)}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(forecast.id)}
                    className={`h-8 w-8 p-0 ml-2 ${
                      bookmarkedForecasts.has(forecast.id) 
                        ? "text-primary hover:text-primary/80" 
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarkedForecasts.has(forecast.id) ? "fill-current" : ""}`} />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[20px]">
                    {forecast.bookmarks + (bookmarkedForecasts.has(forecast.id) ? 1 : 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for No Bookmarks */}
      {mockForecasts.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No forecasts available</h3>
            <p className="text-muted-foreground">
              Check back soon for the latest market analysis and insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}