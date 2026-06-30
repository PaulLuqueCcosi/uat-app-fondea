import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';
import { mockCredits } from '@/modules/admin';
import type { CreditStatus } from '@/modules/admin';

const statusConfig: Record<CreditStatus, { label: string; variant: string }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  IN_ARREARS: { label: 'En mora', variant: 'warning' },
  DEFAULTED: { label: 'Default', variant: 'error' },
  SETTLED: { label: 'Liquidado', variant: 'secondary' },
};

export default async function AdminCreditsPage() {
  const credits = mockCredits;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Créditos</h1>
          <p className="text-sm text-muted-foreground">{credits.length} créditos totales</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Saldo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Mora (días)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Desembolso</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => {
                  const cfg = statusConfig[credit.status];
                  return (
                    <tr key={credit.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/credits/${credit.id}`} className="font-mono text-xs text-primary hover:underline">
                          {credit.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{credit.userName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant as any} className="text-[10px]">{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">S/ {credit.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">S/ {credit.pendingBalance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {credit.daysOverdue > 0 ? <span className="text-destructive">{credit.daysOverdue}d</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(credit.disbursedAt).toLocaleDateString('es-PE')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
