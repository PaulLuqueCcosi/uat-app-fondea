import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, Phone, Construction, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import { mockCollections } from '@/modules/admin';

function CollectionRow({ item, showDays = false }: { item: any; showDays?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1">
        <Link href={`/admin/users/${item.userId}`} className="text-sm font-medium hover:text-primary">{item.userName}</Link>
        <p className="text-xs text-muted-foreground">{item.phone} · Cuota #{item.installmentNo}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-medium">S/ {item.amount.toLocaleString()}</p>
        {item.mora > 0 && <p className="text-xs text-destructive">+ S/ {item.mora} mora</p>}
        {showDays && <p className="text-xs text-warning-600">{item.daysOverdue}d atraso</p>}
      </div>
      <div className="flex gap-2 ml-4">
        <Link href={`/admin/users/${item.userId}`}>
          <User className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Link>
      </div>
    </div>
  );
}

export default async function AdminCollectionsPage() {
  const data = mockCollections;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
          <Phone className="h-5 w-5 text-warning-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cobranza</h1>
          <p className="text-sm text-muted-foreground">Gestión de cobros y morosidad</p>
        </div>
      </div>

      <Card className="border-dashed border-warning-300 bg-warning-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <Construction className="h-5 w-5 text-warning-600 shrink-0" />
          <p className="text-sm text-warning-700">
            El módulo de cobranza está en desarrollo. Pronto podrás registrar pagos manuales y ver detalles de créditos.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="today" className="text-xs">Vencen hoy ({data.dueToday.length})</TabsTrigger>
          <TabsTrigger value="mild" className="text-xs">Leve 1-15d ({data.mildArrears.length})</TabsTrigger>
          <TabsTrigger value="severe" className="text-xs">Grave 16-30d ({data.severeArrears.length})</TabsTrigger>
          <TabsTrigger value="default" className="text-xs">Default ({data.defaulted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Cuotas que vencen hoy</CardTitle></CardHeader>
            <CardContent>
              {data.dueToday.length === 0 ? <p className="text-sm text-muted-foreground">No hay cuotas por vencer hoy</p> : data.dueToday.map((item, i) => <CollectionRow key={i} item={item} />)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mild" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning-600" /> Morosidad leve (1-15 días)</CardTitle></CardHeader>
            <CardContent>
              {data.mildArrears.length === 0 ? <p className="text-sm text-muted-foreground">Sin clientes en mora leve</p> : data.mildArrears.map((item, i) => <CollectionRow key={i} item={item} showDays />)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="severe" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Morosidad grave (16-30 días)</CardTitle></CardHeader>
            <CardContent>
              {data.severeArrears.length === 0 ? <p className="text-sm text-muted-foreground">Sin clientes en mora grave</p> : data.severeArrears.map((item: any, i: number) => <CollectionRow key={i} item={item} showDays />)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="default" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Default (+30 días)</CardTitle></CardHeader>
            <CardContent>
              {data.defaulted.length === 0 ? <p className="text-sm text-muted-foreground">Sin clientes en default</p> : data.defaulted.map((item, i) => <CollectionRow key={i} item={item} showDays />)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
