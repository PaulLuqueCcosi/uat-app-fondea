'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AvailabilityConfig } from '@/modules/admin/calculator-admin.service';

interface AvailabilityTabProps {
  data: AvailabilityConfig;
  version: number;
  updatedAt: string;
}

export function AvailabilityTab({ data, version, updatedAt }: AvailabilityTabProps) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Versión {version}</span>
        <span>•</span>
        <span>Última actualización: {new Date(updatedAt).toLocaleString('es-PE')}</span>
      </div>

      {/* Score Ranges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rangos de Score Crediticio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.scoreRanges.map((range) => (
              <div
                key={range.code}
                className="rounded-lg border p-4 space-y-2"
                style={{ borderLeftColor: range.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{range.label}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {range.code}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Score: {range.minScore} – {range.maxScore}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Montos y Plazos Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.availability.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              {groupIdx > 0 && <Separator />}

              {/* Montos */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Grupo {groupIdx + 1} — Montos
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.amounts.map((amount) => (
                    <Badge key={amount} variant="secondary" className="font-mono">
                      S/ {amount.toLocaleString()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Plazos y cuotas */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Plazos y cuotas</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Plazo (días)</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cuotas permitidas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.terms.map((term, termIdx) => (
                        <tr key={termIdx} className="border-t">
                          <td className="px-3 py-2 font-mono">
                            {term.terms.join(', ')} días
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {term.installments.map((inst) => (
                                <Badge key={inst} variant="outline" className="text-xs">
                                  {inst} {inst === 1 ? 'cuota' : 'cuotas'}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
