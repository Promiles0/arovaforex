import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache
interface CachedData {
  data: any;
  lastUpdated: number;
  timeframe: string;
}

const cache = new Map<string, CachedData>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// All 28 forex pairs for complete matrix
const ALL_FOREX_PAIRS = [
  // USD Base Pairs (7)
  'EUR/USD', 'GBP/USD', 'AUD/USD', 'NZD/USD', 'USD/JPY', 'USD/CAD', 'USD/CHF',
  // EUR Cross Pairs (6)
  'EUR/GBP', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'EUR/NZD',
  // GBP Cross Pairs (5)
  'GBP/JPY', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/NZD',
  // JPY Cross Pairs (4)
  'AUD/JPY', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY',
  // AUD Cross Pairs (3)
  'AUD/CAD', 'AUD/CHF', 'AUD/NZD',
  // CAD Cross Pairs (2)
  'CAD/CHF', 'CAD/NZD',
  // CHF Cross Pairs (1)
  'CHF/NZD'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

interface ForexPair {
  symbol: string;
  price: number;
  percentChange: number;
  timestamp: string;
}

interface CurrencyStrength {
  currency: string;
  strength: number;
  normalizedStrength: number;
}

async function fetchBatch(symbols: string, apiKey: string): Promise<ForexPair[]> {
  try {
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    const results: ForexPair[] = [];
    
    // Handle both single and multiple symbol responses
    if (data && typeof data === 'object') {
      // Check if it's a single symbol response
      if (data.symbol && data.close && !data.code) {
        results.push({
          symbol: data.symbol,
          price: parseFloat(data.close) || 0,
          percentChange: parseFloat(data.percent_change) || 0,
          timestamp: data.datetime || new Date().toISOString()
        });
      } else {
        // Multiple symbols response
        for (const key of Object.keys(data)) {
          const quote = data[key];
          if (quote && quote.close && !quote.code) {
            results.push({
              symbol: quote.symbol || key,
              price: parseFloat(quote.close) || 0,
              percentChange: parseFloat(quote.percent_change) || 0,
              timestamp: quote.datetime || new Date().toISOString()
            });
          }
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching batch:', error);
    return [];
  }
}

async function fetchFromTwelveData(apiKey: string): Promise<{ pairs: ForexPair[], gold: ForexPair | null }> {
  console.log('Fetching from Twelve Data API (all 28 pairs + gold)...');
  
  try {
    // Batch requests to stay within rate limits
    // Batch 1: USD pairs + Gold (8 symbols)
    const batch1 = ['EUR/USD', 'GBP/USD', 'AUD/USD', 'NZD/USD', 'USD/JPY', 'USD/CAD', 'USD/CHF', 'XAU/USD'].join(',');
    // Batch 2: EUR crosses (6 symbols)
    const batch2 = ['EUR/GBP', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'EUR/NZD'].join(',');
    // Batch 3: GBP crosses (5 symbols)
    const batch3 = ['GBP/JPY', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/NZD'].join(',');
    // Batch 4: JPY crosses (4 symbols)
    const batch4 = ['AUD/JPY', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY'].join(',');
    // Batch 5: Remaining crosses (6 symbols)
    const batch5 = ['AUD/CAD', 'AUD/CHF', 'AUD/NZD', 'CAD/CHF', 'CAD/NZD', 'CHF/NZD'].join(',');
    
    // Fetch all batches in parallel
    const [data1, data2, data3, data4, data5] = await Promise.all([
      fetchBatch(batch1, apiKey),
      fetchBatch(batch2, apiKey),
      fetchBatch(batch3, apiKey),
      fetchBatch(batch4, apiKey),
      fetchBatch(batch5, apiKey)
    ]);
    
    // Combine all results
    const allData = [...data1, ...data2, ...data3, ...data4, ...data5];
    
    // Separate gold from forex pairs
    const gold = allData.find(p => p.symbol === 'XAU/USD') || null;
    const pairs = allData.filter(p => p.symbol !== 'XAU/USD');
    
    console.log(`Fetched ${pairs.length} forex pairs and gold: ${gold ? 'yes' : 'no'}`);
    
    return { pairs, gold };
  } catch (error) {
    console.error('Error fetching from Twelve Data:', error);
    throw error;
  }
}

function calculateCurrencyStrength(pairs: ForexPair[]): CurrencyStrength[] {
  const strength: Record<string, number> = {};
  CURRENCIES.forEach(c => strength[c] = 0);
  
  pairs.forEach(pair => {
    const [base, quote] = pair.symbol.split('/');
    const change = pair.percentChange;
    
    if (strength[base] !== undefined) {
      strength[base] += change;
    }
    if (strength[quote] !== undefined) {
      strength[quote] -= change;
    }
  });
  
  // Calculate normalized values
  const values = Object.values(strength);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  
  return CURRENCIES.map(currency => ({
    currency,
    strength: strength[currency],
    normalizedStrength: range > 0 
      ? ((strength[currency] - min) / range) * 200 - 100 
      : 0
  })).sort((a, b) => b.strength - a.strength);
}

function generatePairMatrix(pairs: ForexPair[]): Record<string, Record<string, { price: number; change: number } | null>> {
  const matrix: Record<string, Record<string, { price: number; change: number } | null>> = {};
  
  // Initialize matrix
  CURRENCIES.forEach(base => {
    matrix[base] = {};
    CURRENCIES.forEach(quote => {
      matrix[base][quote] = null;
    });
  });
  
  // Fill in the pairs we have data for
  pairs.forEach(pair => {
    const [base, quote] = pair.symbol.split('/');
    if (matrix[base] && matrix[base][quote] !== undefined) {
      matrix[base][quote] = {
        price: pair.price,
        change: pair.percentChange
      };
    }
    // Also calculate the inverse
    if (matrix[quote] && matrix[quote][base] !== undefined) {
      matrix[quote][base] = {
        price: pair.price > 0 ? 1 / pair.price : 0,
        change: -pair.percentChange
      };
    }
  });
  
  return matrix;
}

function generateDemoData(): { pairs: ForexPair[], gold: ForexPair } {
  const demoPairs = ALL_FOREX_PAIRS.map(symbol => ({
    symbol,
    price: symbol.includes('JPY') ? 140 + Math.random() * 20 : 0.8 + Math.random() * 0.8,
    percentChange: (Math.random() - 0.5) * 2,
    timestamp: new Date().toISOString()
  }));
  
  const gold = {
    symbol: 'XAU/USD',
    price: 2040 + Math.random() * 20,
    percentChange: (Math.random() - 0.5) * 3,
    timestamp: new Date().toISOString()
  };
  
  return { pairs: demoPairs, gold };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '1D';
    const cacheKey = `market-data-${timeframe}`;
    
    const now = Date.now();
    const cached = cache.get(cacheKey);
    
    // Check if cache is still valid
    if (cached && (now - cached.lastUpdated) < CACHE_DURATION) {
      console.log('Returning cached data');
      return new Response(
        JSON.stringify({
          ...cached.data,
          fromCache: true,
          cacheAge: Math.round((now - cached.lastUpdated) / 1000),
          nextRefresh: Math.round((CACHE_DURATION - (now - cached.lastUpdated)) / 1000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch fresh data
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      console.log('TWELVE_DATA_API_KEY not configured, using demo data');
      const { pairs, gold } = generateDemoData();
      const strength = calculateCurrencyStrength(pairs);
      const matrix = generatePairMatrix(pairs);
      
      return new Response(
        JSON.stringify({
          pairs,
          gold,
          strength,
          matrix,
          lastUpdated: new Date().toISOString(),
          timeframe,
          isDemo: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { pairs, gold } = await fetchFromTwelveData(apiKey);
    
    if (pairs.length === 0) {
      // Return fallback demo data
      console.log('No data from API, using demo data');
      const demoData = generateDemoData();
      const strength = calculateCurrencyStrength(demoData.pairs);
      const matrix = generatePairMatrix(demoData.pairs);
      
      return new Response(
        JSON.stringify({
          pairs: demoData.pairs,
          gold: demoData.gold,
          strength,
          matrix,
          lastUpdated: new Date().toISOString(),
          timeframe,
          isDemo: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const strength = calculateCurrencyStrength(pairs);
    const matrix = generatePairMatrix(pairs);
    
    const responseData = {
      pairs,
      gold,
      strength,
      matrix,
      lastUpdated: new Date().toISOString(),
      timeframe,
      fromCache: false
    };
    
    // Update cache
    cache.set(cacheKey, {
      data: responseData,
      lastUpdated: now,
      timeframe
    });
    
    console.log('Returning fresh data with', pairs.length, 'pairs');
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in market-data function:', error);
    
    // Try to return cached data if available
    const cached = cache.get('market-data-1D');
    if (cached) {
      return new Response(
        JSON.stringify({
          ...cached.data,
          fromCache: true,
          error: 'Using cached data - API temporarily unavailable'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch market data' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
