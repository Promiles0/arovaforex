import { useEffect, useMemo, useState } from "react";
import { Star, Plus, X, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNewsWatchlist } from "@/hooks/useNewsWatchlist";
import { supabase } from "@/integrations/supabase/client";

const MAJORS = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "XAU"];

const buildPair = (a: string, b: string): string | null => {
  if (a === b) return null;
  // Conventional ordering: XAU first, then USD, EUR, GBP, AUD, NZD, then others
  const order = ["XAU", "EUR", "GBP", "AUD", "NZD", "USD", "CAD", "CHF", "JPY"];
  const ai = order.indexOf(a), bi = order.indexOf(b);
  if (ai === -1 || bi === -1) return `${a}${b}`;
  return ai < bi ? `${a}${b}` : `${b}${a}`;
};

export const WatchlistEditor = () => {
  const { watchlist, save, saving, loading } = useNewsWatchlist();
  const [open, setOpen] = useState(false);
  const [draftCurrencies, setDraftCurrencies] = useState<string[]>(watchlist.currencies);
  const [draftPairs, setDraftPairs] = useState<string[]>(watchlist.pairs);
  const [pairInput, setPairInput] = useState("");
  const [trendingPairs, setTrendingPairs] = useState<string[]>([]);

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setDraftCurrencies(watchlist.currencies);
      setDraftPairs(watchlist.pairs);
      setPairInput("");
    }
  };

  // Fetch trending pairs from latest digest
  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("news_digests")
        .select("currency_impacts")
        .order("digest_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active || !data?.currency_impacts) return;
      const set = new Set<string>();
      try {
        const impacts = data.currency_impacts as Array<{ pairs?: string[] }>;
        impacts.forEach(ci => (ci.pairs ?? []).forEach(p => {
          const cleaned = p.toUpperCase().replace(/[^A-Z]/g, "");
          if (cleaned.length >= 6) set.add(cleaned);
        }));
      } catch { /* ignore */ }
      setTrendingPairs(Array.from(set));
    })();
    return () => { active = false; };
  }, [open]);

  const toggleCurrency = (c: string) => {
    setDraftCurrencies(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const addPair = (raw?: string) => {
    const source = raw ?? pairInput;
    const cleaned = source.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (cleaned && !draftPairs.includes(cleaned)) {
      setDraftPairs(prev => [...prev, cleaned]);
    }
    if (!raw) setPairInput("");
  };

  const handleSave = async () => {
    const ok = await save({ currencies: draftCurrencies, pairs: draftPairs });
    if (ok) setOpen(false);
  };

  // Auto-suggest: combinations of selected currencies + their X-USD pair + trending
  const suggestions = useMemo(() => {
    const set = new Set<string>();
    // Pair selected currencies with each other and with USD
    draftCurrencies.forEach(a => {
      MAJORS.forEach(b => {
        const p = buildPair(a, b);
        if (p) set.add(p);
      });
    });
    // Add trending
    trendingPairs.forEach(p => set.add(p));
    // Filter out already-added
    return Array.from(set).filter(p => !draftPairs.includes(p)).slice(0, 8);
  }, [draftCurrencies, draftPairs, trendingPairs]);

  const totalCount = watchlist.currencies.length + watchlist.pairs.length;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Star className="w-4 h-4 mr-2" />
          {totalCount > 0 ? `Watchlist (${totalCount})` : "Set watchlist"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">Your watchlist</h4>
            <p className="text-xs text-muted-foreground">
              We'll highlight these on the impact map.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Currencies</p>
            <div className="grid grid-cols-3 gap-2">
              {MAJORS.map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={draftCurrencies.includes(c)}
                    onCheckedChange={() => toggleCurrency(c)}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Pairs</p>
            <div className="flex gap-2 mb-2">
              <Input
                value={pairInput}
                onChange={e => setPairInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPair(); } }}
                placeholder="e.g. EURUSD"
                className="h-8 text-sm"
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => addPair()}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {draftPairs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No pairs added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {draftPairs.map(p => (
                  <Badge key={p} variant="secondary" className="gap-1">
                    {p}
                    <button
                      onClick={() => setDraftPairs(prev => prev.filter(x => x !== p))}
                      className="hover:text-destructive"
                      aria-label={`Remove ${p}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-medium mb-1.5 text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Suggested
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => addPair(p)}
                      className="text-xs px-2 py-0.5 rounded-md border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
