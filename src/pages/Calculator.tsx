import { useState, useMemo } from "react";
import { Calculator, DollarSign, TrendingUp, Target, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SEO } from "@/components/seo/SEO";

// Pip values and contract sizes for different instruments
const INSTRUMENTS = {
  // Major Forex Pairs (standard lot = 100,000 units)
  "EUR/USD": { pipValue: 10, contractSize: 100000, pipDecimal: 4 },
  "GBP/USD": { pipValue: 10, contractSize: 100000, pipDecimal: 4 },
  "USD/JPY": { pipValue: 9.1, contractSize: 100000, pipDecimal: 2 },
  "USD/CHF": { pipValue: 10.2, contractSize: 100000, pipDecimal: 4 },
  "AUD/USD": { pipValue: 10, contractSize: 100000, pipDecimal: 4 },
  "NZD/USD": { pipValue: 10, contractSize: 100000, pipDecimal: 4 },
  "USD/CAD": { pipValue: 7.5, contractSize: 100000, pipDecimal: 4 },
  // Cross Pairs
  "EUR/GBP": { pipValue: 12.5, contractSize: 100000, pipDecimal: 4 },
  "EUR/JPY": { pipValue: 9.1, contractSize: 100000, pipDecimal: 2 },
  "GBP/JPY": { pipValue: 9.1, contractSize: 100000, pipDecimal: 2 },
  "EUR/CHF": { pipValue: 10.2, contractSize: 100000, pipDecimal: 4 },
  "EUR/AUD": { pipValue: 6.5, contractSize: 100000, pipDecimal: 4 },
  "GBP/CHF": { pipValue: 10.2, contractSize: 100000, pipDecimal: 4 },
  "AUD/JPY": { pipValue: 9.1, contractSize: 100000, pipDecimal: 2 },
  "CHF/JPY": { pipValue: 9.1, contractSize: 100000, pipDecimal: 2 },
  "CAD/JPY": { pipValue: 9.1, contractSize: 100000, pipDecimal: 2 },
  "NZD/JPY": { pipValue: 9.1, contractSize: 100000, pipDecimal: 2 },
  "AUD/CAD": { pipValue: 7.5, contractSize: 100000, pipDecimal: 4 },
  "AUD/CHF": { pipValue: 10.2, contractSize: 100000, pipDecimal: 4 },
  "AUD/NZD": { pipValue: 6.2, contractSize: 100000, pipDecimal: 4 },
  "EUR/CAD": { pipValue: 7.5, contractSize: 100000, pipDecimal: 4 },
  "EUR/NZD": { pipValue: 6.2, contractSize: 100000, pipDecimal: 4 },
  "GBP/AUD": { pipValue: 6.5, contractSize: 100000, pipDecimal: 4 },
  "GBP/CAD": { pipValue: 7.5, contractSize: 100000, pipDecimal: 4 },
  "GBP/NZD": { pipValue: 6.2, contractSize: 100000, pipDecimal: 4 },
  "NZD/CAD": { pipValue: 7.5, contractSize: 100000, pipDecimal: 4 },
  "NZD/CHF": { pipValue: 10.2, contractSize: 100000, pipDecimal: 4 },
  "CAD/CHF": { pipValue: 10.2, contractSize: 100000, pipDecimal: 4 },
  // Gold (1 lot = 100 oz, pip = $0.01 movement = $1 per lot)
  "XAU/USD": { pipValue: 1, contractSize: 100, pipDecimal: 2, isGold: true },
} as const;

type InstrumentKey = keyof typeof INSTRUMENTS;

