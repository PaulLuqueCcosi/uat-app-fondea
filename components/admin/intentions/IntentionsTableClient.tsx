'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Search, Eye, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import type { IntentionStatus, MockIntention } from '@/modules/admin';

const statusConfig: Record<IntentionStatus, { label: string; variant: string }> = {
  ACTIVE: { label: 'Activa', variant: 'success' },
  LOCKED: { label: 'Bloqueada', variant: 'warning' },
  CANCELLED: { label: 'Cancelada', variant: 'secondary' },
  REPLACED: { label: 'Reemplazada', variant: 'secondary' },
};

interface IntentionsTableClientProps {
  data: MockIntention[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  currentStatus?: string;
}

export function IntentionsTableClient({ data, pagination, currentStatus }: IntentionsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [viewing, setViewing] = useState<MockIntention | null>(null);

  const columns: ColumnDef<MockIntention, any>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <button onClick={() => setViewing(row.original)} className="font-mono text-xs text-primary hover:underline cursor-pointer">
          {row.original.id}
        </button>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'Cliente',
      cell: ({ row }) => (
        <Link href={`/admin/users/${row.original.userId}`} className="text-sm font-medium hover:text-primary transition-colors">
          {row.original.userName}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status];
        return <Badge variant={cfg.variant as any} className="text-[10px]">{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: 'amount',
      header: () => <span className="text-right block">Monto</span>,
      cell: ({ row }) => <span className="text-right block font-mono text-xs">S/ {row.original.amount.toLocaleString()}</span>,
    },
    {
      accessorKey: 'termDays',
      header: 'Plazo',
      cell: ({ row }) => <span className="text-xs">{row.original.termDays} días</span>,
    },
    {
      accessorKey: 'installmentCount',
      header: 'Cuotas',
      cell: ({ row }) => <span className="text-xs">{row.original.installmentCount}</span>,
    },
    {
      accessorKey: 'applicationId',
      header: 'Solicitud',
      cell: ({ row }) => row.original.applicationId ? (
        <Link href={`/admin/applications/${row.original.applicationId}`} className="font-mono text-xs text-primary hover:underline">
          {row.original.applicationId}
        </Link>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Creada',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString('es-PE')}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewing(row.original)}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const navigate = (params: URLSearchParams) => {
    router.push(`/admin/intentions?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    navigate(params);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__adminIntSearchTimeout);
    (window as any).__adminIntSearchTimeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) { params.set('q', value.trim()); params.set('page', '1'); }
      else { params.delete('q'); }
      navigate(params);
    }, 400);
  };

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) { params.set('status', status); } else { params.delete('status'); }
    params.set('page', '1');
    navigate(params);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente o ID..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <NativeSelect value={currentStatus ?? ''} onChange={(e) => handleStatusFilter(e.target.value)} className="h-9 w-40">
            <NativeSelectOption value="">Todos</NativeSelectOption>
            <NativeSelectOption value="ACTIVE">Activa</NativeSelectOption>
            <NativeSelectOption value="LOCKED">Bloqueada</NativeSelectOption>
            <NativeSelectOption value="CANCELLED">Cancelada</NativeSelectOption>
            <NativeSelectOption value="REPLACED">Reemplazada</NativeSelectOption>
          </NativeSelect>
        </div>

        <DataTable columns={columns} data={data} pagination={pagination} onPageChange={handlePageChange} />
      </div>

      {/* Modal de detalle */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono">{viewing.id}</span>
                  <Badge variant={statusConfig[viewing.status].variant as any} className="text-[10px]">
                    {statusConfig[viewing.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Cliente */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cliente</span>
                  <Link href={`/admin/users/${viewing.userId}`} className="font-medium text-primary hover:underline">
                    {viewing.userName}
                  </Link>
                </div>

                <Separator />

                {/* Datos */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold font-mono">S/ {viewing.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Monto</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{viewing.termDays}d</p>
                    <p className="text-[10px] text-muted-foreground">Plazo</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{viewing.installmentCount}</p>
                    <p className="text-[10px] text-muted-foreground">Cuotas</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primer préstamo</span>
                    <span>{viewing.isFirstLoan ? 'Sí' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creada</span>
                    <span className="text-xs">{new Date(viewing.createdAt).toLocaleString('es-PE')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actualizada</span>
                    <span className="text-xs">{new Date(viewing.updatedAt).toLocaleString('es-PE')}</span>
                  </div>
                </div>

                {/* Link a solicitud */}
                {viewing.applicationId && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Solicitud asociada</span>
                      <Link
                        href={`/admin/applications/${viewing.applicationId}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-mono"
                      >
                        {viewing.applicationId} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
