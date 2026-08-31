'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, UserPlus, Award, Percent, Gift } from 'lucide-react';
import { DataTable, type DataTableColumnDef } from '@/components/admin/DataTable';
import type { ReferralSummary, ReferralRow } from '@/modules/admin/admin-marketing.types';
import type { Pagination } from '@/modules/admin/admin-users.types';

const columns: DataTableColumnDef<ReferralRow>[] = [
  {
    accessorKey: 'referrerName',
    header: 'Referente',
    cell: ({ row }) => (
      <span className="text-sm font-medium truncate max-w-[160px] block">
        {row.original.referrerName ?? 'Sin nombre'}
      </span>
    ),
  },
  {
    accessorKey: 'referredName',
    header: 'Referido',
    cell: ({ row }) => (
      <span className="text-sm truncate max-w-[160px] block">
        {row.original.referredName ?? 'Sin nombre'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const isCompleted = row.original.status === 'LOAN_COMPLETED';
      return (
        <Badge className={isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
          {isCompleted ? 'Primer préstamo completado' : 'Registrado'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'registeredAt',
    header: 'Registrado',
    cell: ({ row }) => (
      <span className="text-[11px] text-muted-foreground">
        {new Date(row.original.registeredAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
  {
    accessorKey: 'completedAt',
    header: 'Completado',
    cell: ({ row }) => {
      const date = row.original.completedAt;
      if (!date) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <span className="text-[11px] text-muted-foreground">
          {new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      );
    },
  },
];

interface ReferralsTabProps {
  summary: ReferralSummary | null;
  data: ReferralRow[];
  pagination: Pagination;
}

export function ReferralsTab({ summary, data, pagination }: ReferralsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback((params: URLSearchParams) => {
    startTransition(() => { router.push(`/admin/marketing?${params.toString()}`); });
  }, [router]);

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('rpage', String(newPage));
    updateUrl(params);
  }, [searchParams, updateUrl]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('rsize', String(newSize));
    params.set('rpage', '1');
    updateUrl(params);
  }, [searchParams, updateUrl]);

  return (
    <div className="space-y-6">
      {/* R40a — Resumen */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Share2 className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold">{summary.codesShared}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Códigos compartidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserPlus className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold">{summary.registrations}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Registros vía referido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-4 w-4 text-emerald-600 mx-auto mb-1.5" />
              <p className="text-xl font-bold text-emerald-700">{summary.firstLoanCompleted}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Primer préstamo recibido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Percent className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold">{summary.conversionRate.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tasa de conversión</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Gift className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold">{summary.pointsAwarded}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Puntos otorgados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* R40b — Tabla paginada */}
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isPending}
      />
    </div>
  );
}
