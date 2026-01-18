import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FlaskConical, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Pencil,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Tag,
  Hash
} from "lucide-react";
import { findAllMatches, type DetailedMatchResult, type KnowledgeEntry } from "@/lib/aiAssistant";

interface AssistantTestModeProps {
  knowledgeBase: KnowledgeEntry[];
  onEditEntry: (entry: KnowledgeEntry) => void;
}

const SAMPLE_QUERIES = {
  platform: [
    "How do I check my wallet balance?",
    "Where can I find the calculator?",
    "How do I join the live trading room?",
    "What are premium signals?",
    "How do I access the academy?",
    "How do I use the trading journal?",
    "Where is the economic calendar?",
  ],
  trading: [
    "What is risk management?",
    "How do I calculate lot size?",
    "What is risk reward ratio?",
    "How to control trading emotions?",
    "How do I trade gold?",
    "Why should I use a stop loss?",
    "What is position sizing?",
  ],
  general: [
    "Hello!",
    "What can you help me with?",
    "How do I contact support?",
    "Good morning",
  ],
  edge: [
    "asdfghjkl",
    "What's your favorite color?",
    "Can you order pizza?",
    "Tell me a joke",
  ],
};

const MATCH_THRESHOLD = 8;

export function AssistantTestMode({ knowledgeBase, onEditEntry }: AssistantTestModeProps) {
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<DetailedMatchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTest = (query: string) => {
    setTestQuery(query);
    const activeEntries = knowledgeBase.filter(e => e.active);
    const results = findAllMatches(query, activeEntries);
    setTestResults(results);
    setHasSearched(true);
  };

  const bestMatch = testResults?.[0];
  const isMatched = bestMatch && bestMatch.score >= MATCH_THRESHOLD;
  const otherMatches = testResults?.slice(1) || [];

  // Keyword Analysis
  const keywordAnalysis = useMemo(() => {
    const keywordStats: Record<string, {
      keyword: string;
      intents: string[];
      categories: string[];
      avgPriority: number;
      count: number;
    }> = {};

    knowledgeBase.forEach(entry => {
      entry.keywords.forEach(keyword => {
        const key = keyword.toLowerCase();
        if (!keywordStats[key]) {
          keywordStats[key] = {
            keyword,
            intents: [],
            categories: [],
            avgPriority: 0,
            count: 0,
          };
        }
        keywordStats[key].intents.push(entry.intent);
        if (!keywordStats[key].categories.includes(entry.category)) {
          keywordStats[key].categories.push(entry.category);
        }
        keywordStats[key].avgPriority += entry.priority;
        keywordStats[key].count++;
      });
    });

    // Calculate averages
    Object.values(keywordStats).forEach(stat => {
      stat.avgPriority = stat.avgPriority / stat.count;
    });

    const allKeywords = Object.values(keywordStats);
    const sortedByPriority = [...allKeywords].sort((a, b) => b.avgPriority - a.avgPriority);
    const duplicates = allKeywords.filter(k => k.intents.length > 1);
    const lowCoverageEntries = knowledgeBase.filter(e => e.keywords.length < 3);

    const avgKeywordsPerEntry = knowledgeBase.length > 0
      ? knowledgeBase.reduce((sum, e) => sum + e.keywords.length, 0) / knowledgeBase.length
      : 0;

    const categoryDistribution = knowledgeBase.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      topKeywords: sortedByPriority.slice(0, 10),
      weakKeywords: sortedByPriority.slice(-5).reverse(),
      duplicates,
      lowCoverageEntries,
      avgKeywordsPerEntry: avgKeywordsPerEntry.toFixed(1),
      totalUniqueKeywords: allKeywords.length,
      categoryDistribution,
    };
  }, [knowledgeBase]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'platform': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'trading': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'general': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'edge': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sample Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="w-5 h-5 text-primary" />
            Sample Query Library
          </CardTitle>
          <CardDescription>
            Click any query to test how the AI assistant would respond
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(SAMPLE_QUERIES).map(([category, queries]) => (
            <div key={category}>
              <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {category === 'edge' ? 'Edge Cases' : category}:
              </p>
              <div className="flex flex-wrap gap-2">
                {queries.map((query) => (
                  <Button
                    key={query}
                    variant="outline"
                    size="sm"
                    className={`text-xs ${getCategoryColor(category)} border`}
                    onClick={() => handleTest(query)}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Query Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="w-5 h-5 text-primary" />
            Query Simulator
          </CardTitle>
          <CardDescription>
            Enter any query to see detailed match analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTest(testQuery)}
                placeholder="Enter a test query..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => handleTest(testQuery)} disabled={!testQuery.trim()}>
              Test Query
            </Button>
          </div>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border ${
                isMatched 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-destructive/10 border-destructive/30'
              }`}>
                <div className="flex items-center gap-2">
                  {isMatched ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className="font-semibold">
                    {isMatched ? 'MATCHED' : 'UNMATCHED'}
                  </span>
                  {bestMatch && (
                    <span className="text-muted-foreground">
                      - Best Score: {bestMatch.score.toFixed(1)} (threshold: {MATCH_THRESHOLD})
                    </span>
                  )}
                </div>
              </div>

              {/* Winner Details */}
              {bestMatch && (
                <Card className="border-2 border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {isMatched ? '✅ Winner' : '❌ Best Candidate (below threshold)'}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditEntry(bestMatch.entry)}
                        className="gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Intent</p>
                        <p className="font-medium">{bestMatch.entry.intent}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <Badge className={getCategoryColor(bestMatch.entry.category)}>
                          {bestMatch.entry.category}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Priority</p>
                        <p className="font-medium">{bestMatch.entry.priority}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant={bestMatch.entry.active ? "default" : "secondary"}>
                          {bestMatch.entry.active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Score Breakdown:</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-background rounded">
                          <p className="text-muted-foreground text-xs">Base Score</p>
                          <p className="font-bold text-lg">{bestMatch.baseScore.toFixed(1)}</p>
                        </div>
                        <div className="text-center p-2 bg-background rounded">
                          <p className="text-muted-foreground text-xs">Priority ×</p>
                          <p className="font-bold text-lg">{bestMatch.priorityMultiplier.toFixed(2)}</p>
                        </div>
                        <div className="text-center p-2 bg-primary/10 rounded border border-primary/30">
                          <p className="text-muted-foreground text-xs">Final Score</p>
                          <p className="font-bold text-lg text-primary">{bestMatch.score.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Matched Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {bestMatch.matchedKeywords.map((kw, i) => (
                          <Badge key={i} variant="default" className="bg-primary/20 text-primary">
                            ✓ {kw}
                          </Badge>
                        ))
                        }
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Response Preview:</p>
                      <ScrollArea className="h-24 p-3 bg-muted/30 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">{bestMatch.entry.answer}</p>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Other Candidates */}
              {otherMatches.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Other Candidates ({otherMatches.length}):</p>
                  <div className="space-y-2">
                    {otherMatches.slice(0, 5).map((match, index) => (
                      <div 
                        key={match.entry.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-medium">#{index + 2}</span>
                          <div>
                            <p className="font-medium text-sm">{match.entry.intent}</p>
                            <p className="text-xs text-muted-foreground">
                              Keywords: {match.matchedKeywords.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${match.score >= MATCH_THRESHOLD ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {match.score.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">Priority: {match.entry.priority}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults?.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No keywords matched any entries in the knowledge base
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyword Analyzer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Keyword Analyzer
          </CardTitle>
          <CardDescription>
            Analyze keyword effectiveness and coverage across the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="top">Top Keywords</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-bold">{keywordAnalysis.totalUniqueKeywords}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Unique Keywords</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <span className="text-2xl font-bold">{keywordAnalysis.avgKeywordsPerEntry}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Avg per Entry</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-2xl font-bold">{keywordAnalysis.duplicates.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Shared Keywords</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-2xl font-bold">{keywordAnalysis.lowCoverageEntries.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Low Coverage</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Category Distribution:</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(keywordAnalysis.categoryDistribution).map(([cat, count]) => (
                    <Badge key={cat} className={getCategoryColor(cat)}>
                      {cat}: {count} entries
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="top" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <p className="font-medium">Top Keywords (by priority)</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Entries</TableHead>
                        <TableHead>Avg Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywordAnalysis.topKeywords.slice(0, 5).map((kw) => (
                        <TableRow key={kw.keyword}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell>{kw.count}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{kw.avgPriority.toFixed(1)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-4 h-4 text-amber-500" />
                    <p className="font-medium">Weak Keywords (low priority)</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Entries</TableHead>
                        <TableHead>Avg Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywordAnalysis.weakKeywords.map((kw) => (
                        <TableRow key={kw.keyword}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell>{kw.count}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{kw.avgPriority.toFixed(1)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {/* Duplicate Keywords */}
              {keywordAnalysis.duplicates.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <p className="font-medium">Keywords in Multiple Intents (may cause conflicts)</p>
                  </div>
                  <div className="space-y-2">
                    {keywordAnalysis.duplicates.slice(0, 5).map((kw) => (
                      <div key={kw.keyword} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="font-medium">"{kw.keyword}"</p>
                        <p className="text-sm text-muted-foreground">
                          Used in: {kw.intents.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Coverage Entries */}
              {keywordAnalysis.lowCoverageEntries.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-destructive" />
                    <p className="font-medium">Entries with Few Keywords (&lt;3 keywords)</p>
                  </div>
                  <div className="space-y-2">
                    {keywordAnalysis.lowCoverageEntries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                      >
                        <div>
                          <p className="font-medium">{entry.intent}</p>
                          <div className="flex gap-1 mt-1">
                            {entry.keywords.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditEntry(entry)}
                        >
                          Add Keywords
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {keywordAnalysis.duplicates.length === 0 && keywordAnalysis.lowCoverageEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-medium">No issues detected!</p>
                  <p className="text-sm">Your knowledge base is well-configured</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

