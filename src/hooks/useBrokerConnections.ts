import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface BrokerConnection {
  id: string;
  user_id: string;
  connection_type: 'metatrader' | 'file_upload' | 'email';
  broker_name: string | null;
  account_number: string | null;
  connection_code: string | null;
  platform: 'mt4' | 'mt5' | null;
  status: 'pending' | 'active' | 'disconnected' | 'error';
  last_sync_at: string | null;
  sync_frequency: 'realtime' | '5min' | '15min' | 'manual';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateConnectionData {
  connection_type: 'metatrader' | 'file_upload' | 'email';
  broker_name?: string;
  account_number?: string;
  platform?: 'mt4' | 'mt5';
}

interface UseBrokerConnectionsReturn {
  connections: BrokerConnection[];
  activeConnection: BrokerConnection | null;
  isLoading: boolean;
  createConnection: (data: CreateConnectionData) => Promise<BrokerConnection | null>;
  updateConnection: (id: string, data: Partial<BrokerConnection>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  generateConnectionCode: () => string;
  refreshConnections: () => Promise<void>;
}

// Generate a unique connection code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ARV-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useBrokerConnections(): UseBrokerConnectionsReturn {
  const { user } = useAuth();
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('broker_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections((data || []) as BrokerConnection[]);
    } catch (error) {
      console.error('Error fetching broker connections:', error);
      toast.error('Failed to load broker connections');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const activeConnection = connections.find(c => c.status === 'active') || null;

  const createConnection = useCallback(async (data: CreateConnectionData): Promise<BrokerConnection | null> => {
    if (!user?.id) return null;

    try {
      const connectionCode = generateCode();
      
      const { data: newConnection, error } = await supabase
        .from('broker_connections')
        .insert({
          user_id: user.id,
          connection_type: data.connection_type,
          broker_name: data.broker_name || null,
          account_number: data.account_number || null,
          platform: data.platform || null,
          connection_code: connectionCode,
          status: 'pending',
          sync_frequency: 'realtime',
          metadata: {},
        })
        .select()
        .single();

      if (error) throw error;

      setConnections(prev => [newConnection as BrokerConnection, ...prev]);
      return newConnection as BrokerConnection;
    } catch (error) {
      console.error('Error creating broker connection:', error);
      toast.error('Failed to create connection');
      return null;
    }
  }, [user?.id]);

  const updateConnection = useCallback(async (id: string, data: Partial<BrokerConnection>) => {
    if (!user?.id) return;

    try {
      // Remove properties that shouldn't be updated directly
      const { metadata, ...updateData } = data;
      const { error } = await supabase
        .from('broker_connections')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setConnections(prev =>
        prev.map(c => (c.id === id ? { ...c, ...data } : c))
      );
      toast.success('Connection updated');
    } catch (error) {
      console.error('Error updating broker connection:', error);
      toast.error('Failed to update connection');
    }
  }, [user?.id]);

  const deleteConnection = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setConnections(prev => prev.filter(c => c.id !== id));
      toast.success('Connection removed');
    } catch (error) {
      console.error('Error deleting broker connection:', error);
      toast.error('Failed to remove connection');
    }
  }, [user?.id]);

  return {
    connections,
    activeConnection,
    isLoading,
    createConnection,
    updateConnection,
    deleteConnection,
    generateConnectionCode: generateCode,
    refreshConnections: fetchConnections,
  };
}
