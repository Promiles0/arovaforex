import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes (longer cache to avoid rate limits)
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

// Reduced to 8 major pairs to stay within free tier API limits (8 credits/minute)
// The free Twelve Data tier only allows 8 API credits per minute
const MAJOR_SYMBOLS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'XAU/USD'
].join(',');

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

// Get Supabase client with service role for cache operations
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

// Check database cache
async function getCachedData(supabase: any, timeframe: string) {
  try {
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('id', `global-${timeframe}`)
      .single();

    if (error || !data) return null;

    const cacheAge = Date.now() - new Date(data.updated_at).getTime();
    if (cacheAge < CACHE_DURATION_MS) {
      console.log(`Cache hit - age: ${Math.round(cacheAge / 1000)}s`);
      return {
        ...data.data,
        fromCache: true,
        cacheAge: Math.round(cacheAge / 1000),
        nextRefresh: Math.round((CACHE_DURATION_MS - cacheAge) / 1000)
      };
    }
    
    console.log(`Cache stale - age: ${Math.round(cacheAge / 1000)}s`);
    // Return stale cache data instead of null for rate limit protection
    return {
      ...data.data,
      fromCache: true,
      cacheAge: Math.round(cacheAge / 1000),
      isStale: true
    };
  } catch (err) {
    console.error('Cache read error:', err);
    return null;
  }
}

