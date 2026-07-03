'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';
import type { ApplicationStatus } from '@/modules/admin';

interface ApplicationRow {
  id: string;
  userId: string;
  userName: string;
  status: ApplicationStatus;
  amount: number;
  score: number;
  submittedAt: string;
  updatedAt: string;
}

const statusConfig: Record<ApplicationStatus, { label: string; variant: string }> = {
  SUBMITTED: { label: 'Enviada', variant: 'secondary' },
  PROCESSING: { label: 'Evaluando', variant: 'default' },
  PRE_APPROVED: { label: 'Pre-aprobada', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  BLOCKED: { label: 'Bloqueada', variant: 'error' },
  FAILED: { label: 'Fallida', variant: 'error' },
  EXPIRED: { label: 'Expirada', variant: 'secondary' },
};

const columns: ColumnDef<ApplicationRow, any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <Link href={`/admin/applications/${row.original.id}`} className="font-mono text-xs text-primary hover:underline">
        {row.original.id}
      </Link>
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
    cell: ({ row }) => (
      <span className="text-right block font-mono text-xs">S/ {row.original.amount.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'score',
    header: () => <span className="text-right block">Score</span>,
    cell: ({ row }) => (
      <span className="text-right block font-mono text-xs">{row.original.score}</span>
    ),
  },
  {
    accessorKey: 'submittedAt',
    header: 'Enviada',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{new Date(row.original.submittedAt).toLocaleDateString('es-PE')}</span>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Actualizada',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{new Date(row.original.updatedAt).toLocaleDateString('es-PE')}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const app = row.original;
      const cfg = statusConfig[app.status];
      return (
        <Dialog>
          <DialogTrigger className="rounded p-1.5 hover:bg-muted transition-colors" aria-label={`Ver resumen de solicitud ${app.id}`}>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resumen de solicitud</DialogTitle>
              <DialogDescription className="font-mono text-xs">{app.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cliente</span>
                <span className="text-sm font-medium">{app.userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monto</span>
                <span className="text-sm font-bold">S/ {app.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-sm font-mono font-medium">{app.score || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fecha de envío</span>
                <span className="text-sm">
                  {new Date(app.submittedAt).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última actualización</span>
                <span className="text-sm">
                  {new Date(app.updatedAt).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    },
  },
];

interface ApplicationsTableClientProps {
  data: ApplicationRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function ApplicationsTableClient({ data, pagination }: ApplicationsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/admin/applications?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__adminAppSearchTimeout);
    (window as any).__adminAppSearchTimeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
        params.set('page', '1');
      } else {
        params.delete('q');
      }
      router.push(`/admin/applications?${params.toString()}`);
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o ID..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
