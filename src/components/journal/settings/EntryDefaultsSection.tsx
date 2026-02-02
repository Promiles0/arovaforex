import { FileEdit, Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { JournalSettings } from '@/hooks/useJournalSettings';

interface Props {
  settings: JournalSettings;
  onUpdate: <K extends keyof JournalSettings>(key: K, value: JournalSettings[K]) => void;
}

export function EntryDefaultsSection({ settings, onUpdate }: Props) {
  const adjustRatio = (delta: number) => {
    const newValue = Math.max(0.5, Math.min(10, settings.default_risk_reward_ratio + delta));
    onUpdate('default_risk_reward_ratio', parseFloat(newValue.toFixed(1)));
  };

  const adjustRisk = (delta: number) => {
    const newValue = Math.max(0.1, Math.min(5, settings.default_risk_percentage + delta));
    onUpdate('default_risk_percentage', parseFloat(newValue.toFixed(1)));
  };

  return (
    <AccordionItem value="entry-defaults" className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileEdit className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Default Entry Settings</h3>
            <p className="text-sm text-muted-foreground">Set default values for new journal entries</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6">
        {/* Default R:R Ratio */}
        <div className="space-y-2">
          <Label>Default Risk/Reward Ratio</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustRatio(-0.1)}
              disabled={settings.default_risk_reward_ratio <= 0.5}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={settings.default_risk_reward_ratio}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0.5 && value <= 10) {
                  onUpdate('default_risk_reward_ratio', value);
                }
              }}
              className="w-24 text-center"
              step={0.1}
              min={0.5}
              max={10}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustRatio(0.1)}
              disabled={settings.default_risk_reward_ratio >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">:1</span>
          </div>
          <p className="text-xs text-muted-foreground">Default R:R ratio when creating new entries</p>
        </div>

        {/* Default Risk Percentage */}
        <div className="space-y-2">
          <Label>Default Risk Percentage</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustRisk(-0.1)}
              disabled={settings.default_risk_percentage <= 0.1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Input
                type="number"
                value={settings.default_risk_percentage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0.1 && value <= 5) {
                    onUpdate('default_risk_percentage', value);
                  }
                }}
                className="w-24 text-center pr-6"
                step={0.1}
                min={0.1}
                max={5}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustRisk(0.1)}
              disabled={settings.default_risk_percentage >= 5}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Default account risk per trade</p>
        </div>

        {/* Position Size Method */}
        <div className="space-y-3">
          <Label>Position Size Calculation</Label>
          <RadioGroup
            value={settings.default_position_size_method}
            onValueChange={(value: 'percentage' | 'fixed' | 'units') => 
              onUpdate('default_position_size_method', value)
            }
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage" className="cursor-pointer">Percentage of account</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label htmlFor="fixed" className="cursor-pointer">Fixed dollar amount</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="units" id="units" />
              <Label htmlFor="units" className="cursor-pointer">Units/Lots</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">How position size is calculated by default</p>
        </div>

        {/* Required Fields */}
        <div className="space-y-4">
          <Label className="text-base">Required Fields</Label>
          <p className="text-xs text-muted-foreground -mt-2">Make these fields mandatory when creating entries</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Require Screenshots</Label>
                <p className="text-xs text-muted-foreground">Force users to attach trade screenshots</p>
              </div>
              <Switch
                checked={settings.require_screenshots}
                onCheckedChange={(checked) => onUpdate('require_screenshots', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Require Trade Plan</Label>
                <p className="text-xs text-muted-foreground">Must fill out pre-trade plan section</p>
              </div>
              <Switch
                checked={settings.require_trade_plan}
                onCheckedChange={(checked) => onUpdate('require_trade_plan', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Require Post-Trade Review</Label>
                <p className="text-xs text-muted-foreground">Must complete review after closing trade</p>
              </div>
              <Switch
                checked={settings.require_post_trade_review}
                onCheckedChange={(checked) => onUpdate('require_post_trade_review', checked)}
              />
            </div>
          </div>
        </div>

        {/* Auto-fill Last Values */}
        <div className="flex items-center justify-between py-2 border-t border-border/50 pt-4">
          <div>
            <Label>Auto-fill Last Used Values</Label>
            <p className="text-xs text-muted-foreground">Automatically populate fields with values from your last entry</p>
          </div>
          <Switch
            checked={settings.auto_fill_last_values}
            onCheckedChange={(checked) => onUpdate('auto_fill_last_values', checked)}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
