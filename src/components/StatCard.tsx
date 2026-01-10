import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  variant = 'default'
}: StatCardProps) {
  const variantStyles = {
    default: 'before:bg-gradient-to-r before:from-primary before:to-accent',
    success: 'before:bg-gradient-to-r before:from-success before:to-emerald-400',
    warning: 'before:bg-gradient-to-r before:from-warning before:to-amber-400',
    danger: 'before:bg-gradient-to-r before:from-destructive before:to-red-400',
  };

  const iconColors = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  };

  return (
    <div className={`stat-card ${variantStyles[variant]} before:h-1`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1 font-mono">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-muted/50 ${iconColors[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
