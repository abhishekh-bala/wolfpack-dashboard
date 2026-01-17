import { useMemo, useState } from 'react';
import { SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { GuideTarget } from '@/hooks/useGuideTargets';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3, PieChartIcon, LineChartIcon } from 'lucide-react';

interface PerformanceChartsProps {
  salesData: SalesData[];
  targets: GuideTarget[];
  viewMode: 'day' | 'month';
}

const COLORS = [
  'hsl(200, 100%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(45, 93%, 47%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 80%, 60%)',
  'hsl(180, 100%, 45%)',
  'hsl(320, 70%, 55%)',
  'hsl(60, 85%, 50%)',
  'hsl(220, 70%, 55%)',
  'hsl(100, 60%, 45%)',
];

type MetricKey = 'newRevenue' | 'newOrders' | 'nrpc' | 'conversion';

export function PerformanceCharts({ salesData, targets, viewMode }: PerformanceChartsProps) {
  const [metric, setMetric] = useState<MetricKey>('newRevenue');

  const chartData = useMemo(() => {
    const dataMap = new Map<string, SalesData>();
    salesData.forEach((item) => {
      dataMap.set(item.name.toLowerCase(), item);
    });

    return targets.map((target) => {
      const sales = dataMap.get(target.name.toLowerCase());
      const chatCount = viewMode === 'day' ? target.chatCount : target.monthlyChatCount;
      const orders = sales?.orders ?? 0;
      const newRevenue = sales?.newRevenue ?? 0;

      return {
        name: target.name.split(',')[0],
        fullName: target.name,
        newRevenue,
        newOrders: orders,
        nrpc: chatCount > 0 ? newRevenue / chatCount : 0,
        conversion: chatCount > 0 ? (orders / chatCount) * 100 : 0,
        chatCount,
      };
    }).filter((d) => d.chatCount > 0);
  }, [salesData, targets, viewMode]);

  const chartConfig = {
    newRevenue: { label: 'New Revenue', color: 'hsl(200, 100%, 50%)' },
    newOrders: { label: 'New Orders', color: 'hsl(142, 71%, 45%)' },
    nrpc: { label: 'NRPC', color: 'hsl(280, 80%, 60%)' },
    conversion: { label: 'Conversion %', color: 'hsl(45, 93%, 47%)' },
  };

  const metricLabel = chartConfig[metric].label;

  const formatValue = (val: number) => {
    if (metric === 'newRevenue' || metric === 'nrpc') return formatCurrency(val);
    if (metric === 'conversion') return formatPercent(val);
    return val.toString();
  };

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground">
        No data with chat counts available for charts.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">Performance Charts</h3>
        <div className="flex gap-2">
          {(['newRevenue', 'newOrders', 'nrpc', 'conversion'] as MetricKey[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                metric === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {chartConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="bar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted">
          <TabsTrigger value="bar" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Bar Chart
          </TabsTrigger>
          <TabsTrigger value="pie" className="gap-2">
            <PieChartIcon className="w-4 h-4" />
            Pie Chart
          </TabsTrigger>
          <TabsTrigger value="line" className="gap-2">
            <LineChartIcon className="w-4 h-4" />
            Line Chart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bar" className="h-[350px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 25%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 11 }} tickFormatter={formatValue} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(val) => formatValue(val as number)} />}
                />
                <Bar dataKey={metric} fill={chartConfig[metric].color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="pie" className="h-[350px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey={metric}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name, value }) => `${name}: ${formatValue(value)}`}
                  labelLine={{ stroke: 'hsl(215, 15%, 50%)' }}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: 8, padding: '8px 12px' }}>
                          <p style={{ color: '#ffffff', margin: 0 }}>{payload[0].name}: {formatValue(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: 'hsl(215, 15%, 75%)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="line" className="h-[350px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 25%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 11 }} tickFormatter={formatValue} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(val) => formatValue(val as number)} />}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke={chartConfig[metric].color}
                  strokeWidth={2}
                  dot={{ r: 5, fill: chartConfig[metric].color }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
