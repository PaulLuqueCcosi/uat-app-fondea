import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Cohorts, Cohort } from './types';

interface CohortRetentionTableProps {
  data: Cohorts | null;
}

export function CohortRetentionTable({ data }: CohortRetentionTableProps) {
  if (!data?.cohorts?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" /> Retención por Cohortes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Mes</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Clientes</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">30d</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">60d</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">90d</th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((c: Cohort) => (
                <tr key={c.month} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{c.month}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.total_clients}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {c.retention_30d != null ? `${c.retention_30d}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {c.retention_60d != null ? `${c.retention_60d}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {c.retention_90d != null ? `${c.retention_90d}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
