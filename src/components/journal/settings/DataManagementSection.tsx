import { useState } from 'react';
import { Database, Download, Upload, Trash2, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { JournalSettings, useBackupHistory } from '@/hooks/useJournalSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  settings: JournalSettings;
  onUpdate: <K extends keyof JournalSettings>(key: K, value: JournalSettings[K]) => void;
}

const retentionOptions = [
  { value: 0, label: 'Keep forever' },
  { value: 365, label: '1 year' },
  { value: 730, label: '2 years' },
  { value: 1825, label: '5 years' },
];

export function DataManagementSection({ settings, onUpdate }: Props) {
  const { user } = useAuth();
  const { backups, loading: backupsLoading, createBackup, deleteBackup, downloadBackup } = useBackupHistory();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      await createBackup();
    } finally {
      setIsBackingUp(false);
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    if (!user?.id) return;
    
    setIsExporting(true);
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let content: string;
      let mimeType: string;
      let fileName: string;

      if (format === 'csv') {
        const headers = entries && entries.length > 0 ? Object.keys(entries[0]).join(',') : '';
        const rows = entries?.map(entry => 
          Object.values(entry).map(v => 
            typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
          ).join(',')
        ).join('\n') || '';
        content = `${headers}\n${rows}`;
        mimeType = 'text/csv';
        fileName = `journal-export-${Date.now()}.csv`;
      } else {
        content = JSON.stringify(entries, null, 2);
        mimeType = 'application/json';
        fileName = `journal-export-${Date.now()}.json`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${entries?.length || 0} entries as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AccordionItem value="data" className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Data & Backup Management</h3>
            <p className="text-sm text-muted-foreground">Manage your trading data and backups</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6">
        {/* Auto Backup */}
        <div className="flex items-center justify-between py-2">
          <div className="flex-1">
            <Label>Automatic Backups</Label>
            <p className="text-xs text-muted-foreground">Automatically backup your journal data</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={settings.backup_frequency}
              onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                onUpdate('backup_frequency', value)
              }
              disabled={!settings.auto_backup_enabled}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Switch
              checked={settings.auto_backup_enabled}
              onCheckedChange={(checked) => onUpdate('auto_backup_enabled', checked)}
            />
          </div>
        </div>

        {/* Manual Backup */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Manual Backup</Label>
              <p className="text-xs text-muted-foreground">Create a backup of all your journal data now</p>
            </div>
            <Button 
              onClick={handleCreateBackup} 
              disabled={isBackingUp}
              variant="outline"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </div>

          {/* Backup History */}
          {backups.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Recent Backups</Label>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.slice(0, 5).map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="text-sm">
                          {format(new Date(backup.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="capitalize text-sm">{backup.backup_type}</TableCell>
                        <TableCell className="text-sm">{formatFileSize(backup.file_size)}</TableCell>
                        <TableCell className="text-sm">{backup.entries_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadBackup(backup.backup_url)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBackup(backup.id, backup.backup_url)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Export Data */}
        <div className="space-y-3">
          <Label>Export Data</Label>
          <p className="text-xs text-muted-foreground">Download your journal entries in various formats</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportData('csv')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData('json')}
              disabled={isExporting}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Data Retention */}
        <div className="space-y-2">
          <Label>Data Retention</Label>
          <Select
            value={settings.data_retention_days.toString()}
            onValueChange={(value) => onUpdate('data_retention_days', parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {retentionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Automatically delete entries older than selected period
          </p>
          {settings.data_retention_days > 0 && (
            <p className="text-xs text-amber-500">
              ⚠️ Deleted data cannot be recovered
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
