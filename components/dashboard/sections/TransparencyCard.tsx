'use client';

import { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Transparencia FONDEA — Simulador de mora.
 * Muestra claramente las consecuencias de atrasarse.
 * Deslizador interactivo: días de atraso = penalidad.
 *
 * TODO: Conectar fórmula real de penalidades.
 */

const consequences = [
  { days: 1, label: 'Penalidad económica automática', severity: 'low' },
  { days: 5, label: 'Reporte a Sentinel (afecta tu score)', severity: 'medium' },
  { days: 15, label: 'Bloqueo de línea + pérdida de nivel', severity: 'high' },
  { days: 30, label: 'Calificación SBS cambia a CPP', severity: 'critical' },
];

export function TransparencyCard() {
  const [daysLate, setDaysLate] = useState(0);

  // Mock: penalidad = S/ 5 por día sobre cuota de S/ 375
  const penaltyPerDay = 5;
  const penalty = daysLate * penaltyPerDay;

  const activeSeverity = consequences.filter((c) => daysLate >= c.days);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Transparencia FONDEA
          </span>
        </CardTitle>
        <CardDescription>
          Sin letras pequeñas: esto es lo que pasa si te atrasas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Simulador de días de atraso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="days-late" className="text-xs font-medium text-foreground">
              Días de atraso
            </label>
            <span className="text-sm font-bold text-foreground">{daysLate} días</span>
          </div>
          <input
            id="days-late"
            type="range"
            min={0}
            max={30}
            value={daysLate}
            onChange={(e) => setDaysLate(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>0 días</span>
            <span>30 días</span>
          </div>
        </div>

        {/* Penalidad calculada */}
        {daysLate > 0 && (
          <div className="rounded-lg bg-error-50 border border-error-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-error-700 font-medium">Penalidad estimada</span>
              <span className="text-lg font-bold text-error-700">
                S/ {penalty.toFixed(0)}
              </span>
            </div>
            <p className="text-[10px] text-error-600 mt-1">
              Adicional a tu cuota normal de S/ 375
            </p>
          </div>
        )}

        <Separator />

        {/* Consecuencias */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Consecuencias</p>
          {consequences.map((item) => {
            const isActive = daysLate >= item.days;
            return (
              <div
                key={item.days}
                className={`flex items-start gap-2 rounded-md p-2 transition-colors ${
                  isActive ? 'bg-error-50' : 'bg-neutral-50'
                }`}
              >
                <AlertTriangle
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    isActive ? 'text-error-500' : 'text-neutral-300'
                  }`}
                />
                <div>
                  <p className={`text-xs ${isActive ? 'text-error-700 font-medium' : 'text-muted-foreground'}`}>
                    Día {item.days}+
                  </p>
                  <p className={`text-[10px] ${isActive ? 'text-error-600' : 'text-muted-foreground'}`}>
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
