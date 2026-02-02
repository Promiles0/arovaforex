import { useState } from 'react';
import { Lock, Eye, Users, Copy, Check, Link2, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { JournalSettings } from '@/hooks/useJournalSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  settings: JournalSettings;
  onUpdate: <K extends keyof JournalSettings>(key: K, value: JournalSettings[K]) => void;
}

const visibilityOptions = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can view',
    icon: Lock,
  },
  {
    value: 'mentors_only',
    label: 'Mentors Only',
    description: 'Only assigned mentors can view',
    icon: Users,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone with the link can view (read-only)',
    icon: Eye,
  },
];

export function PrivacySharingSection({ settings, onUpdate }: Props) {
  const [copied, setCopied] = useState(false);

  const generateShareLink = () => {
    const link = `${window.location.origin}/shared/journal/${crypto.randomUUID()}`;
    onUpdate('share_link', link);
    toast.success('Share link generated!');
  };

  const copyLink = async () => {
    if (settings.share_link) {
      await navigator.clipboard.writeText(settings.share_link);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const revokeLink = () => {
    onUpdate('share_link', null);
    toast.success('Share link revoked');
  };

  return (
    <AccordionItem value="privacy" className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Privacy & Sharing Settings</h3>
            <p className="text-sm text-muted-foreground">Control who can see your trading journal</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6">
        {/* Journal Visibility */}
        <div className="space-y-3">
          <Label className="text-base">Journal Visibility</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = settings.journal_visibility === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => onUpdate('journal_visibility', option.value as 'private' | 'mentors_only' | 'public')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border/50 hover:border-primary/50"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-medium text-sm", isSelected && "text-primary")}>{option.label}</span>
                  <span className="text-xs text-muted-foreground text-center">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mentor Access (conditional) */}
        {settings.journal_visibility !== 'private' && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mentor Access
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Mentors to View Journal</Label>
                  <p className="text-xs text-muted-foreground">Grant your mentors access to view your entries</p>
                </div>
                <Switch
                  checked={settings.allow_mentors_view}
                  onCheckedChange={(checked) => onUpdate('allow_mentors_view', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Mentors to Comment</Label>
                  <p className="text-xs text-muted-foreground">Mentors can leave feedback on your trades</p>
                </div>
                <Switch
                  checked={settings.allow_mentors_comment}
                  onCheckedChange={(checked) => onUpdate('allow_mentors_comment', checked)}
                  disabled={!settings.allow_mentors_view}
                />
              </div>
            </div>
          </div>
        )}

        {/* Statistics Sharing */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Share Performance Statistics</Label>
            <p className="text-xs text-muted-foreground">Allow others to see your performance metrics (win rate, profit factor, etc.)</p>
          </div>
          <Switch
            checked={settings.share_statistics}
            onCheckedChange={(checked) => onUpdate('share_statistics', checked)}
          />
        </div>

        {/* Anonymous Sharing */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Anonymous Sharing</Label>
            <p className="text-xs text-muted-foreground">Hide your name when sharing journal publicly</p>
          </div>
          <Switch
            checked={settings.anonymous_sharing}
            onCheckedChange={(checked) => onUpdate('anonymous_sharing', checked)}
            disabled={settings.journal_visibility === 'private'}
          />
        </div>

        {/* Share Link */}
        {settings.journal_visibility !== 'private' && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Shareable Link
            </Label>
            
            {settings.share_link ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={settings.share_link}
                    readOnly
                    className="text-sm font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={revokeLink}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Anyone with this link can view your journal</p>
              </div>
            ) : (
              <Button onClick={generateShareLink} variant="outline" className="w-full sm:w-auto">
                <Link2 className="h-4 w-4 mr-2" />
                Generate Shareable Link
              </Button>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