// Save to database cache
async function setCachedData(supabase: any, timeframe: string, data: any) {
  try {
    await supabase
      .from('market_data_cache')
      .upsert({
        id: `global-${timeframe}`,
        data,
        timeframe,
        updated_at: new Date().toISOString()
      });
    console.log('Cache updated');
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

// Fetch from Twelve Data API with reduced symbols for free tier
async function fetchFromTwelveData(apiKey: string): Promise<{ pairs: ForexPair[], gold: ForexPair | null }> {
  console.log('Fetching from Twelve Data API - 8 major symbols only (free tier limit)');
  
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(MAJOR_SYMBOLS)}&apikey=${apiKey}`;
    console.log('Request URL (key hidden):', url.replace(apiKey, 'HIDDEN'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API response keys:', Object.keys(data || {}));
    
    // Check for API error response (rate limit, etc.)
    if (data.code || data.status === 'error' || data.message) {
      console.error('API error:', data.message || data.status);
      // Return empty to trigger fallback to demo/cache
      return { pairs: [], gold: null };
    }
    
    const results: ForexPair[] = [];
    
    if (data && typeof data === 'object') {
      for (const key of Object.keys(data)) {
        const quote = data[key];
        
        // Skip error responses for individual symbols
        if (quote.code || quote.status === 'error') {
          console.log(`Skipping ${key}: ${quote.message || 'error'}`);
          continue;
        }
        
        // Log first quote for debugging
        if (results.length === 0) {
          console.log('Sample quote:', JSON.stringify(quote).slice(0, 300));
        }
        
        // Accept if quote has valid price data
        const price = parseFloat(quote.close || quote.price || quote.last_price) || 0;
        if (quote && price > 0) {
          results.push({
            symbol: quote.symbol || key.replace(':', '/'),
            price,
            percentChange: parseFloat(quote.percent_change) || 0,
            timestamp: quote.datetime || new Date().toISOString()
          });
        }
      }
    }
    
    const gold = results.find(p => p.symbol === 'XAU/USD') || null;
    const pairs = results.filter(p => p.symbol !== 'XAU/USD');
    
    console.log(`API returned ${pairs.length} forex pairs and gold: ${gold ? 'yes' : 'no'}`);
    return { pairs, gold };
  } catch (error) {
    console.error('API fetch error:', error);
    return { pairs: [], gold: null };
  }
}

function calculateCurrencyStrength(pairs: ForexPair[]): CurrencyStrength[] {
  const strength: Record<string, number> = {};
  CURRENCIES.forEach(c => strength[c] = 0);
  
  pairs.forEach(pair => {
    const [base, quote] = pair.symbol.split('/');
    const change = pair.percentChange;
    
    if (strength[base] !== undefined) strength[base] += change;
    if (strength[quote] !== undefined) strength[quote] -= change;
  });
  
  const values = Object.values(strength);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  
  return CURRENCIES.map(currency => ({
    currency,
    strength: strength[currency],
    normalizedStrength: range > 0 ? ((strength[currency] - min) / range) * 200 - 100 : 0
  })).sort((a, b) => b.strength - a.strength);
}

function generatePairMatrix(pairs: ForexPair[]): Record<string, Record<string, { price: number; change: number } | null>> {
  const matrix: Record<string, Record<string, { price: number; change: number } | null>> = {};
  
  CURRENCIES.forEach(base => {
    matrix[base] = {};
    CURRENCIES.forEach(quote => {
      matrix[base][quote] = null;
    });
  });
  
  pairs.forEach(pair => {
    const [base, quote] = pair.symbol.split('/');
    if (matrix[base] && matrix[base][quote] !== undefined) {
      matrix[base][quote] = { price: pair.price, change: pair.percentChange };
    }
    if (matrix[quote] && matrix[quote][base] !== undefined) {
      matrix[quote][base] = { price: pair.price > 0 ? 1 / pair.price : 0, change: -pair.percentChange };
    }
  });
  
  return matrix;
}

function generateDemoData(): { pairs: ForexPair[], gold: ForexPair } {
  const allPairs = [
    'EUR/USD', 'GBP/USD', 'AUD/USD', 'NZD/USD', 'USD/JPY', 'USD/CAD', 'USD/CHF',
    'EUR/GBP', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'EUR/NZD',
    'GBP/JPY', 'GBP/AUD', 'GBP/CAD', 'GBP/CHF', 'GBP/NZD',
    'AUD/JPY', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY',
    'AUD/CAD', 'AUD/CHF', 'AUD/NZD', 'CAD/CHF', 'CAD/NZD', 'CHF/NZD'
  ];
  
  const pairs = allPairs.map(symbol => ({
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
  
  return { pairs, gold };
}

// Expand 7 major pairs to all 28 cross pairs using synthetic calculation
function expandToAllPairs(majorPairs: ForexPair[]): ForexPair[] {
  const pairMap: Record<string, ForexPair> = {};
  majorPairs.forEach(p => { pairMap[p.symbol] = p; });
  
  const allPairs: ForexPair[] = [...majorPairs];
  
  // Calculate cross pairs from USD pairs
  // e.g., EUR/GBP = EUR/USD / GBP/USD
  const usdPairs: Record<string, ForexPair> = {};
  majorPairs.forEach(p => {
    const [base, quote] = p.symbol.split('/');
    if (quote === 'USD') usdPairs[base] = p;
    if (base === 'USD') usdPairs[quote] = { ...p, price: 1 / p.price, percentChange: -p.percentChange };
  });
  
  const currencies = Object.keys(usdPairs);
  for (let i = 0; i < currencies.length; i++) {
    for (let j = i + 1; j < currencies.length; j++) {
      const base = currencies[i];
      const quote = currencies[j];
      const symbol = `${base}/${quote}`;
      const reverseSymbol = `${quote}/${base}`;
      
      if (!pairMap[symbol] && !pairMap[reverseSymbol] && usdPairs[base] && usdPairs[quote]) {
        const baseUsd = usdPairs[base];
        const quoteUsd = usdPairs[quote];
        
        // Cross rate = base/USD * USD/quote = base/USD / quote/USD
        const price = baseUsd.price / quoteUsd.price;
        const percentChange = baseUsd.percentChange - quoteUsd.percentChange;
        
        allPairs.push({
          symbol,
          price,
          percentChange,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return allPairs;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '1D';
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    const supabase = getSupabaseClient();
    
    // Check database cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedData(supabase, timeframe);
      if (cached && !cached.isStale) {
        return new Response(
          JSON.stringify(cached),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Try to fetch from API
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    
    if (!apiKey) {
      console.log('No API key configured - using demo data');
      const { pairs, gold } = generateDemoData();
      const responseData = {
        pairs,
        gold,
        strength: calculateCurrencyStrength(pairs),
        matrix: generatePairMatrix(pairs),
        lastUpdated: new Date().toISOString(),
        timeframe,
        isDemo: true
      };
      
      await setCachedData(supabase, timeframe, responseData);
      
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch from API (reduced symbols for free tier)
    const { pairs: majorPairs, gold } = await fetchFromTwelveData(apiKey);
    
    if (majorPairs.length === 0) {
      console.log('Empty API response - checking for stale cache or using demo');
      
      // Try stale cache first
      const staleCache = await getCachedData(supabase, timeframe);
      if (staleCache) {
        console.log('Using stale cache due to API rate limit');
        return new Response(
          JSON.stringify({ ...staleCache, rateLimited: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Fall back to demo data
      const demoData = generateDemoData();
      const responseData = {
        pairs: demoData.pairs,
        gold: demoData.gold,
        strength: calculateCurrencyStrength(demoData.pairs),
        matrix: generatePairMatrix(demoData.pairs),
        lastUpdated: new Date().toISOString(),
        timeframe,
        isDemo: true
      };
      
      await setCachedData(supabase, timeframe, responseData);
      
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Expand 7 major pairs to all 28 cross pairs
    const allPairs = expandToAllPairs(majorPairs);
    console.log(`Expanded ${majorPairs.length} major pairs to ${allPairs.length} total pairs`);
    
    const responseData = {
      pairs: allPairs,
      gold,
      strength: calculateCurrencyStrength(allPairs),
      matrix: generatePairMatrix(allPairs),
      lastUpdated: new Date().toISOString(),
      timeframe,
      fromCache: false,
      liveSymbols: majorPairs.length
    };
    
    // Save to database cache
    await setCachedData(supabase, timeframe, responseData);
    
    console.log(`Fresh data saved - ${allPairs.length} pairs (${majorPairs.length} live + calculated crosses)`);
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Function error:', error);
    
    // Try to return any cached data on error
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('market_data_cache')
        .select('data')
        .single();
      
      if (data?.data) {
        return new Response(
          JSON.stringify({ ...data.data, fromCache: true, error: 'Using cached data' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {}
    
    // Last resort - return demo data
    const demoData = generateDemoData();
    return new Response(
      JSON.stringify({
        pairs: demoData.pairs,
        gold: demoData.gold,
        strength: calculateCurrencyStrength(demoData.pairs),
        matrix: generatePairMatrix(demoData.pairs),
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
