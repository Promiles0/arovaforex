import { useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  onResetToDefaults: () => Promise<void>;
}

export function DangerZoneSection({ onResetToDefaults }: Props) {
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleResetSettings = async () => {
    setIsResetting(true);
    try {
      await onResetToDefaults();
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user?.id || confirmText !== 'DELETE') return;

    setIsDeleting(true);
    try {
      // Delete all journal entries
      const { error: entriesError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('user_id', user.id);

      if (entriesError) throw entriesError;

      // Delete all backups from storage
      const { data: backups } = await supabase
        .from('journal_backup_history')
        .select('backup_url')
        .eq('user_id', user.id);

      if (backups && backups.length > 0) {
        const urls = backups.map(b => b.backup_url);
        await supabase.storage.from('journal-backups').remove(urls);
      }

      // Delete backup history
      await supabase
        .from('journal_backup_history')
        .delete()
        .eq('user_id', user.id);

      toast.success('All journal data has been deleted');
      setDeleteDialogOpen(false);
      setConfirmText('');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete data');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AccordionItem value="danger" className="border border-destructive/50 rounded-lg bg-destructive/5 backdrop-blur-sm px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6">
        {/* Reset Settings */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
          <div>
            <Label>Reset Settings to Defaults</Label>
            <p className="text-xs text-muted-foreground">Reset all settings to their default values</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isResetting}>
                {isResetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all your journal settings to their default values. Your journal entries and data will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSettings}>
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Delete All Data */}
        <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5 space-y-4">
          <div>
            <Label className="text-destructive">Delete All Journal Data</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Permanently delete all your journal entries, analytics, and backups. This action cannot be undone.
            </p>
          </div>
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  ⚠️ Delete All Journal Data?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All journal entries</li>
                    <li>All analytics and statistics</li>
                    <li>All backup files</li>
                    <li>All backup history</li>
                  </ul>
                  <p className="font-semibold text-destructive">
                    This action cannot be undone!
                  </p>
                  <div className="pt-2">
                    <Label htmlFor="confirm">Type "DELETE" to confirm</Label>
                    <Input
                      id="confirm"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAllData}
                  disabled={confirmText !== 'DELETE' || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Everything
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
