'use client';

import { useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoanCalculatorPortal } from '@/components/LoanCalculator';
import { useScoreStore } from '@/lib/stores/score-store';

/**
 * Calculadora de préstamo embebida en el dashboard.
 * CTA crea una nueva intención y redirige al flujo normal (/solicitar/start).
 * Pasa el maxLoanAmount del puntaje para validación reactiva en tiempo real.
 */
export function DashboardCalculator() {
  const puntaje = useScoreStore(s => s.puntaje);
  const fetchPuntaje = useScoreStore(s => s.fetchPuntaje);

  useEffect(() => {
    fetchPuntaje();
  }, [fetchPuntaje]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Simula tu préstamo
          </span>
        </CardTitle>
        <CardDescription>
          Configura monto y plazo. Al solicitar, se creará tu intención de préstamo.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <LoanCalculatorPortal maxAmount={puntaje?.maxLoanAmount ?? null} />
      </CardContent>
    </Card>
  );
}
