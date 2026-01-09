import { useState, useMemo, useEffect } from "react";
import { Calculator, DollarSign, TrendingUp, Target, Info, Scale, ArrowUpDown, Ruler, Save, Download, Trash2, History, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/seo/SEO";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface SavedCalculation {
  id: string;
  type: "position" | "rr" | "pnl" | "pip" | "margin";
  timestamp: string;
  data: Record<string, unknown>;
}

const STORAGE_KEY = "arovaforex_calculator_history";

export default function CalculatorPage() {
  const [accountBalance, setAccountBalance] = useState<string>("10000");
  const [riskPercent, setRiskPercent] = useState<string>("1");
  const [stopLossPips, setStopLossPips] = useState<string>("50");
  const [selectedPair, setSelectedPair] = useState<InstrumentKey>("EUR/USD");

  // Saved calculations history
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);

  // Load saved calculations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedCalculations(JSON.parse(saved));
      } catch {
        console.error("Failed to load saved calculations");
      }
    }
  }, []);

  // Save to localStorage when calculations change
  const saveToStorage = (calcs: SavedCalculation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calcs));
    setSavedCalculations(calcs);
  };

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

  const savePositionCalc = () => {
    if (!calculations.isValid) return;
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      type: "position",
      timestamp: new Date().toISOString(),
      data: {
        pair: selectedPair,
        accountBalance,
        riskPercent,
        stopLossPips,
        lotSize: calculations.lotSize,
        riskAmount: calculations.riskAmount,
        pipValue: calculations.pipValue,
      },
    };
    saveToStorage([newCalc, ...savedCalculations].slice(0, 50));
    toast.success("Position size calculation saved!");
  };

  // Risk:Reward Calculator State
  const [rrStopLoss, setRrStopLoss] = useState<string>("50");
  const [rrTakeProfit, setRrTakeProfit] = useState<string>("100");
  const [rrRiskAmount, setRrRiskAmount] = useState<string>("100");

  const rrCalculations = useMemo(() => {
    const sl = parseFloat(rrStopLoss) || 0;
    const tp = parseFloat(rrTakeProfit) || 0;
    const risk = parseFloat(rrRiskAmount) || 0;

    if (sl <= 0 || tp <= 0) {
      return { ratio: 0, potentialReward: 0, isValid: false };
    }

    const ratio = tp / sl;
    const potentialReward = risk * ratio;

    return {
      ratio: Math.round(ratio * 100) / 100,
      potentialReward: Math.round(potentialReward * 100) / 100,
      isValid: true,
    };
  }, [rrStopLoss, rrTakeProfit, rrRiskAmount]);

  const saveRRCalc = () => {
    if (!rrCalculations.isValid) return;
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      type: "rr",
      timestamp: new Date().toISOString(),
      data: {
        stopLoss: rrStopLoss,
        takeProfit: rrTakeProfit,
        riskAmount: rrRiskAmount,
        ratio: rrCalculations.ratio,
        potentialReward: rrCalculations.potentialReward,
      },
    };
    saveToStorage([newCalc, ...savedCalculations].slice(0, 50));
    toast.success("Risk:Reward calculation saved!");
  };

  // Profit/Loss Calculator State
  const [plPair, setPlPair] = useState<InstrumentKey>("EUR/USD");
  const [plDirection, setPlDirection] = useState<"buy" | "sell">("buy");
  const [plEntryPrice, setPlEntryPrice] = useState<string>("1.1000");
  const [plExitPrice, setPlExitPrice] = useState<string>("1.1050");
  const [plLotSize, setPlLotSize] = useState<string>("1");

  const plCalculations = useMemo(() => {
    const entry = parseFloat(plEntryPrice) || 0;
    const exit = parseFloat(plExitPrice) || 0;
    const lots = parseFloat(plLotSize) || 0;
    const instrument = INSTRUMENTS[plPair];

    if (entry <= 0 || exit <= 0 || lots <= 0) {
      return { pips: 0, profitLoss: 0, isValid: false, isProfit: false };
    }

    // Calculate pip difference based on pip decimal
    const pipMultiplier = instrument.pipDecimal === 2 ? 100 : 10000;
    let priceDiff = exit - entry;
    
    // Adjust for sell direction
    if (plDirection === "sell") {
      priceDiff = -priceDiff;
    }

    const pips = priceDiff * pipMultiplier;
    const profitLoss = pips * lots * instrument.pipValue;

    return {
      pips: Math.round(pips * 10) / 10,
      profitLoss: Math.round(profitLoss * 100) / 100,
      isValid: true,
      isProfit: profitLoss >= 0,
    };
  }, [plPair, plDirection, plEntryPrice, plExitPrice, plLotSize]);

  const savePLCalc = () => {
    if (!plCalculations.isValid) return;
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      type: "pnl",
      timestamp: new Date().toISOString(),
      data: {
        pair: plPair,
        direction: plDirection,
        entryPrice: plEntryPrice,
        exitPrice: plExitPrice,
        lotSize: plLotSize,
        pips: plCalculations.pips,
        profitLoss: plCalculations.profitLoss,
      },
    };
    saveToStorage([newCalc, ...savedCalculations].slice(0, 50));
    toast.success("Profit/Loss calculation saved!");
  };

  // Pip Calculator State
  const [pipPair, setPipPair] = useState<InstrumentKey>("EUR/USD");
  const [pipPrice1, setPipPrice1] = useState<string>("1.1000");
  const [pipPrice2, setPipPrice2] = useState<string>("1.1050");
  const [pipLotSize, setPipLotSize] = useState<string>("1");

  const pipCalculations = useMemo(() => {
    const price1 = parseFloat(pipPrice1) || 0;
    const price2 = parseFloat(pipPrice2) || 0;
    const lots = parseFloat(pipLotSize) || 0;
    const instrument = INSTRUMENTS[pipPair];

    if (price1 <= 0 || price2 <= 0) {
      return { pips: 0, pipValue: 0, totalValue: 0, isValid: false };
    }

    // Calculate pip difference based on pip decimal
    const pipMultiplier = instrument.pipDecimal === 2 ? 100 : 10000;
    const priceDiff = Math.abs(price2 - price1);
    const pips = priceDiff * pipMultiplier;
    
    // Pip value per lot
    const pipValuePerLot = instrument.pipValue;
    const totalValue = pips * lots * pipValuePerLot;

    return {
      pips: Math.round(pips * 10) / 10,
      pipValue: pipValuePerLot,
      totalValue: Math.round(totalValue * 100) / 100,
      isValid: true,
    };
  }, [pipPair, pipPrice1, pipPrice2, pipLotSize]);

  const savePipCalc = () => {
    if (!pipCalculations.isValid) return;
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      type: "pip",
      timestamp: new Date().toISOString(),
      data: {
        pair: pipPair,
        price1: pipPrice1,
        price2: pipPrice2,
        lotSize: pipLotSize,
        pips: pipCalculations.pips,
        pipValue: pipCalculations.pipValue,
        totalValue: pipCalculations.totalValue,
      },
    };
    saveToStorage([newCalc, ...savedCalculations].slice(0, 50));
    toast.success("Pip calculation saved!");
  };

  // Margin Calculator State
  const [marginPair, setMarginPair] = useState<InstrumentKey>("EUR/USD");
  const [marginLotSize, setMarginLotSize] = useState<string>("1");
  const [marginLeverage, setMarginLeverage] = useState<string>("100");
  const [marginPrice, setMarginPrice] = useState<string>("1.1000");

  const marginCalculations = useMemo(() => {
    const lots = parseFloat(marginLotSize) || 0;
    const leverage = parseFloat(marginLeverage) || 0;
    const price = parseFloat(marginPrice) || 0;
    const instrument = INSTRUMENTS[marginPair];

    if (lots <= 0 || leverage <= 0 || price <= 0) {
      return { requiredMargin: 0, positionValue: 0, marginPercent: 0, isValid: false };
    }

    // Calculate position value: lots × contract size × price
    // For Gold, price is per oz, contract is 100 oz
    // For Forex, contract is 100,000 units
    const positionValue = lots * instrument.contractSize * price;
    
    // Required margin = position value / leverage
    const requiredMargin = positionValue / leverage;
    
    // Margin percentage (inverse of leverage)
    const marginPercent = (1 / leverage) * 100;

    return {
      requiredMargin: Math.round(requiredMargin * 100) / 100,
      positionValue: Math.round(positionValue * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
      isValid: true,
    };
  }, [marginPair, marginLotSize, marginLeverage, marginPrice]);

  const saveMarginCalc = () => {
    if (!marginCalculations.isValid) return;
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      type: "margin",
      timestamp: new Date().toISOString(),
      data: {
        pair: marginPair,
        lotSize: marginLotSize,
        leverage: marginLeverage,
        price: marginPrice,
        requiredMargin: marginCalculations.requiredMargin,
        positionValue: marginCalculations.positionValue,
        marginPercent: marginCalculations.marginPercent,
      },
    };
    saveToStorage([newCalc, ...savedCalculations].slice(0, 50));
    toast.success("Margin calculation saved!");
  };

  // Export calculations
  const exportCalculations = () => {
    if (savedCalculations.length === 0) {
      toast.error("No calculations to export");
      return;
    }

    const headers = ["Date", "Type", "Details"];
    const rows = savedCalculations.map((calc) => {
      const date = new Date(calc.timestamp).toLocaleString();
      let details = "";
      
      switch (calc.type) {
        case "position":
          details = `${calc.data.pair} | Balance: $${calc.data.accountBalance} | Risk: ${calc.data.riskPercent}% | SL: ${calc.data.stopLossPips} pips | Lot: ${calc.data.lotSize}`;
          break;
        case "rr":
          details = `SL: ${calc.data.stopLoss} pips | TP: ${calc.data.takeProfit} pips | Ratio: 1:${calc.data.ratio} | Reward: $${calc.data.potentialReward}`;
          break;
        case "pnl":
          details = `${calc.data.pair} ${calc.data.direction} | Entry: ${calc.data.entryPrice} → Exit: ${calc.data.exitPrice} | Lots: ${calc.data.lotSize} | P/L: $${calc.data.profitLoss}`;
          break;
        case "pip":
          details = `${calc.data.pair} | ${calc.data.price1} → ${calc.data.price2} | Pips: ${calc.data.pips} | Value: $${calc.data.totalValue}`;
          break;
        case "margin":
          details = `${calc.data.pair} | Lots: ${calc.data.lotSize} | Leverage: 1:${calc.data.leverage} | Margin: $${calc.data.requiredMargin}`;
          break;
      }
      
      return [date, calc.type.toUpperCase(), details];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arovaforex-calculations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calculations exported!");
  };

  const clearHistory = () => {
    saveToStorage([]);
    toast.success("History cleared");
  };

  const deleteCalculation = (id: string) => {
    saveToStorage(savedCalculations.filter((c) => c.id !== id));
    toast.success("Calculation deleted");
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "position": return "Position Size";
      case "rr": return "Risk:Reward";
      case "pnl": return "P&L";
      case "pip": return "Pip Value";
      case "margin": return "Margin";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "position": return "bg-primary/20 text-primary";
      case "rr": return "bg-amber-500/20 text-amber-500";
      case "pnl": return "bg-green-500/20 text-green-500";
      case "pip": return "bg-blue-500/20 text-blue-500";
      case "margin": return "bg-purple-500/20 text-purple-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <SEO 
        title="Trading Calculators | ArovaForex"
        description="Position size, risk:reward, profit/loss, and pip calculators for Forex and Gold trading."
      />
      
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Calculator className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Trading Calculators
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Essential tools for position sizing, risk management, and profit analysis.
            </p>
          </div>

          <Tabs defaultValue="position" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl mx-auto">
              <TabsTrigger value="position" className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Position</span>
              </TabsTrigger>
              <TabsTrigger value="rr" className="flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                <span className="hidden sm:inline">R:R</span>
              </TabsTrigger>
              <TabsTrigger value="pnl" className="flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">P&L</span>
              </TabsTrigger>
              <TabsTrigger value="pip" className="flex items-center gap-1.5">
                <Ruler className="w-4 h-4" />
                <span className="hidden sm:inline">Pip</span>
              </TabsTrigger>
              <TabsTrigger value="margin" className="flex items-center gap-1.5">
                <Percent className="w-4 h-4" />
                <span className="hidden sm:inline">Margin</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
                {savedCalculations.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {savedCalculations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Position Size Calculator Tab */}
            <TabsContent value="position">
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

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset} className="flex-1">
                    Reset
                  </Button>
                  <Button onClick={savePositionCalc} disabled={!calculations.isValid} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
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

                {/* Info Section */}
                <Card className="md:col-span-2 border-border/50">
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
            </TabsContent>

            {/* Risk:Reward Calculator Tab */}
            <TabsContent value="rr">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Input Card */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-primary" />
                      Risk:Reward Parameters
                    </CardTitle>
                    <CardDescription>
                      Calculate potential reward based on your risk
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Stop Loss Pips */}
                    <div className="space-y-2">
                      <Label htmlFor="rr-sl" className="flex items-center gap-2">
                        Stop Loss (pips)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Distance from entry to stop loss</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="rr-sl"
                        type="number"
                        min="1"
                        step="1"
                        value={rrStopLoss}
                        onChange={(e) => setRrStopLoss(e.target.value)}
                        placeholder="50"
                      />
                    </div>

                    {/* Take Profit Pips */}
                    <div className="space-y-2">
                      <Label htmlFor="rr-tp" className="flex items-center gap-2">
                        Take Profit (pips)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Distance from entry to take profit</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="rr-tp"
                        type="number"
                        min="1"
                        step="1"
                        value={rrTakeProfit}
                        onChange={(e) => setRrTakeProfit(e.target.value)}
                        placeholder="100"
                      />
                    </div>

                    {/* Risk Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="rr-risk" className="flex items-center gap-2">
                        Risk Amount ($)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Dollar amount you're risking on this trade</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="rr-risk"
                          type="number"
                          min="1"
                          step="1"
                          value={rrRiskAmount}
                          onChange={(e) => setRrRiskAmount(e.target.value)}
                          className="pl-9"
                          placeholder="100"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setRrStopLoss("50");
                          setRrTakeProfit("100");
                          setRrRiskAmount("100");
                        }} 
                        className="flex-1"
                      >
                        Reset
                      </Button>
                      <Button onClick={saveRRCalc} disabled={!rrCalculations.isValid} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-primary" />
                      Risk:Reward Results
                    </CardTitle>
                    <CardDescription>
                      Your trade's risk to reward analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rrCalculations.isValid ? (
                      <>
                        {/* Ratio - Main Result */}
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <p className="text-sm text-muted-foreground mb-1">Risk:Reward Ratio</p>
                          <p className="text-4xl font-bold text-primary">
                            1:{rrCalculations.ratio.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {rrCalculations.ratio >= 2 ? "✓ Good ratio (≥1:2)" : rrCalculations.ratio >= 1.5 ? "Acceptable ratio" : "⚠️ Low ratio (<1:1.5)"}
                          </p>
                        </div>

                        {/* Secondary Results */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Risk</p>
                            <p className="text-2xl font-semibold text-destructive">
                              ${parseFloat(rrRiskAmount).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Potential Reward</p>
                            <p className="text-2xl font-semibold text-green-500">
                              ${rrCalculations.potentialReward.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Visual Ratio Bar */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                          <p className="text-sm text-muted-foreground mb-2">Visual Ratio</p>
                          <div className="flex h-4 rounded-full overflow-hidden">
                            <div 
                              className="bg-destructive/70" 
                              style={{ width: `${100 / (1 + rrCalculations.ratio)}%` }}
                            />
                            <div 
                              className="bg-green-500/70" 
                              style={{ width: `${(100 * rrCalculations.ratio) / (1 + rrCalculations.ratio)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{rrStopLoss} pips SL</span>
                            <span>{rrTakeProfit} pips TP</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Enter valid values to see calculations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profit/Loss Calculator Tab */}
            <TabsContent value="pnl">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Input Card */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowUpDown className="w-5 h-5 text-primary" />
                      Trade Details
                    </CardTitle>
                    <CardDescription>
                      Calculate profit or loss based on entry and exit prices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Trading Pair */}
                    <div className="space-y-2">
                      <Label htmlFor="pl-pair">Trading Instrument</Label>
                      <Select value={plPair} onValueChange={(v) => setPlPair(v as InstrumentKey)}>
                        <SelectTrigger id="pl-pair">
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

                    {/* Direction */}
                    <div className="space-y-2">
                      <Label>Trade Direction</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={plDirection === "buy" ? "default" : "outline"}
                          onClick={() => setPlDirection("buy")}
                          className={plDirection === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          Buy / Long
                        </Button>
                        <Button
                          type="button"
                          variant={plDirection === "sell" ? "default" : "outline"}
                          onClick={() => setPlDirection("sell")}
                          className={plDirection === "sell" ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                          Sell / Short
                        </Button>
                      </div>
                    </div>

                    {/* Entry Price */}
                    <div className="space-y-2">
                      <Label htmlFor="pl-entry">Entry Price</Label>
                      <Input
                        id="pl-entry"
                        type="number"
                        step="0.0001"
                        value={plEntryPrice}
                        onChange={(e) => setPlEntryPrice(e.target.value)}
                        placeholder="1.1000"
                      />
                    </div>

                    {/* Exit Price */}
                    <div className="space-y-2">
                      <Label htmlFor="pl-exit">Exit Price</Label>
                      <Input
                        id="pl-exit"
                        type="number"
                        step="0.0001"
                        value={plExitPrice}
                        onChange={(e) => setPlExitPrice(e.target.value)}
                        placeholder="1.1050"
                      />
                    </div>

                    {/* Lot Size */}
                    <div className="space-y-2">
                      <Label htmlFor="pl-lots">Lot Size</Label>
                      <Input
                        id="pl-lots"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={plLotSize}
                        onChange={(e) => setPlLotSize(e.target.value)}
                        placeholder="1.00"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setPlPair("EUR/USD");
                          setPlDirection("buy");
                          setPlEntryPrice("1.1000");
                          setPlExitPrice("1.1050");
                          setPlLotSize("1");
                        }} 
                        className="flex-1"
                      >
                        Reset
                      </Button>
                      <Button onClick={savePLCalc} disabled={!plCalculations.isValid} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Profit/Loss Results
                    </CardTitle>
                    <CardDescription>
                      Your trade outcome analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plCalculations.isValid ? (
                      <>
                        {/* P&L - Main Result */}
                        <div className={`p-4 rounded-xl border ${plCalculations.isProfit ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                          <p className="text-sm text-muted-foreground mb-1">
                            {plCalculations.isProfit ? 'Profit' : 'Loss'}
                          </p>
                          <p className={`text-4xl font-bold ${plCalculations.isProfit ? 'text-green-500' : 'text-destructive'}`}>
                            {plCalculations.isProfit ? '+' : ''}{plCalculations.profitLoss < 0 ? '' : '$'}{Math.abs(plCalculations.profitLoss).toLocaleString()}
                            {plCalculations.profitLoss < 0 && <span className="text-destructive"> ({plCalculations.profitLoss.toLocaleString()})</span>}
                          </p>
                        </div>

                        {/* Secondary Results */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Pips</p>
                            <p className={`text-2xl font-semibold ${plCalculations.pips >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                              {plCalculations.pips >= 0 ? '+' : ''}{plCalculations.pips}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Direction</p>
                            <p className={`text-2xl font-semibold ${plDirection === 'buy' ? 'text-green-500' : 'text-destructive'}`}>
                              {plDirection === 'buy' ? '↑ Buy' : '↓ Sell'}
                            </p>
                          </div>
                        </div>

                        {/* Trade Summary */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-2">Trade Summary</p>
                          <div className="space-y-1">
                            <p><span className="text-foreground">Pair:</span> {plPair}</p>
                            <p><span className="text-foreground">Direction:</span> {plDirection.toUpperCase()}</p>
                            <p><span className="text-foreground">Entry → Exit:</span> {plEntryPrice} → {plExitPrice}</p>
                            <p><span className="text-foreground">Lot Size:</span> {plLotSize} lots</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <ArrowUpDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Enter valid values to see calculations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pip Calculator Tab */}
            <TabsContent value="pip">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Input Card */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-primary" />
                      Pip Calculator
                    </CardTitle>
                    <CardDescription>
                      Convert price movements to pip values
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Trading Pair */}
                    <div className="space-y-2">
                      <Label htmlFor="pip-pair">Trading Instrument</Label>
                      <Select value={pipPair} onValueChange={(v) => setPipPair(v as InstrumentKey)}>
                        <SelectTrigger id="pip-pair">
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

                    {/* Price 1 */}
                    <div className="space-y-2">
                      <Label htmlFor="pip-price1" className="flex items-center gap-2">
                        Price 1
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Starting price (e.g., entry price)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="pip-price1"
                        type="number"
                        step="0.0001"
                        value={pipPrice1}
                        onChange={(e) => setPipPrice1(e.target.value)}
                        placeholder="1.1000"
                      />
                    </div>

                    {/* Price 2 */}
                    <div className="space-y-2">
                      <Label htmlFor="pip-price2" className="flex items-center gap-2">
                        Price 2
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ending price (e.g., target or stop loss)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="pip-price2"
                        type="number"
                        step="0.0001"
                        value={pipPrice2}
                        onChange={(e) => setPipPrice2(e.target.value)}
                        placeholder="1.1050"
                      />
                    </div>

                    {/* Lot Size (Optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="pip-lots" className="flex items-center gap-2">
                        Lot Size (optional)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter lot size to calculate total dollar value</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="pip-lots"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={pipLotSize}
                        onChange={(e) => setPipLotSize(e.target.value)}
                        placeholder="1.00"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setPipPair("EUR/USD");
                          setPipPrice1("1.1000");
                          setPipPrice2("1.1050");
                          setPipLotSize("1");
                        }} 
                        className="flex-1"
                      >
                        Reset
                      </Button>
                      <Button onClick={savePipCalc} disabled={!pipCalculations.isValid} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-primary" />
                      Pip Calculation Results
                    </CardTitle>
                    <CardDescription>
                      Price movement converted to pips
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pipCalculations.isValid ? (
                      <>
                        {/* Pips - Main Result */}
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <p className="text-sm text-muted-foreground mb-1">Pip Difference</p>
                          <p className="text-4xl font-bold text-primary">
                            {pipCalculations.pips.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            pips
                          </p>
                        </div>

                        {/* Secondary Results */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Pip Value / Lot</p>
                            <p className="text-2xl font-semibold text-foreground">
                              ${pipCalculations.pipValue.toFixed(2)}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                            <p className="text-2xl font-semibold text-green-500">
                              ${pipCalculations.totalValue.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                          <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Calculation:</strong> The price moved from {pipPrice1} to {pipPrice2} on {pipPair}, 
                            resulting in {pipCalculations.pips.toFixed(1)} pips. At {pipLotSize} lot(s), 
                            this equals ${pipCalculations.totalValue.toLocaleString()}.
                          </p>
                        </div>

                        {/* Pip Value Reference */}
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Quick Reference:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-muted">
                              <span className="text-muted-foreground">1 pip =</span>{" "}
                              <span className="font-medium text-foreground">
                                {INSTRUMENTS[pipPair].pipDecimal === 2 ? "0.01" : "0.0001"}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-muted">
                              <span className="text-muted-foreground">Contract =</span>{" "}
                              <span className="font-medium text-foreground">
                                {INSTRUMENTS[pipPair].contractSize.toLocaleString()} units
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <Ruler className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Enter valid prices to see calculations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Section */}
                <Card className="md:col-span-2 border-border/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Understanding Pips</h3>
                    <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground mb-1">What is a Pip?</p>
                        <p>A pip is the smallest price move in Forex. For most pairs, it's 0.0001. For JPY pairs, it's 0.01.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Pip Value</p>
                        <p>The monetary value of each pip depends on the currency pair and lot size you're trading.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Gold (XAU/USD)</p>
                        <p>For Gold, 1 pip = $0.01 price movement, valued at $1 per standard lot (100 oz).</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Margin Calculator Tab */}
            <TabsContent value="margin">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Input Card */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Percent className="w-5 h-5 text-primary" />
                      Margin Parameters
                    </CardTitle>
                    <CardDescription>
                      Calculate required margin for your trade
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Trading Pair */}
                    <div className="space-y-2">
                      <Label htmlFor="margin-pair">Trading Instrument</Label>
                      <Select value={marginPair} onValueChange={(v) => setMarginPair(v as InstrumentKey)}>
                        <SelectTrigger id="margin-pair">
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

                    {/* Current Price */}
                    <div className="space-y-2">
                      <Label htmlFor="margin-price" className="flex items-center gap-2">
                        Current Price
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current market price of the instrument</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="margin-price"
                        type="number"
                        step="0.0001"
                        value={marginPrice}
                        onChange={(e) => setMarginPrice(e.target.value)}
                        placeholder="1.1000"
                      />
                    </div>

                    {/* Lot Size */}
                    <div className="space-y-2">
                      <Label htmlFor="margin-lots" className="flex items-center gap-2">
                        Lot Size
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Number of lots to trade (1 lot = 100,000 units for Forex)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="margin-lots"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={marginLotSize}
                        onChange={(e) => setMarginLotSize(e.target.value)}
                        placeholder="1.00"
                      />
                    </div>

                    {/* Leverage */}
                    <div className="space-y-2">
                      <Label htmlFor="margin-leverage" className="flex items-center gap-2">
                        Leverage (1:X)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Your broker's leverage ratio (e.g., 100 for 1:100)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select value={marginLeverage} onValueChange={setMarginLeverage}>
                        <SelectTrigger id="margin-leverage">
                          <SelectValue placeholder="Select leverage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">1:10</SelectItem>
                          <SelectItem value="20">1:20</SelectItem>
                          <SelectItem value="30">1:30</SelectItem>
                          <SelectItem value="50">1:50</SelectItem>
                          <SelectItem value="100">1:100</SelectItem>
                          <SelectItem value="200">1:200</SelectItem>
                          <SelectItem value="300">1:300</SelectItem>
                          <SelectItem value="400">1:400</SelectItem>
                          <SelectItem value="500">1:500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setMarginPair("EUR/USD");
                          setMarginLotSize("1");
                          setMarginLeverage("100");
                          setMarginPrice("1.1000");
                        }} 
                        className="flex-1"
                      >
                        Reset
                      </Button>
                      <Button onClick={saveMarginCalc} disabled={!marginCalculations.isValid} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Percent className="w-5 h-5 text-primary" />
                      Margin Requirements
                    </CardTitle>
                    <CardDescription>
                      Capital needed to open this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {marginCalculations.isValid ? (
                      <>
                        {/* Required Margin - Main Result */}
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <p className="text-sm text-muted-foreground mb-1">Required Margin</p>
                          <p className="text-4xl font-bold text-primary">
                            ${marginCalculations.requiredMargin.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            minimum to open position
                          </p>
                        </div>

                        {/* Secondary Results */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Position Value</p>
                            <p className="text-2xl font-semibold text-foreground">
                              ${marginCalculations.positionValue.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-card border border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">Margin %</p>
                            <p className="text-2xl font-semibold text-foreground">
                              {marginCalculations.marginPercent}%
                            </p>
                          </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                          <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Calculation:</strong> Trading {marginLotSize} lot(s) of {marginPair} at {marginPrice} 
                            with 1:{marginLeverage} leverage requires ${marginCalculations.requiredMargin.toLocaleString()} margin for a ${marginCalculations.positionValue.toLocaleString()} position.
                          </p>
                        </div>

                        {/* Leverage Comparison */}
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Margin at Different Leverage:</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {[50, 100, 200].map((lev) => {
                              const margin = marginCalculations.positionValue / lev;
                              return (
                                <div key={lev} className={`p-2 rounded ${marginLeverage === String(lev) ? 'bg-primary/20 border border-primary/30' : 'bg-muted'}`}>
                                  <span className="text-muted-foreground">1:{lev}</span>{" "}
                                  <span className="font-medium text-foreground">
                                    ${margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <Percent className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Enter valid parameters to see calculations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Section */}
                <Card className="md:col-span-2 border-border/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Understanding Margin</h3>
                    <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground mb-1">What is Margin?</p>
                        <p>Margin is the collateral required to open and maintain a leveraged position. Higher leverage = less margin required.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Leverage Risk</p>
                        <p>While leverage amplifies profits, it also amplifies losses. Always use proper risk management regardless of leverage.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Free Margin</p>
                        <p>Always maintain free margin (account equity minus used margin) to avoid margin calls during market volatility.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Saved Calculations
                      </CardTitle>
                      <CardDescription>
                        Your trade planning history ({savedCalculations.length} saved)
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={exportCalculations}
                        disabled={savedCalculations.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearHistory}
                        disabled={savedCalculations.length === 0}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedCalculations.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="mb-2">No saved calculations yet</p>
                      <p className="text-sm">Use the calculators above and click "Save" to track your trade planning history.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {savedCalculations.map((calc) => (
                          <div
                            key={calc.id}
                            className="p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getTypeColor(calc.type)}`}>
                                    {getTypeLabel(calc.type)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(calc.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-sm text-foreground">
                                  {calc.type === "position" && (
                                    <div className="space-y-1">
                                      <p><span className="text-muted-foreground">Pair:</span> {calc.data.pair as string}</p>
                                      <p><span className="text-muted-foreground">Balance:</span> ${(calc.data.accountBalance as string)} | <span className="text-muted-foreground">Risk:</span> {calc.data.riskPercent as string}%</p>
                                      <p><span className="text-muted-foreground">Result:</span> <span className="font-semibold text-primary">{(calc.data.lotSize as number).toFixed(2)} lots</span> | Risk: ${calc.data.riskAmount as number}</p>
                                    </div>
                                  )}
                                  {calc.type === "rr" && (
                                    <div className="space-y-1">
                                      <p><span className="text-muted-foreground">SL:</span> {calc.data.stopLoss as string} pips | <span className="text-muted-foreground">TP:</span> {calc.data.takeProfit as string} pips</p>
                                      <p><span className="text-muted-foreground">Ratio:</span> <span className="font-semibold text-primary">1:{calc.data.ratio as number}</span> | Reward: ${calc.data.potentialReward as number}</p>
                                    </div>
                                  )}
                                  {calc.type === "pnl" && (
                                    <div className="space-y-1">
                                      <p><span className="text-muted-foreground">Pair:</span> {calc.data.pair as string} {(calc.data.direction as string).toUpperCase()}</p>
                                      <p><span className="text-muted-foreground">Entry → Exit:</span> {calc.data.entryPrice as string} → {calc.data.exitPrice as string}</p>
                                      <p><span className="text-muted-foreground">Result:</span> <span className={`font-semibold ${(calc.data.profitLoss as number) >= 0 ? 'text-green-500' : 'text-destructive'}`}>{(calc.data.profitLoss as number) >= 0 ? '+' : ''}${calc.data.profitLoss as number}</span> ({calc.data.pips as number} pips)</p>
                                    </div>
                                  )}
                                  {calc.type === "pip" && (
                                    <div className="space-y-1">
                                      <p><span className="text-muted-foreground">Pair:</span> {calc.data.pair as string}</p>
                                      <p><span className="text-muted-foreground">Prices:</span> {calc.data.price1 as string} → {calc.data.price2 as string}</p>
                                      <p><span className="text-muted-foreground">Result:</span> <span className="font-semibold text-primary">{calc.data.pips as number} pips</span> = ${calc.data.totalValue as number}</p>
                                    </div>
                                  )}
                                  {calc.type === "margin" && (
                                    <div className="space-y-1">
                                      <p><span className="text-muted-foreground">Pair:</span> {calc.data.pair as string} @ {calc.data.price as string}</p>
                                      <p><span className="text-muted-foreground">Lots:</span> {calc.data.lotSize as string} | <span className="text-muted-foreground">Leverage:</span> 1:{calc.data.leverage as string}</p>
                                      <p><span className="text-muted-foreground">Result:</span> <span className="font-semibold text-purple-500">${(calc.data.requiredMargin as number).toLocaleString()}</span> margin required</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteCalculation(calc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
