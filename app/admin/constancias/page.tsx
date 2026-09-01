import Link from 'next/link';
import { ShieldCheck, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertificateStatsCards } from '@/components/admin/constancias/CertificateStatsCards';
import { CertificatesTable } from '@/components/admin/constancias/CertificatesTable';
import {
  getCertificateStatsAction,
  searchCertificatesAction,
} from '@/app/actions/constancias.actions';
import type { CertificateDeliveryStatus, CertificateStatus } from '@/modules/admin/admin-constancias.types';

interface Props {
  searchParams: Promise<{
    page?: string;
    status?: string;
    deliveryStatus?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function AdminConstanciasPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status as CertificateStatus | undefined;
  const deliveryStatus = params.deliveryStatus as CertificateDeliveryStatus | undefined;

  const [stats, result] = await Promise.all([
    getCertificateStatsAction(),
    searchCertificatesAction({
      status,
      deliveryStatus,
      page: page - 1, // backend es 0-based
      size: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Constancias de No Adeudo</h1>
            <p className="text-sm text-muted-foreground">
              Documentos emitidos al liquidar créditos — por usuario, por crédito, y su estado de envío
            </p>
          </div>
        </div>
        <Link href="/admin/constancias/template">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <FileCode2 className="h-4 w-4" />
            Editar plantilla
          </Button>
        </Link>
      </div>

      <CertificateStatsCards stats={stats} />

      <CertificatesTable
        data={result.data}
        currentStatus={status ?? 'all'}
        currentDeliveryStatus={deliveryStatus ?? 'all'}
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        totalItems={result.pagination.totalItems}
      />
    </div>
  );
}
