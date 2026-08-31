import { Receipt } from 'lucide-react';
import { listAdminPaymentDeclarationsAction } from '@/app/actions/payment-declaration.actions';
import { PaymentDeclarationsTable } from '@/components/admin/payment-declarations/PaymentDeclarationsTable';
import type { PaymentDeclarationStatus } from '@/modules/payment-declarations';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    status?: string;
    creditId?: string;
  }>;
}

export default async function AdminPaymentDeclarationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Number(params.size) || 20;
  const status = params.status as PaymentDeclarationStatus | undefined;
  const creditId = params.creditId?.trim() || undefined;

  const result = await listAdminPaymentDeclarationsAction({
    page: page - 1,
    size: pageSize,
    status: status ? [status] : undefined,
    creditId,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const items = result.ok ? result.data.items : [];
  const pagination = result.ok
    ? {
        page,
        pageSize,
        totalItems: result.data.totalElements,
        totalPages: result.data.totalPages,
      }
    : { page, pageSize, totalItems: 0, totalPages: 0 };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Declaraciones de pago</h1>
          <p className="text-sm text-muted-foreground">
            Comprobantes de pago subidos por clientes, pendientes de revisión manual
          </p>
        </div>
      </div>

      <PaymentDeclarationsTable
        data={items}
        pagination={pagination}
        currentStatus={status ?? 'all'}
        currentCreditId={creditId ?? ''}
      />
    </div>
  );
}
