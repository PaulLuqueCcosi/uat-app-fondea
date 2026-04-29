'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormHeader } from '@/components/ui/form-header';
import {
  XCircle,
  AlertCircle,
  Home,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

// DATOS DEMO - Motivos del rechazo
const MOTIVOS_RECHAZO = [
  {
    titulo: 'Historial crediticio',
    descripcion: 'Tu score crediticio actual no cumple con nuestros requisitos mínimos.'
  },
  {
    titulo: 'Capacidad de pago insuficiente',
    descripcion: 'Según tu perfil económico, la cuota mensual supera el 40% de tus ingresos.'
  },
  {
    titulo: 'Información incompleta',
    descripcion: 'Algunos datos proporcionados no pudieron ser verificados.'
  }
];

export default function RechazadaPage() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={XCircle}
          title="Solicitud no aprobada"
          description="Lamentablemente tu solicitud no fue aprobada en esta ocasión"
        />
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {/* Motivos del rechazo */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Motivos de la decisión:</h3>

          <div className="space-y-3">
            {MOTIVOS_RECHAZO.map((motivo, index) => (
              <div
                key={index}
                className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg"
              >
                <p className="font-medium text-foreground mb-1">{motivo.titulo}</p>
                <p className="text-sm text-muted-foreground">{motivo.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-2">¿Qué puedes hacer?</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Mejora tu score crediticio pagando tus deudas a tiempo</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Reduce tus deudas actuales para mejorar tu capacidad de pago</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Vuelve a solicitar en 3 meses con un perfil mejorado</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Intenta con un monto menor o un plazo más largo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Educación financiera */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-3">Recursos que pueden ayudarte:</h4>
          <div className="space-y-2">
            {[
              { title: 'Cómo mejorar tu score crediticio', time: '5 min' },
              { title: 'Gestiona mejor tus deudas', time: '7 min' },
              { title: 'Tips para aumentar tu capacidad de pago', time: '4 min' }
            ].map((resource, index) => (
              <button
                key={index}
                className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted rounded-lg transition-colors text-left"
                onClick={() => {/* TODO: Link a educación financiera */}}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">Lectura de {resource.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Si tienes dudas sobre esta decisión o deseas apelar, contáctanos a{' '}
            <a href="mailto:soporte@fondea.pe" className="text-primary font-medium hover:underline">
              soporte@fondea.pe
            </a>
            {' '}o al{' '}
            <a href="tel:+51999999999" className="text-primary font-medium hover:underline">
              (01) 999-9999
            </a>
          </p>
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
          <Button
            onClick={() => router.push('/solicitar/labor')}
            className="flex-1"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar nueva solicitud
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
