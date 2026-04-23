'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Calendar, CreditCard, AlertCircle } from 'lucide-react';

export function FunnelContractSigned() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 md:p-12">
        {/* Success animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping"></div>
          <div className="relative bg-secondary rounded-full w-24 h-24 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-3 text-center">
          ¡Proceso Completado! 🎉
        </h1>

        <p className="text-xl text-fondea-text mb-8 text-center">
          Tu contrato ha sido firmado exitosamente
        </p>

        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-secondary/10 border-secondary/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-dark mb-1">Contrato firmado</h3>
                <p className="text-sm text-fondea-text">Tu firma digital ha sido registrada</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-primary/10 border-primary/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-dark mb-1">Desembolso programado</h3>
                <p className="text-sm text-fondea-text">En 24-48 horas hábiles</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Next steps */}
        <div className="bg-background rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            ¿Qué sigue ahora?
          </h3>
          <ol className="space-y-3">
            {[
              {
                step: '1',
                title: 'Validación final',
                desc: 'Nuestro equipo revisará tu documentación (1-2 horas)',
              },
              {
                step: '2',
                title: 'Desembolso',
                desc: 'Transferiremos el dinero a tu cuenta bancaria',
              },
              {
                step: '3',
                title: 'Confirmación',
                desc: 'Recibirás un email y SMS con los detalles',
              },
              {
                step: '4',
                title: 'Primera cuota',
                desc: 'Se cargará automáticamente el día acordado',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-dark">{item.title}</p>
                  <p className="text-sm text-fondea-text">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Download contract */}
        <Card className="p-4 bg-primary/5 border-primary/20 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold text-dark">Tu contrato firmado</p>
                <p className="text-sm text-fondea-text">Descárgalo para tus registros</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alert('Descarga simulada')}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>
        </Card>

        {/* Important note */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-8">
          <p className="text-sm text-dark text-center">
            <strong>Importante:</strong> Mantén tu cuenta bancaria activa y con fondos disponibles
            para los pagos automáticos. Recibirás un recordatorio antes de cada cuota.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={() => router.push('/dashboard/loans')} className="flex-1">
            Ver mis préstamos
          </Button>
          <Button variant="primary" onClick={() => router.push('/dashboard')} className="flex-1" size="lg">
            Ir al dashboard
          </Button>
        </div>

        <p className="text-xs text-fondea-text text-center mt-6">
          Si tienes alguna consulta, contáctanos a soporte@fondea.pe o al WhatsApp +51 999 888 777
        </p>
      </Card>
    </div>
  );
}
