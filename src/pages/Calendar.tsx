import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Clock, Filter, Bell, TrendingUp, BookOpen, Users, Video, ExternalLink, Star, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isFuture, isPast } from "date-fns";
import CurrencyStrengthHeatmap from "@/components/calendar/CurrencyStrengthHeatmap";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  category: string;
  impact: string;
  timezone?: string;
  currency_pairs?: string[];
  external_url?: string;
  is_featured: boolean;
  is_recurring: boolean;
}

const categories = [
  { value: "all", label: "All Events", icon: CalendarIcon, color: "text-primary" },
  { value: "market_data", label: "Market Data", icon: BarChart3, color: "text-cyan-400" },
  { value: "market_event", label: "Market Events", icon: TrendingUp, color: "text-blue-400" },
  { value: "academy", label: "Academy", icon: BookOpen, color: "text-purple-400" },
  { value: "webinar", label: "Webinars", icon: Video, color: "text-pink-400" },
  { value: "signal", label: "Signals", icon: Bell, color: "text-amber-400" },
  { value: "forecast", label: "Forecasts", icon: Users, color: "text-emerald-400" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Calendar() {
  const [selectedCategory, setSelectedCategory] = useState("market_data");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();

    // Real-time subscription for events
    const channel = supabase
      .channel('calendar-events-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        () => fetchEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => 
    selectedCategory === "all" || event.category === selectedCategory
  );

  const upcomingEvents = filteredEvents.filter(event => 
    isFuture(new Date(event.event_date)) || isToday(new Date(event.event_date))
  );

  const pastEvents = filteredEvents.filter(event => 
    isPast(new Date(event.event_date)) && !isToday(new Date(event.event_date))
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getCategoryDetails = (category: string) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  const EventCard = ({ event, index }: { event: CalendarEvent; index: number }) => {
    const categoryDetails = getCategoryDetails(event.category);
    const Icon = categoryDetails.icon;
    const eventDate = new Date(event.event_date);
    const isTodayEvent = isToday(eventDate);
    const isPastEvent = isPast(eventDate) && !isTodayEvent;

    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            "group relative overflow-hidden transition-all duration-300 border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5",
            isTodayEvent && "ring-2 ring-primary/30 border-primary/50",
            isPastEvent && "opacity-60"
          )}
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {event.is_featured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            </div>
          )}

          <CardHeader className="pb-3 relative">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg bg-primary/10",
                categoryDetails.color
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {event.category.replace('_', ' ')}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getImpactColor(event.impact))}
                  >
                    {event.impact}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">
                  {event.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 relative">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                <span className={cn(
                  isTodayEvent && "text-primary font-medium"
                )}>
                  {isTodayEvent ? 'Today' : format(eventDate, 'EEE, MMM d')}
                </span>
              </div>
              {event.event_time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{event.event_time} {event.timezone || 'GMT'}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            )}

            {event.currency_pairs && event.currency_pairs.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {event.currency_pairs.map((pair) => (
                  <Badge key={pair} variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                    {pair}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {isTodayEvent && (
                <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse">
                  Happening Today
                </Badge>
              )}
              {event.external_url && (
                <a 
                  href={event.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-auto"
                >
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3 h-3" />
                    Learn More
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Trading Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with market events, trading sessions, and educational content.
        </p>
      </motion.div>

      {/* Filter Categories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4 text-primary" />
              Filter Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => {
                const Icon = category.icon;
                const count = category.value === 'all' 
                  ? events.length 
                  : events.filter(e => e.category === category.value).length;
                
                return (
                  <motion.div
                    key={category.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Button
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className={cn(
                        "flex items-center gap-2 transition-all duration-200",
                        selectedCategory === category.value && "shadow-lg shadow-primary/25"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {category.label}
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-1 px-1.5 py-0 text-xs",
                          selectedCategory === category.value 
                            ? "bg-primary-foreground/20 text-primary-foreground" 
                            : "bg-muted"
                        )}
                      >
                        {count}
                      </Badge>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Data Section - Currency Strength Heatmap */}
      {selectedCategory === 'market_data' && (
        <motion.div
          key="market-data"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <CurrencyStrengthHeatmap />
        </motion.div>
      )}

      {/* Error State */}
      {error && selectedCategory !== 'market_data' && (
        <Card className="p-8 text-center border-destructive/50">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Oops! Something went wrong</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchEvents}>Try Again</Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && selectedCategory !== 'market_data' && <LoadingSkeleton />}

      {/* Events Grid */}
      {!loading && !error && selectedCategory !== 'market_data' && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
          >
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Upcoming Events ({upcomingEvents.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                  Past Events ({pastEvents.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastEvents.slice(0, 6).map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredEvents.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-12 text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground">
                    {selectedCategory === 'all' 
                      ? 'Check back soon for new events and updates.'
                      : `No ${selectedCategory.replace('_', ' ')} events at the moment.`
                    }
                  </p>
                  {selectedCategory !== 'all' && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSelectedCategory('all')}
                    >
                      View All Events
                    </Button>
                  )}
                </Card>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
