import { BarChart3, Brain, Target, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { JournalSettings } from '@/hooks/useJournalSettings';
import { cn } from '@/lib/utils';

interface Props {
  settings: JournalSettings;
  onUpdate: <K extends keyof JournalSettings>(key: K, value: JournalSettings[K]) => void;
}

export function AnalyticsSection({ settings, onUpdate }: Props) {
  return (
    <AccordionItem value="analytics" className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Analytics Preferences</h3>
            <p className="text-sm text-muted-foreground">Configure what analytics and metrics to track</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6">
        {/* Emotion Tracking */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Emotion Tracking
            </Label>
            <p className="text-xs text-muted-foreground">Track your emotional state before/after trades</p>
          </div>
          <Switch
            checked={settings.show_emotion_tracking}
            onCheckedChange={(checked) => onUpdate('show_emotion_tracking', checked)}
          />
        </div>

        {/* Advanced Metrics */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="flex items-center gap-2">
              Show Advanced Metrics
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Advanced metrics include Sharpe ratio, Sortino ratio, max drawdown, profit factor, and more detailed statistical analysis.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <p className="text-xs text-muted-foreground">Display advanced statistics like Sharpe ratio, drawdown, etc.</p>
          </div>
          <Switch
            checked={settings.show_advanced_metrics}
            onCheckedChange={(checked) => onUpdate('show_advanced_metrics', checked)}
          />
        </div>

        {/* Trading Psychology */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Track Trading Psychology</Label>
            <p className="text-xs text-muted-foreground">Log mental state, discipline, and rule adherence</p>
          </div>
          <Switch
            checked={settings.track_trading_psychology}
            onCheckedChange={(checked) => onUpdate('track_trading_psychology', checked)}
          />
        </div>

        {/* Auto-Calculate Statistics */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Auto-Calculate Statistics</Label>
            <p className="text-xs text-muted-foreground">Automatically update performance statistics after each trade</p>
          </div>
          <Switch
            checked={settings.auto_calculate_statistics}
            onCheckedChange={(checked) => onUpdate('auto_calculate_statistics', checked)}
          />
        </div>

        {/* Goal Tracking */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Goal Tracking
            </Label>
            <Switch
              checked={settings.enable_goal_tracking}
              onCheckedChange={(checked) => onUpdate('enable_goal_tracking', checked)}
            />
          </div>

          <div className={cn(
            "space-y-4 transition-opacity",
            !settings.enable_goal_tracking && "opacity-50 pointer-events-none"
          )}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Monthly Profit Target</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={settings.monthly_profit_target ?? ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null;
                      onUpdate('monthly_profit_target', value);
                    }}
                    className="pl-8"
                    disabled={!settings.enable_goal_tracking}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Win Rate Target</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={settings.win_rate_target ?? ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null;
                      onUpdate('win_rate_target', value);
                    }}
                    className="pr-8"
                    min={0}
                    max={100}
                    disabled={!settings.enable_goal_tracking}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Drawdown Limit</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={settings.max_drawdown_limit ?? ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null;
                      onUpdate('max_drawdown_limit', value);
                    }}
                    className="pr-8"
                    min={0}
                    max={100}
                    disabled={!settings.enable_goal_tracking}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
