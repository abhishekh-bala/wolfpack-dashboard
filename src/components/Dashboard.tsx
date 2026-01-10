import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { SalesTable } from './SalesTable';
import { StatCard } from './StatCard';
import { AdminPanel } from './AdminPanel';
import { parseMhtml, ParsedMhtmlData, formatCurrency } from '@/lib/mhtmlParser';
import { getTargets, GuideTarget, logout } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  LogOut,
  RefreshCw,
  Calendar,
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [parsedData, setParsedData] = useState<ParsedMhtmlData | null>(null);
  const [targets, setTargets] = useState<GuideTarget[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTargets(getTargets());
  }, []);

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

  const handleTargetsChange = (newTargets: GuideTarget[]) => {
    setTargets(newTargets);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center glow-primary">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">Team WolfPack</h1>
                <p className="text-xs text-muted-foreground">Sales Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AdminPanel onTargetsChange={handleTargetsChange} targets={targets} />
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
            <h2 className="text-lg font-semibold text-foreground">Data Import</h2>
            {parsedData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="gap-2"
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
                <h2 className="text-lg font-semibold text-foreground">Summary</h2>
                {parsedData.dateRange && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  value={parsedData.salesData.length.toString()}
                  subtitle={`${formatCurrency(parsedData.summary.salesPerRep)} per rep`}
                  icon={Users}
                />
              </div>
            </section>

            {/* Sales Table */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Performance Details
              </h2>
              <SalesTable salesData={parsedData.salesData} targets={targets} />
            </section>
          </>
        )}

        {/* Empty State */}
        {!parsedData && targets.length > 0 && (
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Configured Guides ({targets.length})
            </h2>
            <SalesTable salesData={[]} targets={targets} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Team WolfPack Sales Dashboard • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
