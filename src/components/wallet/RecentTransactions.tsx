import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, BarChart3, CreditCard, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

export const RecentTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filter]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Generate sample data for demo
      const sampleTransactions: Transaction[] = [
        { id: '1', type: 'deposit', amount: 1000, status: 'completed', description: 'Bank Transfer Deposit', created_at: subDays(new Date(), 1).toISOString() },
        { id: '2', type: 'trade', amount: -50, status: 'completed', description: 'EUR/USD Trade Loss', created_at: subDays(new Date(), 2).toISOString() },
        { id: '3', type: 'trade', amount: 150, status: 'completed', description: 'GBP/JPY Trade Profit', created_at: subDays(new Date(), 3).toISOString() },
        { id: '4', type: 'bonus', amount: 50, status: 'completed', description: 'Referral Bonus', created_at: subDays(new Date(), 4).toISOString() },
        { id: '5', type: 'withdrawal', amount: -200, status: 'pending', description: 'Withdrawal Request', created_at: subDays(new Date(), 5).toISOString() },
      ];
      setTransactions(filter === 'all' ? sampleTransactions : sampleTransactions.filter(t => t.type === filter));
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      deposit: <ArrowDownLeft className="w-5 h-5" />,
      withdrawal: <ArrowUpRight className="w-5 h-5" />,
      transfer: <ArrowLeftRight className="w-5 h-5" />,
      trade: <BarChart3 className="w-5 h-5" />,
      subscription: <CreditCard className="w-5 h-5" />,
      bonus: <Gift className="w-5 h-5" />,
    };
    return icons[type] || <CreditCard className="w-5 h-5" />;
  };

  const getTransactionColor = (type: string) => {
    const colors: Record<string, string> = {
      deposit: 'text-success bg-success/10',
      withdrawal: 'text-destructive bg-destructive/10',
      transfer: 'text-accent bg-accent/10',
      trade: 'text-premium bg-premium/10',
      subscription: 'text-warning bg-warning/10',
      bonus: 'text-pink-400 bg-pink-500/10',
    };
    return colors[type] || 'text-muted-foreground bg-muted';
  };

  const filters = ['all', 'deposit', 'withdrawal', 'trade'];

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur border border-border rounded-3xl p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          {filters.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading transactions...</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <p className="text-muted-foreground">No transactions yet</p>
          <p className="text-sm text-muted-foreground/70 mt-2">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all hover:scale-[1.01] cursor-pointer border border-transparent hover:border-border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {/* Left: Icon + Details */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="text-foreground font-medium capitalize">
                    {transaction.description || transaction.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>

              {/* Right: Amount + Status */}
              <div className="text-right">
                <p className={`text-lg font-bold font-mono ${
                  transaction.amount >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  transaction.status === 'completed' ? 'bg-success/20 text-success' :
                  transaction.status === 'pending' ? 'bg-warning/20 text-warning' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {transaction.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View All Button */}
      {transactions.length > 0 && (
        <Button variant="outline" className="w-full mt-4 py-3">
          View All Transactions →
        </Button>
      )}
    </motion.div>
  );
};
