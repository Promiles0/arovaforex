import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PriceAlert {
  id: string;
  user_id: string;
  currency_pair: string;
  target_price: number;
  direction: 'above' | 'below';
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data as PriceAlert[]) || []);
    } catch (error) {
      console.error('Error fetching price alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = async (
    currencyPair: string,
    targetPrice: number,
    direction: 'above' | 'below'
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create price alerts.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          currency_pair: currencyPair,
          target_price: targetPrice,
          direction,
        });

      if (error) throw error;

      toast({
        title: "Alert Created",
        description: `You'll be notified when ${currencyPair} goes ${direction} ${targetPrice}`,
      });

      await fetchAlerts();
      return true;
    } catch (error: any) {
      console.error('Error creating price alert:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create price alert",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Deleted",
        description: "Price alert has been removed.",
      });

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      return true;
    } catch (error: any) {
      console.error('Error deleting price alert:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete price alert",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkAlerts = useCallback(async (currentPrices: Record<string, number>) => {
    if (!user || alerts.length === 0) return;

    const triggeredAlerts: PriceAlert[] = [];

    for (const alert of alerts) {
      if (alert.is_triggered) continue;

      const currentPrice = currentPrices[alert.currency_pair];
      if (currentPrice === undefined) continue;

      const shouldTrigger = 
        (alert.direction === 'above' && currentPrice >= alert.target_price) ||
        (alert.direction === 'below' && currentPrice <= alert.target_price);

      if (shouldTrigger) {
        triggeredAlerts.push(alert);
      }
    }

    // Update triggered alerts in database
    for (const alert of triggeredAlerts) {
      await supabase
        .from('price_alerts')
        .update({ 
          is_triggered: true, 
          triggered_at: new Date().toISOString() 
        })
        .eq('id', alert.id);

      toast({
        title: "🔔 Price Alert Triggered!",
        description: `${alert.currency_pair} has gone ${alert.direction} ${alert.target_price}`,
      });
    }

    if (triggeredAlerts.length > 0) {
      await fetchAlerts();
    }
  }, [alerts, user, toast, fetchAlerts]);

  const getAlertsForPair = useCallback((currencyPair: string) => {
    return alerts.filter(a => a.currency_pair === currencyPair && !a.is_triggered);
  }, [alerts]);

  return {
    alerts,
    loading,
    createAlert,
    deleteAlert,
    checkAlerts,
    getAlertsForPair,
    refetch: fetchAlerts,
  };
}
