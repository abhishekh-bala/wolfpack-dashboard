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
  const [compactMode, setCompactMode] = useState(false);
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

  return (
    <div className={`min-h-screen bg-background ${compactMode ? 'text-sm' : ''}`}>
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
              {/* Compact Mode Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="compact-mode" className="text-xs text-muted-foreground cursor-pointer">
                  Compact
                </Label>
                <Switch
                  id="compact-mode"
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
              
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

      <main className={`container mx-auto px-4 ${compactMode ? 'py-3 space-y-3' : 'py-6 space-y-6'}`}>
        {/* File Upload Section */}
        <section className={`glass-card ${compactMode ? 'p-4' : 'p-6'}`}>
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
              <div className={`grid ${compactMode ? 'grid-cols-4 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(parsedData.summary.totalSales)}
                  subtitle="All sales combined"
                  icon={DollarSign}
                  variant="success"
                  compact={compactMode}
                />
                <StatCard
                  title="Total Orders"
                  value={parsedData.summary.totalOrders.toString()}
                  subtitle={`Avg: ${formatCurrency(parsedData.summary.avgOrderSize)}`}
                  icon={ShoppingCart}
                  compact={compactMode}
                />
                <StatCard
                  title="New Revenue"
                  value={formatCurrency(parsedData.summary.newSales)}
                  subtitle={`${parsedData.summary.newOrders} new orders`}
                  icon={TrendingUp}
                  variant="default"
                  compact={compactMode}
                />
                <StatCard
                  title="Team Size"
                  value={parsedData.salesData.length.toString()}
                  subtitle={`${formatCurrency(parsedData.summary.salesPerRep)} per rep`}
                  icon={Users}
                  compact={compactMode}
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
              <SalesTable salesData={parsedData.salesData} targets={targets} compact={compactMode} />
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
            <SalesTable salesData={[]} targets={targets} compact={compactMode} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t border-border ${compactMode ? 'mt-6 py-3' : 'mt-12 py-6'}`}>
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <span className="text-gradient font-semibold">Team WolfPack</span> Sales Dashboard • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
