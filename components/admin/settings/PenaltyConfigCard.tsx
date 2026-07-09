'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircleDollarSign, ArrowRight, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import { getActivePenaltyConfigAction } from '@/app/actions/admin-penalty.actions';
import type { PenaltyConfigResponse } from '@/modules/admin/admin-penalty.service';

function getLucideIcon(name: string): React.ComponentType<{ className?: string }> | null {
  const pascalCase = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  return (LucideIcons as any)[pascalCase] ?? null;
}

function formatValue(range: { type: string; value: number; base: string | null }): string {
  if (range.type === 'FIXED') return `S/ ${range.value}/día`;
  const baseLabel = range.base === 'PRINCIPAL' ? 'del préstamo' : 'de la cuota';
  return `${range.value}% ${baseLabel}/día`;
}

function formatRangeLabel(from: number, to: number | null): string {
  if (to === null) return `${from}+ días`;
  return `${from}–${to} días`;
}

/**
 * Card resumen de la config de mora en la página general de settings.
 * Link a la página dedicada /admin/settings/penalty para editar.
 */
export function PenaltyConfigCard() {
  const [config, setConfig] = useState<PenaltyConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivePenaltyConfigAction().then(data => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-warning-600" /> Penalidades por Mora
          </CardTitle>
          <Link href="/admin/settings/penalty">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Configurar <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">
          {config ? config.name : 'Cargo diario según días de atraso'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : config && config.ranges.length > 0 ? (
          config.ranges.map((range) => (
            <div key={range.id} className="flex items-center justify-between py-1.5 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {range.icon && (() => {
                  const IconComp = getLucideIcon(range.icon);
                  return IconComp ? <IconComp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : null;
                })()}
                {range.color && <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: range.color }} />}
                <span className="text-sm text-foreground truncate">
                  {range.label || formatRangeLabel(range.fromDay, range.toDay)}
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-xs shrink-0">{formatValue(range)}</Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-2">Sin configuración activa</p>
        )}
      </CardContent>
    </Card>
  );
}
