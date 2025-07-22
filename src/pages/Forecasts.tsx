import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Bookmark, Eye, Upload, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

interface Forecast {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  forecast_type: 'arova' | 'public';
  tags: string[] | null;
  likes_count: number;
  created_at: string;
  user_id: string;
}

interface Profile {
  full_name: string | null;
  country: string | null;
  phone_number: string | null;
}

export default function Forecasts() {
  const [arovaForecasts, setArovaForecasts] = useState<Forecast[]>([]);
  const [publicForecasts, setPublicForecasts] = useState<Forecast[]>([]);
  const [likedForecasts, setLikedForecasts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null as File | null
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchForecasts();
    fetchProfile();
    fetchLikedForecasts();
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
      const { data: arovaData, error: arovaError } = await supabase
        .from('forecasts')
        .select('*')
        .eq('forecast_type', 'arova')
        .order('created_at', { ascending: false });

      if (arovaError) throw arovaError;
      setArovaForecasts((arovaData || []) as Forecast[]);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (user) {
        const { data: publicData, error: publicError } = await supabase
          .from('forecasts')
          .select('*')
          .eq('forecast_type', 'public')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (publicError) throw publicError;
        setPublicForecasts((publicData || []) as Forecast[]);
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

  const fetchLikedForecasts = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('forecast_likes')
        .select('forecast_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const likedIds = new Set(data.map(like => like.forecast_id));
      setLikedForecasts(likedIds);
    } catch (error) {
      console.error('Error fetching liked forecasts:', error);
    }
  };

  const isProfileComplete = () => {
    return profile?.full_name && profile?.country && profile?.phone_number;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

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
          Explore professional forecasts from ArovaForex experts and share your own market analysis.
        </p>
      </div>

      <Tabs defaultValue="arova" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="arova">Arova Forecasts</TabsTrigger>
          <TabsTrigger value="public">My Forecasts</TabsTrigger>
        </TabsList>

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
                <Card key={forecast.id} className="border-primary/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-primary">{forecast.title || "Untitled"}</h3>
                    <p className="text-sm text-muted-foreground">{forecast.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Upload New Forecast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isProfileComplete() && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="w-4 h-4" />
                    <span>Profile Incomplete</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate('/dashboard/profile')}
                  >
                    Complete Profile
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Forecast title"
                />
              </div>

              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <Button
                disabled={!uploadForm.file || !isProfileComplete()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Upload Forecast
              </Button>
            </CardContent>
          </Card>

          {publicForecasts.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No forecasts uploaded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicForecasts.map((forecast) => (
                <Card key={forecast.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{forecast.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}