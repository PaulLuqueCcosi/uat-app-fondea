'use client';

import { Card, CardContent } from '@/components/ui/card';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScheduleItem {
  installmentNo: number;
  dueDate: string;
  amount: number;
}

interface Fee {
  label: string;
  originalAmount: number;
  finalAmount: number;
  discountAmount: number;
}

interface FixedDiscount {
  label: string;
  totalDiscountAmount: number;
}

interface LoanSummary {
  principal: number;
  totalToPay: number;
  monthlyPayment: number;
  installmentCount: number;
  termDays: number;
  isFirstLoan: boolean;
  creditScoreUsed: number;
  totalFeesOriginal: number;
  totalDiscounts: number;
  totalIgv: number;
  schedule: ScheduleItem[];
  fees: Fee[];
  fixedDiscounts: FixedDiscount[];
  totalFeesResult: number;
}

interface ApplicationLoanDetailProps {
  loan: LoanSummary;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ApplicationLoanDetail({ loan }: ApplicationLoanDetailProps) {
  return (
    <div className="space-y-5">
      {/* Resumen principal */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total a pagar</p>
            <p className="text-2xl font-bold text-primary">{fmt(loan.totalToPay)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Cuota mensual</p>
            <p className="text-lg font-bold text-foreground">{fmt(loan.monthlyPayment)}</p>
            <p className="text-xs text-muted-foreground">{loan.installmentCount} cuota{loan.installmentCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Info general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoItem label="Monto original" value={fmt(loan.principal)} />
        <InfoItem label="Plazo" value={`${loan.termDays} días`} />
        <InfoItem label="Score usado" value={String(loan.creditScoreUsed)} />
        <InfoItem label="Primer préstamo" value={loan.isFirstLoan ? 'Sí' : 'No'} />
      </div>

      {/* Cronograma de pagos */}
      {loan.schedule.length > 0 && (
        <Card className="border shadow-none">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Cronograma de pagos</p>
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>#</span>
                <span>Fecha</span>
                <span className="text-right">Monto</span>
              </div>
              {loan.schedule.map((item) => (
                <div key={item.installmentNo} className="grid grid-cols-3 gap-2 px-4 py-2.5 border-t text-sm">
                  <span className="text-muted-foreground">{item.installmentNo}</span>
                  <span className="text-foreground">{fmtDate(item.dueDate)}</span>
                  <span className="text-right font-medium text-foreground">{fmt(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desglose de comisiones */}
      <Card className="border shadow-none">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Desglose</p>

          {/* Monto original */}
          <Row label="Monto Original" value={fmt(loan.principal)} bold />
          <Divider />

          {/* Comisiones */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Comisiones</p>
          {loan.fees.map((fee) => (
            <div key={fee.label} className="flex justify-between items-center text-sm">
              <span className="text-foreground">{fee.label}</span>
              <span className="flex items-center gap-2">
                {fee.discountAmount > 0 && (
                  <span className="text-xs line-through text-muted-foreground">{fmt(fee.originalAmount)}</span>
                )}
                <span className="text-foreground">{fmt(fee.finalAmount)}</span>
              </span>
            </div>
          ))}
          <Divider />

          {/* Descuentos fijos */}
          {loan.fixedDiscounts.length > 0 && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Descuentos fijos</p>
              {loan.fixedDiscounts.map((d) => (
                <div key={d.label} className="flex justify-between items-center text-sm">
                  <span className="text-foreground">{d.label}</span>
                  <span className="text-success-600">-{fmt(d.totalDiscountAmount)}</span>
                </div>
              ))}
              <Divider />
              <Row label="Subtotal" value={fmt(loan.totalFeesResult)} bold />
            </>
          )}

          {/* IGV */}
          <Row label="IGV" value={fmt(loan.totalIgv)} bold />
          <Divider />

          {/* Total */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Monto Total</p>
              <p className="text-lg font-bold text-primary">{fmt(loan.totalToPay)}</p>
            </div>
            {loan.installmentCount > 1 && (
              <span className="text-xs text-muted-foreground">
                {fmt(loan.monthlyPayment)} × {loan.installmentCount} cuotas
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm py-0.5">
      <span className={bold ? 'font-semibold text-foreground' : 'text-foreground'}>{label}</span>
      <span className={bold ? 'font-semibold text-foreground' : 'text-foreground'}>{value}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-t my-2" />;
}
