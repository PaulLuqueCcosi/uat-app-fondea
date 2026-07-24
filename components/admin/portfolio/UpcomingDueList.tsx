import { Clock } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UpcomingDue, UpcomingDueLoan } from './types';

interface UpcomingDueListProps {
  data: UpcomingDue | null;
}

export function UpcomingDueList({ data }: UpcomingDueListProps) {
  if (!data?.loans?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" /> Préstamos próximos a vencer (7 días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {data.loans.map((loan: UpcomingDueLoan) => (
            <Link
              key={loan.credit_id}
              href={`/admin/credits/${loan.credit_id}`}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/30 rounded transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{loan.client_name ?? 'Sin nombre'}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{loan.client_document}</span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <span className="text-sm font-semibold">S/ {loan.principal}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    loan.days_until_due <= 2
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {loan.days_until_due === 0 ? 'Hoy' : `${loan.days_until_due}d`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
