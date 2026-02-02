import { Palette, Globe, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { JournalSettings } from '@/hooks/useJournalSettings';
import { format } from 'date-fns';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'RWF'];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
];

interface Props {
  settings: JournalSettings;
  onUpdate: <K extends keyof JournalSettings>(key: K, value: JournalSettings[K]) => void;
}

const defaultTimezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow', 'Europe/Istanbul',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland', 'Africa/Johannesburg',
  'Africa/Cairo', 'Africa/Lagos', 'Africa/Kigali'
];

function getTimezones(): string[] {
  try {
    // Check if supportedValuesOf exists and call it dynamically to avoid TS errors
    const intlAny = Intl as { supportedValuesOf?: (key: string) => string[] };
    if (intlAny.supportedValuesOf) {
      return intlAny.supportedValuesOf('timeZone');
    }
  } catch {
    // Fallback if not supported
  }
  return defaultTimezones;
}

export function DisplayPreferencesSection({ settings, onUpdate }: Props) {
  const timezones = getTimezones();

  const formatPreview = () => {
    const now = new Date();
    const dateStr = settings.date_format === 'DD MMM YYYY' 
      ? format(now, 'dd MMM yyyy')
      : settings.date_format === 'YYYY-MM-DD'
      ? format(now, 'yyyy-MM-dd')
      : settings.date_format === 'DD/MM/YYYY'
      ? format(now, 'dd/MM/yyyy')
      : format(now, 'MM/dd/yyyy');
    
    const timeStr = settings.time_format === '24h'
      ? format(now, 'HH:mm')
      : format(now, 'h:mm a');
    
    return `${dateStr} ${timeStr}`;
  };

  return (
    <AccordionItem value="display" className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Display & Format Preferences</h3>
            <p className="text-sm text-muted-foreground">Customize how your journal data is displayed</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6">
        {/* Currency */}
        <div className="space-y-2">
          <Label>Default Currency</Label>
          <Select
            value={settings.default_currency}
            onValueChange={(value) => onUpdate('default_currency', value)}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Default currency for profit/loss calculations</p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Timezone
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={settings.timezone}
              onValueChange={(value) => onUpdate('timezone', value)}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)}
            >
              Detect my timezone
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Used for trade timestamps</p>
        </div>

        {/* Date Format */}
        <div className="space-y-3">
          <Label>Date Format</Label>
          <RadioGroup
            value={settings.date_format}
            onValueChange={(value) => onUpdate('date_format', value)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {dateFormats.map((df) => (
              <div key={df.value} className="flex items-center space-x-2">
                <RadioGroupItem value={df.value} id={df.value} />
                <Label htmlFor={df.value} className="cursor-pointer text-sm">
                  {df.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Time Format */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              24-Hour Time Format
            </Label>
            <p className="text-xs text-muted-foreground">
              Preview: {settings.time_format === '24h' ? '14:30' : '2:30 PM'}
            </p>
          </div>
          <Switch
            checked={settings.time_format === '24h'}
            onCheckedChange={(checked) => onUpdate('time_format', checked ? '24h' : '12h')}
          />
        </div>

        {/* Live Preview */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Live Preview</p>
          <p className="font-mono text-sm">{formatPreview()}</p>
        </div>

        {/* Entries Per Page */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Entries Per Page</Label>
            <span className="text-sm font-medium">{settings.entries_per_page}</span>
          </div>
          <Slider
            value={[settings.entries_per_page]}
            onValueChange={([value]) => onUpdate('entries_per_page', value)}
            min={10}
            max={100}
            step={10}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Number of journal entries to show per page</p>
        </div>

        {/* Enable Animations */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label>Enable Animations</Label>
            <p className="text-xs text-muted-foreground">Disable for better performance on slower devices</p>
          </div>
          <Switch
            checked={settings.enable_animations}
            onCheckedChange={(checked) => onUpdate('enable_animations', checked)}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
