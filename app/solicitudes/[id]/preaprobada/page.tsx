'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormHeader } from '@/components/ui/form-header';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  DollarSign,
  Calendar,
  Percent,
  AlertCircle,
  ArrowRight,
  X,
  FileText,
  Camera,
  PenLine
} from 'lucide-react';

// DATOS DEMO
const DEMO_SOLICITUD = {
  monto: 5000,
  plazo: 12,
  cuotaMensual: 478.50,
  tea: 51.1,
  tcea: 65.3,
  fechaAprobacion: '2024-04-24',
  montoTotal: 5742
};

export default function PreaprobadaPage() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleContinue = () => {
    // Ir al primer paso: KYC Documentos
    router.push(`/solicitudes/${solicitudId}/kyc-documentos`);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      // TODO: Llamar API para cancelar solicitud
      // await cancelApplication(solicitudId);

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error al cancelar:', error);
      setCancelling(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={CheckCircle2}
            title="¡Tu solicitud está preaprobada!"
            description="Completa los siguientes pasos para recibir tu préstamo"
          />
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Resumen de la solicitud */}
          <Card className="border-2 border-secondary/30 bg-secondary/5">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-secondary" />
                Detalles de tu préstamo
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monto aprobado</p>
                  <p className="text-xl font-bold text-foreground">
                    S/ {DEMO_SOLICITUD.monto.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plazo</p>
                  <p className="text-xl font-bold text-foreground">
                    {DEMO_SOLICITUD.plazo} meses
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cuota mensual</p>
                  <p className="text-xl font-bold text-foreground">
                    S/ {DEMO_SOLICITUD.cuotaMensual.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">TEA</p>
                  <p className="text-xl font-bold text-foreground">
                    {DEMO_SOLICITUD.tea}%
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-secondary/20">
                <p className="text-xs text-muted-foreground">
                  Monto total a pagar: <span className="font-semibold text-foreground">S/ {DEMO_SOLICITUD.montoTotal.toLocaleString()}</span>
                  {' • '}
                  TCEA: <span className="font-semibold text-foreground">{DEMO_SOLICITUD.tcea}%</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Próximos pasos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Próximos pasos para completar:</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">1. Verificar tu identidad (DNI)</p>
                  <p className="text-sm text-muted-foreground">Sube fotos de tu DNI (adelante y atrás)</p>
                </div>
                <Badge variant="pending">Pendiente</Badge>
              </div>

              <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">2. Verificación biométrica</p>
                  <p className="text-sm text-muted-foreground">Toma una selfie para confirmar tu identidad</p>
                </div>
                <Badge variant="pending">Pendiente</Badge>
              </div>

              <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">3. Firmar el contrato</p>
                  <p className="text-sm text-muted-foreground">Revisa y firma digitalmente tu contrato</p>
                </div>
                <Badge variant="pending">Pendiente</Badge>
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">Importante:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Completa estos pasos en los próximos 7 días</li>
                  <li>• Ten a la mano tu DNI físico</li>
                  <li>• Asegúrate de estar en un lugar bien iluminado</li>
                  <li>• Una vez firmado, el dinero se desembolsará en 24-48 horas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(true)}
              className="flex-1"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar solicitud
            </Button>
            <Button
              onClick={handleContinue}
              className="flex-1"
              size="lg"
            >
              Continuar con la verificación
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">¿Cancelar solicitud?</h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Si cancelas esta solicitud, perderás la preaprobación y tendrás que volver a solicitar desde el inicio.
              </p>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1"
                >
                  {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
