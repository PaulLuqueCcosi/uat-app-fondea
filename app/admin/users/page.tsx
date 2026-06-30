import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import Link from 'next/link';
import { mockUsers } from '@/modules/admin';

export default async function AdminUsersPage() {
  const users = mockUsers;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Usuarios</h1>
            <p className="text-sm text-muted-foreground">{users.length} usuarios registrados</p>
          </div>
        </div>

        {/* Search (placeholder — futuro filtro real) */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o DNI..." className="pl-9 h-9" />
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">DNI</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contacto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empleo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ingreso</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Puntaje</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Máx. Préstamo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">KYC</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expediente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                    {/* Nombre + avatar */}
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                          {user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    {/* DNI */}
                    <td className="px-4 py-3 font-mono text-xs">{user.dni}</td>
                    {/* Contacto */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.phone}</td>
                    {/* Empleo */}
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">{user.employment ?? '—'}</Badge>
                    </td>
                    {/* Ingreso */}
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {user.monthlyIncome ? `S/ ${user.monthlyIncome.toLocaleString()}` : '—'}
                    </td>
                    {/* Puntaje */}
                    <td className="px-4 py-3 text-right font-mono text-xs font-medium">
                      {user.points ?? '—'}
                    </td>
                    {/* Máx préstamo */}
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {user.maxLoanAmount ? `S/ ${user.maxLoanAmount.toLocaleString()}` : '—'}
                    </td>
                    {/* KYC */}
                    <td className="px-4 py-3">
                      <Badge variant={user.kycStatus === 'VERIFIED' ? 'success' : user.kycStatus === 'PENDING' ? 'warning' : 'secondary'} className="text-[10px]">
                        {user.kycStatus === 'VERIFIED' ? '✓' : user.kycStatus === 'PENDING' ? '⏳' : '—'}
                      </Badge>
                    </td>
                    {/* Expediente progress */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${user.profileProgress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{user.profileProgress}%</span>
                      </div>
                    </td>
                    {/* Registro */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(user.registeredAt).toLocaleDateString('es-PE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
