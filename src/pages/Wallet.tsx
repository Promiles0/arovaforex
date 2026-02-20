import { useState } from "react";
import { Wallet as WalletIcon, Construction, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  WalletBalanceCard, 
  BalanceChart, 
  RecentTransactions, 
  PaymentMethods, 
  SubscriptionPlans 
} from "@/components/wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Wallet() {
  const [showNotice, setShowNotice] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";

  return (
    <div className="space-y-6 pb-8">
      {/* Development Notice Dialog */}
      <Dialog open={showNotice} onOpenChange={setShowNotice}>
        <DialogContent className="sm:max-w-md border-primary/20">
          <DialogHeader className="text-center items-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Construction className="w-8 h-8 text-amber-500" />
            </div>
            <DialogTitle className="text-xl">Under Development 🚧</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2 text-sm leading-relaxed">
              Hey <span className="font-semibold text-foreground">{displayName}</span>, this page is still under development so you may find things not working well — don't be surprised! Some features may also be removed.
              <br /><br />
              For any enquiry, contact our support team or chat with <span className="font-semibold text-primary">Arova AI</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                setShowNotice(false);
                navigate("/dashboard/contact");
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Contact Us
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowNotice(false)}
            >
              Got it, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
