import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { mockInstallments } from '@/modules/admin';
import type { InstallmentStatus } from '@/modules/admin';

const installmentColors: Record<InstallmentStatus, string> = {
  PENDING: 'secondary',
  ACTIVE: 'default',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
};

export default async function AdminCreditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // TODO: fetch from backend
  const credit = { id, userName: 'María García López', userId: 'usr_001', status: 'ACTIVE', amount: 3000, totalToPay: 3450, paid: 1150, pendingBalance: 2300, mora: 0, installments: 6, disbursedAt: '2026-06-17' };

  const progress = Math.round((credit.paid / credit.totalToPay) * 100);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl">
      <Link href="/admin/credits" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Créditos
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{credit.id}</h1>
            <Badge variant="success">ACTIVO</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            <Link href={`/admin/users/${credit.userId}`} className="hover:text-primary">{credit.userName}</Link> · Desembolsado: {credit.disbursedAt}
          </p>
        </div>
        <Button size="sm"><DollarSign className="h-3.5 w-3.5 mr-1" /> Registrar pago</Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">S/ {credit.amount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Monto original</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">S/ {credit.paid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total pagado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">S/ {credit.pendingBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{progress}%</p>
            <p className="text-xs text-muted-foreground">Avance</p>
            <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cronograma */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cronograma de Cuotas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Vencimiento</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Pagado</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Mora</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Pagado el</th>
                </tr>
              </thead>
              <tbody>
                {mockInstallments.map((inst) => (
                  <tr key={inst.number} className="border-b">
                    <td className="px-4 py-2 font-mono">{inst.number}</td>
                    <td className="px-4 py-2">{inst.dueDate}</td>
                    <td className="px-4 py-2 text-right font-mono">S/ {inst.amount}</td>
                    <td className="px-4 py-2 text-right font-mono">S/ {inst.paid}</td>
                    <td className="px-4 py-2 text-right font-mono">{inst.mora > 0 ? `S/ ${inst.mora}` : '—'}</td>
                    <td className="px-4 py-2">
                      <Badge variant={installmentColors[inst.status] as any} className="text-[10px]">
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {inst.paidAt ? new Date(inst.paidAt).toLocaleDateString('es-PE') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
