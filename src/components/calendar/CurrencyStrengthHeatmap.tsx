import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, TrendingDown, Clock, AlertCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import PriceAlertModal from "./PriceAlertModal";
import PriceAlertsList from "./PriceAlertsList";

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
  matrix: Record<string, Record<string, { price: number; change: number } | null>>;
  lastUpdated: string;
  timeframe: string;
  fromCache?: boolean;
  cacheAge?: number;
  nextRefresh?: number;
  error?: string;
  isDemo?: boolean;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

export default function CurrencyStrengthHeatmap() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1D');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<{ symbol: string; price: number } | null>(null);
  
  const { toast } = useToast();
  const { alerts, loading: alertsLoading, createAlert, deleteAlert, checkAlerts, getAlertsForPair } = usePriceAlerts();

  const fetchMarketData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setError(null);
      
      const { data, error: fnError } = await supabase.functions.invoke('market-data', {
        body: null,
        headers: {}
      });
      
      if (fnError) throw fnError;
      
      setMarketData(data);
      setCountdown(data.nextRefresh || 300);
      
      if (data.error) {
        toast({
          title: "Using Cached Data",
          description: data.error,
          variant: "default",
        });
      }
      
      if (data.isDemo) {
        toast({
          title: "Demo Mode",
          description: "Showing demo data. Real-time data will be available when the API is connected.",
          variant: "default",
        });
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // NO auto-refresh - server database cache ensures all users share same data
    // Manual refresh available if user wants to check for updates
  }, [timeframe]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Check price alerts when market data updates
  useEffect(() => {
    if (marketData?.pairs) {
      const prices: Record<string, number> = {};
      marketData.pairs.forEach(pair => {
        prices[pair.symbol] = pair.price;
      });
      checkAlerts(prices);
    }
  }, [marketData, checkAlerts]);

  // Build current prices map for alerts list
  const currentPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    marketData?.pairs?.forEach(pair => {
      prices[pair.symbol] = pair.price;
    });
    return prices;
  }, [marketData]);

  const handleCellClick = (baseCurrency: string, quoteCurrency: string, price: number) => {
    const symbol = `${baseCurrency}/${quoteCurrency}`;
    setSelectedPair({ symbol, price });
    setAlertModalOpen(true);
  };

  const handleCreateAlert = async (targetPrice: number, direction: 'above' | 'below') => {
    if (!selectedPair) return false;
    return createAlert(selectedPair.symbol, targetPrice, direction);
  };

  const getCellColor = (percentChange: number | undefined) => {
    if (percentChange === undefined || percentChange === null || isNaN(percentChange)) {
      return 'bg-muted/30';
    }
    
    const absChange = Math.abs(percentChange);
    
    if (percentChange > 0) {
      if (absChange >= 1.5) return 'bg-emerald-600 text-white';
      if (absChange >= 1.0) return 'bg-emerald-500 text-white';
      if (absChange >= 0.5) return 'bg-emerald-500/60 text-emerald-100';
      return 'bg-emerald-500/30 text-emerald-300';
    } else if (percentChange < 0) {
      if (absChange >= 1.5) return 'bg-red-600 text-white';
      if (absChange >= 1.0) return 'bg-red-500 text-white';
      if (absChange >= 0.5) return 'bg-red-500/60 text-red-100';
      return 'bg-red-500/30 text-red-300';
    }
    
    return 'bg-muted/50 text-muted-foreground';
  };

  const getStrengthBarColor = (strength: number) => {
    if (strength > 0) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    if (strength < 0) return 'bg-gradient-to-r from-red-500 to-red-400';
    return 'bg-muted';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeAgo = useMemo(() => {
    if (!marketData?.lastUpdated) return '';
    const diff = Date.now() - new Date(marketData.lastUpdated).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 minute ago';
    return `${mins} minutes ago`;
  }, [marketData?.lastUpdated, countdown]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-9 gap-1">
              {Array.from({ length: 81 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center border-destructive/50">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-xl font-semibold mb-2">Market Data Unavailable</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => fetchMarketData(true)} disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            'Try Again'
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📊 Currency Strength Heatmap
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time forex pair performance and currency strength analysis
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Timeframe Buttons */}
          <div className="flex gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
            {(['1D', '1W', '1M'] as const).map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={timeframe === tf ? 'default' : 'ghost'}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-4 transition-all",
                  timeframe === tf && "shadow-md"
                )}
              >
                {tf}
              </Button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMarketData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Last Updated Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Updated: {timeAgo}</span>
        </div>
        <span>•</span>
        <span>Next refresh: {formatTime(countdown)}</span>
        {marketData?.fromCache && (
          <>
            <span>•</span>
            <Badge variant="outline" className="text-xs">Cached</Badge>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Currency Matrix */}
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>💱</span>
              Currency Pair Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="min-w-[500px]"
              >
                {/* Header row */}
                <div className="grid grid-cols-9 gap-1 mb-1">
                  <div className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
                    Base/Quote
                  </div>
                  {CURRENCIES.map(currency => (
                    <div 
                      key={`header-${currency}`}
                      className="h-10 flex items-center justify-center text-xs font-bold bg-muted/50 rounded"
                    >
                      {currency}
                    </div>
                  ))}
                </div>
                
                {/* Data rows */}
                {CURRENCIES.map((baseCurrency, rowIndex) => (
                  <div key={baseCurrency} className="grid grid-cols-9 gap-1 mb-1">
                    <div className="h-16 flex items-center justify-center text-xs font-bold bg-muted/50 rounded">
                      {baseCurrency}
                    </div>
                    {CURRENCIES.map((quoteCurrency, colIndex) => {
                      if (baseCurrency === quoteCurrency) {
                        return (
                          <motion.div
                            key={`${baseCurrency}-${quoteCurrency}`}
                            variants={itemVariants}
                            className="h-16 flex items-center justify-center bg-muted/20 rounded text-muted-foreground/50 text-lg"
                          >
                            —
                          </motion.div>
                        );
                      }
                      
                      const cellData = marketData?.matrix?.[baseCurrency]?.[quoteCurrency];
                      
                      const pairAlerts = getAlertsForPair(`${baseCurrency}/${quoteCurrency}`);
                      
                      return (
                        <motion.div
                          key={`${baseCurrency}-${quoteCurrency}`}
                          variants={itemVariants}
                          whileHover={{ scale: 1.05, zIndex: 10 }}
                          onClick={() => cellData && handleCellClick(baseCurrency, quoteCurrency, cellData.price)}
                          className={cn(
                            "h-16 flex flex-col items-center justify-center rounded cursor-pointer transition-all relative",
                            getCellColor(cellData?.change),
                            "hover:ring-2 hover:ring-primary/50"
                          )}
                        >
                          {/* Alert indicator */}
                          {pairAlerts.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <Bell className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                          )}
                          {cellData ? (
                            <>
                              <div className="text-xs font-semibold flex items-center gap-0.5">
                                {cellData.change > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : cellData.change < 0 ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                {cellData.change > 0 ? '+' : ''}{cellData.change.toFixed(2)}%
                              </div>
                              <div className="text-[10px] opacity-80 font-mono">
                                {cellData.price.toFixed(quoteCurrency === 'JPY' ? 2 : 4)}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Side Panel: Strength + Gold */}
        <div className="space-y-6">
          {/* Currency Strength */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>💪</span>
                Currency Strength
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence mode="popLayout">
                {marketData?.strength?.map((item, index) => (
                  <motion.div
                    key={item.currency}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 text-sm font-bold">{item.currency}</div>
                    <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.abs(item.normalizedStrength) / 2 + 50}%`,
                          marginLeft: item.normalizedStrength < 0 ? `${50 - Math.abs(item.normalizedStrength) / 2}%` : '50%'
                        }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={cn(
                          "absolute h-full rounded-full",
                          getStrengthBarColor(item.strength)
                        )}
                        style={{
                          left: item.normalizedStrength < 0 ? 'auto' : 0,
                          right: item.normalizedStrength >= 0 ? 'auto' : 0,
                        }}
                      />
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                    </div>
                    <div className={cn(
                      "w-14 text-right text-sm font-medium",
                      item.strength > 0 ? "text-emerald-400" : item.strength < 0 ? "text-red-400" : "text-muted-foreground"
                    )}>
                      {item.strength > 0 ? '+' : ''}{item.strength.toFixed(1)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Gold Card */}
          {marketData?.gold && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card 
                className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-yellow-500/10 border-amber-500/30 overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-500/30 transition-all relative"
                onClick={() => {
                  setSelectedPair({ symbol: 'XAU/USD', price: marketData.gold!.price });
                  setAlertModalOpen(true);
                }}
              >
                {/* Alert indicator */}
                {getAlertsForPair('XAU/USD').length > 0 && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-2xl mb-1">💰</div>
                      <h3 className="text-lg font-bold text-amber-400">GOLD</h3>
                      <p className="text-xs text-muted-foreground">XAU/USD • Commodity</p>
                    </div>
                    <Badge 
                      className={cn(
                        "text-sm font-semibold",
                        marketData.gold.percentChange > 0 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      )}
                    >
                      {marketData.gold.percentChange > 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {marketData.gold.percentChange > 0 ? '+' : ''}
                      {marketData.gold.percentChange.toFixed(2)}%
                    </Badge>
                  </div>
                  
                  <div className="text-3xl font-bold text-amber-300 font-mono">
                    ${marketData.gold.price.toFixed(2)}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Last update: {new Date(marketData.gold.timestamp).toLocaleTimeString()}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-amber-400 hover:text-amber-300 h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPair({ symbol: 'XAU/USD', price: marketData.gold!.price });
                        setAlertModalOpen(true);
                      }}
                    >
                      <Bell className="w-3.5 h-3.5 mr-1" />
                      Set Alert
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Forex Pairs Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>📈</span>
            Major Pairs Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3"
          >
            {marketData?.pairs?.map((pair, index) => {
              const pairAlerts = getAlertsForPair(pair.symbol);
              return (
                <motion.div
                  key={pair.symbol}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => {
                    setSelectedPair({ symbol: pair.symbol, price: pair.price });
                    setAlertModalOpen(true);
                  }}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer relative",
                    getCellColor(pair.percentChange),
                    "hover:ring-2 hover:ring-primary/30"
                  )}
                >
                  {/* Alert indicator */}
                  {pairAlerts.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Bell className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="text-xs font-medium opacity-80 mb-1">{pair.symbol}</div>
                  <div className="text-lg font-bold font-mono">
                    {pair.price.toFixed(pair.symbol.includes('JPY') ? 2 : 4)}
                  </div>
                  <div className="text-sm font-semibold flex items-center gap-1 mt-1">
                    {pair.percentChange > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : pair.percentChange < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : null}
                    {pair.percentChange > 0 ? '+' : ''}{pair.percentChange.toFixed(2)}%
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </CardContent>
      </Card>

      {/* Price Alerts Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Price Alerts
        </h2>
        <PriceAlertsList
          alerts={alerts}
          loading={alertsLoading}
          onDelete={deleteAlert}
          currentPrices={currentPrices}
        />
      </div>

      {/* Price Alert Modal */}
      {selectedPair && (
        <PriceAlertModal
          open={alertModalOpen}
          onOpenChange={setAlertModalOpen}
          currencyPair={selectedPair.symbol}
          currentPrice={selectedPair.price}
          onCreateAlert={handleCreateAlert}
        />
      )}
    </div>
  );
}
