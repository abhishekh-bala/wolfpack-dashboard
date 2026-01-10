import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileContent: (content: string) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileContent, isProcessing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.mhtml') && !file.name.endsWith('.mht')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a .mhtml or .mht file.',
          variant: 'destructive',
        });
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContent(content);
      };
      reader.onerror = () => {
        toast({
          title: 'File Read Error',
          description: 'Failed to read the file. Please try again.',
          variant: 'destructive',
        });
      };
      reader.readAsText(file);
    },
    [onFileContent, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".mhtml,.mht"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-4">
          {fileName ? (
            <>
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">{fileName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isProcessing ? 'Processing...' : 'File loaded successfully'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Drop your MHTML file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
            </>
          )}
        </div>

        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
            <p className="text-primary font-medium">Drop to upload</p>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/30">
        <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Upload the "Sales by Team" report exported as MHTML from your reporting system.
          The file will be parsed automatically to extract sales data.
        </p>
      </div>
    </div>
  );
}
