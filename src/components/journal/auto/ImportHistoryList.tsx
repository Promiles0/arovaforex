import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  Mail,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ImportHistoryEntry } from '@/hooks/useImportHistory';

interface ImportHistoryListProps {
  imports: ImportHistoryEntry[];
  isLoading: boolean;
  limit?: number;
}

const importTypeIcons: Record<string, typeof Zap> = {
  mt_sync: Zap,
  file_upload: FileSpreadsheet,
  email_import: Mail,
  manual: Clock,
};

const importTypeLabels: Record<string, string> = {
  mt_sync: 'MT Auto-sync',
  file_upload: 'File upload',
  email_import: 'Email import',
  manual: 'Manual',
};

export function ImportHistoryList({
  imports,
  isLoading,
  limit = 5,
}: ImportHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (imports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No import history yet</p>
      </div>
    );
  }

  const displayedImports = imports.slice(0, limit);

  return (
    <div className="space-y-2">
      {displayedImports.map((importEntry, index) => {
        const Icon = importTypeIcons[importEntry.import_type] || Clock;
        const isSuccess = importEntry.status === 'completed';
        const isFailed = importEntry.status === 'failed';
        const isProcessing = importEntry.status === 'processing';

        return (
          <motion.div
            key={importEntry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              "bg-muted/30 hover:bg-muted/50 transition-colors"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isSuccess && "bg-emerald-500/10",
                isFailed && "bg-destructive/10",
                isProcessing && "bg-amber-500/10"
              )}>
                <Icon className={cn(
                  "w-4 h-4",
                  isSuccess && "text-emerald-500",
                  isFailed && "text-destructive",
                  isProcessing && "text-amber-500"
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {importTypeLabels[importEntry.import_type]}
                  </span>
                  {importEntry.source_name && (
                    <span className="text-xs text-muted-foreground">
                      • {importEntry.source_name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(importEntry.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm">
                {importEntry.trades_imported} trade{importEntry.trades_imported !== 1 ? 's' : ''}
              </span>
              {isSuccess && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              {isFailed && (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
              {isProcessing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}

      {imports.length > limit && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          + {imports.length - limit} more imports
        </p>
      )}
    </div>
  );
}
