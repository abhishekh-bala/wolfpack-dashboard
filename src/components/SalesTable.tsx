import { useMemo, useState } from 'react';
import { SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { GuideTarget } from '@/hooks/useGuideTargets';
import { TrendingDown, TrendingUp, Minus, AlertCircle, Edit3, Check, X } from 'lucide-react';
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

    // Sort by new revenue descending
    return result.sort((a, b) => b.newRevenue - a.newRevenue);
  }, [salesData, targets, viewMode]);

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
      <div className="overflow-x-auto">
        <Table className={compact ? 'text-xs' : ''}>
          <TableHeader>
            <TableRow className={`hover:bg-muted/50 ${isFullscreen ? 'bg-muted/30' : 'bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50'}`}>
              <TableHead className={`text-foreground font-bold ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Name</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>New Orders</TableHead>
              <TableHead className={`text-foreground font-bold text-right ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>New Revenue</TableHead>
              <TableHead className={`text-foreground font-bold text-right ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Target Rev</TableHead>
              <TableHead className={`text-foreground font-bold text-right ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Rev Deficit</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Target Ord</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Ord Deficit</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Chats</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>NRPC</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>NewConv %</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Target %</TableHead>
              <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Need</TableHead>
              {onKpiOverride && (
                <TableHead className={`text-foreground font-bold text-center ${isFullscreen ? 'text-sm py-4' : compact ? 'py-2' : ''}`}>Actions</TableHead>
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
                  <TableCell className={`font-medium ${compact ? 'py-1.5' : isFullscreen ? 'py-4' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`${isFullscreen ? 'text-base font-semibold' : ''} ${
                          isExceedingTargets ? 'text-success' : ''
                        }`}
                      >
                        {row.name}
                      </span>
                      {isLeader && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-400 border border-orange-400/40 font-bold shadow-sm">
                          🐺 Team Leader
                        </span>
                      )}
                      {hasOverride && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/30 text-accent font-medium">
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
