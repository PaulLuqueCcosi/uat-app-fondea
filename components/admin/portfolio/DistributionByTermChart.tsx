import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { DistributionByTerm, TermSegment } from './types';

const PIE_COLORS = ['#005F7A', '#00A1CD', '#7DD8F0', '#B2ECF8'];

interface DistributionByTermChartProps {
  data: DistributionByTerm | null;
}

export function DistributionByTermChart({ data }: DistributionByTermChartProps) {
  if (!data?.segments?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribución por Plazo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Distribución por Plazo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPie>
            <Pie
              data={data.segments.map((s: TermSegment) => ({
                name: `${s.term_days}d`,
                value: s.loan_count,
                pct: s.percentage,
              }))}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={(entry: PieLabelRenderProps & { pct?: number }) =>
                `${entry.name ?? ''}: ${entry.pct ?? 0}%`
              }
            >
              {data.segments.map((_s: TermSegment, i: number) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} préstamos`, '']} />
            <Legend />
          </RechartsPie>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
