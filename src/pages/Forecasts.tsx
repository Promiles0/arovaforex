import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, Eye, Upload, AlertCircle, Plus, TrendingUp, TrendingDown, Minus, MessageCircle, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface Forecast {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  forecast_type: 'arova' | 'public';
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  currency_pair: string | null;
  trade_bias: 'long' | 'short' | 'neutral' | null;
  commentary: string | null;
}

interface Profile {
  full_name: string | null;
  country: string | null;
  phone_number: string | null;
}

interface ExtendedForecast extends Forecast {
  user_profile?: Profile;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

const CURRENCY_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD', 'ETH/USD'
];

export default function Forecasts() {
  const [publicForecasts, setPublicForecasts] = useState<ExtendedForecast[]>([]);
  const [arovaForecasts, setArovaForecasts] = useState<ExtendedForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<ExtendedForecast | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    currency_pair: '',
    trade_bias: '',
    commentary: '',
    file: null as File | null,
    preview: null as string | null
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchForecasts();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, country, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchForecasts = async () => {
    try {
      // Fetch public forecasts
      const { data: publicData, error: publicError } = await supabase
        .from('forecasts')
        .select('*')
        .eq('forecast_type', 'public')
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      // Fetch arova forecasts
      const { data: arovaData, error: arovaError } = await supabase
        .from('forecasts')
        .select('*')
        .eq('forecast_type', 'arova')
        .order('created_at', { ascending: false });

      if (arovaError) throw arovaError;

      // Get current user for likes/bookmarks
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        // Fetch user's likes and bookmarks
        const [likesResult, bookmarksResult] = await Promise.all([
          supabase.from('forecast_likes').select('forecast_id').eq('user_id', user.id),
          supabase.from('user_bookmarks').select('forecast_id').eq('user_id', user.id)
        ]);

        const likedIds = new Set(likesResult.data?.map(like => like.forecast_id) || []);
        const bookmarkedIds = new Set(bookmarksResult.data?.map(bookmark => bookmark.forecast_id) || []);

        // Get user profiles for public forecasts
        const userIds = [...new Set((publicData || []).map(f => f.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, country, phone_number')
          .in('user_id', userIds);

        const profilesMap = new Map(
          (profilesData || []).map(p => [p.user_id, p])
        );

        // Process public forecasts
        const processedPublic = (publicData || []).map(forecast => ({
          ...forecast as Forecast,
          user_profile: profilesMap.get(forecast.user_id) || { full_name: "Unknown", country: null, phone_number: null },
          is_liked: likedIds.has(forecast.id),
          is_bookmarked: bookmarkedIds.has(forecast.id)
        })) as ExtendedForecast[];

        // Process arova forecasts
        const processedArova = (arovaData || []).map(forecast => ({
          ...forecast as Forecast,
          user_profile: { full_name: "ArovaForex", country: null, phone_number: null },
          is_liked: likedIds.has(forecast.id),
          is_bookmarked: bookmarkedIds.has(forecast.id)
        })) as ExtendedForecast[];

        setPublicForecasts(processedPublic);
        setArovaForecasts(processedArova);
      }
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast({
        title: "Error",
        description: "Failed to load forecasts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = () => {
    return profile?.full_name && profile?.country && profile?.phone_number;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setUploadForm(prev => ({ ...prev, file, preview }));
    }
  };

  const clearPreview = () => {
    if (uploadForm.preview) {
      URL.revokeObjectURL(uploadForm.preview);
    }
    setUploadForm(prev => ({ ...prev, file: null, preview: null }));
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !isProfileComplete()) return;

    try {
      setUploading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Upload image to storage
      const fileName = `${user.id}/${Date.now()}-${uploadForm.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('forecasts')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL for the image
      const { data: { publicUrl } } = supabase.storage
        .from('forecasts')
        .getPublicUrl(fileName);

      // Insert forecast record
      const { error: insertError } = await supabase
        .from('forecasts')
        .insert({
          title: uploadForm.title,
          image_url: publicUrl,
          forecast_type: 'public',
          currency_pair: uploadForm.currency_pair,
          trade_bias: uploadForm.trade_bias as 'long' | 'short' | 'neutral',
          commentary: uploadForm.commentary,
          user_id: user.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Forecast uploaded successfully!",
      });

      // Reset form
      setUploadForm({
        title: '',
        currency_pair: '',
        trade_bias: '',
        commentary: '',
        file: null,
        preview: null
      });

      // Refresh forecasts
      fetchForecasts();
    } catch (error) {
      console.error('Error uploading forecast:', error);
      toast({
        title: "Error",
        description: "Failed to upload forecast",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (forecastId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const forecast = [...publicForecasts, ...arovaForecasts].find(f => f.id === forecastId);
      if (!forecast) return;

      if (forecast.is_liked) {
        // Unlike
        await supabase
          .from('forecast_likes')
          .delete()
          .eq('forecast_id', forecastId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('forecast_likes')
          .insert({ forecast_id: forecastId, user_id: user.id });
      }

      // Refresh forecasts to update counts
      fetchForecasts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmark = async (forecastId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const forecast = [...publicForecasts, ...arovaForecasts].find(f => f.id === forecastId);
      if (!forecast) return;

      if (forecast.is_bookmarked) {
        // Remove bookmark
        await supabase
          .from('user_bookmarks')
          .delete()
          .eq('forecast_id', forecastId)
          .eq('user_id', user.id);
      } else {
        // Add bookmark
        await supabase
          .from('user_bookmarks')
          .insert({ forecast_id: forecastId, user_id: user.id });
      }

      // Refresh forecasts to update states
      fetchForecasts();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const getBiasIcon = (bias: string | null) => {
    switch (bias) {
      case 'long': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'short': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Minus className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getBiasColor = (bias: string | null) => {
    switch (bias) {
      case 'long': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'short': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'neutral': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const ForecastCard = ({ forecast }: { forecast: ExtendedForecast }) => (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${getBiasColor(forecast.trade_bias)} cursor-pointer`}>
      <CardContent className="p-4" onClick={() => setSelectedForecast(forecast)}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {forecast.currency_pair && (
              <Badge variant="outline" className="font-mono text-xs">
                {forecast.currency_pair}
              </Badge>
            )}
            {getBiasIcon(forecast.trade_bias)}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(forecast.id);
              }}
              className={forecast.is_liked ? 'text-red-500' : ''}
            >
              <Heart className={`w-4 h-4 ${forecast.is_liked ? 'fill-current' : ''}`} />
              <span className="ml-1 text-xs">{forecast.likes_count}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark(forecast.id);
              }}
              className={forecast.is_bookmarked ? 'text-blue-500' : ''}
            >
              <Bookmark className={`w-4 h-4 ${forecast.is_bookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        <h3 className="font-semibold mb-2 text-primary group-hover:text-primary/80 transition-colors">
          {forecast.title || "Untitled Forecast"}
        </h3>
        
        {forecast.commentary && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {forecast.commentary}
          </p>
        )}

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>By {forecast.user_profile?.full_name || "Unknown"}</span>
            <span>{new Date(forecast.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            <span>{forecast.comments_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Market Forecasts</h1>
        <p className="text-muted-foreground">
          Share your market analysis and explore professional forecasts from the trading community.
        </p>
      </div>

      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="public">Public Forecasts</TabsTrigger>
          <TabsTrigger value="arova">Arova Forecasts</TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="space-y-6">
          {/* Upload Section */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Submit Your Market Forecast
              </CardTitle>
              <CardDescription>
                Share your analysis with the trading community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isProfileComplete() && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-warning mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Profile Incomplete</span>
                  </div>
                  <p className="text-sm text-warning/80 mb-3">
                    Please complete your profile before uploading a forecast.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/profile')}
                    className="border-warning text-warning hover:bg-warning/10"
                  >
                    Go to Profile
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency_pair">Currency Pair</Label>
                  <Select value={uploadForm.currency_pair} onValueChange={(value) => 
                    setUploadForm(prev => ({ ...prev, currency_pair: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_PAIRS.map(pair => (
                        <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="trade_bias">Trade Bias</Label>
                  <Select value={uploadForm.trade_bias} onValueChange={(value) => 
                    setUploadForm(prev => ({ ...prev, trade_bias: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">🔼 Long (Bullish)</SelectItem>
                      <SelectItem value="short">🔽 Short (Bearish)</SelectItem>
                      <SelectItem value="neutral">⚖️ Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Forecast Title</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Bullish OB on EUR/USD H4"
                />
              </div>

              <div>
                <Label htmlFor="image">Chart Image</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {uploadForm.preview ? (
                    <div className="relative">
                      <img 
                        src={uploadForm.preview} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearPreview}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Label 
                        htmlFor="image" 
                        className="cursor-pointer text-primary hover:text-primary/80"
                      >
                        Click to upload chart image
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="commentary">Trade Commentary</Label>
                <Textarea
                  id="commentary"
                  value={uploadForm.commentary}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, commentary: e.target.value }))}
                  placeholder="Explain your analysis (max 500 characters)"
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadForm.commentary.length}/500 characters
                </p>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!uploadForm.file || !uploadForm.title || !uploadForm.currency_pair || !uploadForm.trade_bias || !isProfileComplete() || uploading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Forecast
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Public Forecasts List */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-primary">Community Forecasts</h2>
            <Badge variant="outline" className="border-primary text-primary">
              {publicForecasts.length} Forecasts
            </Badge>
          </div>

          {publicForecasts.length === 0 ? (
            <Card className="p-8 text-center border-primary/20">
              <CardContent>
                <div className="text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No community forecasts yet. Be the first to share!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicForecasts.map((forecast) => (
                <ForecastCard key={forecast.id} forecast={forecast} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="arova" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-primary">Professional Forecasts</h2>
            <Badge variant="outline" className="border-primary text-primary">
              {arovaForecasts.length} Forecasts
            </Badge>
          </div>

          {arovaForecasts.length === 0 ? (
            <Card className="p-8 text-center border-primary/20">
              <CardContent>
                <div className="text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No professional forecasts available yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {arovaForecasts.map((forecast) => (
                <ForecastCard key={forecast.id} forecast={forecast} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Forecast Detail Modal */}
      <Dialog open={!!selectedForecast} onOpenChange={() => setSelectedForecast(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedForecast && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedForecast.currency_pair && (
                    <Badge variant="outline" className="font-mono">
                      {selectedForecast.currency_pair}
                    </Badge>
                  )}
                  {getBiasIcon(selectedForecast.trade_bias)}
                  {selectedForecast.title || "Untitled Forecast"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <img 
                  src={selectedForecast.image_url} 
                  alt="Forecast chart"
                  className="w-full rounded-lg"
                />
                
                {selectedForecast.commentary && (
                  <div>
                    <h4 className="font-semibold mb-2">Analysis</h4>
                    <p className="text-muted-foreground">{selectedForecast.commentary}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Posted by <span className="font-medium">{selectedForecast.user_profile?.full_name || "Unknown"}</span> on{' '}
                    {new Date(selectedForecast.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLike(selectedForecast.id)}
                      className={selectedForecast.is_liked ? 'text-red-500 border-red-500' : ''}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${selectedForecast.is_liked ? 'fill-current' : ''}`} />
                      {selectedForecast.likes_count}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBookmark(selectedForecast.id)}
                      className={selectedForecast.is_bookmarked ? 'text-blue-500 border-blue-500' : ''}
                    >
                      <Bookmark className={`w-4 h-4 ${selectedForecast.is_bookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}