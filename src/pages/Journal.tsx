import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Grid3x3,
  List,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import JournalEntryCard from "@/components/journal/JournalEntryCard";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import AnalyticsStats from "@/components/journal/analytics/AnalyticsStats";
import PnLChart from "@/components/journal/analytics/PnLChart";
import WinRateChart from "@/components/journal/analytics/WinRateChart";
import InstrumentPerformanceChart from "@/components/journal/analytics/InstrumentPerformanceChart";
import TimeHeatmap from "@/components/journal/analytics/TimeHeatmap";
import RiskRewardScatter from "@/components/journal/analytics/RiskRewardScatter";
import DrawdownChart from "@/components/journal/analytics/DrawdownChart";
import TimePeriodFilter, { TimePeriod } from "@/components/journal/analytics/TimePeriodFilter";
import { useJournalAnalytics } from "@/hooks/useJournalAnalytics";

interface JournalEntry {
  id: string;
  title: string;
  entry_date: string;
  entry_time?: string;
  instrument?: string;
  direction?: 'long' | 'short' | 'neutral';
  entry_price?: number;
  exit_price?: number;
  quantity?: number;
  stop_loss?: number;
  take_profit?: number;
  setup_description?: string;
  market_analysis?: string;
  trade_rationale?: string;
  outcome?: 'win' | 'loss' | 'breakeven' | 'open';
  lessons_learned?: string;
  emotions?: string;
  chart_screenshot_url?: string;
  chart_screenshot_urls?: string[];
  tags?: string[];
  setup_type?: string;
  session?: string;
  pnl?: number;
  risk_reward_ratio?: number;
  commission?: number;
  swap?: number;
  hold_time_minutes?: number;
  execution_method?: string;
  confidence_level?: number;
  emotional_state?: string;
  stress_level?: string;
  what_went_well?: string;
  what_to_improve?: string;
  post_screenshots_urls?: string[];
  trade_rating?: number;
  market_volatility?: string;
  auto_review_enabled?: boolean;
  review_date?: string;
  related_entry_ids?: string[];
  is_draft: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState("entries");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analytics filters
  const [analyticsPeriod, setAnalyticsPeriod] = useState<TimePeriod>('month');
  const [analyticsStartDate, setAnalyticsStartDate] = useState<Date | undefined>();
  const [analyticsEndDate, setAnalyticsEndDate] = useState<Date | undefined>();

  // Fetch entries
  useEffect(() => {
    if (user?.id) {
      fetchEntries();
    }
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...entries];

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.setup_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.instrument?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterOutcome !== "all") {
      filtered = filtered.filter(entry => entry.outcome === filterOutcome);
    }

    if (filterTag && filterTag !== "all") {
      filtered = filtered.filter(entry => entry.tags?.includes(filterTag));
    }

