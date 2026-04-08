import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Eye, Heart, MessageSquare, Upload, Search, ImageIcon } from "lucide-react";

interface Forecast {
  id: string; title: string; description: string; image_url: string; forecast_type: string;
  currency_pair: string; trade_bias: string; commentary?: string; likes_count: number; comments_count: number; created_at: string;
}
interface AcademyContent {
  id: string; title: string; slug: string; excerpt: string; content: string;
  thumbnail_url: string; is_published: boolean; created_at: string;
}

export default function AdminContent() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [academyContent, setAcademyContent] = useState<AcademyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingForecast, setEditingForecast] = useState<Forecast | null>(null);
  const [editingAcademy, setEditingAcademy] = useState<AcademyContent | null>(null);
  const [showCreateForecast, setShowCreateForecast] = useState(false);
  const [showCreateAcademy, setShowCreateAcademy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [biasFilter, setBiasFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadContent(); }, []);

  const loadContent = async () => {
    try {
      const [forecastsResult, academyResult] = await Promise.all([
        supabase.from('forecasts').select('*').eq('forecast_type', 'arova').order('created_at', { ascending: false }),
        supabase.from('academy_content').select('*').order('created_at', { ascending: false })
      ]);
      if (forecastsResult.data) setForecasts(forecastsResult.data);
      if (academyResult.data) setAcademyContent(academyResult.data);
    } catch {
      toast({ title: "Error", description: "Failed to load content", variant: "destructive" });
    }
    setLoading(false);
  };

  const filteredForecasts = forecasts.filter(f => {
    const matchSearch = !searchQuery || (f.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (f.currency_pair || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchBias = biasFilter === 'all' || f.trade_bias === biasFilter;
    return matchSearch && matchBias;
  });

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('forecasts').upload(path, file);
      if (error) throw error;
      return path; // Store path only; signed URLs generated at render time
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateForecast = async (formData: FormData) => {
    try {
      let image_url = formData.get('image_url') as string;
      const fileInput = (document.querySelector('input[name="image_file"]') as HTMLInputElement);
      if (fileInput?.files?.[0]) {
        const url = await handleUploadImage(fileInput.files[0]);
        if (url) image_url = url;
      }
      const forecastData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        image_url,
        forecast_type: 'arova',
        currency_pair: formData.get('currency_pair') as string,
        trade_bias: formData.get('trade_bias') as string,
        commentary: formData.get('commentary') as string,
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      const { error } = await supabase.from('forecasts').insert([forecastData]);
      if (error) throw error;
      toast({ title: "Success", description: "Forecast created" });
      loadContent(); setShowCreateForecast(false); setEditingForecast(null);
    } catch {
      toast({ title: "Error", description: "Failed to create forecast", variant: "destructive" });
    }
  };

  const handleUpdateForecast = async (formData: FormData) => {
    if (!editingForecast) return;
    try {
      let image_url = formData.get('image_url') as string;
      const fileInput = (document.querySelector('input[name="image_file"]') as HTMLInputElement);
      if (fileInput?.files?.[0]) {
        const url = await handleUploadImage(fileInput.files[0]);
        if (url) image_url = url;
      }
      const { error } = await supabase.from('forecasts').update({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        image_url,
        currency_pair: formData.get('currency_pair') as string,
        trade_bias: formData.get('trade_bias') as string,
        commentary: formData.get('commentary') as string,
      }).eq('id', editingForecast.id);
      if (error) throw error;
      toast({ title: "Success", description: "Forecast updated" });
      loadContent(); setEditingForecast(null);
    } catch {
      toast({ title: "Error", description: "Failed to update forecast", variant: "destructive" });
    }
  };

  const handleDeleteForecast = async (id: string) => {
    if (!confirm('Delete this forecast?')) return;
    try {
      const { error } = await supabase.from('forecasts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted" }); loadContent();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleCreateAcademyContent = async (formData: FormData) => {
    try {
      const { error } = await supabase.from('academy_content').insert([{
        title: formData.get('title') as string,
        slug: (formData.get('title') as string).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: formData.get('excerpt') as string,
        content: formData.get('content') as string,
        thumbnail_url: formData.get('thumbnail_url') as string,
        is_published: formData.get('is_published') === 'true'
      }]);
      if (error) throw error;
      toast({ title: "Success", description: "Academy content created" });
      loadContent(); setShowCreateAcademy(false); setEditingAcademy(null);
    } catch {
      toast({ title: "Error", description: "Failed to create", variant: "destructive" });
    }
  };

  const handleUpdateAcademyContent = async (formData: FormData) => {
    if (!editingAcademy) return;
    try {
      const { error } = await supabase.from('academy_content').update({
        title: formData.get('title') as string,
        excerpt: formData.get('excerpt') as string,
        content: formData.get('content') as string,
        thumbnail_url: formData.get('thumbnail_url') as string,
        is_published: formData.get('is_published') === 'true'
      }).eq('id', editingAcademy.id);
      if (error) throw error;
      toast({ title: "Success", description: "Updated" });
      loadContent(); setEditingAcademy(null);
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const handleDeleteAcademyContent = async (id: string) => {
    if (!confirm('Delete this content?')) return;
    try {
      const { error } = await supabase.from('academy_content').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted" }); loadContent();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const ForecastFormDialog = ({ isEditing }: { isEditing: boolean }) => (
    <Dialog open={isEditing ? !!editingForecast : showCreateForecast} onOpenChange={(open) => { if (!open) { setEditingForecast(null); setShowCreateForecast(false); } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Forecast' : 'Create New Forecast'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Update the forecast details.' : 'Create a new Arova forecast.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); isEditing ? handleUpdateForecast(fd) : handleCreateForecast(fd); }} className="space-y-4">
          <Input name="title" placeholder="Forecast Title" defaultValue={editingForecast?.title || ''} required />
          <Textarea name="description" placeholder="Description" defaultValue={editingForecast?.description || ''} required />
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Image</label>
            <Input name="image_file" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">Or enter URL below</p>
            <Input name="image_url" placeholder="Image URL" defaultValue={editingForecast?.image_url || ''} />
            {editingForecast?.image_url && (
              <div className="w-20 h-14 rounded-md overflow-hidden border border-border">
                <img src={editingForecast.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <Input name="currency_pair" placeholder="Currency Pair (e.g., EUR/USD)" defaultValue={editingForecast?.currency_pair || ''} />
          <Select name="trade_bias" defaultValue={editingForecast?.trade_bias || ''}>
            <SelectTrigger><SelectValue placeholder="Select Trade Bias" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="long">Long (Bullish)</SelectItem>
              <SelectItem value="short">Short (Bearish)</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
          <Textarea name="commentary" placeholder="Commentary & Analysis" defaultValue={editingForecast?.commentary || ''} />
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Uploading...' : `${isEditing ? 'Update' : 'Create'} Forecast`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  const AcademyFormDialog = ({ isEditing }: { isEditing: boolean }) => (
    <Dialog open={isEditing ? !!editingAcademy : showCreateAcademy} onOpenChange={(open) => { if (!open) { setEditingAcademy(null); setShowCreateAcademy(false); } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Academy Content' : 'Create New Academy Content'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Update the content.' : 'Create educational content.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); isEditing ? handleUpdateAcademyContent(fd) : handleCreateAcademyContent(fd); }} className="space-y-4">
          <Input name="title" placeholder="Content Title" defaultValue={editingAcademy?.title || ''} required />
          <Textarea name="excerpt" placeholder="Short excerpt" defaultValue={editingAcademy?.excerpt || ''} />
          <Input name="thumbnail_url" placeholder="Thumbnail Image URL" defaultValue={editingAcademy?.thumbnail_url || ''} />
          <Textarea name="content" placeholder="Full content (supports markdown)" rows={10} defaultValue={editingAcademy?.content || ''} required />
          <Select name="is_published" defaultValue={editingAcademy?.is_published ? 'true' : 'false'}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full">{isEditing ? 'Update' : 'Create'} Content</Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <SEO title="Admin Content | Arova" description="Manage content" />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-semibold mb-6">Content Management</h1>

        {/* Forecasts */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Arova Forecasts ({filteredForecasts.length})</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowCreateForecast(true)}><Plus className="w-4 h-4 mr-2" /> New Forecast</Button>
                </DialogTrigger>
                <ForecastFormDialog isEditing={false} />
              </Dialog>
            </div>
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search forecasts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
              </div>
              <Select value={biasFilter} onValueChange={setBiasFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Bias" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Biases</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Bias</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><div className="w-16 h-4 bg-muted animate-pulse rounded" /></TableCell>)}</TableRow>
                    ))
                  ) : filteredForecasts.length > 0 ? (
                    filteredForecasts.map((forecast) => (
                      <TableRow key={forecast.id}>
                        <TableCell>
                          {forecast.image_url ? (
                            <div className="w-10 h-10 rounded-md overflow-hidden border border-border bg-muted">
                              <img src={forecast.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{forecast.title || 'Untitled'}</TableCell>
                        <TableCell>{forecast.currency_pair || 'N/A'}</TableCell>
                        <TableCell>
                          {forecast.trade_bias && (
                            <Badge variant={forecast.trade_bias === 'long' ? 'default' : forecast.trade_bias === 'short' ? 'destructive' : 'secondary'}>
                              {forecast.trade_bias}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{forecast.likes_count}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{forecast.comments_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(forecast.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setEditingForecast(forecast)}><Pencil className="w-3 h-3" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteForecast(forecast.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No forecasts found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Academy */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Academy Content ({academyContent.length})</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" onClick={() => setShowCreateAcademy(true)}><Plus className="w-4 h-4 mr-2" /> New Article</Button>
                </DialogTrigger>
                <AcademyFormDialog isEditing={false} />
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><div className="w-20 h-4 bg-muted animate-pulse rounded" /></TableCell>)}</TableRow>
                    ))
                  ) : academyContent.length > 0 ? (
                    academyContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium">{content.title}</TableCell>
                        <TableCell><Badge variant={content.is_published ? 'default' : 'secondary'}>{content.is_published ? 'Published' : 'Draft'}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{content.slug}</TableCell>
                        <TableCell>{new Date(content.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setEditingAcademy(content)}><Pencil className="w-3 h-3" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteAcademyContent(content.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No academy content found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <ForecastFormDialog isEditing={true} />
        <AcademyFormDialog isEditing={true} />
      </motion.section>
    </>
  );
}
