'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator, Users, Target } from 'lucide-react';
import type { MockCalcIntention } from '@/modules/admin';

interface CalcIntentionsTabProps {
  intentions: MockCalcIntention[];
  metrics: {
    totalIntentions: number;
    last30Days: number;
    avgAmount: number;
    topAmount: number;
    topTerm: number;
    conversion: { total: number; registered: number; rate: number };
  };
}

export function CalcIntentionsTab({ intentions, metrics }: CalcIntentionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.last30Days}</p>
                <p className="text-[10px] text-muted-foreground">Últimos 30 días</p>
              </div>
              <Calculator className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">S/ {metrics.avgAmount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Monto promedio</p>
              </div>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.conversion.registered}</p>
                <p className="text-[10px] text-muted-foreground">Se registraron</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{metrics.conversion.rate}%</p>
                <p className="text-[10px] text-muted-foreground">Tasa de conversión</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de intenciones anónimas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Intenciones desde la calculadora (landing)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ID</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Monto</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Plazo</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cuotas</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Rango</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">¿Se registró?</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {intentions.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.id}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">S/ {item.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs">{item.termDays}d</td>
                    <td className="px-4 py-2.5 text-xs">{item.installmentCount}</td>
                    <td className="px-4 py-2.5">
                      {item.selectedRangeCode ? (
                        <Badge variant="outline" className="text-[9px]">{item.selectedRangeCode}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.registeredUserId ? (
                        <Badge variant="success" className="text-[9px]">Sí</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('es-PE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
