'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { AlertCircle, FileText, User, DollarSign } from 'lucide-react';

export function FunnelMoreInfo() {
  const router = useRouter();

  const missingInfo = [
    {
      icon: User,
      title: 'Verificación de identidad',
      description: 'Necesitamos que completes la verificación biométrica',
      action: () => router.push('/funnel/kyc-selfie'),
    },
    {
      icon: DollarSign,
      title: 'Información financiera',
      description: 'Requiere más detalles sobre tus ingresos y gastos',
      action: () => router.push('/dashboard/section/economic'),
    },
    {
      icon: FileText,
      title: 'Documentación adicional',
      description: 'Necesitamos validar algunos documentos',
      action: () => router.push('/dashboard'),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 md:p-12">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-warning/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-warning" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3 text-center">
          Necesitamos más Información
        </h1>

        <p className="text-lg text-fondea-text mb-8 text-center">
          Estamos revisando tu solicitud, pero necesitamos que completes algunos datos adicionales
          para poder evaluarla correctamente.
        </p>

        {/* Missing info list */}
        <div className="space-y-4 mb-8">
          {missingInfo.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={item.action}
                className="cursor-pointer"
              >
                <Card className="p-4 border-2 border-warning/20 hover:border-warning/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark mb-1">{item.title}</h3>
                      <p className="text-sm text-fondea-text">{item.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={item.action}>
                      Completar →
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-dark text-center">
            <strong>Nota:</strong> Una vez completes la información, reanudaremos la evaluación
            de tu solicitud. Recibirás una notificación con el resultado.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Volver al dashboard
          </Button>
          <Button
            onClick={() => router.push('/dashboard/section/economic')}
            className="flex-1"
          >
            Completar información
          </Button>
        </div>
      </Card>
    </div>
  );
}
