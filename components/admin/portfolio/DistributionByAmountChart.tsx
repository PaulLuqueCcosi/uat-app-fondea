import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DistributionByAmount } from './types';

const BAR_COLOR = '#00A1CD';

interface DistributionByAmountChartProps {
  data: DistributionByAmount | null;
  configButton?: React.ReactNode;
}

export function DistributionByAmountChart({ data, configButton }: DistributionByAmountChartProps) {
  if (!data?.buckets?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribución por Monto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
        </CardContent>
        {configButton && (
          <CardFooter>
            {configButton}
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Distribución por Monto</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.buckets} margin={{ top: 5, right: 20, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range_label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(value) => [`${value} préstamos`, 'Cantidad']} />
            <Bar dataKey="loan_count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      {configButton && (
        <CardFooter className="justify-end pt-4">
          {configButton}
        </CardFooter>
      )}
    </Card>
  );
}
