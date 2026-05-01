'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight,
  RefreshCw, Home, FileText, Calendar
} from 'lucide-react';
import type { ApplicationRecord } from '@/lib/types';

interface ApplicationStatusViewProps {
  application: ApplicationRecord;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRetryDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ApplicationStatusView({ application }: ApplicationStatusViewProps) {
  const router = useRouter();
  const status = application.status.toUpperCase();
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';
  const canRetry = application.canRetryAt ? new Date(application.canRetryAt) <= new Date() : false;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icono de estado */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isApproved ? 'bg-green-500/10' : 'bg-destructive/10'
          }`}>
            {isApproved ? (
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive" />
            )}
          </div>

          {/* Título */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {isApproved ? '¡Tu solicitud fue aprobada!' : 'Solicitud no aprobada'}
            </h1>
            <p className="text-muted-foreground">
              {isApproved
                ? 'Felicitaciones. Ahora completa los últimos pasos para recibir tu préstamo.'
                : 'Lamentablemente tu solicitud no cumplió con los requisitos en esta ocasión.'
              }
            </p>
          </div>

          {/* Información de la solicitud */}
          <div className="w-full bg-muted/50 border border-border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ID de Solicitud</p>
                <p className="text-sm font-mono font-medium text-foreground">{application.id.slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <Badge variant={isApproved ? "success" : "destructive"}>
                  {isApproved ? 'Aprobada' : 'Rechazada'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha de envío</p>
                <p className="text-sm text-foreground">{formatDate(application.submittedAt)}</p>
              </div>
              {application.evaluatedAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fecha de evaluación</p>
                  <p className="text-sm text-foreground">{formatDate(application.evaluatedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vista APROBADA */}
          {isApproved && (
            <>
              <div className="w-full space-y-2 text-left">
                <p className="text-sm font-semibold text-foreground mb-3">Próximos pasos:</p>
                {[
                  { label: 'Verificar tu DNI', desc: 'Sube fotos de tu documento de identidad' },
                  { label: 'Verificación biométrica', desc: 'Toma una selfie para confirmar tu identidad' },
                  { label: 'Firmar el contrato', desc: 'Revisa y firma digitalmente tu contrato' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push(`/solicitudes/${application.id}/preaprobada`)}
              >
                Continuar con la verificación
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {/* Vista RECHAZADA */}
          {isRejected && (
            <>
              {/* Mensaje de reintento */}
              <div className="w-full bg-muted/50 border border-border rounded-lg p-4 text-left">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">¿Cuándo puedo volver a intentarlo?</p>
                    <p className="text-muted-foreground">
                      {application.canRetryAt ? (
                        <>
                          Podrás presentar una nueva solicitud a partir del{' '}
                          <span className="font-semibold text-foreground">
                            {formatRetryDate(application.canRetryAt)}
                          </span>.
                        </>
                      ) : (
                        'Podrás presentar una nueva solicitud en los próximos 30 días.'
                      )}
                      {' '}Te recomendamos mejorar tu perfil crediticio durante este tiempo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="w-full bg-primary/5 border border-primary/20 rounded-lg p-4 text-left">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground mb-2">Mientras tanto, puedes:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Mejorar tu score crediticio pagando deudas a tiempo</li>
                      <li>• Reducir tus deudas actuales</li>
                      <li>• Solicitar un monto menor cuando puedas reintentar</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push('/dashboard')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al dashboard
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={!canRetry}
                  onClick={() => router.push('/solicitar')}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {canRetry
                    ? 'Nueva solicitud'
                    : `Disponible el ${application.canRetryAt ? formatRetryDate(application.canRetryAt) : '...'}`
                  }
                </Button>
              </div>
            </>
          )}

          {/* Botón para ver detalles */}
          <div className="w-full pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver todas mis solicitudes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
