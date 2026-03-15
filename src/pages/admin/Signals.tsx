import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Signal, Plus, TrendingUp, TrendingDown, X, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TradingSignal {
  id: string;
  currency_pair: string;
  signal_type: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  take_profit_2: number | null;
  take_profit_3: number | null;
  confidence: string;
  status: string;
  outcome: string | null;
  pips_gained: number | null;
  analysis: string | null;
  timeframe: string | null;
  chart_url: string | null;
  published_by: string;
  closed_at: string | null;
  created_at: string;
}

const PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
  "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "EUR/AUD", "GBP/AUD",
  "EUR/CAD", "GBP/CAD", "AUD/CAD", "XAU/USD", "US30", "NAS100", "SPX500"
];

export default function AdminSignals() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [closeDialogId, setCloseDialogId] = useState<string | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<string>("win");
  const [closePips, setClosePips] = useState("");
  const [form, setForm] = useState({
    currency_pair: "",
    signal_type: "BUY",
    entry_price: "",
    stop_loss: "",
    take_profit: "",
    take_profit_2: "",
    take_profit_3: "",
    confidence: "medium",
    analysis: "",
    timeframe: "H4",
  });

  useEffect(() => {
    fetchSignals();
    const channel = supabase
      .channel('admin-signals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_signals' }, () => fetchSignals())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from('trading_signals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error("Failed to load signals"); }
    else setSignals(data || []);
    setLoading(false);
  };

  const publishSignal = async () => {
    if (!form.currency_pair || !form.entry_price || !form.stop_loss || !form.take_profit) {
      toast.error("Fill in all required fields");
      return;
    }
    const { error } = await supabase.from('trading_signals').insert({
      currency_pair: form.currency_pair,
      signal_type: form.signal_type,
      entry_price: parseFloat(form.entry_price),
      stop_loss: parseFloat(form.stop_loss),
      take_profit: parseFloat(form.take_profit),
      take_profit_2: form.take_profit_2 ? parseFloat(form.take_profit_2) : null,
      take_profit_3: form.take_profit_3 ? parseFloat(form.take_profit_3) : null,
      confidence: form.confidence,
      analysis: form.analysis || null,
      timeframe: form.timeframe || null,
      published_by: user!.id,
    });
    if (error) { toast.error("Failed to publish signal"); console.error(error); }
    else {
      toast.success("Signal published!");
      setOpen(false);
      setForm({ currency_pair: "", signal_type: "BUY", entry_price: "", stop_loss: "", take_profit: "", take_profit_2: "", take_profit_3: "", confidence: "medium", analysis: "", timeframe: "H4" });
    }
  };

  const closeSignal = async (id: string) => {
    const { error } = await supabase.from('trading_signals').update({
      status: 'closed',
      outcome: closeOutcome,
      pips_gained: closePips ? parseFloat(closePips) : null,
      closed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) toast.error("Failed to close signal");
    else { toast.success("Signal closed"); setCloseDialogId(null); setClosePips(""); }
  };

  const cancelSignal = async (id: string) => {
    const { error } = await supabase.from('trading_signals').update({ status: 'cancelled' }).eq('id', id);
    if (error) toast.error("Failed to cancel signal");
    else toast.success("Signal cancelled");
  };

  const activeSignals = signals.filter(s => s.status === 'active');
  const closedSignals = signals.filter(s => s.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Signal className="w-6 h-6 text-primary" />
            Trading Signals
          </h1>
          <p className="text-muted-foreground">Publish and manage trading signals for premium members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Signal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Publish New Signal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pair *</Label>
                  <Select value={form.currency_pair} onValueChange={v => setForm(p => ({ ...p, currency_pair: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select pair" /></SelectTrigger>
                    <SelectContent>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Direction *</Label>
                  <Select value={form.signal_type} onValueChange={v => setForm(p => ({ ...p, signal_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Entry Price *</Label><Input type="number" step="any" value={form.entry_price} onChange={e => setForm(p => ({ ...p, entry_price: e.target.value }))} /></div>
                <div><Label>Stop Loss *</Label><Input type="number" step="any" value={form.stop_loss} onChange={e => setForm(p => ({ ...p, stop_loss: e.target.value }))} /></div>
                <div><Label>Take Profit *</Label><Input type="number" step="any" value={form.take_profit} onChange={e => setForm(p => ({ ...p, take_profit: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>TP 2 (optional)</Label><Input type="number" step="any" value={form.take_profit_2} onChange={e => setForm(p => ({ ...p, take_profit_2: e.target.value }))} /></div>
                <div><Label>TP 3 (optional)</Label><Input type="number" step="any" value={form.take_profit_3} onChange={e => setForm(p => ({ ...p, take_profit_3: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Confidence</Label>
                  <Select value={form.confidence} onValueChange={v => setForm(p => ({ ...p, confidence: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeframe</Label>
                  <Select value={form.timeframe} onValueChange={v => setForm(p => ({ ...p, timeframe: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["M15", "M30", "H1", "H4", "D1", "W1"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Analysis</Label><Textarea value={form.analysis} onChange={e => setForm(p => ({ ...p, analysis: e.target.value }))} placeholder="Share your analysis..." rows={3} /></div>
              <Button onClick={publishSignal} className="w-full">Publish Signal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Signals */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-lg">Active Signals ({activeSignals.length})</CardTitle></CardHeader>
        <CardContent>
          {activeSignals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active signals</p>
          ) : (
            <div className="space-y-3">
              {activeSignals.map(signal => (
                <div key={signal.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${signal.signal_type === 'BUY' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {signal.signal_type === 'BUY' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold">{signal.currency_pair} <Badge variant="outline" className="ml-2 text-xs">{signal.signal_type}</Badge></div>
                      <div className="text-sm text-muted-foreground">
                        Entry: {signal.entry_price} | SL: {signal.stop_loss} | TP: {signal.take_profit}
                        {signal.take_profit_2 && ` | TP2: ${signal.take_profit_2}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })} · {signal.confidence} confidence · {signal.timeframe}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={closeDialogId === signal.id} onOpenChange={v => { if (!v) setCloseDialogId(null); else setCloseDialogId(signal.id); }}>
                      <DialogTrigger asChild><Button size="sm" variant="outline">Close</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Close Signal: {signal.currency_pair}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Outcome</Label>
                            <Select value={closeOutcome} onValueChange={setCloseOutcome}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="win">Win</SelectItem>
                                <SelectItem value="loss">Loss</SelectItem>
                                <SelectItem value="breakeven">Breakeven</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Pips Gained/Lost</Label><Input type="number" step="any" value={closePips} onChange={e => setClosePips(e.target.value)} /></div>
                          <Button onClick={() => closeSignal(signal.id)} className="w-full">Close Signal</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="ghost" onClick={() => cancelSignal(signal.id)}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Signals */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-lg">Signal History ({closedSignals.length})</CardTitle></CardHeader>
        <CardContent>
          {closedSignals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No signal history</p>
          ) : (
            <div className="space-y-2">
              {closedSignals.slice(0, 20).map(signal => (
                <div key={signal.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3">
                    {signal.outcome === 'win' ? <CheckCircle className="w-5 h-5 text-success" /> : signal.outcome === 'loss' ? <XCircle className="w-5 h-5 text-destructive" /> : <MinusCircle className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <span className="font-medium">{signal.currency_pair}</span>
                      <span className="text-sm text-muted-foreground ml-2">{signal.signal_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {signal.pips_gained != null && (
                      <span className={signal.pips_gained >= 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                        {signal.pips_gained >= 0 ? '+' : ''}{signal.pips_gained} pips
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">{signal.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
