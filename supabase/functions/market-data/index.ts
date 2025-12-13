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

const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD'
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

async function fetchFromTwelveData(apiKey: string): Promise<{ pairs: ForexPair[], gold: ForexPair | null }> {
  const allSymbols = [...FOREX_PAIRS, 'XAU/USD'];
  const symbolsString = allSymbols.join(',');
  
  console.log('Fetching from Twelve Data API...');
  
  try {
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolsString)}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Twelve Data API response received');
    
    const pairs: ForexPair[] = [];
    let gold: ForexPair | null = null;
    
    // Handle both single and multiple symbol responses
    if (Array.isArray(data) || (data && typeof data === 'object')) {
      for (const symbol of allSymbols) {
        const quote = data[symbol] || data;
        
        if (quote && quote.close && !quote.code) {
          const pairData: ForexPair = {
            symbol: symbol,
            price: parseFloat(quote.close) || 0,
            percentChange: parseFloat(quote.percent_change) || 0,
            timestamp: quote.datetime || new Date().toISOString()
          };
          
          if (symbol === 'XAU/USD') {
            gold = pairData;
          } else {
            pairs.push(pairData);
          }
        }
      }
    }
    
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
      throw new Error('TWELVE_DATA_API_KEY not configured');
    }
    
    const { pairs, gold } = await fetchFromTwelveData(apiKey);
    
    if (pairs.length === 0) {
      // Return fallback data for demo purposes
      console.log('No data from API, using demo data');
      const demoData = {
        pairs: FOREX_PAIRS.map(symbol => ({
          symbol,
          price: Math.random() * 2 + 0.5,
          percentChange: (Math.random() - 0.5) * 2,
          timestamp: new Date().toISOString()
        })),
        gold: {
          symbol: 'XAU/USD',
          price: 2045.50,
          percentChange: 0.85,
          timestamp: new Date().toISOString()
        },
        strength: [],
        matrix: {},
        lastUpdated: new Date().toISOString(),
        timeframe,
        isDemo: true
      };
      
      demoData.strength = calculateCurrencyStrength(demoData.pairs);
      demoData.matrix = generatePairMatrix(demoData.pairs);
      
      return new Response(
        JSON.stringify(demoData),
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
    
    console.log('Returning fresh data');
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
