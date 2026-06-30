import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Unlock, CheckCircle2, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // TODO: fetch from backend
  const app = {
    id, userName: 'María García López', userId: 'usr_001', status: 'PRE_APPROVED',
    amount: 3000, termDays: 30, installments: 3, score: 720,
    submittedAt: '2026-06-15T10:00:00Z',
    timeline: [
      { event: 'Solicitud recibida', date: '2026-06-15T10:00:00Z' },
      { event: 'Validación de negocio OK', date: '2026-06-15T10:01:00Z' },
      { event: 'Score calculado: 720 (BUENO)', date: '2026-06-15T10:02:00Z' },
      { event: 'Estado: PRE_APPROVED', date: '2026-06-15T10:02:30Z' },
    ],
    forms: [
      { name: 'KYC (Identidad)', completed: true, date: '2026-06-14' },
      { name: 'Laboral', completed: true, date: '2026-06-14' },
      { name: 'Económico', completed: true, date: '2026-06-14' },
      { name: 'Referencias', completed: true, date: '2026-06-15' },
      { name: 'Dirección', completed: true, date: '2026-06-15' },
      { name: 'Cuenta bancaria', completed: true, date: '2026-06-15' },
    ],
    documents: [
      { name: 'DNI Frontal', status: 'verified' },
      { name: 'DNI Reverso', status: 'pending' },
      { name: 'Selfie', status: 'pending' },
    ],
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl">
      <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Solicitudes
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{app.id}</h1>
            <Badge variant="warning">PRE-APROBADA</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            <Link href={`/admin/users/${app.userId}`} className="hover:text-primary">{app.userName}</Link> · S/ {app.amount.toLocaleString()} · {app.termDays} días · {app.installments} cuotas
          </p>
        </div>
      </div>

      {/* Acciones admin */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm"><Unlock className="h-3.5 w-3.5 mr-1" /> Desbloquear</Button>
          <Button variant="outline" size="sm"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar documento</Button>
          <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Recalcular score</Button>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30"><XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar</Button>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30"><Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formularios */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Formularios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {app.forms.map((f) => (
              <div key={f.name} className="flex items-center justify-between text-sm">
                <span>{f.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{f.date}</span>
                  {f.completed ? <CheckCircle2 className="h-4 w-4 text-success-600" /> : <span className="text-xs text-warning-600">⏳</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {app.documents.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span>{d.name}</span>
                <Badge variant={d.status === 'verified' ? 'success' : 'warning'} className="text-[10px]">
                  {d.status === 'verified' ? 'Verificado' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historial de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {app.timeline.map((event, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm">{event.event}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString('es-PE')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
