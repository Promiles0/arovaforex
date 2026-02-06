import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ImportHistoryEntry {
  id: string;
  user_id: string;
  connection_id: string | null;
  import_type: 'mt_sync' | 'file_upload' | 'email_import' | 'manual';
  source_name: string | null;
  trades_imported: number;
  trades_skipped: number;
  status: 'processing' | 'completed' | 'partial' | 'failed';
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseImportHistoryReturn {
  imports: ImportHistoryEntry[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useImportHistory(limit: number = 10): UseImportHistoryReturn {
  const { user } = useAuth();
  const [imports, setImports] = useState<ImportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchImports = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('import_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setImports((data || []) as ImportHistoryEntry[]);
    } catch (error) {
      console.error('Error fetching import history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  return {
    imports,
    isLoading,
    refetch: fetchImports,
  };
}
