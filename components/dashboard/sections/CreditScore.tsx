'use client';

import { Shield, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Tu Reputación Crediticia — Score tipo velocímetro.
 * Muestra el score de Sentinel con indicador semafórico.
 *
 * TODO: Conectar con API real de Sentinel/Equifax.
 */

// Mock data
const mockScore = {
  value: 720,
  maxValue: 999,
  category: 'Bueno' as const,
  trend: 'up' as const,
  lastUpdated: '2026-06-01',
};

function getScoreColor(value: number): { ring: string; text: string; bg: string; label: string } {
  if (value >= 800) return { ring: 'stroke-success-500', text: 'text-success-700', bg: 'bg-success-50', label: 'Excelente' };
  if (value >= 700) return { ring: 'stroke-accent-600', text: 'text-accent-800', bg: 'bg-accent-50', label: 'Bueno' };
  if (value >= 500) return { ring: 'stroke-warning-500', text: 'text-warning-700', bg: 'bg-warning-50', label: 'Regular' };
  return { ring: 'stroke-error-500', text: 'text-error-700', bg: 'bg-error-50', label: 'Bajo' };
}

export function CreditScore() {
  const score = mockScore;
  const scoreStyle = getScoreColor(score.value);
  const percentage = (score.value / score.maxValue) * 100;

  // SVG arc para el velocímetro
  const radius = 45;
  const circumference = Math.PI * radius; // semicírculo
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Tu Reputación Crediticia
          </span>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          Powered by
          <span className="font-semibold text-foreground">Sentinel</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Velocímetro */}
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-24">
            <svg viewBox="0 0 100 55" className="w-full h-full">
              {/* Track */}
              <path
                d="M 5 50 A 45 45 0 0 1 95 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-neutral-100"
              />
              {/* Progress */}
              <path
                d="M 5 50 A 45 45 0 0 1 95 50"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${offset}`}
                className={scoreStyle.ring}
              />
            </svg>
            {/* Número central */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <span className={`text-3xl font-bold ${scoreStyle.text}`}>{score.value}</span>
              <span className="text-[9px] text-muted-foreground">de {score.maxValue}</span>
            </div>
          </div>

          {/* Badge de categoría */}
          <div className={`rounded-full px-3 py-1 mt-2 ${scoreStyle.bg}`}>
            <span className={`text-xs font-semibold ${scoreStyle.text} flex items-center gap-1`}>
              {score.trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {scoreStyle.label}
            </span>
          </div>
        </div>

        {/* Escala */}
        <div className="flex justify-between text-[9px] text-muted-foreground px-2">
          <span>0</span>
          <span className="text-error-500">Bajo</span>
          <span className="text-warning-500">Regular</span>
          <span className="text-accent-700">Bueno</span>
          <span className="text-success-600">Excelente</span>
          <span>999</span>
        </div>

        {/* Última actualización */}
        <p className="text-center text-[10px] text-muted-foreground">
          Actualizado:{' '}
          {new Date(score.lastUpdated).toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </CardContent>
    </Card>
  );
}
