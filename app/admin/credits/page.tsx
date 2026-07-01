import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Construction } from 'lucide-react';
import Link from 'next/link';
import { mockCredits } from '@/modules/admin';

export default async function AdminCreditsPage() {
  const credits = mockCredits;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Construction className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Créditos</h1>
          <p className="text-sm text-muted-foreground">{credits.length} créditos registrados</p>
        </div>
      </div>

      <Card className="border-dashed border-warning-300 bg-warning-50/50">
        <CardContent className="p-6 text-center">
          <Construction className="h-8 w-8 text-warning-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-warning-800">Próximamente</h3>
          <p className="text-sm text-warning-700 mt-1 max-w-md mx-auto">
            El módulo de créditos está en desarrollo. Aquí podrás gestionar préstamos activos, 
            cronogramas de cuotas, registrar pagos manuales y ver detalles de desembolso.
          </p>
        </CardContent>
      </Card>

      {/* Vista previa básica */}
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
                  const statusConfig: Record<string, { label: string; variant: string }> = {
                    ACTIVE: { label: 'Activo', variant: 'success' },
                    IN_ARREARS: { label: 'En mora', variant: 'warning' },
                    DEFAULTED: { label: 'Default', variant: 'error' },
                    SETTLED: { label: 'Liquidado', variant: 'secondary' },
                  };
                  const cfg = statusConfig[credit.status];
                  return (
                    <tr key={credit.id} className="border-b hover:bg-muted/30 transition-colors opacity-60">
                      <td className="px-4 py-3 font-mono text-xs">{credit.id}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/admin/users/${credit.userId}`} className="hover:text-primary">{credit.userName}</Link>
                      </td>
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
