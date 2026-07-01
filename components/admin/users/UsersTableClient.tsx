'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface UserRow {
  id: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  maxLoanAmount: number | null;
  registeredAt: string;
}

const columns: ColumnDef<UserRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
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
    accessorKey: 'dni',
    header: 'DNI',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.dni}</span>,
  },
  {
    accessorKey: 'phone',
    header: 'Celular',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.phone}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: 'maxLoanAmount',
    header: () => <span className="text-right block">Máx. Préstamo</span>,
    cell: ({ row }) => (
      <span className="text-right block font-mono text-xs">
        {row.original.maxLoanAmount ? `S/ ${row.original.maxLoanAmount.toLocaleString()}` : '—'}
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
  data: UserRow[];
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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce: navega después de 400ms sin escribir
    clearTimeout((window as any).__adminSearchTimeout);
    (window as any).__adminSearchTimeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
        params.set('page', '1');
      } else {
        params.delete('q');
      }
      router.push(`/admin/users?${params.toString()}`);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, DNI, celular o email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
