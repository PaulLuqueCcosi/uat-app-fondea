'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAllScoreRangesAction } from '@/app/actions/admin-score-ranges.actions';
import type { AdminScoreRange } from '@/modules/admin/admin-score-ranges.service';

function formatRangeLabel(min: number, max: number | null): string {
  return `${min}–${max ?? '∞'} pts`;
}

/**
 * Card resumen de los rangos del pasaporte (puntaje de fidelización) en la
 * página general de settings. Link a la página dedicada para editar.
 * OJO: esto NO es el score crediticio — es el pasaporte BRONCE/PLATA/ORO/MASTER.
 */
export function PassportRangesCard() {
  const [ranges, setRanges] = useState<AdminScoreRange[] | null>(null);

  useEffect(() => {
    getAllScoreRangesAction().then(setRanges);
  }, []);

  const activeRanges = (ranges ?? []).filter((r) => r.isActive);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" /> Rangos del Pasaporte
          </CardTitle>
          <Link href="/admin/settings/passport-ranges">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Configurar <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">Categorías de puntaje y límite de préstamo por rango</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranges === null ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : activeRanges.length > 0 ? (
          activeRanges.map((range) => (
            <div key={range.id} className="flex items-center justify-between py-1.5 gap-2">
              <span className="text-sm text-foreground truncate">
                {range.categoryName} <span className="text-xs text-muted-foreground">({formatRangeLabel(range.minPoints, range.maxPoints)})</span>
              </span>
              <Badge variant="outline" className="font-mono text-xs shrink-0">S/ {range.maxLoanAmount.toLocaleString()}</Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-2">Sin rangos activos</p>
        )}
      </CardContent>
    </Card>
  );
}
