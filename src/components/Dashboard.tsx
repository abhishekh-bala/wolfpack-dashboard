import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { SalesTable } from './SalesTable';
import { StatCard } from './StatCard';
import { AdminPanel } from './AdminPanel';
import { parseMhtml, ParsedMhtmlData, formatCurrency } from '@/lib/mhtmlParser';
import { useGuideTargets } from '@/hooks/useGuideTargets';
import { logout } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  LogOut,
  RefreshCw,
  Calendar,
  Maximize2,
  Loader2,
  Zap,
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [parsedData, setParsedData] = useState<ParsedMhtmlData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const { toast } = useToast();
  
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

  // Fullscreen Mode View
  if (fullscreenMode && parsedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-8 flex flex-col">
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreenMode(false)}
            className="gap-2 border-primary/30 hover:border-primary"
          >
            <Maximize2 className="w-4 h-4" />
            Exit Fullscreen
          </Button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-gradient mb-4">Team WolfPack</h1>
            <p className="text-2xl text-muted-foreground">Sales Performance Metrics</p>
            {parsedData.dateRange && (
              <p className="text-lg text-accent mt-2">{parsedData.dateRange}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto w-full">
            <div className="glass-card p-8 text-center gradient-success">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-success" />
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</p>
              <p className="text-5xl font-bold text-success-foreground">{formatCurrency(parsedData.summary.totalSales)}</p>
              <p className="text-sm text-muted-foreground mt-2">All sales combined</p>
            </div>

            <div className="glass-card p-8 text-center bg-gradient-to-br from-primary/20 to-accent/20">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Orders</p>
              <p className="text-5xl font-bold text-foreground">{parsedData.summary.totalOrders}</p>
              <p className="text-sm text-accent mt-2">Avg: {formatCurrency(parsedData.summary.avgOrderSize)}</p>
            </div>

            <div className="glass-card p-8 text-center bg-gradient-to-br from-accent/20 to-primary/20">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-accent" />
              <p className="text-sm font-medium text-muted-foreground mb-2">New Revenue</p>
              <p className="text-5xl font-bold text-foreground">{formatCurrency(parsedData.summary.newSales)}</p>
              <p className="text-sm text-primary mt-2">{parsedData.summary.newOrders} new orders</p>
            </div>

            <div className="glass-card p-8 text-center bg-gradient-to-br from-warning/20 to-success/20">
              <Users className="w-16 h-16 mx-auto mb-4 text-warning" />
              <p className="text-sm font-medium text-muted-foreground mb-2">Team Size</p>
              <p className="text-5xl font-bold text-foreground">{targets.length}</p>
              <p className="text-sm text-success mt-2">{formatCurrency(parsedData.summary.salesPerRep)} per rep</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-card/95 via-card/80 to-card/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse-glow" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient tracking-tight">Team WolfPack</h1>
                <p className="text-xs text-muted-foreground font-medium">Sales Performance Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Fullscreen Mode Toggle */}
              {parsedData && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="fullscreen-mode" className="text-xs text-muted-foreground cursor-pointer">
                    Fullscreen
                  </Label>
                  <Switch
                    id="fullscreen-mode"
                    checked={fullscreenMode}
                    onCheckedChange={setFullscreenMode}
                  />
                </div>
              )}

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
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* File Upload Section */}
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

        {/* Summary Stats */}
        {parsedData && (
          <>
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-success" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Summary</h2>
                </div>
                {parsedData.dateRange && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    {parsedData.dateRange}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(parsedData.summary.totalSales)}
                  subtitle="All sales combined"
                  icon={DollarSign}
                  variant="success"
                />
                <StatCard
                  title="Total Orders"
                  value={parsedData.summary.totalOrders.toString()}
                  subtitle={`Avg: ${formatCurrency(parsedData.summary.avgOrderSize)}`}
                  icon={ShoppingCart}
                />
                <StatCard
                  title="New Revenue"
                  value={formatCurrency(parsedData.summary.newSales)}
                  subtitle={`${parsedData.summary.newOrders} new orders`}
                  icon={TrendingUp}
                  variant="default"
                />
                <StatCard
                  title="Team Size"
                  value={targets.length.toString()}
                  subtitle={`${formatCurrency(parsedData.summary.salesPerRep)} per rep`}
                  icon={Users}
                />
              </div>
            </section>

            {/* Sales Table */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Performance Details</h2>
              </div>
              <SalesTable salesData={parsedData.salesData} targets={targets} />
            </section>
          </>
        )}

        {/* Empty State */}
        {!parsedData && targets.length > 0 && (
          <section className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Configured Guides ({targets.length})
              </h2>
            </div>
            <SalesTable salesData={[]} targets={targets} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <span className="text-gradient font-semibold">Team WolfPack</span> Sales Dashboard • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
