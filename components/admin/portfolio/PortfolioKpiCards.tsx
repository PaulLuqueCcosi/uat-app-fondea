import { DollarSign, RefreshCw, PieChart, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AverageTicket, Rotation, DistributionByTerm, UpcomingDue } from './types';

interface PortfolioKpiCardsProps {
  averageTicket: AverageTicket | null;
  rotation: Rotation | null;
  distributionByTerm: DistributionByTerm | null;
  upcomingDue: UpcomingDue | null;
}

export function PortfolioKpiCards({
  averageTicket,
  rotation,
  distributionByTerm,
  upcomingDue,
}: PortfolioKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">S/ {averageTicket?.average_ticket?.toFixed(0) ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Ticket promedio</p>
          <p className="text-[10px] text-muted-foreground">
            {averageTicket?.disbursements_this_month ?? 0} desembolsos este mes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <RefreshCw className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{rotation?.rotation_rate?.toFixed(1) ?? '—'}x</p>
          <p className="text-xs text-muted-foreground mt-1">Rotación mensual</p>
          <p className="text-[10px] text-muted-foreground">
            S/ {rotation?.total_disbursed_this_month?.toLocaleString() ?? '0'} / S/{' '}
            {rotation?.current_portfolio_balance?.toLocaleString() ?? '0'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <PieChart className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{distributionByTerm?.total_loans ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Préstamos activos</p>
          <p className="text-[10px] text-muted-foreground">
            S/ {distributionByTerm?.total_principal?.toLocaleString() ?? '0'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{upcomingDue?.total_count ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Vencen en 7 días</p>
          <p className="text-[10px] text-muted-foreground">
            S/ {upcomingDue?.total_amount?.toLocaleString() ?? '0'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
