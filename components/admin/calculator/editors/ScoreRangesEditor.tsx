'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import type { ScoreRange } from '@/modules/admin/calculator-admin.service';

interface Props {
  scoreRanges: ScoreRange[];
  onChange: (ranges: ScoreRange[]) => void;
  readonly: boolean;
}

const COLOR_PRESETS = [
  { color: '#EF4444', label: 'Rojo' },
  { color: '#F59E0B', label: 'Ámbar' },
  { color: '#10B981', label: 'Verde' },
];

const SCORE_MIN = 0;
const SCORE_MAX = 1000;

/** Valida que los rangos no se solapen y cubran de SCORE_MIN a SCORE_MAX */
function validateRanges(ranges: ScoreRange[]): string | null {
  const sorted = [...ranges].sort((a, b) => a.minScore - b.minScore);

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.minScore > r.maxScore) {
      return `"${r.label}": el mínimo (${r.minScore}) no puede ser mayor al máximo (${r.maxScore})`;
    }
    if (r.minScore < SCORE_MIN) {
      return `"${r.label}": el mínimo no puede ser menor a ${SCORE_MIN}`;
    }
    if (r.maxScore > SCORE_MAX) {
      return `"${r.label}": el máximo no puede ser mayor a ${SCORE_MAX}`;
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      if (r.minScore <= prev.maxScore) {
        return `"${prev.label}" y "${r.label}" se solapan (${prev.maxScore} y ${r.minScore})`;
      }
      if (r.minScore > prev.maxScore + 1) {
        return `Hay un hueco entre "${prev.label}" (hasta ${prev.maxScore}) y "${r.label}" (desde ${r.minScore})`;
      }
    }
  }

  if (sorted.length > 0) {
    if (sorted[0].minScore !== SCORE_MIN) {
      return `El primer rango debe empezar en ${SCORE_MIN} (actualmente empieza en ${sorted[0].minScore})`;
    }
    if (sorted[sorted.length - 1].maxScore !== SCORE_MAX) {
      return `El último rango debe terminar en ${SCORE_MAX} (actualmente termina en ${sorted[sorted.length - 1].maxScore})`;
    }
  }

  return null;
}

export function ScoreRangesEditor({ scoreRanges, onChange, readonly }: Props) {
  const sorted = [...scoreRanges].sort((a, b) => a.displayOrder - b.displayOrder);
  const error = !readonly ? validateRanges(sorted) : null;

  const updateRange = (idx: number, field: keyof ScoreRange, value: any) => {
    const updated = sorted.map((r, i) => i === idx ? { ...r, [field]: value } : r);

    // Auto-generar código desde el label
    if (field === 'label') {
      updated[idx] = { ...updated[idx], code: String(value).toUpperCase().replace(/\s+/g, '_') };
    }

    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Rangos de Score Crediticio</CardTitle>
        {!readonly && (
          <p className="text-xs text-muted-foreground">
            Los 3 rangos deben cubrir de {SCORE_MIN} a {SCORE_MAX} sin solaparse ni dejar huecos.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((range, idx) => (
          <div
            key={`${range.code}-${idx}`}
            className="rounded-lg border p-4"
            style={{ borderLeftColor: range.color, borderLeftWidth: 4 }}
          >
            {!readonly ? (
              <div className="flex items-center gap-4">
                {/* Color picker */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    {COLOR_PRESETS.map((opt) => (
                      <button
                        key={opt.color}
                        type="button"
                        title={opt.label}
                        onClick={() => updateRange(idx, 'color', opt.color)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          range.color === opt.color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: opt.color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={range.color}
                    onChange={(e) => updateRange(idx, 'color', e.target.value)}
                    className="w-8 h-5 rounded cursor-pointer border-0 p-0"
                    title="Elegir otro color"
                  />
                </div>

                {/* Label */}
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nombre</Label>
                  <Input
                    value={range.label}
                    onChange={(e) => updateRange(idx, 'label', e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Ej: Bajo"
                  />
                </div>

                {/* Min score */}
                <div className="w-24 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Desde</Label>
                  <Input
                    type="number"
                    value={range.minScore}
                    onChange={(e) => updateRange(idx, 'minScore', Number(e.target.value))}
                    className="h-8 text-sm font-mono"
                    min={SCORE_MIN}
                    max={SCORE_MAX}
                  />
                </div>

                {/* Max score */}
                <div className="w-24 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Hasta</Label>
                  <Input
                    type="number"
                    value={range.maxScore}
                    onChange={(e) => updateRange(idx, 'maxScore', Number(e.target.value))}
                    className="h-8 text-sm font-mono"
                    min={SCORE_MIN}
                    max={SCORE_MAX}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: range.color }} />
                  <span className="font-medium text-sm">{range.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {range.minScore} – {range.maxScore}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Error de validación */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
