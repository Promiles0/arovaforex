import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Forecast {
  id: string;
  title: string | null;
  currency_pair: string | null;
  trade_bias: 'long' | 'short' | 'neutral' | null;
  forecast_type: string;
}

export function useArovaForecastNotifications(onNewForecast?: () => void) {
  const { toast } = useToast();
  const lastNotifiedId = useRef<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('arova-forecasts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forecasts',
          filter: 'forecast_type=eq.arova'
        },
        (payload) => {
          const forecast = payload.new as Forecast;
          
          // Prevent duplicate notifications
          if (lastNotifiedId.current === forecast.id) return;
          lastNotifiedId.current = forecast.id;

          const biasEmoji = forecast.trade_bias === 'long' ? '📈' : forecast.trade_bias === 'short' ? '📉' : '➡️';
          const biasText = forecast.trade_bias?.toUpperCase() || 'NEUTRAL';

          toast({
            title: `${biasEmoji} New Arova Forecast!`,
            description: `${forecast.currency_pair || 'Market'} - ${biasText} bias. ${forecast.title || 'Check it out!'}`,
            duration: 8000,
          });

          onNewForecast?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, onNewForecast]);
}
