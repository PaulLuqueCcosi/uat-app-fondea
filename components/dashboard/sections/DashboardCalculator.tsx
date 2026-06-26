'use client';

import { Calculator } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoanCalculatorPortal } from '@/components/LoanCalculator';

/**
 * Calculadora de préstamo embebida en el dashboard.
 * CTA crea una nueva intención y redirige al flujo normal (/solicitar/start).
 */
export function DashboardCalculator() {
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
        <LoanCalculatorPortal />
      </CardContent>
    </Card>
  );
}
