import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { SalesTable } from './SalesTable';
import { StatCard } from './StatCard';
import { AdminPanel } from './AdminPanel';
import { parseMhtml, ParsedMhtmlData, formatCurrency } from '@/lib/mhtmlParser';
import { useGuideTargets } from '@/hooks/useGuideTargets';
import { logout } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  LogOut,
  RefreshCw,
  Calendar,
  Maximize,
  Minimize,
  Loader2,
  Zap,
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [parsedData, setParsedData] = useState<ParsedMhtmlData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  // Calculate total chats from targets
  const getTotalChats = useCallback((targets: { chatCount: number }[]) => {
    return targets.reduce((sum, t) => sum + t.chatCount, 0);
  }, []);

  // Calculate NRPC (New Revenue Per Chat)
  const calculateNRPC = useCallback((newRevenue: number, totalChats: number) => {
    if (totalChats === 0) return 0;
    return newRevenue / totalChats;
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        toast({
          title: 'Fullscreen Error',
          description: 'Unable to enter fullscreen mode.',
          variant: 'destructive',
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, [toast]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  const { 
    targets, 
    formulas, 
    isLoading, 
    saveTargets, 
    saveFormulas, 
    resetFormulas 
  } = useGuideTargets();

  const handleFileContent = (content: string) => {
    setIsProcessing(true);
    try {
      const data = parseMhtml(content);
      setParsedData(data);
      toast({
        title: 'File Parsed Successfully',
        description: `Found ${data.salesData.length} employees with sales data.`,
      });
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'Parse Error',
        description: error instanceof Error ? error.message : 'Failed to parse the MHTML file.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
    toast({
      title: 'Signed Out',
      description: 'You have been logged out successfully.',
    });
  };

  const handleClearData = () => {
    setParsedData(null);
    toast({
      title: 'Data Cleared',
      description: 'Upload a new file to continue.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalChats = getTotalChats(targets);
  const nrpc = parsedData ? calculateNRPC(parsedData.summary.newSales, totalChats) : 0;

  return (
    <div className={`min-h-screen transition-all duration-300 ${isFullscreen ? 'bg-[hsl(220,25%,5%)] fullscreen-mode' : 'bg-background'}`}>
      {/* Header */}
      <header className={`border-b border-border backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 ${
        isFullscreen 
          ? 'bg-gradient-to-r from-[hsl(220,25%,8%)] via-[hsl(220,25%,6%)] to-[hsl(220,25%,8%)] py-2' 
          : 'bg-gradient-to-r from-card/95 via-card/80 to-card/95'
      }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`rounded-xl gradient-primary flex items-center justify-center glow-primary transition-all ${isFullscreen ? 'w-10 h-10' : 'w-12 h-12'}`}>
                  <Zap className={`text-primary-foreground ${isFullscreen ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse-glow" />
              </div>
              <div>
                <h1 className={`font-bold text-gradient tracking-tight ${isFullscreen ? 'text-xl' : 'text-2xl'}`}>Team WolfPack</h1>
                <p className="text-xs text-muted-foreground font-medium">Sales Performance Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className={`gap-2 transition-all ${
                  isFullscreen 
                    ? 'border-primary bg-primary/20 text-primary hover:bg-primary/30' 
                    : 'border-primary/30 hover:border-primary hover:bg-primary/10'
                }`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
              
              {!isFullscreen && (
                <>
                  <AdminPanel 
                    targets={targets}
                    formulas={formulas}
                    onSaveTargets={saveTargets}
                    onSaveFormulas={saveFormulas}
                    onResetFormulas={resetFormulas}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`container mx-auto px-4 ${isFullscreen ? 'py-4 space-y-4' : 'py-6 space-y-6'}`}>
        {/* File Upload Section - Hidden in fullscreen */}
        {!isFullscreen && (
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Data Import</h2>
              </div>
              {parsedData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearData}
                  className="gap-2 border-primary/30 hover:border-primary"
                >
                  <RefreshCw className="w-4 h-4" />
                  Upload New File
                </Button>
              )}
            </div>
            <FileUpload onFileContent={handleFileContent} isProcessing={isProcessing} />
          </section>
        )}

        {/* Summary Stats */}
        {parsedData && (
          <>
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg flex items-center justify-center ${isFullscreen ? 'w-6 h-6 bg-success/30' : 'w-8 h-8 bg-success/20'}`}>
                    <DollarSign className={`text-success ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  </div>
                  <h2 className={`font-semibold text-foreground ${isFullscreen ? 'text-base' : 'text-lg'}`}>Summary</h2>
                </div>
                {parsedData.dateRange && (
                  <div className={`flex items-center gap-2 text-muted-foreground rounded-lg ${isFullscreen ? 'text-xs bg-muted/30 px-2 py-1' : 'text-sm bg-muted/50 px-3 py-1.5'}`}>
                    <Calendar className={isFullscreen ? 'w-3 h-3' : 'w-4 h-4'} />
                    {parsedData.dateRange}
                  </div>
                )}
              </div>
              <div className={`grid grid-cols-2 md:grid-cols-4 ${isFullscreen ? 'gap-3' : 'gap-4'}`}>
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(parsedData.summary.totalSales)}
                  subtitle="All sales combined"
                  icon={DollarSign}
                  variant="success"
                  compact={isFullscreen}
                  isFullscreen={isFullscreen}
                />
                <StatCard
                  title="Total Orders"
                  value={parsedData.summary.totalOrders.toString()}
                  subtitle={`Avg: ${formatCurrency(parsedData.summary.avgOrderSize)}`}
                  icon={ShoppingCart}
                  compact={isFullscreen}
                  isFullscreen={isFullscreen}
                />
                <StatCard
                  title="New Revenue"
                  value={formatCurrency(parsedData.summary.newSales)}
                  subtitle={`${parsedData.summary.newOrders} new orders`}
                  icon={TrendingUp}
                  variant="default"
                  compact={isFullscreen}
                  isFullscreen={isFullscreen}
                />
                <StatCard
                  title="NRPC"
                  value={totalChats > 0 ? formatCurrency(nrpc) : '-'}
                  subtitle={totalChats > 0 ? `${totalChats} total chats` : 'No chat data'}
                  icon={MessageSquare}
                  variant={totalChats > 0 ? 'default' : 'warning'}
                  compact={isFullscreen}
                  isFullscreen={isFullscreen}
                />
              </div>
            </section>

            {/* Sales Table */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-lg flex items-center justify-center ${isFullscreen ? 'w-6 h-6 bg-accent/30' : 'w-8 h-8 bg-accent/20'}`}>
                  <TrendingUp className={`text-accent ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </div>
                <h2 className={`font-semibold text-foreground ${isFullscreen ? 'text-base' : 'text-lg'}`}>Performance Details</h2>
              </div>
              <SalesTable salesData={parsedData.salesData} targets={targets} compact={isFullscreen} isFullscreen={isFullscreen} />
            </section>
          </>
        )}

        {/* Empty State - Hidden in fullscreen */}
        {!parsedData && targets.length > 0 && !isFullscreen && (
          <section className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Configured Guides ({targets.length})
              </h2>
            </div>
            <SalesTable salesData={[]} targets={targets} compact={false} isFullscreen={false} />
          </section>
        )}
      </main>

      {/* Footer - Hidden in fullscreen */}
      {!isFullscreen && (
        <footer className="border-t border-border mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <span className="text-gradient font-semibold">Team WolfPack</span> Sales Dashboard • {new Date().getFullYear()}
          </div>
        </footer>
      )}
    </div>
  );
}
