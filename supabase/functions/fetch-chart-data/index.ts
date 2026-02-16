import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval } = await req.json();
    
    const API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!API_KEY) {
      throw new Error('TWELVE_DATA_API_KEY not configured');
    }

    // Map symbol format for Twelve Data
    const formattedSymbol = symbol.includes('/') ? symbol : `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
    
    // Map intervals
    const intervalMap: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '30m': '30min',
      '1h': '1h',
      '4h': '4h',
      '1d': '1day',
    };
    
    const apiInterval = intervalMap[interval] || '15min';
    
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(formattedSymbol)}&interval=${apiInterval}&outputsize=500&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'API error');
    }
    
    if (!data.values || !Array.isArray(data.values)) {
      throw new Error('No data available for this symbol/interval');
    }
    
    // Convert to chart format (Twelve Data returns newest first, we need oldest first)
    const chartData = data.values
      .map((v: any) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
      }))
      .reverse();
    
    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        interval,
        data: chartData,
        cached_at: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
