import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Loader2,
  ExternalLink,
  Play,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrokerConnections, type BrokerConnection } from '@/hooks/useBrokerConnections';

interface MetaTraderSetupProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: (connection: BrokerConnection) => void;
}

type Step = 1 | 2 | 3;

export function MetaTraderSetup({ open, onClose, onBack, onSuccess }: MetaTraderSetupProps) {
  const [step, setStep] = useState<Step>(1);
  const [platform, setPlatform] = useState<'mt4' | 'mt5' | null>(null);
  const [brokerName, setBrokerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<BrokerConnection | null>(null);

  const { createConnection, generateConnectionCode } = useBrokerConnections();

  // Generate connection code on mount
  useEffect(() => {
    if (open && !connectionCode) {
      setConnectionCode(generateConnectionCode());
    }
  }, [open, connectionCode, generateConnectionCode]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setPlatform(null);
      setBrokerName('');
      setAccountNumber('');
      setConnectionCode(null);
      setCopied(false);
      setIsWaiting(false);
      setPendingConnection(null);
    }
  }, [open]);

  const handleCopyCode = async () => {
    if (!connectionCode) return;
    await navigator.clipboard.writeText(connectionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // In real implementation, this would download the EA file
    console.log('Downloading EA for:', platform);
  };

  const handleStartWaiting = async () => {
    if (!platform) return;
    
    setIsWaiting(true);

    // Create the connection in database
    const connection = await createConnection({
      connection_type: 'metatrader',
      broker_name: brokerName || undefined,
      account_number: accountNumber || undefined,
      platform,
    });

    if (connection) {
      setPendingConnection(connection);
      // In real implementation, would poll for connection status
      // For now, simulate success after 3 seconds
      setTimeout(() => {
        onSuccess(connection);
      }, 3000);
    } else {
      setIsWaiting(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Connection Code */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Label className="text-sm text-muted-foreground mb-3 block">
          Your Unique Connection Code
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex-1 font-mono text-2xl font-bold tracking-wider text-foreground bg-background/50 px-4 py-3 rounded-lg border">
            {connectionCode || 'Generating...'}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyCode}
            className="h-12 w-12"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="w-5 h-5 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Copy className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 This code connects your MT4/MT5 to ArovaForex. Keep it private!
        </p>
      </div>

      {/* Optional Account Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="broker">Broker Name (optional)</Label>
          <Input
            id="broker"
            placeholder="e.g., XM Global, IC Markets"
            value={brokerName}
            onChange={(e) => setBrokerName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account">Account Number (optional)</Label>
          <Input
            id="account"
            placeholder="e.g., 123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={() => setStep(2)} className="w-full" size="lg">
        Continue to Download
      </Button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">
          Choose your platform
        </Label>
        <div className="grid grid-cols-2 gap-4">
          {(['mt4', 'mt5'] as const).map((p) => (
            <motion.button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-center",
                platform === p
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl font-bold mb-1">{p.toUpperCase()}</div>
              <div className="text-xs text-muted-foreground">
                MetaTrader {p === 'mt4' ? '4' : '5'}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {platform && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <Button
            onClick={handleDownload}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Download className="w-5 h-5 mr-2" />
            Download ArovaSync.{platform === 'mt4' ? 'ex4' : 'ex5'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            File size: 8KB | Safe & Secure
          </p>
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          className="flex-1"
          disabled={!platform}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm">📥</span>
          Install in MetaTrader
        </h3>
        
        <ol className="space-y-3 text-sm">
          {[
            `Open MetaTrader (${platform?.toUpperCase()})`,
            "Click File → Open Data Folder",
            `Navigate to ${platform === 'mt4' ? 'MQL4' : 'MQL5'}/Experts`,
            "Copy ArovaSync file into this folder",
            "Restart MetaTrader",
            "Drag ArovaSync onto any chart",
            `Enter your connection code: ${connectionCode}`,
            'Enable "Allow DLL imports" and "Allow live trading"',
          ].map((instruction, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{instruction}</span>
            </li>
          ))}
        </ol>

        <Button variant="link" className="text-primary p-0 h-auto">
          <Play className="w-4 h-4 mr-2" />
          Watch Video Tutorial (2 min)
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Waiting for connection */}
      <div className={cn(
        "p-4 rounded-xl border transition-all",
        isWaiting ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"
      )}>
        {isWaiting ? (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">Waiting for connection...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure MetaTrader is running with the EA attached
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Click "Test Connection" once you've completed the setup
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ MetaTrader is running</li>
              <li>✓ EA is attached to a chart</li>
              <li>✓ AutoTrading button is enabled (green)</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(2)}
          className="flex-1"
          disabled={isWaiting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleStartWaiting}
          className="flex-1"
          disabled={isWaiting}
        >
          {isWaiting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        I'll finish this later
      </Button>

      <div className="text-center">
        <Button variant="link" size="sm" className="text-muted-foreground">
          <HelpCircle className="w-4 h-4 mr-1" />
          Need help? Chat Support
        </Button>
      </div>
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={step === 1 ? onBack : () => setStep((step - 1) as Step)}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <DialogTitle>Connect MetaTrader</DialogTitle>
              <p className="text-sm text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
