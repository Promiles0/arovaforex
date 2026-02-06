import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  FileText,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadSetupProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

const supportedFormats = [
  { ext: 'CSV', icon: FileSpreadsheet, color: 'text-emerald-500' },
  { ext: 'XLSX', icon: FileSpreadsheet, color: 'text-blue-500' },
  { ext: 'PDF', icon: FileText, color: 'text-red-500' },
];

export function FileUploadSetup({ open, onClose, onBack, onSuccess }: FileUploadSetupProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setStatus('uploading');
    setErrorMessage(null);

    // Simulate upload and processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success
    setStatus('success');
    setTimeout(() => {
      onSuccess();
    }, 1500);
  }, [onSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const resetUpload = () => {
    setUploadedFile(null);
    setStatus('idle');
    setErrorMessage(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
              <DialogTitle>Upload Trade Files</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Import your trading history from files
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supported formats */}
          <div className="flex items-center justify-center gap-6">
            {supportedFormats.map((format) => (
              <div key={format.ext} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <format.icon className={cn("w-4 h-4", format.color)} />
                <span>{format.ext}</span>
              </div>
            ))}
          </div>

          {/* Drop zone */}
          <motion.div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            animate={{
              borderColor: dragActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              backgroundColor: dragActive ? 'hsla(var(--primary) / 0.05)' : 'transparent',
            }}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors",
              status !== 'idle' && "pointer-events-none"
            )}
          >
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.pdf"
                      onChange={handleFileSelect}
                    />
                    <Button variant="outline" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </motion.div>
              )}

              {(status === 'uploading' || status === 'processing') && uploadedFile && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <File className="w-12 h-12 mx-auto text-primary" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">
                      {status === 'uploading' ? 'Uploading...' : 'Processing trades...'}
                    </span>
                  </div>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
                  </motion.div>
                  <p className="font-medium text-emerald-500">Upload Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to your journal...
                  </p>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                  <p className="font-medium text-destructive">Upload Failed</p>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                  <Button variant="outline" onClick={resetUpload}>
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Tips */}
          <div className="p-4 rounded-lg bg-muted/30 text-sm space-y-2">
            <p className="font-medium">Tips for best results:</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Export your trade history from your broker platform</li>
              <li>Make sure the file includes date, symbol, and P&L columns</li>
              <li>You can import multiple files to build your history</li>
            </ul>
          </div>

          {/* Actions */}
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
