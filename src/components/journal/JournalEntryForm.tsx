import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Upload, X, Save, TrendingUp, TrendingDown, DollarSign, Target, Calendar, Smile, Lightbulb, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalEntryFormProps {
  initialData?: Partial<JournalEntry>;
  onSubmit: (data: Partial<JournalEntry>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface JournalEntry {
  id?: string;
  title: string;
  entry_date: string;
  instrument?: string;
  direction?: 'long' | 'short' | 'neutral';
  outcome?: 'win' | 'loss' | 'breakeven' | 'open';
  setup_description?: string;
  market_analysis?: string;
  tags?: string[];
  entry_price?: number;
  exit_price?: number;
  quantity?: number;
  pnl?: number;
  risk_reward_ratio?: number;
  confidence_level?: number;
  lessons_learned?: string;
  chart_screenshot_urls?: string[];
}

const INSTRUMENTS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'GOLD', 'SILVER', 'OIL', 'BTC/USD', 'ETH/USD'];

const MOOD_EMOJIS = [
  { value: 1, emoji: '😰', label: 'Very Low' },
  { value: 2, emoji: '😟', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Uncertain' },
  { value: 4, emoji: '🙂', label: 'Okay' },
  { value: 5, emoji: '😊', label: 'Good' },
  { value: 6, emoji: '😃', label: 'Confident' },
  { value: 7, emoji: '😄', label: 'Very Confident' },
  { value: 8, emoji: '🤩', label: 'Highly Confident' },
  { value: 9, emoji: '🚀', label: 'Exceptional' },
  { value: 10, emoji: '💎', label: 'Perfect' },
];

export default function JournalEntryForm({ initialData, onSubmit, onCancel, isSubmitting }: JournalEntryFormProps) {
  const [formData, setFormData] = useState<Partial<JournalEntry>>({
    title: '',
    entry_date: new Date().toISOString().split('T')[0],
    instrument: '',
    direction: undefined,
    outcome: undefined,
    setup_description: '',
    market_analysis: '',
    tags: [],
    entry_price: undefined,
    exit_price: undefined,
    quantity: undefined,
    confidence_level: 5,
    lessons_learned: '',
    chart_screenshot_urls: [],
    ...initialData
  });

  const [tagInput, setTagInput] = useState('');
  const [calculatedPnL, setCalculatedPnL] = useState<number | null>(null);
  const [calculatedRR, setCalculatedRR] = useState<number | null>(null);

  // Calculate P&L and R/R automatically
  const calculateMetrics = () => {
    if (formData.entry_price && formData.exit_price && formData.quantity) {
      const pnl = formData.direction === 'long' 
        ? (formData.exit_price - formData.entry_price) * formData.quantity
        : (formData.entry_price - formData.exit_price) * formData.quantity;
      setCalculatedPnL(pnl);
      
      // Simple R/R calculation (would need stop loss for accurate calculation)
      const rr = Math.abs((formData.exit_price - formData.entry_price) / formData.entry_price) * 100;
      setCalculatedRR(rr);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      pnl: calculatedPnL ?? formData.pnl,
      risk_reward_ratio: calculatedRR ?? formData.risk_reward_ratio
    };
    onSubmit(submitData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) });
  };

  const selectedMood = MOOD_EMOJIS.find(m => m.value === formData.confidence_level) || MOOD_EMOJIS[4];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Title & Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 journal-form-field">
          <Label htmlFor="title" className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Title *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="My Best Scalping Setup"
            required
            className="journal-input focus:scale-[1.01] transition-transform"
          />
        </div>

        <div className="space-y-2 journal-form-field">
          <Label htmlFor="entry_date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Date *
          </Label>
          <Input
            id="entry_date"
            type="date"
            value={formData.entry_date}
            onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
            required
            className="journal-input focus:scale-[1.01] transition-transform"
          />
        </div>
      </div>

      {/* Instrument & Direction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 journal-form-field">
          <Label htmlFor="instrument">Instrument</Label>
          <Select value={formData.instrument} onValueChange={(value) => setFormData({ ...formData, instrument: value })}>
            <SelectTrigger className="journal-input">
              <SelectValue placeholder="Select instrument" />
            </SelectTrigger>
            <SelectContent>
              {INSTRUMENTS.map(inst => (
                <SelectItem key={inst} value={inst}>{inst}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 journal-form-field">
          <Label htmlFor="direction">Trade Direction</Label>
          <Select value={formData.direction} onValueChange={(value: any) => setFormData({ ...formData, direction: value })}>
            <SelectTrigger className="journal-input">
              <SelectValue placeholder="Select direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="long">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Long
                </span>
              </SelectItem>
              <SelectItem value="short">
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  Short
                </span>
              </SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Entry/Exit Prices & Position Size */}
      <Card className="p-4 journal-glassmorphism space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Trade Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entry_price">Entry Price</Label>
            <Input
              id="entry_price"
              type="number"
              step="0.00001"
              value={formData.entry_price || ''}
              onChange={(e) => {
                setFormData({ ...formData, entry_price: parseFloat(e.target.value) });
                setTimeout(calculateMetrics, 100);
              }}
              placeholder="1.2345"
              className="journal-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exit_price">Exit Price</Label>
            <Input
              id="exit_price"
              type="number"
              step="0.00001"
              value={formData.exit_price || ''}
              onChange={(e) => {
                setFormData({ ...formData, exit_price: parseFloat(e.target.value) });
                setTimeout(calculateMetrics, 100);
              }}
              placeholder="1.2445"
              className="journal-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Position Size</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={formData.quantity || ''}
              onChange={(e) => {
                setFormData({ ...formData, quantity: parseFloat(e.target.value) });
                setTimeout(calculateMetrics, 100);
              }}
              placeholder="1.0"
              className="journal-input"
            />
          </div>
        </div>

        {/* Calculated Metrics Display */}
        {calculatedPnL !== null && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <span className="text-sm font-medium">Calculated P&L:</span>
            <span className={cn(
              "text-lg font-bold",
              calculatedPnL > 0 ? "text-success" : calculatedPnL < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {calculatedPnL > 0 ? '+' : ''}{calculatedPnL.toFixed(2)}
            </span>
          </div>
        )}
      </Card>

      {/* Outcome */}
      <div className="space-y-2 journal-form-field">
        <Label htmlFor="outcome">Outcome</Label>
        <Select value={formData.outcome} onValueChange={(value: any) => setFormData({ ...formData, outcome: value })}>
          <SelectTrigger className="journal-input">
            <SelectValue placeholder="Select outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="win">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                Win
              </span>
            </SelectItem>
            <SelectItem value="loss">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                Loss
              </span>
            </SelectItem>
            <SelectItem value="breakeven">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                Breakeven
              </span>
            </SelectItem>
            <SelectItem value="open">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                Open
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trade Setup */}
      <div className="space-y-2 journal-form-field">
        <Label htmlFor="setup_description">Trade Setup</Label>
        <Textarea
          id="setup_description"
          value={formData.setup_description}
          onChange={(e) => setFormData({ ...formData, setup_description: e.target.value })}
          placeholder="Describe your trade setup, entry conditions, and strategy..."
          rows={4}
          className="journal-input resize-none focus:scale-[1.01] transition-transform"
        />
      </div>

      {/* Market Analysis */}
      <div className="space-y-2 journal-form-field">
        <Label htmlFor="market_analysis">Market Analysis *</Label>
        <Textarea
          id="market_analysis"
          value={formData.market_analysis}
          onChange={(e) => setFormData({ ...formData, market_analysis: e.target.value })}
          placeholder="What was happening in the market? What indicators or patterns did you observe?"
          rows={6}
          className="journal-input resize-none focus:scale-[1.01] transition-transform"
          required
        />
      </div>

      {/* Mood/Confidence Level */}
      <Card className="p-4 journal-glassmorphism space-y-4">
        <Label className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-primary" />
          Mood / Confidence Level: {selectedMood.emoji} {selectedMood.label}
        </Label>
        <div className="space-y-2">
          <Slider
            value={[formData.confidence_level || 5]}
            onValueChange={(value) => setFormData({ ...formData, confidence_level: value[0] })}
            min={1}
            max={10}
            step={1}
            className="journal-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>😰 Low</span>
            <span>😊 Medium</span>
            <span>💎 High</span>
          </div>
        </div>
      </Card>

      {/* Lessons Learned */}
      <div className="space-y-2 journal-form-field">
        <Label htmlFor="lessons_learned" className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-warning" />
          Lessons Learned
        </Label>
        <Textarea
          id="lessons_learned"
          value={formData.lessons_learned}
          onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
          placeholder="What did you learn from this trade? What would you do differently?"
          rows={3}
          className="journal-input resize-none"
        />
      </div>

      {/* Screenshots/Charts */}
      <Card className="p-4 journal-glassmorphism space-y-3">
        <Label className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Screenshots / Charts
        </Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Drag & drop images or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">Supports: JPG, PNG, WEBP</p>
        </div>
        {formData.chart_screenshot_urls && formData.chart_screenshot_urls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {formData.chart_screenshot_urls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img src={url} alt={`Chart ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    const updated = formData.chart_screenshot_urls?.filter((_, i) => i !== idx);
                    setFormData({ ...formData, chart_screenshot_urls: updated });
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tags (press Enter)"
            className="journal-input"
          />
          <Button type="button" onClick={addTag} variant="outline" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 journal-submit-btn"
          disabled={isSubmitting}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </form>
  );
}
