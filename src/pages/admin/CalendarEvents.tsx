import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, CalendarDays, Clock, TrendingUp, BookOpen, Bell, Users, Video } from "lucide-react";
import { format } from "date-fns";

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
  recurrence_pattern?: string;
  created_at: string;
  updated_at: string;
}

const categoryOptions = [
  { value: 'market_event', label: 'Market Event', icon: TrendingUp },
  { value: 'academy', label: 'Academy', icon: BookOpen },
  { value: 'webinar', label: 'Webinar', icon: Video },
  { value: 'signal', label: 'Signal', icon: Bell },
  { value: 'forecast', label: 'Forecast', icon: Users },
  { value: 'trading_session', label: 'Trading Session', icon: TrendingUp },
];

const impactOptions = [
  { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'bg-warning/20 text-warning' },
  { value: 'high', label: 'High', color: 'bg-destructive/20 text-destructive' },
];

export default function AdminCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    category: 'market_event',
    impact: 'medium',
    timezone: 'GMT',
    currency_pairs: '',
    external_url: '',
    is_featured: false,
    is_recurring: false,
    recurrence_pattern: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();

    // Real-time subscription
    const channel = supabase
      .channel('admin-calendar-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => loadEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      category: 'market_event',
      impact: 'medium',
      timezone: 'GMT',
      currency_pairs: '',
      external_url: '',
      is_featured: false,
      is_recurring: false,
      recurrence_pattern: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_date: event.event_date || '',
      event_time: event.event_time || '',
      category: event.category || 'market_event',
      impact: event.impact || 'medium',
      timezone: event.timezone || 'GMT',
      currency_pairs: event.currency_pairs?.join(', ') || '',
      external_url: event.external_url || '',
      is_featured: event.is_featured || false,
      is_recurring: event.is_recurring || false,
      recurrence_pattern: event.recurrence_pattern || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      title: formData.title,
      description: formData.description || null,
      event_date: formData.event_date,
      event_time: formData.event_time || null,
      category: formData.category,
      impact: formData.impact,
      timezone: formData.timezone || 'GMT',
      currency_pairs: formData.currency_pairs ? formData.currency_pairs.split(',').map(s => s.trim()).filter(Boolean) : null,
      external_url: formData.external_url || null,
      is_featured: formData.is_featured,
      is_recurring: formData.is_recurring,
      recurrence_pattern: formData.recurrence_pattern || null,
    };

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully"
        });
        setEditingEvent(null);
      } else {
        const { error } = await supabase
          .from('calendar_events')
          .insert([eventData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event created successfully"
        });
        setShowCreateDialog(false);
      }

      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    const found = categoryOptions.find(c => c.value === category);
    if (found) {
      const Icon = found.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <CalendarDays className="w-4 h-4" />;
  };

  const getImpactBadgeClass = (impact: string) => {
    const found = impactOptions.find(i => i.value === impact);
    return found?.color || 'bg-muted text-muted-foreground';
  };

  const EventFormDialog = () => (
    <Dialog 
      open={showCreateDialog || !!editingEvent} 
      onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingEvent(null);
          resetForm();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>
            {editingEvent ? 'Update the event details below.' : 'Fill in the details to create a new calendar event.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., FOMC Meeting, Live Trading Session"
              required
              minLength={5}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impact Level *</Label>
              <Select
                value={formData.impact}
                onValueChange={(value) => setFormData({ ...formData, impact: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact" />
                </SelectTrigger>
                <SelectContent>
                  {impactOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the event..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_time">Time</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GMT">GMT</SelectItem>
                  <SelectItem value="EST">EST</SelectItem>
                  <SelectItem value="PST">PST</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="CET">CET</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency_pairs">Related Currency Pairs</Label>
            <Input
              id="currency_pairs"
              value={formData.currency_pairs}
              onChange={(e) => setFormData({ ...formData, currency_pairs: e.target.value })}
              placeholder="e.g., EUR/USD, GBP/JPY (comma separated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="external_url">External URL (optional)</Label>
            <Input
              id="external_url"
              type="url"
              value={formData.external_url}
              onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured">Featured Event</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
              <Label htmlFor="is_recurring">Recurring Event</Label>
            </div>
          </div>

          {formData.is_recurring && (
            <div className="space-y-2">
              <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
              <Select
                value={formData.recurrence_pattern}
                onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingEvent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <SEO title="Calendar Events | Admin" description="Manage trading calendar events for ArovaForex" />
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Calendar Events</h1>
            <p className="text-muted-foreground">Manage trading calendar events, webinars, and academy sessions</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              All Events ({events.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : events.length > 0 ? (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(event.category)}
                            <span className="font-medium">{event.title}</span>
                            {event.is_featured && (
                              <Badge variant="secondary" className="text-xs">Featured</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarDays className="w-3 h-3" />
                            {format(new Date(event.event_date), 'MMM d, yyyy')}
                            {event.event_time && (
                              <>
                                <Clock className="w-3 h-3 ml-2" />
                                {event.event_time} {event.timezone}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getImpactBadgeClass(event.impact)}>
                            {event.impact}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.currency_pairs?.length ? (
                            <div className="flex gap-1 flex-wrap max-w-[150px]">
                              {event.currency_pairs.slice(0, 2).map((pair) => (
                                <Badge key={pair} variant="outline" className="text-xs">
                                  {pair}
                                </Badge>
                              ))}
                              {event.currency_pairs.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{event.currency_pairs.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(event.event_date) >= new Date() ? (
                            <Badge className="bg-primary/20 text-primary">Upcoming</Badge>
                          ) : (
                            <Badge variant="secondary">Past</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(event)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(event.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays className="w-12 h-12 text-muted-foreground" />
                          <h3 className="text-lg font-medium">No events yet</h3>
                          <p className="text-muted-foreground">Create your first calendar event to get started</p>
                          <Button onClick={openCreateDialog} className="mt-4 gap-2">
                            <Plus className="w-4 h-4" />
                            Create First Event
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <EventFormDialog />
      </motion.section>
    </>
  );
}
