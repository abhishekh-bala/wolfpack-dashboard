import { useMemo, useState } from 'react';
import { SalesData, formatCurrency, formatPercent } from '@/lib/mhtmlParser';
import { GuideTarget } from '@/hooks/useGuideTargets';
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
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, PieChartIcon, LineChartIcon } from 'lucide-react';

interface FullscreenGraphsViewProps {
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

type ChartType = 'bar' | 'pie' | 'line';
type MetricKey = 'newRevenue' | 'newOrders' | 'nrpc' | 'conversion';

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string }> = {
  newRevenue: { label: 'New Revenue', color: 'hsl(142, 71%, 45%)' },
  newOrders: { label: 'New Orders', color: 'hsl(200, 100%, 50%)' },
  nrpc: { label: 'NRPC', color: 'hsl(280, 80%, 60%)' },
  conversion: { label: 'Conversion %', color: 'hsl(45, 93%, 47%)' },
};

const METRICS: MetricKey[] = ['newRevenue', 'newOrders', 'nrpc', 'conversion'];

export function FullscreenGraphsView({ salesData, targets, viewMode }: FullscreenGraphsViewProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');

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

  const formatValue = (metric: MetricKey, val: number) => {
    if (metric === 'newRevenue' || metric === 'nrpc') return formatCurrency(val);
    if (metric === 'conversion') return formatPercent(val);
    return val.toString();
  };

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No data with chat counts available for charts.
      </div>
    );
  }

  const renderChart = (metric: MetricKey) => {
    const config = METRIC_CONFIG[metric];

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 25%)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={50}
            />
            <YAxis tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 10 }} tickFormatter={(val) => formatValue(metric, val)} width={70} />
            <Tooltip
              formatter={(val: number) => formatValue(metric, val)}
              contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: 8 }}
              labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              itemStyle={{ color: 'hsl(210, 40%, 98%)' }}
            />
            <Bar dataKey={metric} fill={config.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey={metric}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              label={({ name, value }) => `${name}: ${formatValue(metric, value)}`}
              labelLine={{ stroke: 'hsl(215, 15%, 50%)' }}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => [formatValue(metric, val), '']}
              contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: 8, color: '#ffffff' }}
              labelStyle={{ color: '#ffffff' }}
              itemStyle={{ color: '#ffffff' }}
              wrapperStyle={{ color: '#ffffff' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: 8, padding: '8px 12px' }}>
                      <p style={{ color: '#ffffff', margin: 0 }}>{payload[0].name}: {formatValue(metric, payload[0].value as number)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              formatter={(value) => <span style={{ color: 'hsl(215, 15%, 75%)', fontSize: 10 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Line chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 25%)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={50}
          />
          <YAxis tick={{ fill: 'hsl(215, 15%, 65%)', fontSize: 10 }} tickFormatter={(val) => formatValue(metric, val)} width={70} />
          <Tooltip
            formatter={(val: number) => formatValue(metric, val)}
            contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 15%, 25%)', borderRadius: 8 }}
            labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
            itemStyle={{ color: 'hsl(210, 40%, 98%)' }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={config.color}
            strokeWidth={2}
            dot={{ r: 4, fill: config.color }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6" style={{ minHeight: '600px' }}>
      {/* Chart Type Selector - Premium styled */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setChartType('bar')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            chartType === 'bar' 
              ? 'bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-[0_0_30px_hsl(200_100%_50%/0.4)]' 
              : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50 hover:border-primary/30'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            chartType === 'line' 
              ? 'bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-[0_0_30px_hsl(200_100%_50%/0.4)]' 
              : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50 hover:border-primary/30'
          }`}
        >
          <LineChartIcon className="w-5 h-5" />
          Line Chart
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
            chartType === 'pie' 
              ? 'bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-[0_0_30px_hsl(200_100%_50%/0.4)]' 
              : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50 hover:border-primary/30'
          }`}
        >
          <PieChartIcon className="w-5 h-5" />
          Pie Chart
        </button>
      </div>

      {/* 4 KPI Grid - Enhanced styling */}
      <div className="flex-1 grid grid-cols-2 gap-6" style={{ minHeight: '500px' }}>
        {METRICS.map((metric, index) => (
          <div 
            key={metric} 
            className="glass-card p-6 flex flex-col glow-primary ring-1 ring-primary/25 relative overflow-hidden group hover:ring-primary/40 transition-all duration-300" 
            style={{ 
              minHeight: '280px',
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Decorative gradient overlay */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at top left, ${METRIC_CONFIG[metric].color}15, transparent 50%)`
              }}
            />
            {/* Top accent line */}
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${METRIC_CONFIG[metric].color}, transparent)`
              }}
            />
            <h3 
              className="text-xl font-bold mb-4 text-center relative z-10 tracking-wide"
              style={{ color: METRIC_CONFIG[metric].color, textShadow: `0 0 20px ${METRIC_CONFIG[metric].color}40` }}
            >
              {METRIC_CONFIG[metric].label}
            </h3>
            <div className="flex-1 relative z-10" style={{ minHeight: '200px' }}>
              {renderChart(metric)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
