import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, TrendingDown, BarChart3, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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

interface MarketData {
  pairs: ForexPair[];
  gold: ForexPair | null;
  strength: CurrencyStrength[];
  lastUpdated: string;
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarketData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: null,
        headers: {}
      });
      
      if (error) throw error;
      setMarketData(data);
    } catch (err) {
      console.error('Error fetching market data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchMarketData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get top 5 most volatile pairs (highest absolute percent change)
  const topMovers = marketData?.pairs
    ?.filter(pair => pair.symbol !== 'XAU/USD')
    ?.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    ?.slice(0, 5) || [];

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-20 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Market Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchMarketData(true)}
                disabled={refreshing}
                className="h-8 gap-1.5"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                Refresh
              </Button>
              <Link to="/dashboard/calendar">
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  Full Heatmap
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Top movers in the last 24 hours</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Top 5 Movers Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {topMovers.map((pair, index) => {
              const isPositive = pair.percentChange > 0;
              
              return (
                <motion.div
                  key={pair.symbol}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={cn(
                    "relative p-3 rounded-lg border cursor-pointer transition-all overflow-hidden",
                    isPositive
                      ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                      : "bg-red-500/10 border-red-500/30 hover:bg-red-500/15"
                  )}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground">#{index + 1}</span>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  
                  {/* Currency Pair */}
                  <div className="text-sm font-bold truncate">{pair.symbol}</div>
                  
                  {/* Percent Change */}
                  <div className={cn(
                    "text-xl font-bold",
                    isPositive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {isPositive ? '+' : ''}{pair.percentChange.toFixed(2)}%
                  </div>
                  
                  {/* Current Price */}
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">
                    {pair.price.toFixed(pair.symbol.includes('JPY') ? 2 : 4)}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Currency Strength Summary */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
            <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Currency Strength
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {marketData?.strength?.map((item) => {
                const isStrong = item.strength > 0;
                return (
                  <motion.div
                    key={item.currency}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "text-center p-2 rounded-md transition-colors",
                      isStrong ? "bg-emerald-500/15" : "bg-red-500/15"
                    )}
                  >
                    <div className="text-xs font-bold">{item.currency}</div>
                    <div className={cn(
                      "text-sm font-bold",
                      isStrong ? "text-emerald-400" : "text-red-400"
                    )}>
                      {item.strength > 0 ? '+' : ''}{item.strength.toFixed(1)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
