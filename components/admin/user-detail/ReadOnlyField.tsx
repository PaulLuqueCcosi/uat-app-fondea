import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReadOnlyFieldProps {
  label: string;
  value: string | number | null | undefined;
  type?: 'text' | 'money' | 'date' | 'badge' | 'boolean';
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'secondary';
  colSpan?: 1 | 2;
}

export function ReadOnlyField({
  label,
  value,
  type = 'text',
  badgeVariant = 'default',
  colSpan = 1,
}: ReadOnlyFieldProps) {
  const displayValue =
    value === null || value === undefined || value === ''
      ? '—'
      : type === 'money'
        ? `S/ ${Number(value).toLocaleString()}`
        : type === 'boolean'
          ? value
            ? 'Sí'
            : 'No'
          : String(value);

  return (
    <div className={`${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {type === 'badge' ? (
        <Badge variant={badgeVariant} className="text-[10px]">
          {displayValue}
        </Badge>
      ) : (
        <p className="text-sm font-medium text-foreground">{displayValue}</p>
      )}
    </div>
  );
}

interface ReadOnlySectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ReadOnlySection({ title, children, className }: ReadOnlySectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
