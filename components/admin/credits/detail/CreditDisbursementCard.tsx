import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle } from 'lucide-react';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditDisbursementCardProps {
  data: AdminCreditFullDetail;
}

export function CreditDisbursementCard({ data }: CreditDisbursementCardProps) {
  const disbursement = data.disbursement;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Desembolso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!disbursement ? (
          <p className="text-sm text-muted-foreground">Sin información de desembolso</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Monto</span>
              <span className="font-bold">S/ {Number(disbursement.amount).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Estado</span>
              <Badge variant={disbursement.status === 'COMPLETED' ? 'success' : 'warning'}>
                {disbursement.status}
              </Badge>
            </div>
            {disbursement.destination_bank && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Banco</span>
                <span className="text-sm">{disbursement.destination_bank}</span>
              </div>
            )}
            {disbursement.destination_account && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Cuenta</span>
                <span className="text-sm font-mono">{disbursement.destination_account}</span>
              </div>
            )}
            {disbursement.destination_holder && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Titular</span>
                <span className="text-sm">{disbursement.destination_holder}</span>
              </div>
            )}
            {disbursement.reference_number && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Referencia</span>
                <span className="text-sm font-mono">{disbursement.reference_number}</span>
              </div>
            )}
            {disbursement.disbursed_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Fecha</span>
                <span className="text-sm">{new Date(disbursement.disbursed_at).toLocaleString('es-PE')}</span>
              </div>
            )}
            {disbursement.failure_reason && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                {disbursement.failure_reason}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
