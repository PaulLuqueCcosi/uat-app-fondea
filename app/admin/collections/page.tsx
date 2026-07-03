import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, CalendarClock, CircleDollarSign, User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { mockCollections } from '@/modules/admin';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CollectionItem {
  userId: string;
  userName: string;
  phone: string;
  creditId: string;
  installmentNo: number;
  amount: number;
  mora: number;
  daysOverdue: number;
  dueDate: string;
  partialPaid?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMoraCategory(days: number): { label: string; penalty: string; variant: string } {
  if (days <= 0) return { label: 'Al día', penalty: 'S/ 0/día', variant: 'success' };
  if (days <= 3) return { label: '1-3 días', penalty: 'S/ 5/día', variant: 'warning' };
  if (days <= 14) return { label: '4-14 días', penalty: 'S/ 7/día', variant: 'error' };
  return { label: '15+ días', penalty: 'S/ 10/día', variant: 'error' };
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CollectionRow({ item }: { item: CollectionItem }) {
  const moraInfo = getMoraCategory(item.daysOverdue);

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/admin/users/${item.userId}`} className="text-sm font-medium hover:text-primary truncate">
            {item.userName}
          </Link>
          {item.daysOverdue > 0 && (
            <Badge variant={moraInfo.variant as any} className="text-[9px] shrink-0">
              {item.daysOverdue}d
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Cuota #{item.installmentNo} · Vence: {fmtDate(item.dueDate)} · {item.phone}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-mono font-medium">S/ {item.amount.toLocaleString()}</p>
        {item.mora > 0 && (
          <p className="text-xs text-destructive">+ S/ {item.mora} mora</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span title="Créditos (en desarrollo)" className="rounded p-1.5 opacity-40 cursor-not-allowed">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </span>
        <Link href={`/admin/users/${item.userId}`} title="Ver usuario" className="rounded p-1.5 hover:bg-muted transition-colors">
          <User className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminCollectionsPage() {
  const data = mockCollections;

  const totalDueToday = data.dueToday.reduce((s, i) => s + i.amount, 0);
  const totalMild = data.mildArrears.reduce((s, i) => s + i.amount + i.mora, 0);
  const totalSevere = data.severeArrears.reduce((s, i) => s + i.amount + i.mora, 0);
  const totalDefault = data.defaulted.reduce((s, i) => s + i.amount + i.mora, 0);
  const totalMoraAccumulated = [...data.mildArrears, ...data.severeArrears, ...data.defaulted].reduce((s, i) => s + i.mora, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
          <CircleDollarSign className="h-5 w-5 text-warning-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Centro de Cobranza</h1>
          <p className="text-sm text-muted-foreground">Monitoreo de cuotas y morosidad</p>
        </div>
      </div>

      {/* Resumen de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vencen hoy</p>
            <p className="text-xl font-bold mt-1">{data.dueToday.length}</p>
            <p className="text-xs text-muted-foreground">S/ {totalDueToday.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Próximos 7 días</p>
            <p className="text-xl font-bold mt-1">{data.dueNext7Days.length}</p>
            <p className="text-xs text-muted-foreground">S/ {data.dueNext7Days.reduce((s, i) => s + i.amount, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En mora</p>
            <p className="text-xl font-bold text-warning-600 mt-1">{data.mildArrears.length + data.severeArrears.length}</p>
            <p className="text-xs text-muted-foreground">S/ {(totalMild + totalSevere).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Mora acumulada</p>
            <p className="text-xl font-bold text-destructive mt-1">S/ {totalMoraAccumulated.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{data.defaulted.length} en default</p>
          </CardContent>
        </Card>
      </div>

      {/* Penalidades por rango */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Penalidades por mora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">1 a 3 días</p>
              <p className="text-lg font-bold text-warning-600 mt-1">S/ 5/día</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">4 a 14 días</p>
              <p className="text-lg font-bold text-destructive mt-1">S/ 7/día</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">15+ días</p>
              <p className="text-lg font-bold text-destructive mt-1">S/ 10/día</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de cuotas */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="today" className="text-xs">
            Hoy ({data.dueToday.length})
          </TabsTrigger>
          <TabsTrigger value="next7" className="text-xs">
            7 días ({data.dueNext7Days.length})
          </TabsTrigger>
          <TabsTrigger value="mild" className="text-xs">
            1-3d ({data.mildArrears.length})
          </TabsTrigger>
          <TabsTrigger value="severe" className="text-xs">
            4-14d ({data.severeArrears.length})
          </TabsTrigger>
          <TabsTrigger value="default" className="text-xs">
            15+d ({data.defaulted.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Cuotas que vencen hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.dueToday.length === 0
                ? <EmptyState message="No hay cuotas por vencer hoy" />
                : data.dueToday.map((item, i) => <CollectionRow key={i} item={item} />)
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="next7" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> Cuotas por vencer en los próximos 7 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.dueNext7Days.length === 0
                ? <EmptyState message="No hay cuotas próximas a vencer" />
                : data.dueNext7Days.map((item, i) => <CollectionRow key={i} item={item} />)
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mild" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning-600" /> Mora leve — 1 a 3 días (S/ 5/día)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.mildArrears.length === 0
                ? <EmptyState message="Sin clientes en mora leve" />
                : data.mildArrears.map((item, i) => <CollectionRow key={i} item={item} />)
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="severe" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Mora grave — 4 a 14 días (S/ 7/día)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.severeArrears.length === 0
                ? <EmptyState message="Sin clientes en mora grave" />
                : data.severeArrears.map((item, i) => <CollectionRow key={i} item={item} />)
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="default" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Default — 15+ días (S/ 10/día)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.defaulted.length === 0
                ? <EmptyState message="Sin clientes en default" />
                : data.defaulted.map((item, i) => <CollectionRow key={i} item={item} />)
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
