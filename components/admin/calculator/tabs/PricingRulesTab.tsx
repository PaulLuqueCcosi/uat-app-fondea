'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PricingRulesConfig } from '@/modules/admin/calculator-admin.service';

interface PricingRulesTabProps {
  data: PricingRulesConfig;
  version: number;
  updatedAt: string;
}

export function PricingRulesTab({ data, version, updatedAt }: PricingRulesTabProps) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Versión {version}</span>
        <span>•</span>
        <span>Última actualización: {new Date(updatedAt).toLocaleString('es-PE')}</span>
      </div>

      {/* Rules */}
      <div className="space-y-4">
        {data.rules
          .sort((a, b) => b.priority - a.priority)
          .map((rule) => (
            <Card key={rule.ruleId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {rule.selectors.scoreRanges.join(', ')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Prioridad {rule.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {rule.ruleId}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fee Groups aplicados */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tarifas aplicadas</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.package.feeGroups.map((fg) => (
                      <Badge key={fg.groupCode} variant="default">
                        {fg.groupCode} — {fg.value}%
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Descuentos */}
                {rule.package.discounts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Descuentos</p>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Descuento</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Tipo</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rule.package.discounts
                            .sort((a, b) => a.order - b.order)
                            .map((disc) => (
                              <tr key={disc.code} className="border-t">
                                <td className="px-3 py-2">{disc.label}</td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {disc.calculationType === 'PERCENTAGE' ? '%' : 'S/'}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-medium">
                                  {disc.calculationType === 'PERCENTAGE'
                                    ? `${disc.value}%`
                                    : `S/ ${disc.value}`}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
