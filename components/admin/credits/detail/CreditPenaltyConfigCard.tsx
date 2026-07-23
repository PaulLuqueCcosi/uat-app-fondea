import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditPenaltyConfigCardProps {
  data: AdminCreditFullDetail;
}

export function CreditPenaltyConfigCard({ data }: CreditPenaltyConfigCardProps) {
  const config = data.penalty_config;
  if (!config) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Configuración de mora aplicada</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium mb-2">{config.name}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Días</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Valor</TableHead>
              <TableHead className="text-xs">Base</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.ranges.map((range, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-xs">
                  {range.from_day} - {range.to_day ?? '+'}
                </TableCell>
                <TableCell className="text-xs">{range.type}</TableCell>
                <TableCell className="text-xs">{range.value}</TableCell>
                <TableCell className="text-xs">{range.base ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
