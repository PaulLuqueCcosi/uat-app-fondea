'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface NplByDaysChartProps {
  data?: { term: string; rate: number }[];
}

export function NplByDaysChart({ data }: NplByDaysChartProps) {
  const mockData = data ?? [
    { term: '7d', rate: 1.2 },
    { term: '15d', rate: 2.5 },
    { term: '30d', rate: 3.8 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          NPL por Plazo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <XAxis dataKey="term" tick={{ fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [`${Number(value)}%`, 'NPL']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
