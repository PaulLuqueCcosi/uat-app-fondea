import { BackLink } from './BackLink';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'default' | 'pending' | 'secondary' | 'outline' | 'destructive' | 'completed';

interface DetailPageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string | ReactNode;
  badge: { label: string; variant: BadgeVariant };
  backHref: string;
  backLabel?: string;
  children?: ReactNode;
}

export function DetailPageHeader({
  icon,
  title,
  subtitle,
  badge,
  backHref,
  backLabel,
  children,
}: DetailPageHeaderProps) {
  return (
    <div className="space-y-4">
      <BackLink href={backHref} label={backLabel} />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {typeof subtitle === 'string' ? <span>{subtitle}</span> : subtitle}
              </div>
            )}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
