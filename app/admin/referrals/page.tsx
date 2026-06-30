import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Target, Gift } from 'lucide-react';
import Link from 'next/link';
import { mockReferrals } from '@/modules/admin';

export default async function AdminReferralsPage() {
  const data = mockReferrals;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Programa de Referidos</h1>
          <p className="text-sm text-muted-foreground">Estadísticas y top referidores</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{data.totalCodes}</p>
            <p className="text-xs text-muted-foreground">Códigos generados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{data.totalReferred}</p>
            <p className="text-xs text-muted-foreground">Usuarios referidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success-600">+{data.totalPointsGiven}</p>
            <p className="text-xs text-muted-foreground">Puntos entregados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{data.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Tasa de conversión</p>
          </CardContent>
        </Card>
      </div>

      {/* Top referidores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-warning-500" /> Top Referidores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Código</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Referidos</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {data.topReferrers.map((ref, i) => (
                  <tr key={ref.userId} className="border-b">
                    <td className="px-4 py-2 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/users/${ref.userId}`} className="hover:text-primary">{ref.userName}</Link>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{ref.code}</td>
                    <td className="px-4 py-2 text-right font-medium">{ref.referred}</td>
                    <td className="px-4 py-2 text-right font-mono text-success-600">+{ref.pointsEarned}</td>
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
