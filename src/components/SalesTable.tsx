import { useMemo, useState } from 'react';
import { SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { GuideTarget } from '@/hooks/useGuideTargets';
import { TrendingDown, TrendingUp, Minus, AlertCircle, Edit3, Check, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SortField = 'name' | 'orders' | 'newRevenue' | 'revenueDeficit' | 'orderDeficit' | 'chatCount' | 'nrpc' | 'currentConversion' | 'ordersToTarget';
type SortDirection = 'asc' | 'desc';

interface ComputedData extends SalesData {
  targetRevenue: number;
  revenueDeficit: number;
  targetOrders: number;
  orderDeficit: number;
  chatCount: number;
  currentConversion: number;
  targetConversion: number;
  ordersToTarget: number;
  isFromFile: boolean;
  hasChatData: boolean;
  nrpc: number;
}

interface SalesTableProps {
  salesData: SalesData[];
  targets: GuideTarget[];
  compact?: boolean;
  isFullscreen?: boolean;
  viewMode?: 'day' | 'month';
  kpiOverrides?: Record<string, Partial<SalesData>>;
  onKpiOverride?: (agentName: string, field: keyof SalesData, value: number) => void;
  onClearOverride?: (agentName: string) => void;
  editingAgent?: string | null;
  onEditAgent?: (agentName: string | null) => void;
}

const isTeamLeaderName = (name: string) => {
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  return n.includes('abhishekh') && n.includes('dey');
};

export function SalesTable({ 
  salesData, 
  targets, 
  compact = false, 
  isFullscreen = false, 
  viewMode = 'day',
  kpiOverrides = {},
  onKpiOverride,
  onClearOverride,
  editingAgent,
  onEditAgent,
}: SalesTableProps) {
  const [editValues, setEditValues] = useState<Partial<SalesData>>({});
  const [sortField, setSortField] = useState<SortField>('newRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };
  
  const computedData = useMemo(() => {
    const dataMap = new Map<string, SalesData>();

    // Map sales data by name
    salesData.forEach((item) => {
      dataMap.set(item.name.toLowerCase(), item);
    });

    // Combine with targets
    const result: ComputedData[] = [];
    const processedNames = new Set<string>();

    // First, process all targets
    targets.forEach((target) => {
      const key = target.name.toLowerCase();
      const sales = dataMap.get(key);
      processedNames.add(key);

      const orders = sales?.orders ?? 0;
      const newRevenue = sales?.newRevenue ?? 0;
      const chatCount = viewMode === 'day' ? target.chatCount : target.monthlyChatCount;
      const hasChatData = chatCount > 0;
      const targetRevenue = viewMode === 'day' ? target.targetRevenue : target.monthlyTargetRevenue;
      const targetOrders = viewMode === 'day' ? target.targetOrders : target.monthlyTargetOrders;
      const targetConversion = viewMode === 'day' ? target.targetConversion : target.monthlyTargetConversion;

      // Calculate computed values
      const revenueDeficit = targetRevenue - newRevenue;
      const orderDeficit = targetOrders - orders;
      const currentConversion = hasChatData ? (orders / chatCount) * 100 : 0;
      const ordersToTarget = hasChatData
        ? Math.max(0, Math.ceil((targetConversion / 100) * chatCount - orders))
        : 0;
      const nrpc = hasChatData ? newRevenue / chatCount : 0;

      result.push({
        name: target.name,
        orders,
        avgOrderSize: sales?.avgOrderSize ?? 0,
        total: sales?.total ?? 0,
        newRevenue,
        targetRevenue,
        revenueDeficit,
        targetOrders,
        orderDeficit,
        chatCount,
        currentConversion,
        targetConversion,
        ordersToTarget,
        isFromFile: !!sales,
        hasChatData,
        nrpc,
      });
    });

    // Then add any sales data not in targets
    salesData.forEach((item) => {
      const key = item.name.toLowerCase();
      if (!processedNames.has(key)) {
        result.push({
          ...item,
          targetRevenue: 0,
          revenueDeficit: -item.newRevenue,
          targetOrders: 0,
          orderDeficit: -item.orders,
          chatCount: 0,
          currentConversion: 0,
          targetConversion: 0,
          ordersToTarget: 0,
          isFromFile: true,
          hasChatData: false,
          nrpc: 0,
        });
      }
    });

    // Sort by selected field and direction
    return result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'orders':
          aVal = a.orders;
          bVal = b.orders;
          break;
        case 'newRevenue':
          aVal = a.newRevenue;
          bVal = b.newRevenue;
          break;
        case 'revenueDeficit':
          aVal = a.revenueDeficit;
          bVal = b.revenueDeficit;
          break;
        case 'orderDeficit':
          aVal = a.orderDeficit;
          bVal = b.orderDeficit;
          break;
        case 'chatCount':
          aVal = a.chatCount;
          bVal = b.chatCount;
          break;
        case 'nrpc':
          aVal = a.nrpc;
          bVal = b.nrpc;
          break;
        case 'currentConversion':
          aVal = a.currentConversion;
          bVal = b.currentConversion;
          break;
        case 'ordersToTarget':
          aVal = a.ordersToTarget;
          bVal = b.ordersToTarget;
          break;
        default:
          aVal = a.newRevenue;
          bVal = b.newRevenue;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [salesData, targets, viewMode, sortField, sortDirection]);

  const DeficitCell = ({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) => {
    const isGood = value <= 0;
    const displayValue = isCurrency ? formatCurrency(Math.abs(value)) : Math.abs(value);

    return (
      <div
        className={`flex items-center justify-end gap-1 font-mono ${compact ? 'text-xs' : isFullscreen ? 'text-base' : 'text-sm'} ${
          isGood ? 'text-success' : 'text-destructive'
        }`}
      >
        {value === 0 ? (
          <Minus className="w-3 h-3" />
        ) : isGood ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{isGood && value !== 0 ? '+' : value < 0 ? '-' : ''}{displayValue}</span>
      </div>
    );
  };

  if (computedData.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No data to display. Upload an MHTML file or add guides in the Admin panel.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden glass-card ${isFullscreen ? 'glow-primary ring-1 ring-primary/20' : ''}`}>
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-3 py-2 bg-muted/30 border-b border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
        <span>←</span>
        <span>Scroll horizontally to see all columns</span>
        <span>→</span>
      </div>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <Table className={`${compact ? 'text-xs' : ''} min-w-[900px]`}>
          <TableHeader>
            <TableRow className={`hover:bg-muted/50 ${isFullscreen ? 'bg-muted/30' : 'bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50'}`}>
              <TableHead 
                className={`text-foreground font-bold cursor-pointer hover:text-primary transition-colors sticky left-0 bg-card z-10 ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">Name<SortIcon field="name" /></div>
              </TableHead>
              <TableHead 
                className={`text-foreground font-bold text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('orders')}
              >
                <div className="flex items-center justify-center">Orders<SortIcon field="orders" /></div>
              </TableHead>
              <TableHead 
                className={`text-foreground font-bold text-right cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('newRevenue')}
              >
                <div className="flex items-center justify-end">Revenue<SortIcon field="newRevenue" /></div>
              </TableHead>
              <TableHead className={`text-foreground font-bold text-right whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}>Target</TableHead>
              <TableHead 
                className={`text-foreground font-bold text-right cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('revenueDeficit')}
              >
                <div className="flex items-center justify-end">Deficit<SortIcon field="revenueDeficit" /></div>
              </TableHead>
              <TableHead className={`text-foreground font-bold text-center whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}>Tgt Ord</TableHead>
              <TableHead 
                className={`text-foreground font-bold text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('orderDeficit')}
              >
                <div className="flex items-center justify-center">Ord Δ<SortIcon field="orderDeficit" /></div>
              </TableHead>
              <TableHead 
                className={`text-foreground font-bold text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('chatCount')}
              >
                <div className="flex items-center justify-center">Chats<SortIcon field="chatCount" /></div>
              </TableHead>
              <TableHead 
                className={`text-foreground font-bold text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('nrpc')}
              >
                <div className="flex items-center justify-center">NRPC<SortIcon field="nrpc" /></div>
              </TableHead>
              <TableHead 
                className={`text-foreground font-bold text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('currentConversion')}
              >
                <div className="flex items-center justify-center">Conv%<SortIcon field="currentConversion" /></div>
              </TableHead>
              <TableHead className={`text-foreground font-bold text-center whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}>Tgt%</TableHead>
              <TableHead 
                className={`text-foreground font-bold text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}
                onClick={() => handleSort('ordersToTarget')}
              >
                <div className="flex items-center justify-center">Need<SortIcon field="ordersToTarget" /></div>
              </TableHead>
              {onKpiOverride && (
                <TableHead className={`text-foreground font-bold text-center whitespace-nowrap ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : 'py-2 sm:py-3'}`}>Edit</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {computedData.map((row, index) => {
              const isExceedingTargets = row.revenueDeficit <= 0 && row.orderDeficit <= 0 && row.targetRevenue > 0;
              const isLeader = isTeamLeaderName(row.name);
              const isEditing = editingAgent === row.name;
              const hasOverride = !!kpiOverrides[row.name];

              const startEdit = () => {
                setEditValues({ orders: row.orders, newRevenue: row.newRevenue });
                onEditAgent?.(row.name);
              };

              const cancelEdit = () => {
                setEditValues({});
                onEditAgent?.(null);
              };

              const saveEdit = () => {
                if (editValues.orders !== undefined) {
                  onKpiOverride?.(row.name, 'orders', editValues.orders);
                }
                if (editValues.newRevenue !== undefined) {
                  onKpiOverride?.(row.name, 'newRevenue', editValues.newRevenue);
                }
                setEditValues({});
                onEditAgent?.(null);
              };

              return (
                <TableRow
                  key={row.name}
                  className={`
                    animate-fade-in border-b transition-colors
                    border-border/50
                    ${!row.isFromFile ? 'bg-warning/5' : ''}
                    ${isExceedingTargets ? 'bg-success/5' : ''}
                    ${hasOverride ? 'bg-accent/10 ring-1 ring-accent/30' : ''}
                    ${index % 2 === 0 && !hasOverride ? 'bg-muted/10' : ''}
                    hover:bg-primary/10
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell className={`font-medium sticky left-0 bg-card z-10 ${compact ? 'py-1.5' : isFullscreen ? 'py-4' : 'py-2 sm:py-3'}`}>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span
                        className={`${isFullscreen ? 'text-base font-semibold' : 'text-xs sm:text-sm'} ${
                          isExceedingTargets ? 'text-success' : ''
                        } truncate max-w-[100px] sm:max-w-none`}
                      >
                        {row.name}
                      </span>
                      {isLeader && (
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-400 border border-orange-400/40 font-bold shadow-sm whitespace-nowrap">
                          🐺 <span className="hidden sm:inline">Team Leader</span>
                        </span>
                      )}
                      {hasOverride && (
                        <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-accent/30 text-accent font-medium hidden sm:inline">
                          Modified
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className={`text-center font-mono ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.orders ?? row.orders}
                        onChange={(e) => setEditValues(prev => ({ ...prev, orders: parseInt(e.target.value) || 0 }))}
                        className="w-20 h-8 text-center mx-auto"
                      />
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded bg-muted/50 text-foreground">
                        {row.orders}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className={`text-right font-mono ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValues.newRevenue ?? row.newRevenue}
                        onChange={(e) => setEditValues(prev => ({ ...prev, newRevenue: parseFloat(e.target.value) || 0 }))}
                        className="w-28 h-8 text-right ml-auto"
                      />
                    ) : (
                      <span className="font-semibold text-primary">{formatCurrency(row.newRevenue)}</span>
                    )}
                  </TableCell>

                  <TableCell className={`text-right font-mono text-muted-foreground ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {row.targetRevenue > 0 ? formatCurrency(row.targetRevenue) : '-'}
                  </TableCell>

                  <TableCell className={`${compact ? 'py-1.5' : isFullscreen ? 'py-4' : ''} text-right`}>
                    {row.targetRevenue > 0 ? (
                      <DeficitCell value={row.revenueDeficit} isCurrency />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className={`text-center font-mono text-muted-foreground ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {row.targetOrders > 0 ? row.targetOrders : '-'}
                  </TableCell>

                  <TableCell className={`text-center ${compact ? 'py-1.5' : isFullscreen ? 'py-4' : ''}`}>
                    {row.targetOrders > 0 ? (
                      <div className="flex justify-center">
                        <DeficitCell value={row.orderDeficit} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className={`text-center font-mono ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {row.hasChatData ? (
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded bg-accent/20 text-accent">
                        {row.chatCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No Data</span>
                    )}
                  </TableCell>

                  <TableCell className={`text-center font-mono ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {row.hasChatData ? (
                      <span className="font-semibold text-foreground">{formatCurrency(row.nrpc)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className={`text-center font-mono ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {row.hasChatData ? (
                      <span className={row.currentConversion >= row.targetConversion ? 'text-success' : 'text-foreground'}>
                        {formatPercent(row.currentConversion)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className={`text-center font-mono text-muted-foreground ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {row.targetConversion > 0 ? formatPercent(row.targetConversion) : '-'}
                  </TableCell>

                  <TableCell className={`text-center ${compact ? 'py-1.5' : isFullscreen ? 'py-4 text-base' : ''}`}>
                    {row.targetConversion > 0 && row.hasChatData ? (
                      <span className={`font-mono font-semibold ${row.ordersToTarget > 0 ? 'text-warning' : 'text-success'}`}>
                        {row.ordersToTarget}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {onKpiOverride && (
                    <TableCell className={`text-center ${compact ? 'py-1.5' : isFullscreen ? 'py-4' : ''}`}>
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:text-success" onClick={saveEdit}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-primary" onClick={startEdit}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          {hasOverride && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-destructive/70 hover:text-destructive" 
                              onClick={() => onClearOverride?.(row.name)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
