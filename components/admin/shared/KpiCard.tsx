/**
 * Unified KPI card for admin detail pages.
 * Merges patterns from ApplicationDetailHeader, CreditDetailHeader, and InstallmentDetailPage.
 */

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  positive?: boolean;
  negative?: boolean;
  mono?: boolean;
  progress?: number;
  progressColor?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  highlight,
  positive,
  negative,
  mono,
  progress,
  progressColor,
}: KpiCardProps) {
  // Background and value color classes
  let bgClasses = 'bg-card';
  let valueClasses = 'text-foreground';

  if (highlight) {
    bgClasses = 'border-primary/40 bg-primary/5';
    valueClasses = 'text-primary';
  } else if (negative) {
    valueClasses = 'text-red-600';
  } else if (positive) {
    valueClasses = 'text-emerald-600';
  }

  return (
    <div className={`rounded-lg border p-3 ${bgClasses}`}>
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className={`text-lg font-bold mt-1 leading-tight ${mono ? 'font-mono' : ''} ${valueClasses}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      {progress != null && (
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressColor ?? 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
