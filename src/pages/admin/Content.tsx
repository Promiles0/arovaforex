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
import { Pencil, Trash2, Plus, Eye, Heart, MessageSquare, Upload } from "lucide-react";

interface Forecast {
  id: string;
  title: string;
  description: string;
  image_url: string;
  forecast_type: string;
  currency_pair: string;
  trade_bias: string;
  commentary?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface AcademyContent {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail_url: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminContent() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [academyContent, setAcademyContent] = useState<AcademyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingForecast, setEditingForecast] = useState<Forecast | null>(null);
  const [editingAcademy, setEditingAcademy] = useState<AcademyContent | null>(null);
  const [showCreateForecast, setShowCreateForecast] = useState(false);
  const [showCreateAcademy, setShowCreateAcademy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [forecastsResult, academyResult] = await Promise.all([
        supabase
          .from('forecasts')
          .select('*')
          .eq('forecast_type', 'arova')
          .order('created_at', { ascending: false }),
        supabase
          .from('academy_content')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (forecastsResult.data) setForecasts(forecastsResult.data);
      if (academyResult.data) setAcademyContent(academyResult.data);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleCreateForecast = async (formData: FormData) => {
    try {
      const forecastData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        image_url: formData.get('image_url') as string,
        forecast_type: 'arova',
        currency_pair: formData.get('currency_pair') as string,
        trade_bias: formData.get('trade_bias') as string,
        commentary: formData.get('commentary') as string,
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from('forecasts')
        .insert([forecastData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast created successfully"
      });
      
      loadContent();
      setShowCreateForecast(false);
      setEditingForecast(null);
    } catch (error) {
      console.error('Error creating forecast:', error);
      toast({
        title: "Error",
        description: "Failed to create forecast",
        variant: "destructive"
      });
    }
  };

  const handleUpdateForecast = async (formData: FormData) => {
    if (!editingForecast) return;

    try {
      const updates = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        image_url: formData.get('image_url') as string,
        currency_pair: formData.get('currency_pair') as string,
        trade_bias: formData.get('trade_bias') as string,
        commentary: formData.get('commentary') as string,
      };

      const { error } = await supabase
        .from('forecasts')
        .update(updates)
        .eq('id', editingForecast.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast updated successfully"
      });
      
      loadContent();
      setEditingForecast(null);
    } catch (error) {
      console.error('Error updating forecast:', error);
      toast({
        title: "Error",
        description: "Failed to update forecast",
        variant: "destructive"
      });
    }
  };

  const handleDeleteForecast = async (id: string) => {
    if (!confirm('Are you sure you want to delete this forecast?')) return;

    try {
      const { error } = await supabase
        .from('forecasts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast deleted successfully"
      });
      
      loadContent();
    } catch (error) {
      console.error('Error deleting forecast:', error);
      toast({
        title: "Error",
        description: "Failed to delete forecast",
        variant: "destructive"
      });
    }
  };

