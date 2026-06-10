'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calculator, Lock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Calculadora: Tu Próximo Crédito — preview en el dashboard.
 * Si hay préstamo activo: modo lectura (muestra cuánto podrá pedir).
 * Si no hay préstamo: sliders activos con botón solicitar.
 *
 * TODO: Conectar con datos reales del nivel/monto disponible.
 */

// Mock
const mockState = {
  hasActiveLoan: true,
  nextAvailableAmount: 350, // lo que podrá pedir cuando termine
  currentLevel: 'Bronce',
  nextLevel: 'Plata',
};

export function CalculatorPreview() {
  const [amount, setAmount] = useState(250);
  const [term, setTerm] = useState(30);

  const hasLoan = mockState.hasActiveLoan;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Tu Próximo Crédito
          </span>
        </CardTitle>
        <CardDescription>
          {hasLoan
            ? 'Termina de pagar tu préstamo actual para solicitar uno nuevo'
            : 'Simula cuánto necesitas y solicítalo al instante'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasLoan ? (
          /* Modo lectura — préstamo activo */
          <>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center space-y-2">
              <Lock className="w-8 h-8 text-primary/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                Al completar tu pago podrás solicitar hasta
              </p>
              <p className="text-2xl font-bold text-primary">
                S/ {mockState.nextAvailableAmount}
              </p>
              <Badge variant="outline" className="text-[10px]">
                Nivel {mockState.nextLevel}
              </Badge>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              Paga puntual para subir de nivel y desbloquear montos mayores
            </p>
          </>
        ) : (
          /* Modo activo — sin préstamo */
          <>
            {/* Slider monto */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-bold text-foreground">S/ {amount}</span>
              </div>
              <input
                type="range"
                min={100}
                max={500}
                step={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Slider plazo */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Plazo</span>
                <span className="font-bold text-foreground">{term} días</span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                step={15}
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>

            <Link href="/dashboard/calculadora" className="block">
              <Button className="w-full gap-2">
                Solicitar préstamo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
