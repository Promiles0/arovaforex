import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TradingProfileTabProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export const TradingProfileTab = ({ profile, onUpdate }: TradingProfileTabProps) => {
  const [formData, setFormData] = useState({
    trading_style: profile.trading_style || '',
    experience_level: profile.experience_level || '',
    risk_tolerance: profile.risk_tolerance || 'medium',
    trading_goals: profile.trading_goals || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          trading_style: formData.trading_style,
          experience_level: formData.experience_level,
          risk_tolerance: formData.risk_tolerance,
          trading_goals: formData.trading_goals,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);
      
      if (error) throw error;
      
      onUpdate(formData);
      setIsDirty(false);
      
      toast({
        title: "Success",
        description: "Trading profile updated successfully"
      });
      
    } catch (error) {
      console.error('Error updating trading profile:', error);
      toast({
        title: "Error",
        description: "Failed to update trading profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.form
      className="space-y-6"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="trading_style" className="flex items-center gap-2">
            <TrendingUp size={16} />
            Trading Style
          </Label>
          <Select value={formData.trading_style} onValueChange={(value) => handleChange('trading_style', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your trading style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day_trading">Day Trading</SelectItem>
              <SelectItem value="swing_trading">Swing Trading</SelectItem>
              <SelectItem value="scalping">Scalping</SelectItem>
              <SelectItem value="position_trading">Position Trading</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="experience_level">Experience Level</Label>
          <Select value={formData.experience_level} onValueChange={(value) => handleChange('experience_level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
              <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
              <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
              <SelectItem value="expert">Expert (5+ years)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-3">
        <Label>Risk Tolerance</Label>
        <RadioGroup value={formData.risk_tolerance} onValueChange={(value) => handleChange('risk_tolerance', value)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                formData.risk_tolerance === 'low' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChange('risk_tolerance', 'low')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="cursor-pointer flex-1">
                  <div className="font-semibold">Low Risk</div>
                  <div className="text-xs text-muted-foreground">Conservative approach</div>
                </Label>
              </div>
            </motion.div>
            
            <motion.div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                formData.risk_tolerance === 'medium' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChange('risk_tolerance', 'medium')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer flex-1">
                  <div className="font-semibold">Medium Risk</div>
                  <div className="text-xs text-muted-foreground">Balanced strategy</div>
                </Label>
              </div>
            </motion.div>
            
            <motion.div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                formData.risk_tolerance === 'high' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChange('risk_tolerance', 'high')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer flex-1">
                  <div className="font-semibold">High Risk</div>
                  <div className="text-xs text-muted-foreground">Aggressive trading</div>
                </Label>
              </div>
            </motion.div>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="trading_goals">Trading Goals</Label>
        <Textarea
          id="trading_goals"
          value={formData.trading_goals}
          onChange={(e) => handleChange('trading_goals', e.target.value)}
          placeholder="What are your trading goals? (e.g., consistent monthly income, capital growth, learning experience)"
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.trading_goals.length}/1000 characters
        </p>
      </div>
      
      {/* Save Button */}
      <Button
        type="submit"
        disabled={!isDirty || isSaving}
        className="w-full md:w-auto"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle size={16} className="mr-2" />
            Save Trading Profile
          </>
        )}
      </Button>
    </motion.form>
  );
};
