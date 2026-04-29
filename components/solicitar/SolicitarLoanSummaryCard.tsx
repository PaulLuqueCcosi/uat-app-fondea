'use client';

import { useState, useEffect } from 'react';
import { Settings, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getLoanSummary } from '@/app/actions/loan.actions';

interface LoanData {
  amount: number;
  installments: number;
  installmentAmount: number;
  firstPaymentDate: string;
}

export function FunnelLoanSummaryCard() {
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const data = await getLoanSummary();
        if (data) {
          setLoanData(data);
        }
      } catch (error) {
        console.error('Error fetching loan data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const handleAdjust = () => {
    // TODO: Implementar la lógica para ajustar monto o plazo
    console.log('Ajustar monto o plazo');
  };

  if (loading) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-pulse">
        <CardContent className="p-4">
          <div className="h-24"></div>
        </CardContent>
      </Card>
    );
  }

  if (!loanData) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-sm border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xs font-medium text-primary/70 uppercase tracking-wide">
              Tu Solicitud
            </h3>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatCurrency(loanData.amount)}
            </p>
          </div>
          <Button
            onClick={handleAdjust}
            size="sm"
            variant="outline"
            className="h-8 text-xs border-primary/50 text-primary hover:bg-primary/20 hover:border-primary font-medium"
          >
            <Settings className="w-3 h-3 mr-1.5" />
            Ajustar
          </Button>
        </div>

        {/* Detalles */}
        <div className="space-y-3">
          {/* Cuotas */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Cuotas</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {loanData.installments}x de {formatCurrency(loanData.installmentAmount)}
              </p>
            </div>
          </div>

          {/* Primera cuota */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Primera cuota</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {formatDate(loanData.firstPaymentDate)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
