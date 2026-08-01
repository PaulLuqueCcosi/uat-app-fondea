'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable, type DataTableColumnDef, type DataTablePagination } from '@/components/admin/DataTable';
import type { FormSubmission, PageResponse } from '@/modules/admin';
import { AdminFormDataView } from './AdminFormDataView';

interface FormSubmissionsHistoryProps {
  page: PageResponse<FormSubmission>;
  formKey?: string;
}

const RESULT_LABELS: Record<string, string> = {
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PENDING: 'Pendiente',
};

/** Motivo corto para la columna — la traza completa está en el detalle. */
function rejectionSummary(sub: FormSubmission): string {
  if (sub.verificationResult === 'APPROVED' || sub.ruleOutcomes.length === 0) return '—';
  const failed = sub.ruleOutcomes.find((o) => !o.passed);
  return failed?.message ?? '—';
}

export function FormSubmissionsHistory({ page, formKey = '' }: FormSubmissionsHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);

  const pagination: DataTablePagination = {
    page: (page.number ?? 0) + 1,
    pageSize: page.size || 20,
    totalItems: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
  };

  const updateUrl = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => updateUrl('submissionsPage', String(newPage - 1)),
    [updateUrl],
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('submissionsSize', String(newSize));
      params.set('submissionsPage', '0');
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const columns: DataTableColumnDef<FormSubmission>[] = [
    {
      accessorKey: 'submittedAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">{new Date(row.original.submittedAt).toLocaleString('es-PE')}</span>
      ),
    },
    {
      accessorKey: 'verificationResult',
      header: 'Resultado',
      cell: ({ row }) => (
        <Badge variant={row.original.verificationResult === 'APPROVED' ? 'success' : 'error'} className="text-[9px]">
          {RESULT_LABELS[row.original.verificationResult] ?? row.original.verificationResult}
        </Badge>
      ),
    },
    {
      accessorKey: 'ruleOutcomes',
      header: 'Motivo',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-xs truncate block">{rejectionSummary(row.original)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Datos',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewingSubmission(row.original)}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">Historial de envíos ({pagination.totalItems})</h3>
      <DataTable
        columns={columns}
        data={page.content}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        enableExport={false}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* Modal de detalle */}
      <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              Datos del envío
              {viewingSubmission && (
                <span className="ml-2">
                  <Badge
                    variant={viewingSubmission.verificationResult === 'APPROVED' ? 'success' : 'error'}
                    className="text-[10px]"
                  >
                    {RESULT_LABELS[viewingSubmission.verificationResult] ?? viewingSubmission.verificationResult}
                  </Badge>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {viewingSubmission && (
            <div className="space-y-4">
              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Enviado: {new Date(viewingSubmission.submittedAt).toLocaleString('es-PE')}</span>
              </div>

              {/* Traza de reglas evaluadas — el motivo real de rechazo */}
              {viewingSubmission.ruleOutcomes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Reglas evaluadas:</p>
                  {viewingSubmission.ruleOutcomes.map((outcome, i) => (
                    <div
                      key={i}
                      className={
                        outcome.passed
                          ? 'rounded-lg border border-success-200 bg-success-50/50 p-3'
                          : 'rounded-lg border border-destructive/20 bg-destructive/5 p-3'
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-foreground">{outcome.ruleCode}</span>
                        <Badge variant={outcome.passed ? 'success' : 'error'} className="text-[9px]">
                          {outcome.passed ? 'OK' : 'FALLÓ'}
                        </Badge>
                      </div>
                      {outcome.message && (
                        <p className="text-sm text-foreground mt-0.5">{outcome.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Datos con el mismo formato que la vista principal */}
              <AdminFormDataView formKey={formKey} data={viewingSubmission.submissionData} bare />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
