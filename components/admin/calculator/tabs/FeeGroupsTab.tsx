'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FeeGroup } from '@/modules/admin/calculator-admin.service';

interface FeeGroupsTabProps {
  data: FeeGroup[];
  version: number;
  updatedAt: string;
}

export function FeeGroupsTab({ data, version, updatedAt }: FeeGroupsTabProps) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Versión {version}</span>
        <span>•</span>
        <span>Última actualización: {new Date(updatedAt).toLocaleString('es-PE')}</span>
      </div>

      {/* Fee Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.map((group) => (
          <Card key={group.groupCode}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{group.name}</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {group.groupCode}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{group.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.splits.map((split) => (
                  <div key={split.feeCode} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{split.label}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-primary/20"
                        style={{ width: `${split.percentage}px` }}
                      />
                      <span className="text-sm font-mono font-medium w-10 text-right">
                        {split.percentage}%
                      </span>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs font-medium">Total</span>
                  <span className="text-xs font-mono font-bold">
                    {group.splits.reduce((sum, s) => sum + s.percentage, 0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
