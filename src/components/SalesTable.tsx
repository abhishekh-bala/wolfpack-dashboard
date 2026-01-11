import { useMemo } from 'react';
import { SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { GuideTarget } from '@/hooks/useGuideTargets';
import { TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';
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
  nrpc: number;
  isFromFile: boolean;
  hasChatData: boolean;
}

interface SalesTableProps {
  salesData: SalesData[];
  targets: GuideTarget[];
}

export function SalesTable({ salesData, targets }: SalesTableProps) {
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
      const chatCount = target.chatCount;
      const hasChatData = chatCount > 0;

      // Calculate computed values
      const revenueDeficit = target.targetRevenue - newRevenue;
      const orderDeficit = target.targetOrders - orders;
      const currentConversion = hasChatData ? (orders / chatCount) * 100 : 0;
      const ordersToTarget = hasChatData
        ? Math.max(0, Math.ceil((target.targetConversion / 100) * chatCount - orders))
        : 0;
      const nrpc = hasChatData ? newRevenue / chatCount : 0;

      result.push({
        name: target.name,
        orders,
        avgOrderSize: sales?.avgOrderSize ?? 0,
        total: sales?.total ?? 0,
        newRevenue,
        targetRevenue: target.targetRevenue,
        revenueDeficit,
        targetOrders: target.targetOrders,
        orderDeficit,
        chatCount,
        currentConversion,
        targetConversion: target.targetConversion,
        ordersToTarget,
        nrpc,
        isFromFile: !!sales,
        hasChatData,
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
          nrpc: 0,
          isFromFile: true,
          hasChatData: false,
        });
      }
    });

    // Sort by new revenue descending
    return result.sort((a, b) => b.newRevenue - a.newRevenue);
  }, [salesData, targets]);

  const DeficitCell = ({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) => {
    const isPositive = value <= 0;
    const displayValue = isCurrency ? formatCurrency(Math.abs(value)) : Math.abs(value);

    return (
      <div className={`flex items-center justify-end gap-1 font-mono text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {value === 0 ? (
          <Minus className="w-3 h-3" />
        ) : isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{isPositive && value !== 0 ? '+' : value < 0 ? '-' : ''}{displayValue}</span>
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
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 hover:bg-muted/50">
              <TableHead className="text-foreground font-bold">Name</TableHead>
              <TableHead className="text-foreground font-bold text-center">Orders</TableHead>
              <TableHead className="text-foreground font-bold text-right">New Revenue</TableHead>
              <TableHead className="text-foreground font-bold text-right">Target Rev</TableHead>
              <TableHead className="text-foreground font-bold text-right">Rev Deficit</TableHead>
              <TableHead className="text-foreground font-bold text-center">Target Ord</TableHead>
              <TableHead className="text-foreground font-bold text-center">Ord Deficit</TableHead>
              <TableHead className="text-foreground font-bold text-center">Chats</TableHead>
              <TableHead className="text-foreground font-bold text-center">Conv %</TableHead>
              <TableHead className="text-foreground font-bold text-center">Target %</TableHead>
              <TableHead className="text-foreground font-bold text-center">Need</TableHead>
              <TableHead className="text-foreground font-bold text-right">NRPC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computedData.map((row, index) => {
              // Determine row status for styling
              const isExceedingTargets = row.revenueDeficit <= 0 && row.orderDeficit <= 0 && row.targetRevenue > 0;
              
              const revenueProgress = row.targetRevenue > 0 ? (row.newRevenue / row.targetRevenue) * 100 : 0;
              const orderProgress = row.targetOrders > 0 ? (row.orders / row.targetOrders) * 100 : 0;

              let rowColorClass = '';
              if (isExceedingTargets) {
                rowColorClass = 'bg-gradient-to-r from-success/10 via-success/5 to-transparent';
              } else if (revenueProgress > 75 || orderProgress > 75) {
                rowColorClass = 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent';
              } else if (revenueProgress > 50 || orderProgress > 50) {
                rowColorClass = 'bg-gradient-to-r from-accent/10 via-accent/5 to-transparent';
              } else if (row.targetRevenue > 0) {
                rowColorClass = 'bg-gradient-to-r from-warning/10 via-warning/5 to-transparent';
              }

              return (
                <TableRow
                  key={row.name}
                  className={`
                    animate-fade-in border-b border-border/50
                    ${rowColorClass}
                    hover:bg-primary/10 transition-all duration-300
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell className="font-medium">
                    <span className={`${isExceedingTargets ? 'text-success font-semibold' : ''}`}>{row.name}</span>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded bg-muted/50">
                      {row.orders}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="text-primary font-semibold">{formatCurrency(row.newRevenue)}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {row.targetRevenue > 0 ? formatCurrency(row.targetRevenue) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.targetRevenue > 0 ? (
                      <DeficitCell value={row.revenueDeficit} isCurrency />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-muted-foreground">
                    {row.targetOrders > 0 ? row.targetOrders : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.targetOrders > 0 ? (
                      <div className="flex justify-center">
                        <DeficitCell value={row.orderDeficit} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {row.hasChatData ? (
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded bg-accent/20 text-accent font-semibold">
                        {row.chatCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No Data</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {row.hasChatData ? (
                      <span className={`font-semibold ${row.currentConversion >= row.targetConversion ? 'text-success' : row.currentConversion >= row.targetConversion * 0.75 ? 'text-primary' : 'text-warning'}`}>
                        {formatPercent(row.currentConversion)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-muted-foreground">
                    {row.targetConversion > 0 ? formatPercent(row.targetConversion) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.targetConversion > 0 && row.hasChatData ? (
                      <span className={`font-mono font-semibold ${row.ordersToTarget > 0 ? 'text-warning' : 'text-success'}`}>
                        {row.ordersToTarget}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.hasChatData ? (
                      <span className="text-accent font-semibold">{formatCurrency(row.nrpc)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
