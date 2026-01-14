import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUpload } from './FileUpload';
import { SalesTable } from './SalesTable';
import { StatCard } from './StatCard';
import { AdminPanel } from './AdminPanel';
import { PerformanceCharts } from './PerformanceCharts';
import { parseMhtml, ParsedMhtmlData, SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { useGuideTargets, GuideTarget } from '@/hooks/useGuideTargets';
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

  // Published data from database (persistent) - separate for daily and monthly
  const [publishedDailyData, setPublishedDailyData] = useState<ParsedMhtmlData | null>(null);
  const [publishedDailyOverrides, setPublishedDailyOverrides] = useState<Record<string, Partial<SalesData>>>({});
  const [publishedMonthlyData, setPublishedMonthlyData] = useState<ParsedMhtmlData | null>(null);
  const [publishedMonthlyOverrides, setPublishedMonthlyOverrides] = useState<Record<string, Partial<SalesData>>>({});
  
  // Local data from file upload (temporary, not persisted until published) - separate for daily and monthly
  const [localDailyData, setLocalDailyData] = useState<ParsedMhtmlData | null>(null);
  const [localDailyOverrides, setLocalDailyOverrides] = useState<Record<string, Partial<SalesData>>>({});
  const [localMonthlyData, setLocalMonthlyData] = useState<ParsedMhtmlData | null>(null);
  const [localMonthlyOverrides, setLocalMonthlyOverrides] = useState<Record<string, Partial<SalesData>>>({});
  const [hasDailyChanges, setHasDailyChanges] = useState(false);
  const [hasMonthlyChanges, setHasMonthlyChanges] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingPublished, setIsLoadingPublished] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
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

  // Load published data from database on mount (both daily and monthly)
  useEffect(() => {
    const loadPublishedData = async () => {
      try {
        const { data, error } = await supabase
          .from('published_sales_data')
          .select('*')
          .order('published_at', { ascending: false });

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading published data:', error);
        }

        if (data) {
          // Find daily and monthly reports
          const dailyReport = data.find((d: any) => d.report_type === 'daily');
          const monthlyReport = data.find((d: any) => d.report_type === 'monthly');
          
          if (dailyReport) {
            setPublishedDailyData(dailyReport.sales_data as unknown as ParsedMhtmlData);
            setPublishedDailyOverrides((dailyReport.kpi_overrides as Record<string, Partial<SalesData>>) || {});
          }
          if (monthlyReport) {
            setPublishedMonthlyData(monthlyReport.sales_data as unknown as ParsedMhtmlData);
            setPublishedMonthlyOverrides((monthlyReport.kpi_overrides as Record<string, Partial<SalesData>>) || {});
          }
        }
      } catch (err) {
        console.error('Failed to load published data:', err);
      } finally {
        setIsLoadingPublished(false);
      }
    };

    loadPublishedData();
  }, []);

  // The active data is based on view mode and local changes
  const hasLocalChanges = viewMode === 'day' ? hasDailyChanges : hasMonthlyChanges;
  const publishedData = viewMode === 'day' ? publishedDailyData : publishedMonthlyData;
  const publishedOverrides = viewMode === 'day' ? publishedDailyOverrides : publishedMonthlyOverrides;
  const localParsedData = viewMode === 'day' ? localDailyData : localMonthlyData;
  const localKpiOverrides = viewMode === 'day' ? localDailyOverrides : localMonthlyOverrides;
  
  const parsedData = hasLocalChanges ? localParsedData : publishedData;
  const kpiOverrides = hasLocalChanges ? localKpiOverrides : publishedOverrides;

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
      // Store in the current view mode's local state
      if (viewMode === 'day') {
        setLocalDailyData(data);
        setLocalDailyOverrides({});
        setHasDailyChanges(true);
      } else {
        setLocalMonthlyData(data);
        setLocalMonthlyOverrides({});
        setHasMonthlyChanges(true);
      }
      toast({
        title: 'File Parsed Successfully',
        description: `Found ${data.salesData.length} employees. Click "Publish ${viewMode === 'day' ? 'Daily' : 'Monthly'}" to save permanently.`,
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
    onLogout();
    toast({
      title: 'Signed Out',
      description: 'You have been logged out successfully.',
    });
  };

  const handleClearData = () => {
    // Clear local changes for current view mode, revert to published data
    if (viewMode === 'day') {
      setLocalDailyData(null);
      setLocalDailyOverrides({});
      setHasDailyChanges(false);
    } else {
      setLocalMonthlyData(null);
      setLocalMonthlyOverrides({});
      setHasMonthlyChanges(false);
    }
    toast({
      title: 'Local Changes Discarded',
      description: publishedData ? 'Reverted to published data.' : 'Upload a new file to continue.',
    });
  };

  // Publish data to Supabase database for current view mode
  const handlePublishData = async () => {
    const dataToPublish = hasLocalChanges ? localParsedData : publishedData;
    const overridesToPublish = hasLocalChanges ? localKpiOverrides : publishedOverrides;
    const reportType = viewMode === 'day' ? 'daily' : 'monthly';
    
    if (!dataToPublish) return;
    
    setIsPublishing(true);
    try {
      // Delete existing published data for this report type only
      await supabase.from('published_sales_data').delete().eq('report_type', reportType);
      
      // Insert new published data with report_type
      const { error } = await supabase.from('published_sales_data').insert([{
        sales_data: JSON.parse(JSON.stringify(dataToPublish)),
        kpi_overrides: JSON.parse(JSON.stringify(overridesToPublish)),
        report_type: reportType,
      }]);

      if (error) throw error;

      // Update published state and clear local changes for current view mode
      if (viewMode === 'day') {
        setPublishedDailyData(dataToPublish);
        setPublishedDailyOverrides(overridesToPublish);
        setLocalDailyData(null);
        setLocalDailyOverrides({});
        setHasDailyChanges(false);
      } else {
        setPublishedMonthlyData(dataToPublish);
        setPublishedMonthlyOverrides(overridesToPublish);
        setLocalMonthlyData(null);
        setLocalMonthlyOverrides({});
        setHasMonthlyChanges(false);
      }
      
      toast({
        title: `${viewMode === 'day' ? 'Daily' : 'Monthly'} Data Published!`,
        description: `${viewMode === 'day' ? 'Daily' : 'Monthly'} dashboard data saved to database.`,
      });
    } catch (error) {
      console.error('Publish error:', error);
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

  // Handle KPI override for an agent (updates local state)
  const handleKpiOverride = (agentName: string, field: keyof SalesData, value: number) => {
    const setLocalData = viewMode === 'day' ? setLocalDailyData : setLocalMonthlyData;
    const setLocalOverrides = viewMode === 'day' ? setLocalDailyOverrides : setLocalMonthlyOverrides;
    const setHasChanges = viewMode === 'day' ? setHasDailyChanges : setHasMonthlyChanges;
    
    if (hasLocalChanges) {
      setLocalOverrides(prev => ({
        ...prev,
        [agentName]: {
          ...prev[agentName],
          [field]: value,
        },
      }));
    } else {
      // If editing published data, switch to local mode
      setLocalData(publishedData);
      setLocalOverrides(prev => ({
        ...publishedOverrides,
        ...prev,
        [agentName]: {
          ...publishedOverrides[agentName],
          ...prev[agentName],
          [field]: value,
        },
      }));
      setHasChanges(true);
    }
  };

  // Clear override for an agent
  const clearAgentOverride = (agentName: string) => {
    const setLocalData = viewMode === 'day' ? setLocalDailyData : setLocalMonthlyData;
    const setLocalOverrides = viewMode === 'day' ? setLocalDailyOverrides : setLocalMonthlyOverrides;
    const setHasChanges = viewMode === 'day' ? setHasDailyChanges : setHasMonthlyChanges;
    
    if (hasLocalChanges) {
      setLocalOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[agentName];
        return newOverrides;
      });
    } else {
      setLocalData(publishedData);
      setLocalOverrides(() => {
        const newOverrides = { ...publishedOverrides };
        delete newOverrides[agentName];
        return newOverrides;
      });
      setHasChanges(true);
    }
  };

  if (isLoading || isLoadingPublished) {
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
              <div className="flex items-center gap-2">
                {hasLocalChanges && (
                  <span className="text-xs text-warning bg-warning/20 px-2 py-1 rounded-full font-medium animate-pulse">
                    Unpublished Changes
                  </span>
                )}
                {parsedData && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePublishData}
                      disabled={isPublishing}
                      className="gap-2 bg-success hover:bg-success/80 text-success-foreground"
                    >
                      {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Publish {viewMode === 'day' ? 'Daily' : 'Monthly'}
                    </Button>
                    {hasLocalChanges && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearData}
                        className="gap-2 border-destructive/30 hover:border-destructive hover:bg-destructive/20 text-destructive"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Discard Changes
                      </Button>
                    )}
                  </>
                )}
              </div>
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


