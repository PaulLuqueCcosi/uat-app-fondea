import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { AdminCreditFullDetail, InstallmentItem } from '@/modules/admin/admin-credit-detail.service';

interface CreditInstallmentsTableProps {
  data: AdminCreditFullDetail;
}

const STATUS_CONFIG: Record<InstallmentItem['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  CURRENT: { label: 'Activa', variant: 'default' },
  PARTIALLY_PAID: { label: 'Parcial', variant: 'warning' },
  PAID: { label: 'Pagada', variant: 'success' },
  OVERDUE: { label: 'Vencida', variant: 'destructive' },
};

export function CreditInstallmentsTable({ data }: CreditInstallmentsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Cronograma de cuotas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">#</TableHead>
              <TableHead className="text-xs">Vencimiento</TableHead>
              <TableHead className="text-xs">Monto</TableHead>
              <TableHead className="text-xs">Pagado</TableHead>
              <TableHead className="text-xs">Mora</TableHead>
              <TableHead className="text-xs">Pendiente</TableHead>
              <TableHead className="text-xs">Estado</TableHead>
              <TableHead className="text-xs">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.installments.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell className="text-xs font-mono">{inst.installment_no}</TableCell>
                <TableCell className="text-xs">{new Date(inst.due_date).toLocaleDateString('es-PE')}</TableCell>
                <TableCell className="text-xs">S/ {Number(inst.amount_due).toFixed(2)}</TableCell>
                <TableCell className="text-xs">S/ {Number(inst.amount_paid).toFixed(2)}</TableCell>
                <TableCell className="text-xs">
                  {Number(inst.penalty_accrued) > 0 ? (
                    <span className="text-red-600">S/ {Number(inst.penalty_accrued).toFixed(2)}</span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-xs font-medium">S/ {Number(inst.outstanding).toFixed(2)}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={STATUS_CONFIG[inst.status].variant}>{STATUS_CONFIG[inst.status].label}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <Link href={`/admin/credits/${data.id}/installments/${inst.installment_no}`} className="text-primary hover:underline">
                    Ver
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
