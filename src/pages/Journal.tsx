import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  Calendar as CalendarIcon
} from "lucide-react";
import { JournalCalendar } from "@/components/journal/calendar";
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
import { JournalSettings } from "@/components/journal/settings";
import { useJournalMode, type JournalMode } from "@/hooks/useJournalMode";
import { useBrokerConnections, type BrokerConnection } from "@/hooks/useBrokerConnections";
import {
  JournalModeToggle,
  AutoModeWelcome,
  ConnectionMethodSelector,
  MetaTraderSetup,
  FileUploadSetup,
  EmailSetup,
  ConnectionSuccess,
  ConnectionStatusBar,
} from "@/components/journal/mode";
import { AutoEntryCard, AutoEntriesTable } from "@/components/journal/auto";

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
  // Auto-import fields
  import_source?: string;
  auto_imported?: boolean;
  external_ticket?: string;
  broker_name?: string;
  notes_added?: boolean;
  trade_reasoning?: string;
}

type SetupStep = 'welcome' | 'method' | 'metatrader' | 'file' | 'email' | 'success' | null;

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mode and connection state
  const { mode, setMode, isFirstTimeAuto, hasConnections, isLoading: modeLoading, isTransitioning } = useJournalMode();
  const { connections, activeConnection, refreshConnections } = useBrokerConnections();
  
  // Setup flow state
  const [setupStep, setSetupStep] = useState<SetupStep>(null);
  const [successConnection, setSuccessConnection] = useState<BrokerConnection | null>(null);
  
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

  // Handle mode toggle
  const handleModeToggle = async (newMode: JournalMode) => {
    if (newMode === 'auto' && isFirstTimeAuto && !hasConnections) {
      // Show welcome modal for first-time auto mode
      setSetupStep('welcome');
    }
    await setMode(newMode);
  };

  // Setup flow handlers
  const handleSetupWelcomeGetStarted = () => {
    setSetupStep('method');
  };

  const handleSetupWelcomeSkip = () => {
    setSetupStep(null);
  };

  const handleSelectMethod = (method: 'metatrader' | 'file_upload' | 'email') => {
    if (method === 'metatrader') {
      setSetupStep('metatrader');
    } else if (method === 'file_upload') {
      setSetupStep('file');
    } else {
      setSetupStep('email');
    }
  };

  const handleSetupSuccess = (connection: BrokerConnection) => {
    setSuccessConnection(connection);
    setSetupStep('success');
    refreshConnections();
  };

  const handleConnectionSuccessContinue = () => {
    setSetupStep(null);
    setSuccessConnection(null);
    setActiveTab('entries');
  };

  // Fetch entries - now filters by mode
  useEffect(() => {
    if (user?.id) {
      fetchEntries();
    }
  }, [user, mode]);

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

      // Build query based on mode - SEPARATE DATA SOURCES
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      // Filter by import_source based on mode
      if (mode === 'manual') {
        // Manual mode: show only manual entries (import_source is null, 'manual', or not auto-imported)
        query = query.or('import_source.is.null,import_source.eq.manual');
      } else {
        // Auto mode: show only auto-imported entries
        query = query.in('import_source', ['mt4', 'mt5', 'file_upload', 'email']);
      }

      const { data, error } = await query;

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

  // No longer need to filter entries in render since we fetch by mode
  const displayEntries = filteredEntries;

  if (loading || modeLoading) {
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your trades, analyze performance, and improve your strategy
          </p>
        </div>
        
        {/* Mode Toggle and New Entry Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <JournalModeToggle
            mode={mode}
            onToggle={handleModeToggle}
            disabled={isTransitioning}
          />
          <Button
            onClick={() => setShowEntryForm(true)}
            size="lg"
            className="journal-submit-btn w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Connection Status Bar (Auto Mode) */}
      <AnimatePresence>
        {mode === 'auto' && activeConnection && (
          <ConnectionStatusBar
            connection={activeConnection}
            onSettings={() => setActiveTab('settings')}
          />
        )}
      </AnimatePresence>

      {/* Page Content with Mode Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.3 }}
        >
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 max-w-lg">
              <TabsTrigger value="entries">Entries</TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendar
              </TabsTrigger>
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

              {/* Entries Display - Different layouts for Manual vs Auto mode */}
              {mode === 'auto' ? (
                /* AUTO MODE: Table-based layout */
                <AutoEntriesTable
                  entries={displayEntries}
                  isConnected={!!activeConnection && activeConnection.status === 'active'}
                  lastSyncAt={activeConnection?.last_sync_at}
                  onRefresh={fetchEntries}
                  onViewDetails={(entry) => setSelectedEntry(entries.find(e => e.id === entry.id) || null)}
                />
              ) : (
                /* MANUAL MODE: Card grid layout */
                displayEntries.length > 0 ? (
                  <div className={cn(
                    viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
                      : "space-y-4"
                  )}>
                    {displayEntries.map(entry => (
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
                        Create your first journal entry to begin tracking your trades and improving your performance.
                      </p>
                      {entries.length === 0 && (
                        <Button onClick={() => setShowEntryForm(true)} size="lg" className="journal-submit-btn">
                          <Plus className="w-5 h-5 mr-2" />
                          Create First Entry
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6 mt-6">
              <JournalCalendar
                entries={entries as Array<{ id: string; title: string; entry_date: string; pnl?: number | null; outcome?: 'win' | 'loss' | 'breakeven' | 'open' | null; instrument?: string | null; direction?: 'long' | 'short' | 'neutral' | null }>}
                loading={loading}
                onAddEntry={() => setShowEntryForm(true)}
                onViewEntry={(entry) => setSelectedEntry(entries.find(e => e.id === entry.id) || null)}
              />
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

            <TabsContent value="settings" className="mt-6">
              <JournalSettings />
            </TabsContent>
          </Tabs>
        </motion.div>
      </AnimatePresence>

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

      {/* Auto Mode Setup Flow */}
      <AutoModeWelcome
        open={setupStep === 'welcome'}
        onClose={() => setSetupStep(null)}
        onGetStarted={handleSetupWelcomeGetStarted}
        onSkip={handleSetupWelcomeSkip}
      />
      
      <ConnectionMethodSelector
        open={setupStep === 'method'}
        onClose={() => setSetupStep(null)}
        onSelectMethod={handleSelectMethod}
        onBack={() => setSetupStep('welcome')}
      />
      
      <MetaTraderSetup
        open={setupStep === 'metatrader'}
        onClose={() => setSetupStep(null)}
        onBack={() => setSetupStep('method')}
        onSuccess={handleSetupSuccess}
      />
      
      <FileUploadSetup
        open={setupStep === 'file'}
        onClose={() => setSetupStep(null)}
        onBack={() => setSetupStep('method')}
        onSuccess={() => {
          refreshConnections();
          setSetupStep(null);
        }}
      />
      
      <EmailSetup
        open={setupStep === 'email'}
        onClose={() => setSetupStep(null)}
        onBack={() => setSetupStep('method')}
        onSuccess={() => {
          refreshConnections();
          setSetupStep(null);
        }}
      />
      
      <ConnectionSuccess
        open={setupStep === 'success'}
        onClose={() => setSetupStep(null)}
        onContinue={handleConnectionSuccessContinue}
        connection={successConnection}
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
