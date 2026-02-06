import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { BrokerConnection } from '@/hooks/useBrokerConnections';

interface ConnectionStatusBarProps {
  connection: BrokerConnection | null;
  onSettings: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function ConnectionStatusBar({
  connection,
  onSettings,
  onSync,
  isSyncing = false,
}: ConnectionStatusBarProps) {
  if (!connection) return null;

  const isConnected = connection.status === 'active';
  const lastSyncText = connection.last_sync_at
    ? formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })
    : 'Never synced';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl mb-4",
        isConnected
          ? "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30"
          : "bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/30"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isConnected ? "bg-emerald-500/20" : "bg-destructive/20"
        )}>
          {isConnected ? (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-5 h-5 text-emerald-500" />
            </motion.div>
          ) : (
            <WifiOff className="w-5 h-5 text-destructive" />
          )}
        </div>

        {/* Connection details */}
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-destructive"
            )} />
            <span className="font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}:{' '}
              <span className="text-muted-foreground">
                {connection.platform?.toUpperCase()}{' '}
                {connection.account_number && `#${connection.account_number}`}
                {connection.broker_name && ` | ${connection.broker_name}`}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last sync: {lastSyncText}
            </span>
            <span>Auto-sync: {connection.sync_frequency === 'manual' ? 'OFF' : 'ON'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {onSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing || !isConnected}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettings}
          className="flex-1 sm:flex-none"
        >
          <Settings className="w-4 h-4 mr-1.5" />
          Settings
        </Button>
      </div>
    </motion.div>
  );
}
