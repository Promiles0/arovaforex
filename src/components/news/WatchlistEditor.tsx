import { useState } from "react";
import { Star, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNewsWatchlist } from "@/hooks/useNewsWatchlist";

const MAJORS = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "XAU"];

export const WatchlistEditor = () => {
  const { watchlist, save, saving, loading } = useNewsWatchlist();
  const [open, setOpen] = useState(false);
  const [draftCurrencies, setDraftCurrencies] = useState<string[]>(watchlist.currencies);
  const [draftPairs, setDraftPairs] = useState<string[]>(watchlist.pairs);
  const [pairInput, setPairInput] = useState("");

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setDraftCurrencies(watchlist.currencies);
      setDraftPairs(watchlist.pairs);
      setPairInput("");
    }
  };

  const toggleCurrency = (c: string) => {
    setDraftCurrencies(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const addPair = () => {
    const cleaned = pairInput.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (cleaned && !draftPairs.includes(cleaned)) {
      setDraftPairs(prev => [...prev, cleaned]);
    }
    setPairInput("");
  };

  const handleSave = async () => {
    const ok = await save({ currencies: draftCurrencies, pairs: draftPairs });
    if (ok) setOpen(false);
  };

  const totalCount = watchlist.currencies.length + watchlist.pairs.length;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Star className="w-4 h-4 mr-2" />
          {totalCount > 0 ? `Watchlist (${totalCount})` : "Set watchlist"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
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
              <Button type="button" size="sm" variant="secondary" onClick={addPair}>
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
