import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Mail,
  Shield,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailSetupProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
}

export function EmailSetup({ open, onClose, onBack, onSuccess }: EmailSetupProps) {
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    if (!email) return;
    
    setIsConnecting(true);
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setIsConnected(true);
    
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  const providers = [
    { id: 'gmail', name: 'Gmail', icon: '📧' },
    { id: 'outlook', name: 'Outlook', icon: '📬' },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <DialogTitle>Email Auto-Import</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Automatically import trades from broker emails
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {!isConnected ? (
            <>
              {/* Features */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Mail, label: 'Auto-detect trades' },
                  { icon: Shield, label: 'Read-only access' },
                  { icon: Clock, label: 'Real-time sync' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center p-3 rounded-lg bg-muted/30"
                  >
                    <feature.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <span className="text-xs text-muted-foreground">{feature.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Provider selection */}
              <div className="space-y-3">
                <Label>Choose email provider</Label>
                <div className="grid grid-cols-2 gap-3">
                  {providers.map((provider) => (
                    <Button
                      key={provider.id}
                      variant="outline"
                      className="h-auto py-4"
                      onClick={() => setEmail(`demo@${provider.id}.com`)}
                    >
                      <span className="text-2xl mr-2">{provider.icon}</span>
                      {provider.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Email input */}
              <div className="space-y-2">
                <Label htmlFor="email">Or enter email manually</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Info */}
              <div className="p-4 rounded-lg bg-muted/30 text-sm">
                <p className="font-medium mb-2">How it works:</p>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>We connect to your email (read-only)</li>
                  <li>We scan for broker trade confirmations</li>
                  <li>Trades are automatically imported to your journal</li>
                  <li>You can add notes and lessons anytime</li>
                </ol>
              </div>

              {/* Actions */}
              <Button
                onClick={handleConnect}
                disabled={!email || isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Email'
                )}
              </Button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Email Connected!</h3>
              <p className="text-muted-foreground">
                We'll start scanning for trades...
              </p>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
