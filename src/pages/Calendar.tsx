import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Filter, Bell, TrendingUp, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock events data
const events = [
  {
    id: 1,
    title: "US Non-Farm Payrolls",
    date: "2024-01-05",
    time: "08:30",
    category: "Market Event",
    impact: "high",
    description: "Monthly employment report showing the number of jobs added or lost in the US economy."
  },
  {
    id: 2,
    title: "EUR/USD Weekly Analysis",
    date: "2024-01-08",
    time: "10:00",
    category: "Forecast",
    impact: "medium",
    description: "Weekly technical and fundamental analysis for EUR/USD pair."
  },
  {
    id: 3,
    title: "Live Trading Session",
    date: "2024-01-10",
    time: "14:00",
    category: "Academy",
    impact: "low",
    description: "Interactive trading session with our senior analysts."
  },
  {
    id: 4,
    title: "Federal Reserve Meeting",
    date: "2024-01-12",
    time: "14:00",
    category: "Market Event",
    impact: "high",
    description: "FOMC meeting with potential interest rate decision."
  },
  {
    id: 5,
    title: "Risk Management Webinar",
    date: "2024-01-15",
    time: "16:00",
    category: "Academy",
    impact: "medium",
    description: "Educational webinar on effective risk management strategies."
  },
  {
    id: 6,
    title: "GBP/JPY Signal Alert",
    date: "2024-01-16",
    time: "09:30",
    category: "Signal",
    impact: "medium",
    description: "Premium trading signal for GBP/JPY with entry and exit levels."
  }
];

const categories = [
  { value: "all", label: "All Events", icon: CalendarIcon },
  { value: "Market Event", label: "Market Events", icon: TrendingUp },
  { value: "Academy", label: "Academy", icon: BookOpen },
  { value: "Signal", label: "Signals", icon: Bell },
  { value: "Forecast", label: "Forecasts", icon: Users }
];

export default function Calendar() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
      case "Market Event":
        return <TrendingUp className="w-4 h-4" />;
      case "Academy":
        return <BookOpen className="w-4 h-4" />;
      case "Signal":
        return <Bell className="w-4 h-4" />;
      case "Forecast":
        return <Users className="w-4 h-4" />;
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
              isToday(event.date) && "ring-2 ring-primary/20 border-primary/30",
              !isUpcoming(event.date) && "opacity-75"
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
                    isToday(event.date) && "text-primary font-medium"
                  )}>
                    {formatDate(event.date)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{event.time} GMT</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
              {isToday(event.date) && (
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