import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SignalPayload {
  id: string;
  currency_pair: string;
  signal_type: string;
  confidence: string;
  entry_price: number;
  timeframe: string | null;
}

export function useSignalNotifications() {
  const { toast } = useToast();
  const lastNotifiedId = useRef<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('signal-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trading_signals',
        },
        (payload) => {
          const signal = payload.new as SignalPayload;
          if (lastNotifiedId.current === signal.id) return;
          lastNotifiedId.current = signal.id;

          const emoji = signal.signal_type === 'BUY' ? '🟢' : '🔴';

          toast({
            title: `${emoji} New Signal: ${signal.currency_pair}`,
            description: `${signal.signal_type} @ ${signal.entry_price} · ${signal.confidence} confidence${signal.timeframe ? ` · ${signal.timeframe}` : ''}`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
}
