import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencyPair: string;
  currentPrice: number;
  onCreateAlert: (targetPrice: number, direction: 'above' | 'below') => Promise<boolean>;
}

export default function PriceAlertModal({
  open,
  onOpenChange,
  currencyPair,
  currentPrice,
  onCreateAlert,
}: PriceAlertModalProps) {
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    setIsSubmitting(true);
    const success = await onCreateAlert(price, direction);
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
      setTargetPrice(currentPrice.toString());
    }
  };

  const priceDiff = parseFloat(targetPrice) - currentPrice;
  const priceDiffPercent = ((priceDiff / currentPrice) * 100).toFixed(2);
  const isValidPrice = !isNaN(parseFloat(targetPrice)) && parseFloat(targetPrice) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Create Price Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Currency Pair Info */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
            <div>
              <p className="text-sm text-muted-foreground">Currency Pair</p>
              <p className="text-xl font-bold">{currencyPair}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-xl font-bold font-mono text-primary">
                {currentPrice.toFixed(currencyPair.includes('JPY') ? 2 : 4)}
              </p>
            </div>
          </div>

          {/* Direction Selection */}
          <div className="space-y-2">
            <Label>Alert me when price goes</Label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDirection('above')}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                  direction === 'above'
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <TrendingUp className={cn(
                  "w-6 h-6",
                  direction === 'above' ? "text-emerald-400" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "font-semibold",
                  direction === 'above' ? "text-emerald-400" : "text-muted-foreground"
                )}>
                  Above
                </span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDirection('below')}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                  direction === 'below'
                    ? "border-red-500 bg-red-500/10"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <TrendingDown className={cn(
                  "w-6 h-6",
                  direction === 'below' ? "text-red-400" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "font-semibold",
                  direction === 'below' ? "text-red-400" : "text-muted-foreground"
                )}>
                  Below
                </span>
              </motion.button>
            </div>
          </div>

          {/* Target Price Input */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.0001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="font-mono text-lg"
              placeholder="Enter target price"
            />
            
            {/* Price Difference */}
            <AnimatePresence>
              {isValidPrice && priceDiff !== 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Badge 
                    variant="outline"
                    className={cn(
                      priceDiff > 0 
                        ? "border-emerald-500/50 text-emerald-400" 
                        : "border-red-500/50 text-red-400"
                    )}
                  >
                    {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(4)} ({priceDiffPercent}%)
                  </Badge>
                  <span className="text-muted-foreground">from current price</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Warning if direction doesn't match */}
          <AnimatePresence>
            {isValidPrice && (
              (direction === 'above' && parseFloat(targetPrice) <= currentPrice) ||
              (direction === 'below' && parseFloat(targetPrice) >= currentPrice)
            ) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-amber-200">
                  Target price is already {direction === 'above' ? 'below' : 'above'} the current price. 
                  The alert may trigger immediately.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValidPrice || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              "Creating Alert..."
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Create Alert
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
