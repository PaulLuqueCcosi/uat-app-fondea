'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Users, Copy, Check, MessageCircle, Gift, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getReferralData, getReferralsList } from '@/app/actions/referrals.actions';
import type { Referral, ReferralSummary } from '@/modules/referrals';
import { referralStatusLabels } from '@/modules/referrals';
import type { ReferralStatus } from '@/modules/referrals';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Columnas de la tabla ──────────────────────────────────────────────────────

const statusVariants: Record<ReferralStatus, 'success' | 'warning' | 'pending'> = {
  LOAN_COMPLETED: 'success',
  ACTIVE: 'warning',
  REGISTERED: 'pending',
};

const statusDescriptions: Record<ReferralStatus, string> = {
  REGISTERED: 'Tu amigo se registró en la plataforma',
  ACTIVE: 'Tu amigo tiene un crédito en curso',
  LOAN_COMPLETED: 'Tu amigo completó su primer crédito',
};

const columns: ColumnDef<Referral>[] = [
  {
    accessorKey: 'registeredAt',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.original.registeredAt)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariants[status] ?? 'pending'}>
          {referralStatusLabels[status] ?? status}
        </Badge>
      );
    },
  },
  {
    id: 'description',
    header: 'Descripción',
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {statusDescriptions[row.original.status] ?? ''}
      </span>
    ),
  },
  {
    accessorKey: 'pointsAwarded',
    header: () => <div className="text-right">Puntos</div>,
    cell: ({ row }) => (
      <div className={`text-right text-sm font-bold ${row.original.pointsAwarded > 0 ? 'text-accent-600' : 'text-muted-foreground'}`}>
        {row.original.pointsAwarded > 0 ? `+${row.original.pointsAwarded}` : '—'}
      </div>
    ),
  },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function ReferidosClient() {
  const [summary, setSummary] = React.useState<ReferralSummary | null>(null);
  const [referrals, setReferrals] = React.useState<Referral[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reloading, setReloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [summaryResult, listResult] = await Promise.all([
      getReferralData(),
      getReferralsList(),
    ]);
    if (summaryResult.ok) {
      setSummary(summaryResult.data);
    } else {
      setError(summaryResult.error.message);
    }
    if (listResult.ok) {
      setReferrals(listResult.data);
    }
    setLoading(false);
  }, []);

  const reload = React.useCallback(async () => {
    setReloading(true);
    setError(null);
    const [summaryResult, listResult] = await Promise.all([
      getReferralData(),
      getReferralsList(),
    ]);
    if (summaryResult.ok) {
      setSummary(summaryResult.data);
    } else {
      setError(summaryResult.error.message);
    }
    if (listResult.ok) {
      setReferrals(listResult.data);
    }
    setReloading(false);
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const handleCopyCode = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!summary) return;
    const message = encodeURIComponent(
      `¡Solicita tu préstamo en FONDEA! Usa mi código ${summary.code} y ambos ganamos puntos para el Pasaporte Financiero. ${summary.link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const table = useReactTable({
    data: referrals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ── Loading state ──
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-60" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /></CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-64 mb-4 rounded-md" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-error-700 mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>Reintentar</Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ─── Columna izquierda: Instrucciones + Código ─── */}
      <div className="flex flex-col gap-4">
        {/* Cómo funciona */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                ¿Cómo funciona?
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-foreground">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-50 text-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span>Comparte tu código con un amigo</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-50 text-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span>Tu amigo se registra y solicita su primer préstamo</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-50 text-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span>Ambos ganan <strong>{summary.pointsPerReferral} puntos</strong> para el Pasaporte Financiero</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Código + acciones */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Tu código de referido
              </span>
            </CardTitle>
            <CardDescription>
              Comparte este código con tus amigos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Código */}
            <div className="flex items-center gap-2 rounded-lg bg-accent-50 border border-accent-200 px-4 py-3">
              <code className="text-lg font-bold text-accent-900 tracking-wider flex-1">
                {summary.code}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-1.5 shrink-0">
                {copiedCode ? <Check className="w-3.5 h-3.5 text-accent-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            {/* Link */}
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
              <span className="text-xs text-muted-foreground truncate flex-1">{summary.link}</span>
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 shrink-0">
                {copiedLink ? <Check className="w-3.5 h-3.5 text-accent-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            {/* WhatsApp */}
            <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={handleShareWhatsApp}>
              <MessageCircle className="w-4 h-4" />
              Compartir por WhatsApp
            </Button>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center rounded-md border border-border p-2">
                <p className="text-lg font-bold text-foreground">{summary.totalReferrals}</p>
                <p className="text-[10px] text-muted-foreground">Referidos</p>
              </div>
              <div className="text-center rounded-md border border-accent-200 bg-accent-50 p-2">
                <p className="text-lg font-bold text-accent-700">{summary.completedReferrals}</p>
                <p className="text-[10px] text-accent-800">Completados</p>
              </div>
              <div className="text-center rounded-md border border-primary-200 bg-primary-50 p-2">
                <p className="text-lg font-bold text-primary">{summary.totalPointsEarned}</p>
                <p className="text-[10px] text-primary-700">Puntos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Columna derecha: Tabla de referidos ─── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Tus referidos
            </span>
          </CardTitle>
          <CardDescription>
            {referrals.length} {referrals.length === 1 ? 'amigo referido' : 'amigos referidos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recargar */}
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={reload} disabled={reloading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {reloading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      Aún no tienes referidos. ¡Comparte tu código!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {referrals.length} resultado{referrals.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
