'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handshake, CheckCircle2, Clock, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { PaymentAgreement } from '@/modules/admin/admin-collections.types';
import type { Pagination } from '@/modules/admin/admin-users.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function getDaysLabel(days: number | null, paid: boolean): { text: string; className: string } | null {
  if (paid) return { text: 'Pagada', className: 'text-emerald-700 bg-emerald-50' };
  if (days === null) return null;
  if (days < 0) return { text: `${Math.abs(days)}d vencida`, className: 'text-red-700 bg-red-50' };
  if (days === 0) return { text: 'Vence hoy', className: 'text-amber-700 bg-amber-50' };
  if (days <= 3) return { text: `Vence en ${days}d`, className: 'text-amber-700 bg-amber-50' };
  return { text: `Vence en ${days}d`, className: 'text-muted-foreground bg-muted' };
}

// ── Componente ───────────────────────────────────────────────────────────────

interface PaymentAgreementsTableProps {
  data: PaymentAgreement[];
  pagination: Pagination;
}

export function PaymentAgreementsTable({ data, pagination }: PaymentAgreementsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => { router.push(`/admin/collections?${params.toString()}`); });
    }, [router]
  );

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'agreements');
    params.set('apage', String(newPage));
    updateUrl(params);
  }, [searchParams, updateUrl]);

  if (data.length === 0 && pagination.totalItems === 0) {
    return (
      <div className="py-12 text-center">
        <Handshake className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No hay acuerdos de pago activos</p>
        <p className="text-xs text-muted-foreground mt-1">
          Los acuerdos aparecen cuando una oferta de negociación es aceptada por el cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {pagination.totalItems} acuerdo{pagination.totalItems !== 1 ? 's' : ''} activo{pagination.totalItems !== 1 ? 's' : ''}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className="h-8 gap-2"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualizar
        </Button>
      </div>

      {/* Cards */}
      {data.map((agreement) => {
        const paidCount = agreement.installments.filter((i) => i.paid).length;
        const totalCount = agreement.installments.length;
        const shortId = agreement.agreementId.slice(0, 6);

        return (
          <Card key={agreement.agreementId} className={`overflow-hidden ${isPending ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Handshake className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="truncate">{agreement.clientName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">#{shortId}</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      DNI {agreement.clientDocument} · Total: S/ {agreement.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {paidCount}/{totalCount} cuotas
                  </Badge>
                  <Link
                    href={`/admin/credits/${agreement.creditId}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver crédito →
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {agreement.installments.map((inst) => {
                  const daysInfo = getDaysLabel(inst.daysUntilDue, inst.paid);
                  return (
                    <div
                      key={inst.installmentNo}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${inst.paid ? 'bg-emerald-50/50 border-emerald-100' : ''}`}
                    >
                      {inst.paid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : inst.daysUntilDue !== null && inst.daysUntilDue < 0 ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">
                          Cuota {inst.installmentNo}: S/ {inst.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {fmtDate(inst.dueDate)}
                        </p>
                      </div>
                      {daysInfo && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${daysInfo.className}`}>
                          {daysInfo.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isPending}
              className="h-8 w-8 p-0"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-xs font-medium tabular-nums">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isPending}
              className="h-8 w-8 p-0"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
