import { useState, useEffect, useCallback, useRef } from 'react';
import { FileUpload, FileType } from './FileUpload';
import { SalesTable } from './SalesTable';
import { StatCard } from './StatCard';
import { AdminPanel } from './AdminPanel';
import { PerformanceCharts } from './PerformanceCharts';
import { FullscreenGraphsView } from './FullscreenGraphsView';
import { Footer } from './Footer';
import { ParticleNetwork } from './ParticleNetwork';
import { parseMhtml, ParsedMhtmlData, SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { parseCsv, getUnmappedLogins } from '@/lib/csvParser';
import { useGuideTargets, GuideTarget } from '@/hooks/useGuideTargets';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  LogOut,
  RefreshCw,
  Calendar,
  Maximize,
  Minimize,
  Loader2,
  CalendarDays,
  CalendarRange,
  Upload,
  Table2,
  BarChart3,
  Target,
  CircleDollarSign,
  Banknote,
  ShoppingCart,
  Receipt,
  MessageCircle,
  FileText,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { exportToPDF } from '@/lib/pdfExport';
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
  const [fullscreenView, setFullscreenView] = useState<'table' | 'graphs'>('table');
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingDateRange, setIsEditingDateRange] = useState(false);
  const [editedDateRange, setEditedDateRange] = useState('');
  const { toast } = useToast();

  const {
    targets,
    formulas,
    isLoading,
    saveTargets,
    saveFormulas,
    resetFormulas,
  } = useGuideTargets();

  const { isAdmin, isLoading: isLoadingRole } = useUserRole();

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

  // Export dashboard as PDF
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        dailyData: publishedDailyData ? {
          salesData: publishedDailyData.salesData.map(agent => {
            const override = publishedDailyOverrides[agent.name];
            return override ? { ...agent, ...override } : agent;
          }),
          summary: {
            newSales: publishedDailyData.salesData.reduce((sum, a) => sum + (publishedDailyOverrides[a.name]?.newRevenue ?? a.newRevenue), 0),
            newOrders: publishedDailyData.salesData.reduce((sum, a) => sum + (publishedDailyOverrides[a.name]?.orders ?? a.orders), 0),
          },
          dateRange: publishedDailyData.dateRange,
        } : null,
        monthlyData: publishedMonthlyData ? {
          salesData: publishedMonthlyData.salesData.map(agent => {
            const override = publishedMonthlyOverrides[agent.name];
            return override ? { ...agent, ...override } : agent;
          }),
          summary: {
            newSales: publishedMonthlyData.salesData.reduce((sum, a) => sum + (publishedMonthlyOverrides[a.name]?.newRevenue ?? a.newRevenue), 0),
            newOrders: publishedMonthlyData.salesData.reduce((sum, a) => sum + (publishedMonthlyOverrides[a.name]?.orders ?? a.orders), 0),
          },
          dateRange: publishedMonthlyData.dateRange,
        } : null,
        targets,
      });
      
      toast({
        title: 'Report Exported',
        description: 'PDF report downloaded successfully.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileContent = (content: string, fileType: FileType) => {
    setIsProcessing(true);
    try {
      let data: ParsedMhtmlData;
      
      if (fileType === 'csv') {
        // CSV files are typically for monthly data
        // Check for unmapped logins first
        const unmappedLogins = getUnmappedLogins(content, targets);
        if (unmappedLogins.length > 0) {
          toast({
            title: 'Warning: Unmapped Login Names',
            description: `The following login names are not configured in Admin Panel: ${unmappedLogins.slice(0, 5).join(', ')}${unmappedLogins.length > 5 ? ` and ${unmappedLogins.length - 5} more` : ''}. Configure them in Admin Panel → Monthly Targets.`,
            variant: 'destructive',
          });
        }
        
        data = parseCsv(content, targets);
        
        if (data.salesData.length === 0) {
          toast({
            title: 'No Data Mapped',
            description: 'No data was mapped from the CSV. Please ensure guides have their Login Names configured in Admin Panel.',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }
        
        // CSV is for monthly - switch to monthly view if not already
        if (viewMode !== 'month') {
          setViewMode('month');
        }
        setLocalMonthlyData(data);
        setLocalMonthlyOverrides({});
        setHasMonthlyChanges(true);
        
        toast({
          title: 'CSV Parsed Successfully',
          description: `Found ${data.salesData.length} guides. Click "Publish Monthly" to save permanently.`,
        });
      } else {
        // MHTML parsing
        data = parseMhtml(content);
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
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'Parse Error',
        description: error instanceof Error ? error.message : 'Failed to parse the file.',
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

  // Handle date range update for monthly reports
  const handleUpdateDateRange = () => {
    if (!editedDateRange.trim()) return;
    
    const setLocalData = viewMode === 'day' ? setLocalDailyData : setLocalMonthlyData;
    const setHasChanges = viewMode === 'day' ? setHasDailyChanges : setHasMonthlyChanges;
    const currentData = hasLocalChanges ? localParsedData : publishedData;
    
    if (currentData) {
      setLocalData({
        ...currentData,
        dateRange: editedDateRange.trim(),
      });
      setHasChanges(true);
    }
    
    setIsEditingDateRange(false);
    toast({
      title: 'Date Range Updated',
      description: `Updated to "${editedDateRange.trim()}". Click Publish to save.`,
    });
  };

  const startEditingDateRange = () => {
    const currentData = hasLocalChanges ? localParsedData : publishedData;
    setEditedDateRange(currentData?.dateRange || '');
    setIsEditingDateRange(true);
  };

  if (isLoading || isLoadingPublished || isLoadingRole) {
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
      className={`min-h-screen bg-background transition-all duration-300 relative overflow-hidden ${isFullscreen ? 'fullscreen-mode' : ''}`}
    >
      {/* Dynamic particle network background */}
      <ParticleNetwork />
      {/* Header */}
      <header
        className={`relative z-10 border-b border-border backdrop-blur-xl transition-all duration-300 ${
          isFullscreen ? 'bg-card/95' : 'bg-card/80'
        }`}
      >
        <div className={`mx-auto px-3 sm:px-4 ${isFullscreen ? 'max-w-none py-4' : 'container py-2 sm:py-3'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative flex-shrink-0">
                {/* Logo - Update at src/assets/wolfpack-logo.png */}
                <img 
                  src={wolfpackLogo} 
                  alt="WolfPack Logo" 
                  className={`rounded-xl object-cover transition-all ${isFullscreen ? 'w-14 h-14' : 'w-10 h-10 sm:w-12 sm:h-12'}`}
                  onError={(e) => {
                    // Fallback to gradient icon if logo not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className={`rounded-xl gradient-primary flex items-center justify-center glow-primary transition-all hidden ${isFullscreen ? 'w-14 h-14' : 'w-10 h-10 sm:w-12 sm:h-12'}`}>
                  <span className={`text-primary-foreground font-bold ${isFullscreen ? 'text-xl' : 'text-base sm:text-lg'}`}>WP</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-success rounded-full animate-pulse-glow" />
              </div>
              <div className="min-w-0">
                <h1 className={`font-bold text-gradient tracking-tight truncate ${isFullscreen ? 'text-3xl' : 'text-lg sm:text-2xl'}`}>
                  Team WolfPack
                </h1>
                <p className={`text-muted-foreground font-medium hidden sm:block ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                  Sales Performance Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
              {/* Day / Month Toggle */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-lg p-0.5 sm:p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline">Day</span>
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarRange className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline">Month</span>
                </button>
              </div>

              {/* Fullscreen View Toggle - Only show when in fullscreen */}
              {isFullscreen && (
                <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-lg p-0.5 sm:p-1">
                  <button
                    onClick={() => setFullscreenView('table')}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                      fullscreenView === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Table2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Guide View</span>
                  </button>
                  <button
                    onClick={() => setFullscreenView('graphs')}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-colors ${
                      fullscreenView === 'graphs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Graphs</span>
                  </button>
                </div>
              )}

              {/* Export Report Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                disabled={isExporting || (!publishedDailyData && !publishedMonthlyData)}
                className="gap-1 sm:gap-2 px-2 sm:px-3 border-success/30 hover:border-success hover:bg-success/10 text-success"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                <span className="hidden sm:inline">Export PDF</span>
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className={`gap-1 sm:gap-2 px-2 sm:px-3 transition-all ${
                  isFullscreen
                    ? 'border-primary bg-primary/20 text-primary hover:bg-primary/30'
                    : 'border-primary/30 hover:border-primary hover:bg-primary/10'
                }`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </Button>

              {!isFullscreen && (
                <>
                  {isAdmin && (
                    <AdminPanel
                      targets={targets}
                      formulas={formulas}
                      onSaveTargets={saveTargets}
                      onSaveFormulas={saveFormulas}
                      onResetFormulas={resetFormulas}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1 sm:gap-2 px-2 sm:px-3 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`relative z-10 mx-auto px-4 ${isFullscreen ? 'max-w-none py-6 space-y-6' : 'container py-6 space-y-6'}`}>
        {/* File Upload Section - Hidden in fullscreen */}
        {!isFullscreen && (
          <section className="glass-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Data Import</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {hasLocalChanges && (
                  <span className="text-xs text-warning bg-warning/20 px-2 py-1 rounded-full font-medium animate-pulse">
                    Unpublished
                  </span>
                )}
                {parsedData && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePublishData}
                      disabled={isPublishing}
                      className="gap-1.5 sm:gap-2 bg-success hover:bg-success/80 text-success-foreground text-xs sm:text-sm"
                    >
                      {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span className="hidden xs:inline">Publish</span> {viewMode === 'day' ? 'Daily' : 'Monthly'}
                    </Button>
                    {hasLocalChanges && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearData}
                        className="gap-1.5 sm:gap-2 border-destructive/30 hover:border-destructive hover:bg-destructive/20 text-destructive text-xs sm:text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Discard</span>
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
                    <Banknote className={`text-success ${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                  </div>
                  <h2 className={`font-semibold text-foreground ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                    Summary ({viewMode === 'day' ? 'Daily' : 'Monthly'})
                  </h2>
                </div>
                {/* Date Range Display with Edit option for monthly */}
                {isEditingDateRange ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedDateRange}
                      onChange={(e) => setEditedDateRange(e.target.value)}
                      placeholder="e.g., Jan 1 - Jan 31, 2026"
                      className="h-8 w-48 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-success hover:text-success"
                      onClick={handleUpdateDateRange}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setIsEditingDateRange(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 text-muted-foreground rounded-lg ${isFullscreen ? 'text-sm bg-muted/30 px-4 py-2' : 'text-sm bg-muted/50 px-3 py-1.5'}`}>
                    <Calendar className="w-4 h-4" />
                    <span>{parsedData.dateRange || 'No date range'}</span>
                    {viewMode === 'month' && !isFullscreen && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-primary"
                        onClick={startEditingDateRange}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 ${isFullscreen ? 'gap-4 sm:gap-6' : 'gap-3 sm:gap-4'}`}>
                <StatCard
                  title="NewConversion%"
                  value={totalChats > 0 ? formatPercent(newConversion) : '-'}
                  subtitle={totalChats > 0 ? `${summaryToUse?.newOrders || 0} new / ${totalChats} chats` : 'No chat data'}
                  icon={Target}
                  variant={totalChats > 0 ? 'success' : 'warning'}
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="NRPC"
                  value={totalChats > 0 ? formatCurrency(nrpc) : '-'}
                  subtitle={totalChats > 0 ? `${totalChats} total chats` : 'No chat data'}
                  icon={CircleDollarSign}
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
                  icon={ShoppingCart}
                  variant="default"
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="New AOS"
                  value={summaryToUse && summaryToUse.newOrders > 0 ? formatCurrency(newAos) : '-'}
                  subtitle="New avg order size"
                  icon={Receipt}
                  variant="default"
                  compact={false}
                  isFullscreen={isFullscreen}
                />

                <StatCard
                  title="Total Chats"
                  value={totalChats.toString()}
                  subtitle={viewMode === 'day' ? 'Daily chats' : 'Monthly chats'}
                  icon={MessageCircle}
                  variant="default"
                  compact={false}
                  isFullscreen={isFullscreen}
                />
              </div>
            </section>

            {/* Fullscreen Graphs View */}
            {isFullscreen && fullscreenView === 'graphs' && (
              <section className="animate-fade-in flex-1" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <FullscreenGraphsView salesData={effectiveSalesData} targets={targets} viewMode={viewMode} />
              </section>
            )}

            {/* Sales Table - Show in normal mode or fullscreen table view */}
            {(!isFullscreen || fullscreenView === 'table') && (
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
            )}

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
      {!isFullscreen && <Footer />}
    </div>
  );
}


