'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface NplTramosChartProps {
  nplGeneralRate: number;
  nplTramos: {
    d1_30: number;
    d31_60: number;
    d61_90: number;
    d91_plus: number;
  };
}

export function NplTramosChart({ nplGeneralRate, nplTramos }: NplTramosChartProps) {
  const data = [
    { name: 'D+1-30', value: nplTramos.d1_30, color: '#eab308' },
    { name: 'D+31-60', value: nplTramos.d31_60, color: '#f97316' },
    { name: 'D+61-90', value: nplTramos.d61_90, color: '#ef4444' },
    { name: 'D+91+', value: nplTramos.d91_plus, color: '#6b7280' },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          NPL General
        </CardTitle>
        <div className="text-3xl font-bold mt-1">{nplGeneralRate.toFixed(2)}%</div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" hide />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()}`, 'Créditos']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="value" stackId="a" barSize={24} radius={[4, 4, 4, 4]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-muted-foreground">{d.name}:</span>
              <span className="font-medium">{d.value.toLocaleString()}</span>
              <span className="text-muted-foreground">
                ({total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
