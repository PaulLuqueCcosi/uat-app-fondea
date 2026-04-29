'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Calendar, CreditCard, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getLoanSummary } from '@/app/actions/loan.actions';

interface LoanData {
  amount: number;
  installments: number;
  installmentAmount: number;
  firstPaymentDate: string;
}

export function FunnelLoanSummaryBanner() {
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Click outside para cerrar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expanded && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded]);

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
      <Card className="rounded-none border-x-0 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="py-1.5">
          <div className="animate-pulse h-6 bg-primary/5 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!loanData) {
    return null;
  }

  return (
    <Card ref={cardRef} className="rounded-none border-x-0 bg-gradient-to-r from-primary/10 to-primary/5">
      <CardContent className="space-y-2">
        {/* Collapsed view - inline como los pasos */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Info inline */}
          <div className="flex items-center gap-3">
            {/* Monto */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">Solicitud:</span>
              <span className="text-sm font-bold text-primary">
                {formatCurrency(loanData.amount)}
              </span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Cuotas inline */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">Cuotas:</span>
              <span className="text-xs font-semibold text-foreground">
                {loanData.installments}x de {formatCurrency(loanData.installmentAmount)}
              </span>
            </div>
          </div>

          {/* Right: Botones mini */}
          <div className="flex items-center gap-1">
            <Button
              onClick={handleAdjust}
              size="sm"
              variant="outline"
              className="h-6 text-[10px] border-primary/50 text-primary hover:bg-primary/20 hover:border-primary font-medium px-2"
            >
              <Settings className="w-2.5 h-2.5 mr-1" />
              <span className="hidden sm:inline">Ajustar</span>
            </Button>

            <Button
              onClick={() => setExpanded(!expanded)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
            >
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded view - más compacto */}
        {expanded && (
          <div className="pt-3 border-t border-primary/10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cuotas (visible en mobile cuando expandido) */}
              <div className="flex items-start gap-2 sm:hidden">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Cuotas</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {loanData.installments}x de {formatCurrency(loanData.installmentAmount)}
                  </p>
                </div>
              </div>

              {/* Primera cuota */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Primera cuota</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {formatDate(loanData.firstPaymentDate)}
                  </p>
                </div>
              </div>

              {/* Total a pagar */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Total a pagar</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {formatCurrency(loanData.installmentAmount * loanData.installments)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