export default function CalculatorPage() {
  const [accountBalance, setAccountBalance] = useState<string>("10000");
  const [riskPercent, setRiskPercent] = useState<string>("1");
  const [stopLossPips, setStopLossPips] = useState<string>("50");
  const [selectedPair, setSelectedPair] = useState<InstrumentKey>("EUR/USD");

  const calculations = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const stopLoss = parseFloat(stopLossPips) || 0;
    const instrument = INSTRUMENTS[selectedPair];

    if (balance <= 0 || risk <= 0 || stopLoss <= 0) {
      return { lotSize: 0, riskAmount: 0, pipValue: 0, isValid: false };
    }

    // Calculate risk amount in dollars
    const riskAmount = (balance * risk) / 100;

    // Calculate pip value per standard lot
    const pipValuePerLot = instrument.pipValue;

    // For Gold: pip value is $1 per 0.01 movement per lot
    // For Forex: pip value is typically $10 per pip per standard lot (for USD pairs)
    
    // Calculate lot size: Risk Amount / (Stop Loss Pips × Pip Value Per Lot)
    const lotSize = riskAmount / (stopLoss * pipValuePerLot);

    // Calculate actual pip value based on lot size
    const actualPipValue = lotSize * pipValuePerLot;

    return {
      lotSize: Math.round(lotSize * 100) / 100,
      riskAmount: Math.round(riskAmount * 100) / 100,
      pipValue: Math.round(actualPipValue * 100) / 100,
      isValid: true,
    };
  }, [accountBalance, riskPercent, stopLossPips, selectedPair]);

  const handleReset = () => {
    setAccountBalance("10000");
    setRiskPercent("1");
    setStopLossPips("50");
    setSelectedPair("EUR/USD");
  };

  return (
    <>
      <SEO 
        title="Trading Calculator | ArovaForex"
        description="Calculate your position size, risk, and pip value for Forex and Gold trading."
      />
      
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Calculator className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Position Size Calculator
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Calculate the optimal lot size based on your account balance, risk tolerance, and stop loss.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Trade Parameters
                </CardTitle>
                <CardDescription>
                  Enter your trade details to calculate position size
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Account Balance */}
                <div className="space-y-2">
                  <Label htmlFor="balance" className="flex items-center gap-2">
                    Account Balance (USD)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your total trading account balance</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="balance"
                      type="number"
                      min="0"
                      step="100"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(e.target.value)}
                      className="pl-9"
                      placeholder="10000"
                    />
                  </div>
                </div>

                {/* Risk Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="risk" className="flex items-center gap-2">
                    Risk per Trade (%)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Recommended: 1-2% per trade</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="risk"
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      className="pl-9"
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Stop Loss */}
                <div className="space-y-2">
                  <Label htmlFor="stopLoss" className="flex items-center gap-2">
                    Stop Loss (pips)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Distance from entry to stop loss in pips</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    min="1"
                    step="1"
                    value={stopLossPips}
                    onChange={(e) => setStopLossPips(e.target.value)}
                    placeholder="50"
                  />
                </div>

                {/* Currency Pair */}
                <div className="space-y-2">
                  <Label htmlFor="pair">Trading Instrument</Label>
                  <Select value={selectedPair} onValueChange={(v) => setSelectedPair(v as InstrumentKey)}>
                    <SelectTrigger id="pair">
                      <SelectValue placeholder="Select pair" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="XAU/USD" className="font-medium text-amber-500">
                        🥇 XAU/USD (Gold)
                      </SelectItem>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Major Pairs
                      </div>
                      {["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "NZD/USD", "USD/CAD"].map((pair) => (
                        <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Cross Pairs
                      </div>
                      {Object.keys(INSTRUMENTS)
                        .filter(p => !["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "NZD/USD", "USD/CAD", "XAU/USD"].includes(p))
                        .map((pair) => (
                          <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={handleReset} className="w-full">
                  Reset Values
                </Button>
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Calculation Results
                </CardTitle>
                <CardDescription>
                  Your recommended position size
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {calculations.isValid ? (
                  <>
                    {/* Lot Size - Main Result */}
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Recommended Lot Size</p>
                      <p className="text-4xl font-bold text-primary">
                        {calculations.lotSize.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Standard Lots
                      </p>
                    </div>

                    {/* Secondary Results */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-card border border-border/50">
                        <p className="text-sm text-muted-foreground mb-1">Risk Amount</p>
                        <p className="text-2xl font-semibold text-foreground">
                          ${calculations.riskAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-card border border-border/50">
                        <p className="text-sm text-muted-foreground mb-1">Pip Value</p>
                        <p className="text-2xl font-semibold text-foreground">
                          ${calculations.pipValue.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Trade Summary:</strong> With a {riskPercent}% risk on ${parseFloat(accountBalance).toLocaleString()}, 
                        risking ${calculations.riskAmount} with a {stopLossPips} pip stop loss on {selectedPair}.
                      </p>
                    </div>

                    {/* Lot Size Breakdown */}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Lot Size Equivalents:</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                          {calculations.lotSize.toFixed(2)} Standard
                        </span>
                        <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                          {(calculations.lotSize * 10).toFixed(1)} Mini
                        </span>
                        <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                          {(calculations.lotSize * 100).toFixed(0)} Micro
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Enter valid values to see calculations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <Card className="mt-6 border-border/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">How Position Sizing Works</h3>
              <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground mb-1">1. Define Your Risk</p>
                  <p>Most traders risk 1-2% of their account per trade to manage drawdowns.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">2. Set Your Stop Loss</p>
                  <p>Place your stop loss based on technical analysis, not arbitrary pip values.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">3. Calculate Lot Size</p>
                  <p>Formula: Risk Amount ÷ (Stop Loss Pips × Pip Value) = Lot Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
