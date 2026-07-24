import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MetricCard({
  icon: Icon,
  title,
  description,
  onRefresh,
  isRefreshing = false,
  footer,
  children,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`relative group ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm leading-tight">{title}</CardTitle>
              {description && (
                <CardDescription className="text-[11px]">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {children}
        </CardContent>

        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>

      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Refrescar"
        >
          {isRefreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
        </Button>
      )}

      {isRefreshing && (
        <div className="absolute inset-0 bg-background/40 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

export function MetricCardSkeleton({ className = '' }: { className?: string }) {
  return <div className={`h-40 bg-muted animate-pulse rounded-lg ${className}`} />;
}
