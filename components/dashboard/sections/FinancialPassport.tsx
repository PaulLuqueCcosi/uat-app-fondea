'use client';

import { Award, Lock, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Pasaporte Financiero — Sistema de niveles gamificado.
 * Muestra el nivel actual y los beneficios de subir.
 *
 * TODO: Conectar con datos reales del sistema de niveles.
 */

interface Level {
  name: string;
  minPoints: number;
  maxAmount: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const levels: Level[] = [
  { name: 'Bronce', minPoints: 0, maxAmount: 200, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { name: 'Plata', minPoints: 100, maxAmount: 350, color: 'text-neutral-600', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-300' },
  { name: 'Oro', minPoints: 250, maxAmount: 600, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  { name: 'Platino', minPoints: 500, maxAmount: 1000, color: 'text-primary-700', bgColor: 'bg-primary-50', borderColor: 'border-primary-200' },
];

// Mock: el usuario está en Bronce con 65 puntos
const mockUserLevel = {
  currentLevel: 0, // index en el array levels
  points: 65,
};

export function FinancialPassport() {
  const { currentLevel, points } = mockUserLevel;
  const current = levels[currentLevel];
  const next = levels[currentLevel + 1];
  const progressToNext = next
    ? Math.round((points / next.minPoints) * 100)
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Pasaporte Financiero
          </span>
        </CardTitle>
        <CardDescription>Tu nivel determina cuánto puedes solicitar</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nivel actual */}
        <div className={`rounded-lg border p-3 ${current.bgColor} ${current.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className={`w-5 h-5 ${current.color}`} />
              <div>
                <p className={`text-sm font-bold ${current.color}`}>Nivel {current.name}</p>
                <p className="text-[10px] text-muted-foreground">Hasta S/ {current.maxAmount}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">{points} pts</Badge>
          </div>
        </div>

        {/* Progreso al siguiente nivel */}
        {next && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso a {next.name}</span>
              <span className="font-medium text-foreground">{points}/{next.minPoints} pts</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Te faltan <span className="font-semibold text-foreground">{next.minPoints - points} puntos</span> para desbloquear hasta S/ {next.maxAmount}
            </p>
          </div>
        )}

        {/* Línea de tiempo de niveles */}
        <div className="flex items-center justify-between pt-2">
          {levels.map((level, i) => (
            <div key={level.name} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  i <= currentLevel
                    ? `${level.bgColor} ${level.borderColor}`
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                {i <= currentLevel ? (
                  <Award className={`w-4 h-4 ${level.color}`} />
                ) : (
                  <Lock className="w-3 h-3 text-neutral-400" />
                )}
              </div>
              <span className={`text-[9px] font-medium ${i <= currentLevel ? level.color : 'text-neutral-400'}`}>
                {level.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
