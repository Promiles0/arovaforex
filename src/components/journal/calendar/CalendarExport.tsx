import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Image, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalendarExportProps {
  calendarRef: React.RefObject<HTMLDivElement>;
  monthLabel: string;
}

export function CalendarExport({ calendarRef, monthLabel }: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportAsImage = async () => {
    if (!calendarRef.current) return;
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#0a0e1a',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `trading-calendar-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: 'Calendar Exported',
        description: 'Your calendar has been saved as an image.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!calendarRef.current) return;
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#0a0e1a',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If the image is taller than A4 height, scale it down
      const maxHeight = 210; // A4 landscape height in mm
      const finalHeight = Math.min(imgHeight, maxHeight);
      const finalWidth = imgHeight > maxHeight 
        ? (canvas.width * finalHeight) / canvas.height 
        : imgWidth;
      
      const xOffset = (297 - finalWidth) / 2;
      const yOffset = (210 - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`trading-calendar-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`);

      toast({
        title: 'Calendar Exported',
        description: 'Your calendar has been saved as a PDF.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsImage} className="gap-2 cursor-pointer">
          <Image className="w-4 h-4" />
          Export as Image (PNG)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