  const handleCreateAcademyContent = async (formData: FormData) => {
    try {
      const contentData = {
        title: formData.get('title') as string,
        slug: (formData.get('title') as string).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: formData.get('excerpt') as string,
        content: formData.get('content') as string,
        thumbnail_url: formData.get('thumbnail_url') as string,
        is_published: formData.get('is_published') === 'true'
      };

      const { error } = await supabase
        .from('academy_content')
        .insert([contentData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academy content created successfully"
      });
      
      loadContent();
      setShowCreateAcademy(false);
      setEditingAcademy(null);
    } catch (error) {
      console.error('Error creating academy content:', error);
      toast({
        title: "Error",
        description: "Failed to create academy content",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAcademyContent = async (formData: FormData) => {
    if (!editingAcademy) return;

    try {
      const updates = {
        title: formData.get('title') as string,
        excerpt: formData.get('excerpt') as string,
        content: formData.get('content') as string,
        thumbnail_url: formData.get('thumbnail_url') as string,
        is_published: formData.get('is_published') === 'true'
      };

      const { error } = await supabase
        .from('academy_content')
        .update(updates)
        .eq('id', editingAcademy.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academy content updated successfully"
      });
      
      loadContent();
      setEditingAcademy(null);
    } catch (error) {
      console.error('Error updating academy content:', error);
      toast({
        title: "Error",
        description: "Failed to update academy content",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAcademyContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this academy content?')) return;

    try {
      const { error } = await supabase
        .from('academy_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academy content deleted successfully"
      });
      
      loadContent();
    } catch (error) {
      console.error('Error deleting academy content:', error);
      toast({
        title: "Error",
        description: "Failed to delete academy content",
        variant: "destructive"
      });
    }
  };

  const ForecastFormDialog = ({ isEditing }: { isEditing: boolean }) => (
    <Dialog 
      open={isEditing ? !!editingForecast : showCreateForecast} 
      onOpenChange={(open) => {
        if (!open) {
          setEditingForecast(null);
          setShowCreateForecast(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Forecast' : 'Create New Forecast'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the forecast details below.' : 'Fill in the details to create a new Arova forecast.'}
          </DialogDescription>
        </DialogHeader>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            isEditing && editingForecast?.id ? handleUpdateForecast(formData) : handleCreateForecast(formData);
          }}
          className="space-y-4"
        >
          <Input
            name="title"
            placeholder="Forecast Title"
            defaultValue={editingForecast?.title || ''}
            required
          />
          <Textarea
            name="description"
            placeholder="Description"
            defaultValue={editingForecast?.description || ''}
            required
          />
          <Input
            name="image_url"
            placeholder="Image URL"
            defaultValue={editingForecast?.image_url || ''}
            required
          />
          <Input
            name="currency_pair"
            placeholder="Currency Pair (e.g., EUR/USD)"
            defaultValue={editingForecast?.currency_pair || ''}
          />
          <Select 
            name="trade_bias" 
            defaultValue={editingForecast?.trade_bias || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Trade Bias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bullish">Bullish</SelectItem>
              <SelectItem value="bearish">Bearish</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            name="commentary"
            placeholder="Commentary & Analysis"
            defaultValue={editingForecast?.commentary || ''}
          />
          <Button type="submit" className="w-full">
            {isEditing ? 'Update' : 'Create'} Forecast
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  const AcademyFormDialog = ({ isEditing }: { isEditing: boolean }) => (
    <Dialog 
      open={isEditing ? !!editingAcademy : showCreateAcademy} 
      onOpenChange={(open) => {
        if (!open) {
          setEditingAcademy(null);
          setShowCreateAcademy(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Academy Content' : 'Create New Academy Content'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the academy content details below.' : 'Fill in the details to create new educational content.'}
          </DialogDescription>
        </DialogHeader>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            isEditing && editingAcademy?.id ? handleUpdateAcademyContent(formData) : handleCreateAcademyContent(formData);
          }}
          className="space-y-4"
        >
          <Input
            name="title"
            placeholder="Content Title"
            defaultValue={editingAcademy?.title || ''}
            required
          />
          <Textarea
            name="excerpt"
            placeholder="Short excerpt/description"
            defaultValue={editingAcademy?.excerpt || ''}
          />
          <Input
            name="thumbnail_url"
            placeholder="Thumbnail Image URL"
            defaultValue={editingAcademy?.thumbnail_url || ''}
          />
          <Textarea
            name="content"
            placeholder="Full content (supports markdown)"
            rows={10}
            defaultValue={editingAcademy?.content || ''}
            required
          />
          <Select 
            name="is_published" 
            defaultValue={editingAcademy?.is_published ? 'true' : 'false'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Publication Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full">
            {isEditing ? 'Update' : 'Create'} Content
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <SEO title="Admin Content | Arova" description="Manage Arova forecasts and Academy educational content with full CRUD operations." />
      <motion.section 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-semibold mb-6">Content Management</h1>

        {/* Arova Forecasts Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Arova Forecasts ({forecasts.length})
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowCreateForecast(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Forecast
                  </Button>
                </DialogTrigger>
                <ForecastFormDialog isEditing={false} />
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Currency Pair</TableHead>
                    <TableHead>Bias</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : forecasts.length > 0 ? (
                    forecasts.map((forecast) => (
                      <TableRow key={forecast.id}>
                        <TableCell className="font-medium">
                          {forecast.title || 'Untitled'}
                        </TableCell>
                        <TableCell>{forecast.currency_pair || 'N/A'}</TableCell>
                        <TableCell>
                          {forecast.trade_bias && (
                            <Badge variant={
                              forecast.trade_bias === 'bullish' ? 'default' :
                              forecast.trade_bias === 'bearish' ? 'destructive' : 'secondary'
                            }>
                              {forecast.trade_bias}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {forecast.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {forecast.comments_count}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(forecast.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingForecast(forecast)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteForecast(forecast.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No forecasts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Academy Content Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Academy Content ({academyContent.length})
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary"
                    onClick={() => setShowCreateAcademy(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Article
                  </Button>
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
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : academyContent.length > 0 ? (
                    academyContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium">
                          {content.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={content.is_published ? 'default' : 'secondary'}>
                            {content.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {content.slug}
                        </TableCell>
                        <TableCell>
                          {new Date(content.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingAcademy(content)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAcademyContent(content.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No academy content found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Form Dialogs */}
        <ForecastFormDialog isEditing={true} />
        <AcademyFormDialog isEditing={true} />
      </motion.section>
    </>
  );
}
