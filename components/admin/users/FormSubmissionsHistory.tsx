'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ShieldCheck, Clock } from 'lucide-react';
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
  /** Info de la verificación activa para indicar cuál envío la generó */
  activeVerification?: {
    verifiedAt: string | null;
    expiresAt: string | null;
  } | null;
}

const RESULT_LABELS: Record<string, string> = {
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PENDING: 'Pendiente',
};

function rejectionSummary(sub: FormSubmission): string {
  if (sub.verificationResult === 'APPROVED' || sub.ruleOutcomes.length === 0) return '—';
  const failed = sub.ruleOutcomes.find((o) => !o.passed);
  return failed?.message ?? '—';
}

export function FormSubmissionsHistory({ page, formKey = '', activeVerification }: FormSubmissionsHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);

  const pagination: DataTablePagination = {
    page: (page.number ?? 0) + 1,
    pageSize: page.size || 20,
    totalItems: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('submissionsPage', String(newPage - 1));
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
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

  // El primer envío APPROVED en la primera página es la verificación activa
  const activeSubmissionId = page.content.find(
    (s) => s.verificationResult === 'APPROVED'
  )?.id;

  const columns: DataTableColumnDef<FormSubmission>[] = [
    {
      accessorKey: 'submittedAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">
          {new Date(row.original.submittedAt).toLocaleString('es-PE')}
        </span>
      ),
    },
    {
      accessorKey: 'verificationResult',
      header: 'Resultado',
      cell: ({ row }) => {
        const isActive = row.original.id === activeSubmissionId && activeVerification;
        return (
          <div className="flex items-center gap-1.5">
            <Badge
              variant={row.original.verificationResult === 'APPROVED' ? 'success' : 'error'}
              className="text-[9px]"
            >
              {RESULT_LABELS[row.original.verificationResult] ?? row.original.verificationResult}
            </Badge>
            {isActive && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-success-700 font-medium">
                <ShieldCheck className="h-3 w-3" />
                Vigente
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'ruleOutcomes',
      header: 'Motivo',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-xs truncate block">
          {rejectionSummary(row.original)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setViewingSubmission(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  // Determinar si el envío en el modal es la verificación activa
  const isViewingActive = viewingSubmission?.id === activeSubmissionId && !!activeVerification;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">
        Historial de envíos ({pagination.totalItems})
      </h3>
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
            <DialogTitle className="text-base flex items-center gap-2">
              Detalle del envío
              {viewingSubmission && (
                <Badge
                  variant={viewingSubmission.verificationResult === 'APPROVED' ? 'success' : 'error'}
                  className="text-[10px]"
                >
                  {RESULT_LABELS[viewingSubmission.verificationResult] ?? viewingSubmission.verificationResult}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {viewingSubmission && (
            <div className="space-y-4">
              {/* Meta */}
              <div className="text-xs text-muted-foreground">
                Enviado: {new Date(viewingSubmission.submittedAt).toLocaleString('es-PE')}
              </div>

              {/* Si es la verificación activa → panel de vigencia */}
              {isViewingActive && activeVerification && (
                <div className="rounded-lg border border-success-200 bg-success-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success-600" />
                    <p className="text-sm font-semibold text-success-700">
                      Este envío es la verificación vigente
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {activeVerification.verifiedAt && (
                      <div>
                        <span className="text-muted-foreground">Verificado el</span>
                        <p className="font-medium text-foreground">
                          {new Date(activeVerification.verifiedAt).toLocaleDateString('es-PE', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                    {activeVerification.expiresAt && (
                      <div>
                        <span className="text-muted-foreground">Vigente hasta</span>
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(activeVerification.expiresAt).toLocaleDateString('es-PE', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Envío aprobado pero no vigente (reemplazado) */}
              {viewingSubmission.verificationResult === 'APPROVED' && !isViewingActive && (
                <div className="rounded-lg border border-muted bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    Este envío fue aprobado pero ya fue reemplazado por uno posterior.
                  </p>
                </div>
              )}

              {/* Reglas evaluadas (rechazos) */}
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

              {/* Datos del formulario */}
              <div>
                <p className="text-xs font-medium text-foreground mb-2">Datos enviados:</p>
                <AdminFormDataView formKey={formKey} data={viewingSubmission.submissionData} bare />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
