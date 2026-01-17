import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Plus, Pencil, Trash2, Search, X, Tag, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { AssistantAnalytics } from "@/components/admin/AssistantAnalytics";

interface KnowledgeEntry {
  id: string;
  intent: string;
  keywords: string[];
  answer: string;
  category: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const defaultEntry: Partial<KnowledgeEntry> = {
  intent: '',
  keywords: [],
  answer: '',
  category: 'general',
  priority: 5,
  active: true,
};

const AIAssistant = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<KnowledgeEntry>>(defaultEntry);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const fetchKnowledgeBase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setKnowledgeBase(data || []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      toast.error('Failed to load knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingEntry.intent?.trim()) {
      toast.error('Intent is required');
      return;
    }
    if (!editingEntry.keywords?.length) {
      toast.error('At least one keyword is required');
      return;
    }
    if (!editingEntry.answer?.trim()) {
      toast.error('Answer is required');
      return;
    }

    setIsSaving(true);
    try {
      const entryData = {
        intent: editingEntry.intent.trim(),
        keywords: editingEntry.keywords,
        answer: editingEntry.answer.trim(),
        category: editingEntry.category || 'general',
        priority: editingEntry.priority || 5,
        active: editingEntry.active ?? true,
      };

      if (editingEntry.id) {
        const { error } = await supabase
          .from('ai_knowledge_base')
          .update(entryData)
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        toast.success('Entry updated successfully');
      } else {
        const { error } = await supabase
          .from('ai_knowledge_base')
          .insert([entryData]);
        
        if (error) throw error;
        toast.success('Entry created successfully');
      }

      setIsModalOpen(false);
      setEditingEntry(defaultEntry);
      setKeywordInput("");
      fetchKnowledgeBase();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Entry deleted');
      fetchKnowledgeBase();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchKnowledgeBase();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    if (editingEntry.keywords?.includes(keywordInput.trim())) {
      toast.error('Keyword already exists');
      return;
    }
    setEditingEntry(prev => ({
      ...prev,
      keywords: [...(prev.keywords || []), keywordInput.trim()]
    }));
    setKeywordInput("");
  };

  const removeKeyword = (keyword: string) => {
    setEditingEntry(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const openEditModal = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const openCreateModal = (prefillKeywords?: string) => {
    setEditingEntry({
      ...defaultEntry,
      keywords: prefillKeywords ? [prefillKeywords] : [],
    });
    setKeywordInput("");
    setIsModalOpen(true);
  };

  // Filter entries
  const filteredEntries = knowledgeBase.filter(entry => {
    const matchesSearch = searchQuery === "" ||
      entry.intent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && entry.active) ||
      (statusFilter === "disabled" && !entry.active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'platform': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'trading': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'general': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI Assistant Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage knowledge base and view conversation analytics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="knowledge-base" className="space-y-6">
        <TabsList>
          <TabsTrigger value="knowledge-base" className="gap-2">
            <Bot className="w-4 h-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge-base" className="space-y-6">
          {/* Add Button */}
          <div className="flex justify-end">
            <Button onClick={() => openCreateModal()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Entry
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by intent, keywords, or answer..."
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{knowledgeBase.length}</div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-emerald-500">
                  {knowledgeBase.filter(e => e.active).length}
                </div>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-500">
                  {knowledgeBase.filter(e => e.category === 'platform').length}
                </div>
                <p className="text-sm text-muted-foreground">Platform</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-500">
                  {knowledgeBase.filter(e => e.category === 'trading').length}
                </div>
                <p className="text-sm text-muted-foreground">Trading</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intent</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <span className="font-medium">{entry.intent}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {entry.keywords.slice(0, 3).map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                              {entry.keywords.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{entry.keywords.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(entry.category)}>
                              {entry.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.priority}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => toggleActive(entry.id, entry.active)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                entry.active
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {entry.active ? 'Active' : 'Disabled'}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(entry)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(entry.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AssistantAnalytics onAddToKnowledgeBase={(query) => openCreateModal(query)} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry.id ? 'Edit Knowledge Entry' : 'Create Knowledge Entry'}
            </DialogTitle>
            <DialogDescription>
              {editingEntry.id
                ? 'Update the details for this knowledge base entry.'
                : 'Add a new entry to the AI assistant knowledge base.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Intent */}
            <div className="space-y-2">
              <Label htmlFor="intent">Intent Name *</Label>
              <Input
                id="intent"
                value={editingEntry.intent || ''}
                onChange={(e) => setEditingEntry(prev => ({ ...prev, intent: e.target.value }))}
                placeholder="e.g., wallet_balance, risk_management"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>Keywords *</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add a keyword..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword} variant="secondary">
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingEntry.keywords?.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Answer */}
            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={editingEntry.answer || ''}
                onChange={(e) => setEditingEntry(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="The response the assistant will give..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Use **text** for bold formatting. Line breaks are preserved.
              </p>
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editingEntry.category || 'general'}
                  onValueChange={(value) => setEditingEntry(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority (1-10)</Label>
                <Select
                  value={String(editingEntry.priority || 5)}
                  onValueChange={(value) => setEditingEntry(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                      <SelectItem key={p} value={String(p)}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Entry will be available for matching when active
                </p>
              </div>
              <Switch
                checked={editingEntry.active ?? true}
                onCheckedChange={(checked) => setEditingEntry(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingEntry.id ? 'Update Entry' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIAssistant;
