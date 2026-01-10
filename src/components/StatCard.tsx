import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  compact?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  compact = false 
}: StatCardProps) {
  const gradientClasses = {
    default: 'gradient-primary',
    success: 'gradient-success',
    warning: 'bg-warning',
    danger: 'gradient-danger',
  };

  const iconBgClasses = {
    default: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className={`stat-card group hover:border-primary/30 transition-all duration-300 ${compact ? 'p-3' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-muted-foreground font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{title}</p>
          <p className={`font-bold text-foreground ${compact ? 'text-xl mt-0.5' : 'text-3xl mt-1'}`}>{value}</p>
          {subtitle && (
            <p className={`text-muted-foreground ${compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'}`}>{subtitle}</p>
          )}
        </div>
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg ${iconBgClasses[variant]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        </div>
      </div>
      {/* Animated underline on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
