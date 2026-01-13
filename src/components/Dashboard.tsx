import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUpload } from './FileUpload';
import { SalesTable } from './SalesTable';
import { StatCard } from './StatCard';
import { AdminPanel } from './AdminPanel';
import { PerformanceCharts } from './PerformanceCharts';
import { parseMhtml, ParsedMhtmlData, SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { useGuideTargets, GuideTarget } from '@/hooks/useGuideTargets';
import { logout } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign,
  TrendingUp,
  MessageSquare,
  LogOut,
  RefreshCw,
  Calendar,
  Maximize,
  Minimize,
  Loader2,
  Percent,
  Hash,
  Coins,
  CalendarDays,
  CalendarRange,
  Users,
  Upload,
  Edit3,
} from 'lucide-react';
import wolfpackLogo from '@/assets/wolfpack-logo.png';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const [parsedData, setParsedData] = useState<ParsedMhtmlData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [kpiOverrides, setKpiOverrides] = useState<Record<string, Partial<SalesData>>>({});
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    targets,
    formulas,
    isLoading,
    saveTargets,
    saveFormulas,
    resetFormulas,
  } = useGuideTargets();

  // Calculate total chats from targets based on view mode
  const getTotalChats = useCallback((targetsInput: GuideTarget[], mode: 'day' | 'month') => {
    return targetsInput.reduce(
      (sum, t) => sum + (mode === 'day' ? t.chatCount : t.monthlyChatCount),
      0
    );
  }, []);

  // Calculate NRPC (New Revenue Per Chat)
  const calculateNRPC = useCallback((newRevenue: number, totalChats: number) => {
    if (totalChats === 0) return 0;
    return newRevenue / totalChats;
  }, []);

  // Fullscreen / screenshot mode toggle
  const toggleFullscreen = useCallback(async () => {
    const next = !isFullscreen;
    setIsFullscreen(next);

    if (next) {
      const el = rootRef.current;
      const requestFullscreen = el?.requestFullscreen?.bind(el);

      if (requestFullscreen) {
        try {
          await requestFullscreen();
        } catch {
          toast({
            title: 'Screenshot mode enabled',
            description: 'Browser fullscreen is unavailable here, using fullscreen dashboard styling instead.',
          });
        }
      }
    } else {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }
    }
  }, [isFullscreen, toast]);

  // If the user exits browser fullscreen with ESC, keep state in sync.
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

  // Prevent page scroll in fullscreen/screenshot mode
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (isFullscreen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

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
    setKpiOverrides({});
    toast({
      title: 'Data Cleared',
      description: 'Upload a new file to continue.',
    });
  };

  // Publish data to Supabase for real-time tracking
  const handlePublishData = async () => {
    if (!parsedData) return;
    
    setIsPublishing(true);
    try {
      // Store the parsed data with overrides in localStorage for now
      // This can be extended to Supabase later
      const dataToPublish = {
        ...parsedData,
        salesData: getEffectiveSalesData(),
        publishedAt: new Date().toISOString(),
        viewMode,
      };
      localStorage.setItem('wolfpack_published_data', JSON.stringify(dataToPublish));
      
      toast({
        title: 'Data Published!',
        description: 'Dashboard data is now available for real-time viewing.',
      });
    } catch (error) {
      toast({
        title: 'Publish Failed',
        description: 'Failed to publish data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Apply KPI overrides to sales data
  const getEffectiveSalesData = useCallback(() => {
    if (!parsedData) return [];
    return parsedData.salesData.map(agent => {
      const override = kpiOverrides[agent.name];
      if (override) {
        return { ...agent, ...override };
      }
      return agent;
    });
  }, [parsedData, kpiOverrides]);

  // Handle KPI override for an agent
  const handleKpiOverride = (agentName: string, field: keyof SalesData, value: number) => {
    setKpiOverrides(prev => ({
      ...prev,
      [agentName]: {
        ...prev[agentName],
        [field]: value,
      },
    }));
  };

  // Clear override for an agent
  const clearAgentOverride = (agentName: string) => {
    setKpiOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[agentName];
      return newOverrides;
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

  const totalChats = getTotalChats(targets, viewMode);
  const effectiveSalesData = getEffectiveSalesData();
  
  // Recalculate summary based on effective (overridden) data
  const effectiveSummary = effectiveSalesData.reduce(
    (acc, agent) => ({
      newOrders: acc.newOrders + agent.orders,
      newSales: acc.newSales + agent.newRevenue,
    }),
    { newOrders: 0, newSales: 0 }
  );
  
  const summaryToUse = effectiveSalesData.length > 0 ? effectiveSummary : parsedData?.summary;
  const nrpc = summaryToUse ? calculateNRPC(summaryToUse.newSales, totalChats) : 0;
  const newConversion = summaryToUse && totalChats > 0 ? (summaryToUse.newOrders / totalChats) * 100 : 0;
  const newAos = summaryToUse && summaryToUse.newOrders > 0 ? summaryToUse.newSales / summaryToUse.newOrders : 0;

  return (
    <div
      ref={rootRef}
      className={`min-h-screen bg-background transition-all duration-300 ${isFullscreen ? 'fullscreen-mode' : ''}`}
    >
      {/* Header */}
      <header
        className={`border-b border-border backdrop-blur-xl transition-all duration-300 ${
          isFullscreen ? 'bg-card/95' : 'bg-card/80'
        }`}
      >
        <div className={`mx-auto px-4 ${isFullscreen ? 'max-w-none py-4' : 'container py-3'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Logo - Update at src/assets/wolfpack-logo.png */}
                <img 
                  src={wolfpackLogo} 
                  alt="WolfPack Logo" 
                  className={`rounded-xl object-cover transition-all ${isFullscreen ? 'w-14 h-14' : 'w-12 h-12'}`}
                  onError={(e) => {
                    // Fallback to gradient icon if logo not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className={`rounded-xl gradient-primary flex items-center justify-center glow-primary transition-all hidden ${isFullscreen ? 'w-14 h-14' : 'w-12 h-12'}`}>
                  <span className={`text-primary-foreground font-bold ${isFullscreen ? 'text-xl' : 'text-lg'}`}>WP</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse-glow" />
              </div>
              <div>
                <h1 className={`font-bold text-gradient tracking-tight ${isFullscreen ? 'text-3xl' : 'text-2xl'}`}>
                  Team WolfPack
                </h1>
                <p className={`text-muted-foreground font-medium ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                  Sales Performance Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Day / Month Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Day
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  Month
                </button>
              </div>

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
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
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

      <main className={`mx-auto px-4 ${isFullscreen ? 'max-w-none py-6 space-y-6' : 'container py-6 space-y-6'}`}>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePublishData}
                    disabled={isPublishing}
                    className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Publish Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearData}
                    className="gap-2 border-primary/30 hover:border-primary"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Upload New File
                  </Button>
                </div>
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
                  <div className={`rounded-lg flex items-center justify-center ${isFullscreen ? 'w-10 h-10 bg-success/20' : 'w-8 h-8 bg-success/20'}`}>
                    <DollarSign className={`text-success ${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                  </div>
                  <h2 className={`font-semibold text-foreground ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                    Summary ({viewMode === 'day' ? 'Daily' : 'Monthly'})
                  </h2>
                </div>
                {parsedData.dateRange && (
                  <div className={`flex items-center gap-2 text-muted-foreground rounded-lg ${isFullscreen ? 'text-sm bg-muted/30 px-4 py-2' : 'text-sm bg-muted/50 px-3 py-1.5'}`}>
                    <Calendar className="w-4 h-4" />
                    {parsedData.dateRange}
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 ${isFullscreen ? 'gap-6' : 'gap-4'}`}>
                <StatCard
                  title="NewConversion%"
                  value={totalChats > 0 ? formatPercent(newConversion) : '-'}
                  subtitle={totalChats > 0 ? `${summaryToUse?.newOrders || 0} new / ${totalChats} chats` : 'No chat data'}
                  icon={Percent}
                  variant={totalChats > 0 ? 'success' : 'warning'}
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="NRPC"
                  value={totalChats > 0 ? formatCurrency(nrpc) : '-'}
                  subtitle={totalChats > 0 ? `${totalChats} total chats` : 'No chat data'}
                  icon={MessageSquare}
                  variant={totalChats > 0 ? 'default' : 'warning'}
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="New Revenue"
                  value={formatCurrency(summaryToUse?.newSales || 0)}
                  subtitle="Revenue from new orders"
                  icon={TrendingUp}
                  variant="success"
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="New Orders"
                  value={(summaryToUse?.newOrders || 0).toString()}
                  subtitle="New orders only"
                  icon={Hash}
                  variant="default"
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="New AOS"
                  value={summaryToUse && summaryToUse.newOrders > 0 ? formatCurrency(newAos) : '-'}
                  subtitle="New avg order size"
                  icon={Coins}
                  variant="default"
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="Total Chats"
                  value={totalChats.toString()}
                  subtitle={viewMode === 'day' ? 'Daily chats' : 'Monthly chats'}
                  icon={Users}
                  variant="default"
                  compact={false}
                  isFullscreen={isFullscreen}
                />
              </div>
            </section>

            {/* Sales Table */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`rounded-lg flex items-center justify-center ${isFullscreen ? 'w-10 h-10 bg-accent/20' : 'w-8 h-8 bg-accent/20'}`}>
                  <TrendingUp className={`text-accent ${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </div>
                <h2 className={`font-semibold text-foreground ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                  Performance Details
                </h2>
              </div>

              <SalesTable 
                salesData={effectiveSalesData} 
                targets={targets} 
                isFullscreen={isFullscreen} 
                viewMode={viewMode}
                kpiOverrides={kpiOverrides}
                onKpiOverride={handleKpiOverride}
                onClearOverride={clearAgentOverride}
                editingAgent={editingAgent}
                onEditAgent={setEditingAgent}
              />
            </section>

            {/* Charts Section - Hidden in fullscreen */}
            {!isFullscreen && (
              <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <PerformanceCharts salesData={effectiveSalesData} targets={targets} viewMode={viewMode} />
              </section>
            )}
          </>
        )}

        {/* Empty State - Hidden in fullscreen */}
        {!parsedData && targets.length > 0 && !isFullscreen && (
          <section className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Configured Guides ({targets.length})</h2>
            </div>
            <SalesTable salesData={[]} targets={targets} compact={false} isFullscreen={false} viewMode={viewMode} />
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


