'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { XCircle, HelpCircle, Mail } from 'lucide-react';

export function FunnelRejected() {
  const router = useRouter();

  const reasons = [
    'Tu perfil crediticio actual no cumple con nuestros criterios mínimos',
    'Los ingresos declarados no son suficientes para el monto solicitado',
    'Detectamos inconsistencias en la información proporcionada',
  ];

  const recommendations = [
    {
      icon: HelpCircle,
      title: 'Mejora tu historial crediticio',
      description: 'Paga tus deudas actuales a tiempo y mantén un buen comportamiento financiero.',
    },
    {
      icon: Mail,
      title: 'Solicita información de tu reporte',
      description: 'Puedes solicitar tu reporte crediticio en las centrales de riesgo.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 md:p-12">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-error/10 rounded-full flex items-center justify-center">
          <XCircle className="w-10 h-10 text-error" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3 text-center">
          Lo Sentimos
        </h1>

        <p className="text-lg text-fondea-text mb-8 text-center">
          En este momento no podemos aprobar tu solicitud de préstamo.
        </p>

        {/* Reasons */}
        <div className="bg-background rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-dark mb-4">Motivos de la decisión:</h3>
          <ul className="space-y-2">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-dark">
                <span className="text-error mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h3 className="font-semibold text-dark mb-4 text-center">
            ¿Qué puedes hacer?
          </h3>
          <div className="space-y-4">
            {recommendations.map((rec, idx) => {
              const Icon = rec.icon;
              return (
                <Card key={idx} className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-dark mb-1">{rec.title}</h4>
                      <p className="text-sm text-fondea-text">{rec.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info note */}
        <div className="bg-background rounded-lg p-4 mb-6">
          <p className="text-sm text-fondea-text text-center">
            Puedes volver a solicitar un préstamo en <strong className="text-dark">3 meses</strong>.
            Trabajar en mejorar tu perfil crediticio aumentará tus posibilidades de aprobación.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Volver al dashboard
          </Button>
          <Button
            variant="primary"
            onClick={() => window.open('mailto:soporte@fondea.pe?subject=Consulta sobre solicitud rechazada', '_blank')}
            className="flex-1"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contactar soporte
          </Button>
        </div>

        <p className="text-xs text-fondea-text text-center mt-6">
          Si crees que esta decisión es un error, puedes contactarnos para revisión manual.
        </p>
      </Card>
    </div>
  );
}
