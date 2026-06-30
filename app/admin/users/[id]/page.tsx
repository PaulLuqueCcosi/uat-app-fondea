import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { mockUserDetail } from '@/modules/admin';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch user by id from backend
  const user = mockUserDetail;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Usuarios
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">DNI: {user.dni} · {user.email} · {user.phone}</p>
        </div>
        <Badge variant="success">Activo</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="score" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="gamification">Puntos</TabsTrigger>
          <TabsTrigger value="applications">Solicitudes</TabsTrigger>
          <TabsTrigger value="referrals">Referidos</TabsTrigger>
        </TabsList>

        {/* Score Tab */}
        <TabsContent value="score" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Score Crediticio</CardTitle>
                <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Recalcular</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold text-primary">{user.score.total}</div>
                <div>
                  <Badge variant="success">{user.score.level}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Último cálculo: {new Date(user.score.lastCalculated).toLocaleDateString('es-PE')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(user.score.dimensions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-xs font-mono w-8 text-right">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gamification Tab */}
        <TabsContent value="gamification" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Puntaje Gamificado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{user.gamification.points}</p>
                  <p className="text-xs text-muted-foreground">Puntos</p>
                </div>
                <div className="text-center">
                  <Badge>{user.gamification.rank}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Rango</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">S/ {user.gamification.maxLoanAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Máx. préstamo</p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Concepto</th>
                      <th className="text-right px-3 py-2">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.gamification.history.map((h, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{h.date}</td>
                        <td className="px-3 py-2">{h.concept}</td>
                        <td className="px-3 py-2 text-right font-mono text-success-600">+{h.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Las solicitudes de este usuario se cargarán del backend.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="font-mono font-bold text-primary">{user.referrals.code}</p>
                  <p className="text-xs text-muted-foreground">Código</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{user.referrals.totalReferred}</p>
                  <p className="text-xs text-muted-foreground">Referidos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-success-600">+{user.referrals.pointsEarned}</p>
                  <p className="text-xs text-muted-foreground">Puntos ganados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
