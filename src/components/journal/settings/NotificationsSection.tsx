import { Bell, Mail, Smartphone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { JournalSettings } from '@/hooks/useJournalSettings';
import { cn } from '@/lib/utils';

interface Props {
  settings: JournalSettings;
  onUpdate: <K extends keyof JournalSettings>(key: K, value: JournalSettings[K]) => void;
}

const weekdays = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
];

const inactivityOptions = [
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
];

export function NotificationsSection({ settings, onUpdate }: Props) {
  const isDisabled = settings.notification_method === 'disabled';

  return (
    <AccordionItem value="notifications" className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Notification Preferences</h3>
            <p className="text-sm text-muted-foreground">Choose when and how you receive notifications</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6">
        {/* Notification Method */}
        <div className="space-y-3">
          <Label className="text-base">Notification Method</Label>
          <RadioGroup
            value={settings.notification_method}
            onValueChange={(value: 'email' | 'in_app' | 'both' | 'disabled') => 
              onUpdate('notification_method', value)
            }
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          >
            <div className={cn(
              "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
              settings.notification_method === 'email' && "border-primary bg-primary/10"
            )}>
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email" className="cursor-pointer flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
            </div>
            <div className={cn(
              "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
              settings.notification_method === 'in_app' && "border-primary bg-primary/10"
            )}>
              <RadioGroupItem value="in_app" id="in_app" />
              <Label htmlFor="in_app" className="cursor-pointer flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                In-App
              </Label>
            </div>
            <div className={cn(
              "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
              settings.notification_method === 'both' && "border-primary bg-primary/10"
            )}>
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="cursor-pointer">Both</Label>
            </div>
            <div className={cn(
              "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
              settings.notification_method === 'disabled' && "border-destructive bg-destructive/10"
            )}>
              <RadioGroupItem value="disabled" id="disabled" />
              <Label htmlFor="disabled" className="cursor-pointer">Disabled</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Notification Types */}
        <div className={cn("space-y-4", isDisabled && "opacity-50 pointer-events-none")}>
          <Label className="text-base">Notification Types</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Milestone Achievements</Label>
                <p className="text-xs text-muted-foreground">Notify me when I reach profit milestones</p>
              </div>
              <Switch
                checked={settings.notify_milestone_achieved}
                onCheckedChange={(checked) => onUpdate('notify_milestone_achieved', checked)}
                disabled={isDisabled}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label>Weekly Performance Summary</Label>
                <p className="text-xs text-muted-foreground">Receive weekly trading performance summary</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={settings.weekly_summary_day}
                  onValueChange={(value) => onUpdate('weekly_summary_day', value)}
                  disabled={isDisabled || !settings.notify_weekly_summary}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdays.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Switch
                  checked={settings.notify_weekly_summary}
                  onCheckedChange={(checked) => onUpdate('notify_weekly_summary', checked)}
                  disabled={isDisabled}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Monthly Performance Report</Label>
                <p className="text-xs text-muted-foreground">Receive detailed monthly report</p>
              </div>
              <Switch
                checked={settings.notify_monthly_report}
                onCheckedChange={(checked) => onUpdate('notify_monthly_report', checked)}
                disabled={isDisabled}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Mentor Feedback</Label>
                <p className="text-xs text-muted-foreground">Notify when mentor comments on trades</p>
              </div>
              <Switch
                checked={settings.notify_mentor_feedback}
                onCheckedChange={(checked) => onUpdate('notify_mentor_feedback', checked)}
                disabled={isDisabled}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Goal Reminders</Label>
                <p className="text-xs text-muted-foreground">Remind me about my trading goals</p>
              </div>
              <Switch
                checked={settings.notify_goal_reminder}
                onCheckedChange={(checked) => onUpdate('notify_goal_reminder', checked)}
                disabled={isDisabled}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <Label>Inactivity Reminder</Label>
                <p className="text-xs text-muted-foreground">Remind me if I haven't logged trades</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={settings.inactivity_days.toString()}
                  onValueChange={(value) => onUpdate('inactivity_days', parseInt(value))}
                  disabled={isDisabled || !settings.notify_inactivity}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {inactivityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Switch
                  checked={settings.notify_inactivity}
                  onCheckedChange={(checked) => onUpdate('notify_inactivity', checked)}
                  disabled={isDisabled}
                />
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
