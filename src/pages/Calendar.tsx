import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Filter, Bell, TrendingUp, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
}

const categories = [
  { value: "all", label: "All Events", icon: CalendarIcon },
  { value: "market_event", label: "Market Events", icon: TrendingUp },
  { value: "academy", label: "Academy", icon: BookOpen },
  { value: "signal", label: "Signals", icon: Bell },
  { value: "forecast", label: "Forecasts", icon: Users },
  { value: "webinar", label: "Webinars", icon: BookOpen }
];

export default function Calendar() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    // Real-time subscription for events
    const channel = supabase
      .channel('calendar-events')
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
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => 
    selectedCategory === "all" || event.category === selectedCategory
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "market_event":
        return <TrendingUp className="w-4 h-4" />;
      case "academy":
        return <BookOpen className="w-4 h-4" />;
      case "signal":
        return <Bell className="w-4 h-4" />;
      case "forecast":
        return <Users className="w-4 h-4" />;
      case "webinar":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toDateString();
    const eventDate = new Date(dateString).toDateString();
    return today === eventDate;
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return eventDate > today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Calendar</h1>
        <p className="text-muted-foreground">
          Stay updated with market events, trading sessions, and educational content.
        </p>
      </div>

      {/* Filter Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filter Events
          </CardTitle>
          <CardDescription>
            Choose the type of events you want to see.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEvents.map((event) => (
          <Card
            key={event.id}
            className={cn(
              "transition-all duration-200 hover:shadow-md cursor-pointer border-border/50",
              isToday(event.event_date) && "ring-2 ring-primary/20 border-primary/30",
              !isUpcoming(event.event_date) && "opacity-75"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-primary">
                  {getCategoryIcon(event.category)}
                  <Badge variant="outline" className="text-xs">
                    {event.category}
                  </Badge>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getImpactColor(event.impact))}
                >
                  {event.impact}
                </Badge>
              </div>
              <CardTitle className="text-base leading-tight">
                {event.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span className={cn(
                    isToday(event.event_date) && "text-primary font-medium"
                  )}>
                    {formatDate(event.event_date)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{event.event_time || 'All Day'} {event.timezone || 'GMT'}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
              {event.currency_pairs && event.currency_pairs.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {event.currency_pairs.map((pair) => (
                    <Badge key={pair} variant="outline" className="text-xs">
                      {pair}
                    </Badge>
                  ))}
                </div>
              )}
              {isToday(event.event_date) && (
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  Today
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-muted-foreground">
            There are no events matching your current filter selection.
          </p>
        </Card>
      )}
    </div>
  );
}