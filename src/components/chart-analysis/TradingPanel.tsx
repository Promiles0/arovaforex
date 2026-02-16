import { useState } from 'react';
import { TrendingUp, TrendingDown, Shield, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface TradingPanelProps {
  currentPrice: number;
  symbol: string;
  onPlaceTrade: (trade: {
    type: 'long' | 'short';
    entry: number;
    stopLoss: number | null;
    takeProfit: number | null;
    lotSize: number;
  }) => void;
}

export function TradingPanel({ currentPrice, symbol, onPlaceTrade }: TradingPanelProps) {
  const [lotSize, setLotSize] = useState(0.1);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [useStopLoss, setUseStopLoss] = useState(false);
  const [useTakeProfit, setUseTakeProfit] = useState(false);

  const handleTrade = (type: 'long' | 'short') => {
    onPlaceTrade({
      type,
      entry: currentPrice,
      stopLoss: useStopLoss ? stopLoss : null,
      takeProfit: useTakeProfit ? takeProfit : null,
      lotSize,
    });
  };

  const decimals = currentPrice > 10 ? 2 : 5;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Trading Panel</h3>

      {/* Current Price */}
      <div className="text-center p-3 rounded-lg bg-muted/50">
        <p className="text-xs text-muted-foreground">Current Price</p>
        <p className="text-2xl font-bold text-foreground tabular-nums">{currentPrice.toFixed(decimals)}</p>
        <p className="text-xs text-muted-foreground">{symbol}</p>
      </div>

      {/* Lot Size */}
      <div className="space-y-1.5">
        <Label className="text-xs">Lot Size</Label>
        <Input
          type="number"
          value={lotSize}
          onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
          step="0.01"
          min="0.01"
          className="h-9"
        />
      </div>

      {/* Stop Loss */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="use-sl"
            checked={useStopLoss}
            onCheckedChange={(c) => setUseStopLoss(!!c)}
          />
          <Label htmlFor="use-sl" className="text-xs flex items-center gap-1">
            <Shield className="w-3 h-3 text-destructive" /> Stop Loss
          </Label>
        </div>
        {useStopLoss && (
          <Input
            type="number"
            value={stopLoss ?? ''}
            onChange={(e) => setStopLoss(parseFloat(e.target.value) || null)}
            placeholder="Enter price"
            step="0.00001"
            className="h-9"
          />
        )}
      </div>

      {/* Take Profit */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="use-tp"
            checked={useTakeProfit}
            onCheckedChange={(c) => setUseTakeProfit(!!c)}
          />
          <Label htmlFor="use-tp" className="text-xs flex items-center gap-1">
            <Target className="w-3 h-3 text-success" /> Take Profit
          </Label>
        </div>
        {useTakeProfit && (
          <Input
            type="number"
            value={takeProfit ?? ''}
            onChange={(e) => setTakeProfit(parseFloat(e.target.value) || null)}
            placeholder="Enter price"
            step="0.00001"
            className="h-9"
          />
        )}
      </div>

      {/* Trade Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => handleTrade('long')}
          className="bg-success/20 hover:bg-success/30 border border-success/50 text-success"
          variant="outline"
        >
          <TrendingUp className="w-4 h-4 mr-1" /> BUY
        </Button>
        <Button
          onClick={() => handleTrade('short')}
          className="bg-destructive/20 hover:bg-destructive/30 border border-destructive/50 text-destructive"
          variant="outline"
        >
          <TrendingDown className="w-4 h-4 mr-1" /> SELL
        </Button>
      </div>
    </div>
  );
}
