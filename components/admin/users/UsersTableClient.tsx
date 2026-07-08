'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { AdminUserRow } from '@/modules/admin';

const columns: ColumnDef<AdminUserRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre completo',
    cell: ({ row }) => (
      <Link href={`/admin/users/${row.original.id}`} className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
          {row.original.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
        </div>
        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
          {row.original.name}
        </span>
      </Link>
    ),
  },
  {
    accessorKey: 'documentType',
    header: 'Tipo Doc.',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.documentType ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'documentNumber',
    header: 'Nro. Documento',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.documentNumber ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'registeredAt',
    header: 'Registro',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.original.registeredAt).toLocaleDateString('es-PE')}
      </span>
    ),
  },
];

interface UsersTableClientProps {
  data: AdminUserRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function UsersTableClient({ data, pagination }: UsersTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__adminSearchTimeout);
    (window as any).__adminSearchTimeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
        params.set('page', '1');
      } else {
        params.delete('q');
      }
      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    }, 400);
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Buscador + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="h-9 gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isPending}
      />
    </div>
  );
}
