import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  compact?: boolean;
  isFullscreen?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  compact = false,
  isFullscreen = false,
}: StatCardProps) {
  const iconBgClasses = {
    default: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-destructive/20 text-destructive',
  };

  const fullscreenValueClasses = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  };

  const size = isFullscreen ? 'fullscreen' : compact ? 'compact' : 'default';

  const paddingClass =
    size === 'fullscreen' ? 'p-6' : compact ? 'p-3' : '';

  const titleClass =
    size === 'fullscreen' ? 'text-base' : compact ? 'text-xs' : 'text-sm';

  const valueClass =
    size === 'fullscreen' ? 'text-4xl mt-2' : compact ? 'text-xl mt-0.5' : 'text-3xl mt-1';

  const subtitleClass =
    size === 'fullscreen' ? 'text-sm mt-2' : compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1';

  const iconBoxClass =
    size === 'fullscreen' ? 'w-12 h-12' : compact ? 'w-8 h-8' : 'w-10 h-10';

  const iconSizeClass =
    size === 'fullscreen' ? 'w-6 h-6' : compact ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`stat-card group hover:border-primary/30 transition-all duration-300 ${paddingClass} ${
        isFullscreen ? 'glow-primary ring-1 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-muted-foreground font-medium ${titleClass}`}>{title}</p>
          <p
            className={`font-bold ${valueClass} ${
              isFullscreen ? fullscreenValueClasses[variant] : 'text-foreground'
            }`}
          >
            {value}
          </p>
          {subtitle && <p className={`text-muted-foreground ${subtitleClass}`}>{subtitle}</p>}
        </div>
        <div
          className={`${iconBoxClass} rounded-lg ${iconBgClasses[variant]} flex items-center justify-center group-hover:scale-110 transition-transform ${
            isFullscreen ? 'opacity-90' : ''
          }`}
        >
          <Icon className={iconSizeClass} />
        </div>
      </div>
      {/* Animated underline on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
