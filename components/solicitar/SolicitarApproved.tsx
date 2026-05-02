'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { getApplication } from '@/app/actions/loan.actions';
import { useEffect, useState } from 'react';
import type { LoanApplication } from '@/lib/types';

export function FunnelApproved() {
  const router = useRouter();
  const [application, setApplication] = useState<LoanApplication | null>(null);

  useEffect(() => {
    const loadApp = async () => {
      const app = await getApplication();
      setApplication(app);
    };
    loadApp();
  }, []);

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-fondea-text">Cargando...</p>
        </Card>
      </div>
    );
  }

  const { simulation } = application;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 md:p-12 text-center">
        {/* Success icon with animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping"></div>
          <div className="relative bg-secondary rounded-full w-24 h-24 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-accent-900" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-3">
          ¡Felicidades! 🎉
        </h1>

        <p className="text-xl text-fondea-text mb-8">
          Tu préstamo ha sido aprobado
        </p>

        {/* Loan details */}
        <div className="bg-background rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-center gap-2 text-fondea-text mb-2">
                <DollarSign className="w-4 h-4" />
                <p className="text-sm">Monto aprobado</p>
              </div>
              <p className="text-2xl font-bold text-primary">
                S/ {simulation.amount.toLocaleString()}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 text-fondea-text mb-2">
                <Calendar className="w-4 h-4" />
                <p className="text-sm">Plazo</p>
              </div>
              <p className="text-2xl font-bold text-dark">
                {simulation.months} meses
              </p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 text-fondea-text mb-2">
                <TrendingUp className="w-4 h-4" />
                <p className="text-sm">Cuota mensual</p>
              </div>
              <p className="text-2xl font-bold text-dark">
                S/ {simulation.monthlyPayment.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-fondea-text">TEA</span>
              <span className="font-medium text-dark">{simulation.tea}%</span>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-dark mb-3">Próximos pasos:</h3>
          <ol className="space-y-2 text-sm text-dark">
            <li className="flex gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Registra tu cuenta bancaria para el desembolso</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Revisa y firma tu contrato digital</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Recibirás el dinero en 24-48 horas</span>
            </li>
          </ol>
        </div>

        <Button
          onClick={() => router.push('/solicitar/bank-account')}
          size="lg"
          className="w-full md:w-auto"
        >
          Continuar con el desembolso →
        </Button>

        <p className="text-xs text-fondea-text mt-6">
          Al continuar, aceptas los términos y condiciones del préstamo
        </p>
      </Card>
    </div>
  );
}
