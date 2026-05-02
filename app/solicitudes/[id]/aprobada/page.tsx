'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormHeader } from '@/components/ui/form-header';
import {
  CheckCircle2,
  PartyPopper,
  DollarSign,
  Clock,
  Building2,
  Home,
  Download
} from 'lucide-react';

// DATOS DEMO
const DEMO_APROBACION = {
  monto: 5000,
  plazo: 12,
  cuotaMensual: 478.50,
  fechaDesembolso: '26 de Abril, 2024',
  estadoDesembolso: 'EN_PROCESO', // EN_PROCESO | COMPLETADO
  banco: 'BCP',
  cciDestino: '••••••••••••3456',
  contratoUrl: '/documents/contrato-12345.pdf'
};

export default function AprobadaPage() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={PartyPopper}
            title="¡Felicitaciones! Tu préstamo fue aprobado"
            description="Tu dinero está en camino"
          />
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Estado del desembolso */}
          <Card className="border-2 border-secondary/30 bg-secondary/5">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Estado del desembolso</h3>
                {DEMO_APROBACION.estadoDesembolso === 'EN_PROCESO' ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-warning-50 border border-warning-100 rounded-full">
                    <Clock className="w-4 h-4 text-warning-700" />
                    <span className="text-sm font-medium text-warning-700">En proceso</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary/20 border border-secondary rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium text-foreground">Completado</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-dark" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Contrato firmado</p>
                    <p className="text-xs text-muted-foreground">Completado</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    DEMO_APROBACION.estadoDesembolso === 'COMPLETADO'
                      ? 'bg-secondary'
                      : 'bg-warning-50 border-2 border-warning-400'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      DEMO_APROBACION.estadoDesembolso === 'COMPLETADO'
                        ? 'text-dark'
                        : 'text-warning-700'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Desembolso a tu cuenta</p>
                    <p className="text-xs text-muted-foreground">
                      {DEMO_APROBACION.estadoDesembolso === 'COMPLETADO'
                        ? 'Completado'
                        : `Estimado: ${DEMO_APROBACION.fechaDesembolso}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-secondary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Destino: {DEMO_APROBACION.banco} {DEMO_APROBACION.cciDestino}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Resumen del préstamo */}
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Resumen de tu préstamo</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monto aprobado</p>
                  <p className="text-lg font-bold text-foreground">
                    S/ {DEMO_APROBACION.monto.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plazo</p>
                  <p className="text-lg font-bold text-foreground">
                    {DEMO_APROBACION.plazo} meses
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cuota mensual</p>
                  <p className="text-lg font-bold text-foreground">
                    S/ {DEMO_APROBACION.cuotaMensual.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Primera cuota</p>
                  <p className="text-lg font-bold text-foreground">
                    26 May 2024
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(DEMO_APROBACION.contratoUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar contrato
              </Button>
            </div>
          </Card>

          {/* Próximos pasos */}
          <Card className="bg-primary/5 border-primary/20">
            <div className="p-6 space-y-3">
              <h3 className="font-semibold text-foreground">¿Qué sigue?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">1.</span>
                  <span>Recibirás el dinero en tu cuenta en las próximas 24-48 horas</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">2.</span>
                  <span>Te enviaremos un email con el cronograma de pagos</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">3.</span>
                  <span>Podrás ver tus cuotas y hacer pagos desde tu dashboard</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">4.</span>
                  <span>Recuerda pagar a tiempo para mantener tu buen historial crediticio</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Botón de acción */}
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir a mi dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
