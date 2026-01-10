import { Wallet as WalletIcon } from "lucide-react";
import { 
  WalletBalanceCard, 
  BalanceChart, 
  RecentTransactions, 
  PaymentMethods, 
  SubscriptionPlans 
} from "@/components/wallet";

export default function Wallet() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <WalletIcon className="w-5 h-5 text-primary" />
          </div>
          My Wallet
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your funds, subscriptions, and transactions
        </p>
      </div>

      {/* Wallet Balance & Quick Actions */}
      <WalletBalanceCard />

      {/* Balance Chart */}
      <BalanceChart />

      {/* Recent Transactions */}
      <RecentTransactions />

      {/* Payment Methods */}
      <PaymentMethods />

      {/* Subscription Plans */}
      <SubscriptionPlans />
    </div>
  );
}
