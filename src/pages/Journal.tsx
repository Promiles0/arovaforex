import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Save,
  Share2,
  X,
  Upload,
  Tag,
  ChevronDown,
  ChevronRight,
  Clock,
  Brain,
  Target,
  Settings,
  HelpCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
  // New fields
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
}

const SETUP_TYPES = [
  'Breakout', 'Trendline Bounce', 'Support/Resistance', 'Pattern', 'News Event', 'Scalp', 'Swing', 'Other'
];

const SESSIONS = [
  'London', 'New York', 'Asia', 'London-NY Overlap', 'Asia-London Overlap'
];

const EMOTIONAL_STATES = [
  'Calm', 'Anxious', 'Overconfident', 'Frustrated', 'Excited', 'Fearful', 'Neutral'
];

const STRESS_LEVELS = [
  'Low', 'Medium', 'High'
];

const EXECUTION_METHODS = [
  'Manual', 'Automated'
];

const MARKET_VOLATILITY = [
  'Low', 'Medium', 'High'
];

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("entries");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [filterTag, setFilterTag] = useState("");

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    execution: false,
    psychology: false,
    reflection: false,
    automation: false
  });

  // Form state
  const [formData, setFormData] = useState<Partial<JournalEntry>>({
    title: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_time: '',
    instrument: '',
    direction: undefined,
    entry_price: undefined,
    exit_price: undefined,
    quantity: undefined,
    stop_loss: undefined,
    take_profit: undefined,
    setup_description: '',
    market_analysis: '',
    trade_rationale: '',
    outcome: undefined,
    lessons_learned: '',
    emotions: '',
    tags: [],
    setup_type: '',
    session: '',
      pnl: undefined,
      risk_reward_ratio: undefined,
      // New fields
      commission: undefined,
      swap: undefined,
      hold_time_minutes: undefined,
      execution_method: '',
      confidence_level: undefined,
      emotional_state: '',
      stress_level: '',
      what_went_well: '',
      what_to_improve: '',
      post_screenshots_urls: [],
      trade_rating: undefined,
      market_volatility: '',
      auto_review_enabled: false,
      review_date: '',
      related_entry_ids: [],
      is_draft: false,
      is_shared: false
    });

  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    fetchJournalEntries();
  }, [user?.id]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, filterOutcome, filterTag]);

  const fetchJournalEntries = async () => {
    try {
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

  const filterEntries = () => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.instrument?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.setup_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterOutcome !== "all") {
      filtered = filtered.filter(entry => entry.outcome === filterOutcome);
    }

    if (filterTag) {
      filtered = filtered.filter(entry => 
        entry.tags?.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
      );
    }

    setFilteredEntries(filtered);
  };

  const handleSubmit = async (isDraft = false) => {
    try {
      if (!user?.id) return;

      const entryData = {
        ...formData,
        user_id: user.id,
        is_draft: isDraft,
        title: formData.title || 'Untitled Entry',
        entry_time: formData.entry_time || null, // Convert empty string to null
        entry_price: formData.entry_price || null,
        exit_price: formData.exit_price || null,
        quantity: formData.quantity || null,
        stop_loss: formData.stop_loss || null,
        take_profit: formData.take_profit || null,
        pnl: formData.pnl || null,
        risk_reward_ratio: formData.risk_reward_ratio || null,
        // New fields
        commission: formData.commission || null,
        swap: formData.swap || null,
        hold_time_minutes: formData.hold_time_minutes || null,
        execution_method: formData.execution_method || null,
        confidence_level: formData.confidence_level || null,
        emotional_state: formData.emotional_state || null,
        stress_level: formData.stress_level || null,
        what_went_well: formData.what_went_well || null,
        what_to_improve: formData.what_to_improve || null,
        post_screenshots_urls: formData.post_screenshots_urls || null,
        trade_rating: formData.trade_rating || null,
        market_volatility: formData.market_volatility || null,
        auto_review_enabled: formData.auto_review_enabled || false,
        review_date: formData.review_date || null,
        related_entry_ids: formData.related_entry_ids || null
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', editingEntry.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({ title: "Success", description: "Journal entry updated!" });
      } else {
        const { error } = await supabase
          .from('journal_entries')
          .insert([entryData]);

        if (error) throw error;
        toast({ title: "Success", description: `Journal entry ${isDraft ? 'saved as draft' : 'created'}!` });
      }

      await fetchJournalEntries();
      resetForm();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      entry_date: new Date().toISOString().split('T')[0],
      entry_time: '',
      instrument: '',
      direction: undefined,
      entry_price: undefined,
      exit_price: undefined,
      quantity: undefined,
      stop_loss: undefined,
      take_profit: undefined,
      setup_description: '',
      market_analysis: '',
      trade_rationale: '',
      outcome: undefined,
      lessons_learned: '',
      emotions: '',
      tags: [],
      setup_type: '',
      session: '',
      pnl: undefined,
      risk_reward_ratio: undefined,
      // Reset new fields
      commission: undefined,
      swap: undefined,
      hold_time_minutes: undefined,
      execution_method: '',
      confidence_level: undefined,
      emotional_state: '',
      stress_level: '',
      what_went_well: '',
      what_to_improve: '',
      post_screenshots_urls: [],
      trade_rating: undefined,
      market_volatility: '',
      auto_review_enabled: false,
      review_date: '',
      related_entry_ids: [],
      is_draft: false,
      is_shared: false
    });
    setEditingEntry(null);
    setShowEntryForm(false);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'win':
        return 'bg-success/10 text-success border-success/20';
      case 'loss':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'breakeven':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'open':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDirectionIcon = (direction?: string) => {
    switch (direction) {
      case 'long':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'short':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            My Trading Journal
          </h1>
          <p className="text-muted-foreground">
            Track your trades, reflect on your decisions, and improve your performance.
          </p>
        </div>
        <Button 
          onClick={() => setShowEntryForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entries">All Entries</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="breakeven">Breakeven</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Filter by tag..."
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                />
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setFilterOutcome("all");
                  setFilterTag("");
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Entries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getDirectionIcon(entry.direction)}
                      <CardTitle className="text-base">{entry.title}</CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getOutcomeColor(entry.outcome))}
                    >
                      {entry.outcome || 'Open'}
                    </Badge>
                  </div>
                  {entry.instrument && (
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {entry.instrument} • {new Date(entry.entry_date).toLocaleDateString()}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {entry.setup_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.setup_description}
                    </p>
                  )}

                  {/* Execution & Metrics */}
                  {(entry.commission || entry.swap || entry.hold_time_minutes || entry.execution_method) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Execution & Metrics</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {entry.commission && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission:</span>
                            <span>${entry.commission}</span>
                          </div>
                        )}
                        {entry.swap && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Swap:</span>
                            <span>${entry.swap}</span>
                          </div>
                        )}
                        {entry.hold_time_minutes && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hold Time:</span>
                            <span>{entry.hold_time_minutes}m</span>
                          </div>
                        )}
                        {entry.execution_method && (
                          <div className="flex justify-between col-span-2">
                            <span className="text-muted-foreground">Method:</span>
                            <span className="capitalize">{entry.execution_method}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Psychology */}
                  {(entry.confidence_level || entry.emotional_state || entry.stress_level) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Psychology</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {entry.confidence_level && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span>{entry.confidence_level}/5</span>
                          </div>
                        )}
                        {entry.emotional_state && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Emotional State:</span>
                            <span className="capitalize">{entry.emotional_state}</span>
                          </div>
                        )}
                        {entry.stress_level && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stress Level:</span>
                            <span className="capitalize">{entry.stress_level}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Post-Trade Reflection */}
                  {(entry.what_went_well || entry.what_to_improve || entry.trade_rating) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reflection</h4>
                      <div className="space-y-1 text-xs">
                        {entry.what_went_well && (
                          <div>
                            <span className="text-muted-foreground">What went well:</span>
                            <p className="line-clamp-2">{entry.what_went_well}</p>
                          </div>
                        )}
                        {entry.what_to_improve && (
                          <div>
                            <span className="text-muted-foreground">To improve:</span>
                            <p className="line-clamp-2">{entry.what_to_improve}</p>
                          </div>
                        )}
                        {entry.trade_rating && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rating:</span>
                            <span>{entry.trade_rating}/5 ⭐</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Advanced Settings */}
                  {(entry.setup_type || entry.session || entry.market_volatility) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Advanced</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {entry.setup_type && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Setup Type:</span>
                            <span className="capitalize">{entry.setup_type}</span>
                          </div>
                        )}
                        {entry.session && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Session:</span>
                            <span className="capitalize">{entry.session}</span>
                          </div>
                        )}
                        {entry.market_volatility && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Volatility:</span>
                            <span className="capitalize">{entry.market_volatility}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Market Analysis */}
                  {entry.market_analysis && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Analysis</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{entry.market_analysis}</p>
                    </div>
                  )}
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span>
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                    {entry.is_draft && (
                      <Badge variant="outline" className="text-xs">
                        Draft
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEntries.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No entries found</h3>
              <p className="text-muted-foreground mb-4">
                {entries.length === 0 
                  ? "Start by creating your first journal entry to track your trading journey."
                  : "No entries match your current filters."
                }
              </p>
              <Button onClick={() => setShowEntryForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Entry
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Coming soon: Detailed analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This section will include win rate, P&L charts, risk-reward analysis, and more.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Journal Settings</CardTitle>
              <CardDescription>
                Configure your journal preferences and sharing options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings panel coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter entry title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry_date">Date *</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instrument">Instrument</Label>
                  <Input
                    id="instrument"
                    value={formData.instrument}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrument: e.target.value }))}
                    placeholder="e.g., EUR/USD"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direction">Direction</Label>
                  <Select value={formData.direction} onValueChange={(value: any) => setFormData(prev => ({ ...prev, direction: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcome">Outcome</Label>
                  <Select value={formData.outcome} onValueChange={(value: any) => setFormData(prev => ({ ...prev, outcome: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                      <SelectItem value="breakeven">Breakeven</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup_description">Setup Description</Label>
                <Textarea
                  id="setup_description"
                  value={formData.setup_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, setup_description: e.target.value }))}
                  placeholder="Describe your trading setup..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="market_analysis">Market Analysis</Label>
                <Textarea
                  id="market_analysis"
                  value={formData.market_analysis}
                  onChange={(e) => setFormData(prev => ({ ...prev, market_analysis: e.target.value }))}
                  placeholder="Your market analysis and reasoning..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Execution & Metrics Section */}
              <Collapsible open={openSections.execution} onOpenChange={() => toggleSection('execution')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      <span className="font-medium">Execution & Metrics</span>
                    </div>
                    {openSections.execution ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commission">Commission</Label>
                      <Input
                        id="commission"
                        type="number"
                        step="0.01"
                        value={formData.commission || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) || undefined }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swap">Swap</Label>
                      <Input
                        id="swap"
                        type="number"
                        step="0.01"
                        value={formData.swap || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, swap: parseFloat(e.target.value) || undefined }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hold_time_minutes">Hold Time (minutes)</Label>
                      <Input
                        id="hold_time_minutes"
                        type="number"
                        value={formData.hold_time_minutes || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hold_time_minutes: parseInt(e.target.value) || undefined }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="execution_method">Execution Method</Label>
                    <Select value={formData.execution_method} onValueChange={(value) => setFormData(prev => ({ ...prev, execution_method: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select execution method" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXECUTION_METHODS.map((method) => (
                          <SelectItem key={method} value={method.toLowerCase()}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Trader Psychology Section */}
              <Collapsible open={openSections.psychology} onOpenChange={() => toggleSection('psychology')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      <span className="font-medium">Trader Psychology</span>
                    </div>
                    {openSections.psychology ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 px-4 pb-4">
                  <div className="space-y-2">
                    <Label>Confidence Level: {formData.confidence_level || 1}</Label>
                    <Slider
                      value={[formData.confidence_level || 1]}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, confidence_level: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emotional_state">Emotional State</Label>
                      <Select value={formData.emotional_state} onValueChange={(value) => setFormData(prev => ({ ...prev, emotional_state: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select emotional state" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMOTIONAL_STATES.map((state) => (
                            <SelectItem key={state} value={state.toLowerCase()}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stress_level">Stress Level</Label>
                      <Select value={formData.stress_level} onValueChange={(value) => setFormData(prev => ({ ...prev, stress_level: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stress level" />
                        </SelectTrigger>
                        <SelectContent>
                          {STRESS_LEVELS.map((level) => (
                            <SelectItem key={level} value={level.toLowerCase()}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Post-Trade Reflection Section */}
              <Collapsible open={openSections.reflection} onOpenChange={() => toggleSection('reflection')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Post-Trade Reflection</span>
                    </div>
                    {openSections.reflection ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 px-4 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="what_went_well">What Went Well</Label>
                    <Textarea
                      id="what_went_well"
                      value={formData.what_went_well}
                      onChange={(e) => setFormData(prev => ({ ...prev, what_went_well: e.target.value }))}
                      placeholder="Describe what you did right in this trade..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="what_to_improve">What to Improve</Label>
                    <Textarea
                      id="what_to_improve"
                      value={formData.what_to_improve}
                      onChange={(e) => setFormData(prev => ({ ...prev, what_to_improve: e.target.value }))}
                      placeholder="Areas for improvement in future trades..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trade Rating: {formData.trade_rating || 1} ⭐</Label>
                    <Slider
                      value={[formData.trade_rating || 1]}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, trade_rating: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Advanced Tagging Section */}
              <Collapsible open={openSections.automation} onOpenChange={() => toggleSection('automation')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Advanced Settings</span>
                    </div>
                    {openSections.automation ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 px-4 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="market_volatility">Market Volatility</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Select value={formData.market_volatility} onValueChange={(value) => setFormData(prev => ({ ...prev, market_volatility: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select market volatility" />
                            </SelectTrigger>
                            <SelectContent>
                              {MARKET_VOLATILITY.map((volatility) => (
                                <SelectItem key={volatility} value={volatility.toLowerCase()}>{volatility}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Helps track performance in different market conditions</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto_review_enabled">Auto Review</Label>
                      <p className="text-sm text-muted-foreground">Enable automatic review reminders</p>
                    </div>
                    <Switch
                      id="auto_review_enabled"
                      checked={formData.auto_review_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_review_enabled: checked }))}
                    />
                  </div>
                  {formData.auto_review_enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="review_date">Review Date</Label>
                      <Input
                        id="review_date"
                        type="date"
                        value={formData.review_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => handleSubmit(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button onClick={() => handleSubmit(false)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Publish Entry
                </Button>
              </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}