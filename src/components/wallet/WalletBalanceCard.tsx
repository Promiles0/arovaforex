import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, CreditCard, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface WalletBalance {
  balance: number;
  equity: number;
  margin_used: number;
  free_margin: number;
  profit_loss: number;
}

export const WalletBalanceCard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  // Animated counter effect
  useEffect(() => {
    if (balance?.balance && isVisible) {
      const duration = 1500;
      const steps = 60;
      const increment = balance.balance / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= balance.balance) {
          setDisplayBalance(balance.balance);
          clearInterval(timer);
        } else {
          setDisplayBalance(current);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [balance?.balance, isVisible]);

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('balance, equity, margin_used, free_margin, profit_loss')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBalance({
          balance: Number(data.balance) || 0,
          equity: Number(data.equity) || 0,
          margin_used: Number(data.margin_used) || 0,
          free_margin: Number(data.free_margin) || 0,
          profit_loss: Number(data.profit_loss) || 0
        });
      } else {
        // Create wallet if it doesn't exist
        const { error: insertError } = await supabase
          .from('user_wallets')
          .insert({ user_id: user?.id, balance: 0, equity: 0, margin_used: 0, free_margin: 0, profit_loss: 0 });
        
        if (!insertError) {
          setBalance({ balance: 0, equity: 0, margin_used: 0, free_margin: 0, profit_loss: 0 });
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance({ balance: 0, equity: 0, margin_used: 0, free_margin: 0, profit_loss: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const profitLoss = balance?.profit_loss || 0;
  const isProfit = profitLoss >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main Balance Card */}
      <motion.div 
        className="lg:col-span-2 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-br from-primary via-primary/90 to-accent rounded-3xl p-8 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          </div>
          
          {/* Floating Particles */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Balance</p>
                  <p className="text-white/60 text-xs">Available Funds</p>
                </div>
              </div>
              
              {/* Visibility Toggle */}
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isVisible ? (
                  <Eye className="w-5 h-5 text-white" />
                ) : (
                  <EyeOff className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            {/* Balance Amount */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-white mb-2 font-mono">
                {isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : isVisible ? (
                  `$${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  '$ •••••'
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-sm ${isProfit ? 'text-white' : 'text-red-200'}`}>
                  {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isVisible ? `${isProfit ? '+' : ''}$${Math.abs(profitLoss).toFixed(2)}` : '•••'}
                </span>
                <span className="text-white/60 text-xs">Today's P&L</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs mb-1">Equity</p>
                <p className="text-white font-bold text-lg font-mono">
                  {isVisible ? `$${(balance?.equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$•••'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs mb-1">Margin Used</p>
                <p className="text-white font-bold text-lg font-mono">
                  {isVisible ? `$${(balance?.margin_used || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$•••'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs mb-1">Free Margin</p>
                <p className="text-white font-bold text-lg font-mono">
                  {isVisible ? `$${(balance?.free_margin || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$•••'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Card */}
      <motion.div 
        className="bg-card/50 backdrop-blur border border-border rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
        
        <div className="space-y-3">
          <Button className="w-full py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 group">
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Deposit Funds</span>
          </Button>
          <Button variant="outline" className="w-full py-6 border-border hover:border-primary/50 text-foreground font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            <span>Withdraw</span>
          </Button>
          <Button variant="outline" className="w-full py-6 border-border hover:border-accent/50 text-foreground font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            <span>Transfer</span>
          </Button>
        </div>

        {/* Referral Bonus Section */}
        <div className="mt-6 p-4 bg-gradient-to-r from-premium/10 to-accent/10 border border-premium/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-premium" />
            <p className="text-sm text-muted-foreground">Refer & Earn</p>
          </div>
          <p className="text-foreground font-semibold">Get $50 bonus</p>
          <Button variant="ghost" className="mt-3 w-full py-2 bg-premium/20 hover:bg-premium/30 text-premium text-sm font-medium rounded-lg transition-colors">
            Invite Friends
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
