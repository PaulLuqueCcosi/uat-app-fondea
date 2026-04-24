'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormHeader } from '@/components/ui/form-header';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Home
} from 'lucide-react';

// DATOS DEMO - Información faltante o a corregir
const INFORMACION_PENDIENTE = [
  {
    seccion: 'Perfil Laboral',
    campo: 'Constancia de trabajo',
    descripcion: 'Necesitamos verificar tu situación laboral actual',
    completado: false,
    path: '/funnel/labor'
  },
  {
    seccion: 'Perfil Económico',
    campo: 'Justificación de ingresos adicionales',
    descripcion: 'Requiere documentación que respalde los ingresos declarados',
    completado: false,
    path: '/funnel/economic'
  },
  {
    seccion: 'Referencias',
    campo: 'Verificación de contactos',
    descripcion: 'Una de las referencias no pudo ser contactada',
    completado: false,
    path: '/funnel/references'
  },
  {
    seccion: 'Dirección',
    campo: 'Comprobante de domicilio',
    descripcion: 'Recibo de luz, agua o teléfono reciente (últimos 3 meses)',
    completado: true,
    path: null
  }
];

export default function MasInfoPage() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;

  const pendientes = INFORMACION_PENDIENTE.filter(item => !item.completado);
  const completadas = INFORMACION_PENDIENTE.filter(item => item.completado);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={AlertCircle}
          title="Necesitamos más información"
          description="Completa los siguientes datos para continuar con tu solicitud"
        />
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {/* Mensaje principal */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Tu solicitud está en espera</p>
              <p className="text-muted-foreground">
                Necesitamos que completes o corrijas la siguiente información para poder evaluar tu solicitud.
                Una vez completado todo, tu solicitud volverá a evaluación automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Información pendiente */}
        {pendientes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Pendiente de completar ({pendientes.length})
            </h3>

            <div className="space-y-2">
              {pendientes.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border-2 border-warning/30 bg-warning/5 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.seccion}</p>
                      <p className="text-sm text-muted-foreground">{item.campo}</p>
                    </div>
                    <Badge variant="pending">Pendiente</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.descripcion}</p>
                  {item.path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(item.path)}
                      className="w-full sm:w-auto"
                    >
                      Completar ahora
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información completada */}
        {completadas.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              Ya completado ({completadas.length})
            </h3>

            <div className="space-y-2">
              {completadas.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-border bg-secondary/5 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.seccion}</p>
                      <p className="text-sm text-muted-foreground">{item.campo}</p>
                    </div>
                    <Badge variant="success">Completo</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Importante:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Tienes 7 días para completar esta información</li>
                <li>• Puedes completar por partes, no es necesario hacerlo todo de una vez</li>
                <li>• Una vez completado, la evaluación se reanudará automáticamente</li>
                <li>• Si tienes dudas, contáctanos al (01) 999-9999</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Button>
          {pendientes.length > 0 && pendientes[0].path && (
            <Button
              onClick={() => router.push(pendientes[0].path!)}
              className="flex-1"
              size="lg"
            >
              Completar información
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