    setFilteredEntries(filtered);
  }, [entries, searchTerm, filterOutcome, filterTag]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries((data || []) as JournalEntry[]);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Partial<JournalEntry>) => {
    try {
      setIsSubmitting(true);
      if (!user?.id) return;

      if (!formData.title || !formData.entry_date) {
        toast({
          title: "Validation Error",
          description: "Title and date are required",
          variant: "destructive"
        });
        return;
      }

      const entryData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        is_draft: false,
        is_shared: false
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', editingEntry.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Journal entry updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('journal_entries')
          .insert([{
            ...entryData,
            title: formData.title,
            entry_date: formData.entry_date,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Journal entry created successfully"
        });
      }

      setShowEntryForm(false);
      setEditingEntry(null);
      fetchEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Journal entry deleted successfully"
      });

      setSelectedEntry(null);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setSelectedEntry(null);
    setShowEntryForm(true);
  };

  const resetForm = () => {
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  const getSelectedEntryIndex = () => {
    if (!selectedEntry) return -1;
    return filteredEntries.findIndex(e => e.id === selectedEntry.id);
  };

  const handlePrevious = () => {
    const index = getSelectedEntryIndex();
    if (index > 0) {
      setSelectedEntry(filteredEntries[index - 1]);
    }
  };

  const handleNext = () => {
    const index = getSelectedEntryIndex();
    if (index < filteredEntries.length - 1) {
      setSelectedEntry(filteredEntries[index + 1]);
    }
  };

  // Get all unique tags for filter
  const allTags = Array.from(new Set(entries.flatMap(e => e.tags || [])));

  // Calculate date range for analytics
  const getDateRange = (): { start?: Date; end?: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (analyticsPeriod) {
      case 'today':
        return { start: today, end: now };
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return { start: weekStart, end: now };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
      }
      case 'year': {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      }
      case 'custom':
        return { start: analyticsStartDate, end: analyticsEndDate };
      case 'all':
      default:
        return {};
    }
  };

  const dateRange = getDateRange();
  const analytics = useJournalAnalytics(entries, dateRange.start, dateRange.end);

  const handlePeriodChange = (period: TimePeriod) => {
    setAnalyticsPeriod(period);
    if (period !== 'custom') {
      setAnalyticsStartDate(undefined);
      setAnalyticsEndDate(undefined);
    }
  };

  const handleDateChange = (start?: Date, end?: Date) => {
    setAnalyticsStartDate(start);
    setAnalyticsEndDate(end);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading journal entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your trades, analyze performance, and improve your strategy
          </p>
        </div>
        <Button
          onClick={() => setShowEntryForm(true)}
          size="lg"
          className="journal-submit-btn w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-6 mt-6">
          {/* Filters */}
          <Card className="journal-glassmorphism">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 journal-input"
                  />
                </div>

                {/* Outcome Filter */}
                <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                  <SelectTrigger className="journal-input">
                    <SelectValue placeholder="All Outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="breakeven">Breakeven</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                  </SelectContent>
                </Select>

                {/* Tag Filter */}
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="journal-input">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="flex-1"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "timeline" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("timeline")}
                    className="flex-1"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Active Filters */}
              {(searchTerm || filterOutcome !== "all" || (filterTag && filterTag !== "all")) && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs flex items-center gap-1">
                      Search: {searchTerm}
                      <button onClick={() => setSearchTerm("")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterOutcome !== "all" && (
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs flex items-center gap-1">
                      Outcome: {filterOutcome}
                      <button onClick={() => setFilterOutcome("all")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterTag && filterTag !== "all" && (
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs flex items-center gap-1">
                      Tag: {filterTag}
                      <button onClick={() => setFilterTag("all")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entries Display */}
          {filteredEntries.length > 0 ? (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
                : "space-y-4"
            )}>
              {filteredEntries.map(entry => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => setSelectedEntry(entry)}
                />
              ))}
            </div>
          ) : (
            <Card className="journal-glassmorphism">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="w-20 h-20 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  {entries.length === 0 ? "Start Your Trading Journey" : "No Entries Found"}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {entries.length === 0 
                    ? "Create your first journal entry to begin tracking your trades and improving your performance."
                    : "Try adjusting your filters or search terms to find specific entries."
                  }
                </p>
                {entries.length === 0 && (
                  <Button onClick={() => setShowEntryForm(true)} size="lg" className="journal-submit-btn">
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Time Period Filter */}
          <Card className="journal-glassmorphism">
            <CardContent className="p-4">
              <TimePeriodFilter
                period={analyticsPeriod}
                onPeriodChange={handlePeriodChange}
                startDate={analyticsStartDate}
                endDate={analyticsEndDate}
                onDateChange={handleDateChange}
              />
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {entries.length > 0 ? (
            <>
              <AnalyticsStats metrics={analytics} />
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PnLChart metrics={analytics} />
                <WinRateChart metrics={analytics} />
              </div>

              {/* Advanced Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InstrumentPerformanceChart metrics={analytics} />
                <TimeHeatmap metrics={analytics} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskRewardScatter metrics={analytics} />
                <DrawdownChart metrics={analytics} />
              </div>
            </>
          ) : (
            <Card className="journal-glassmorphism">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="w-20 h-20 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Start creating journal entries to see your performance analytics
                </p>
                <Button onClick={() => setShowEntryForm(true)} size="lg" className="journal-submit-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Entry
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="journal-glassmorphism">
            <CardHeader>
              <CardTitle>Journal Settings</CardTitle>
              <CardDescription>
                Configure your journal preferences and sharing options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Settings panel coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Entry Form Modal */}
      <Dialog open={showEntryForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto p-6">
            <JournalEntryForm
              initialData={editingEntry || undefined}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Detail Modal */}
      <JournalEntryModal
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onEdit={() => handleEdit(selectedEntry!)}
        onDelete={() => handleDelete(selectedEntry!.id)}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={getSelectedEntryIndex() > 0}
        hasNext={getSelectedEntryIndex() < filteredEntries.length - 1}
      />

      {/* Floating Action Button (Mobile) */}
      <Button
        onClick={() => setShowEntryForm(true)}
        size="lg"
        className="journal-fab fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl md:hidden z-40"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
