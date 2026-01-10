import { useMemo } from 'react';
import { SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { GuideTarget, getFormulas } from '@/lib/storage';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
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
}

interface SalesTableProps {
  salesData: SalesData[];
  targets: GuideTarget[];
}

export function SalesTable({ salesData, targets }: SalesTableProps) {
  const computedData = useMemo(() => {
    const formulas = getFormulas();
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

      // Calculate computed values
      const revenueDeficit = target.targetRevenue - newRevenue;
      const orderDeficit = target.targetOrders - orders;
      const currentConversion = chatCount > 0 ? (orders / chatCount) * 100 : 0;
      const ordersToTarget = Math.max(
        0,
        Math.ceil((target.targetConversion / 100) * chatCount - orders)
      );

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
        isFromFile: !!sales,
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
      <div className={`flex items-center gap-1 font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
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
        <p className="text-muted-foreground">No data to display. Upload an MHTML file or add guides in the Admin panel.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-foreground font-semibold">Name</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Orders</TableHead>
              <TableHead className="text-foreground font-semibold text-right">New Revenue</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Target Revenue</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Revenue Deficit</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Target Orders</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Order Deficit</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Chats</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Conv %</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Target Conv %</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Orders Needed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computedData.map((row, index) => (
              <TableRow
                key={row.name}
                className={`
                  table-row-alt animate-fade-in
                  ${!row.isFromFile ? 'opacity-60' : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{row.name}</span>
                    {!row.isFromFile && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                        No Data
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono">{row.orders}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(row.newRevenue)}</TableCell>
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
                    <DeficitCell value={row.orderDeficit} />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center font-mono">{row.chatCount || '-'}</TableCell>
                <TableCell className="text-center font-mono">
                  {row.chatCount > 0 ? formatPercent(row.currentConversion) : '-'}
                </TableCell>
                <TableCell className="text-center font-mono text-muted-foreground">
                  {row.targetConversion > 0 ? formatPercent(row.targetConversion) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {row.targetConversion > 0 && row.chatCount > 0 ? (
                    <span className={`font-mono ${row.ordersToTarget > 0 ? 'text-warning' : 'text-success'}`}>
                      {row.ordersToTarget}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
