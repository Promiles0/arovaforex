import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Upload, Camera, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Profile {
  full_name: string | null;
  country: string | null;
  phone_number: string | null;
}

interface ForecastUploadModalProps {
  profile: Profile | null;
  onUploadSuccess: () => void;
}

const CURRENCY_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD', 'ETH/USD'
];

export default function ForecastUploadModal({ profile, onUploadSuccess }: ForecastUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const isProfileComplete = () => {
    return profile?.full_name && profile?.country && profile?.phone_number;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }
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

      // Reset form and close modal
      setUploadForm({
        title: '',
        currency_pair: '',
        trade_bias: '',
        commentary: '',
        file: null,
        preview: null
      });
      setOpen(false);
      onUploadSuccess();
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

  const canSubmit = uploadForm.title && uploadForm.currency_pair && uploadForm.trade_bias && uploadForm.file && isProfileComplete();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Submit Market Forecast
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Submit Your Market Forecast
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isProfileComplete() && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Profile Incomplete</span>
              </div>
              <p className="text-sm text-destructive/80 mb-3">
                Please complete your profile before uploading a forecast.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  navigate('/dashboard/profile');
                }}
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                Go to Profile
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency_pair">Currency Pair *</Label>
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
              <Label htmlFor="trade_bias">Trade Bias *</Label>
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
            <Label htmlFor="title">Forecast Title *</Label>
            <Input
              id="title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Bullish OB on EUR/USD H4"
            />
          </div>

          <div>
            <Label htmlFor="chart_image">Chart Image *</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-6">
              {uploadForm.preview ? (
                <div className="relative">
                  <img 
                    src={uploadForm.preview} 
                    alt="Preview" 
                    className="max-w-full h-auto rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearPreview}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="text-sm text-muted-foreground mb-2">
                    Drag and drop your chart image, or click to browse
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose File
                  </Button>
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
              rows={4}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {uploadForm.commentary.length}/500 characters
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!canSubmit || uploading}
              className="flex-1"
            >
              {uploading ? "Uploading..." : "Upload Forecast"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}