'use client';

import { DollarSign, Receipt, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditPaymentActionsProps {
  data: AdminCreditFullDetail;
}

export function CreditPaymentActions({ data }: CreditPaymentActionsProps) {
  if (data.status === 'PAID_OFF') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Acciones admin
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="default" size="sm" className="gap-1.5" disabled>
          <DollarSign className="h-3.5 w-3.5" />
          Registrar pago
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" disabled>
          <Receipt className="h-3.5 w-3.5" />
          Registrar pago a cuota
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" disabled>
          <FileText className="h-3.5 w-3.5" />
          Ver contrato
        </Button>
      </CardContent>
    </Card>
  );
}
