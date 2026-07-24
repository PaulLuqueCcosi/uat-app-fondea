import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, AlertTriangle } from 'lucide-react';
import type { AdminApplicationDetail } from '@/modules/admin/admin-application-detail.service';

interface Props {
  data: AdminApplicationDetail;
}

function formatCurrency(value: number | null) {
  if (value == null) return '—';
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ApplicationDetailSection({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* KPIs financieros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Producto" value={data.productName ?? '—'} />
        <KpiCard label="Monto solicitado" value={formatCurrency(data.requestedAmount)} />
        <KpiCard label="Monto aprobado" value={formatCurrency(data.approvedAmount)} />
        <KpiCard label="Principal" value={formatCurrency(data.principal)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total a pagar" value={formatCurrency(data.totalToPay)} highlight />
        <KpiCard label="Cuota mensual" value={formatCurrency(data.monthlyPayment)} />
        <KpiCard label="Cuotas" value={`${data.installmentCount}`} />
        <KpiCard label="Plazo" value={`${data.termDays} días`} />
      </div>

      {/* Desglose de costos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Desglose de costos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <InfoItem label="Fees originales" value={formatCurrency(data.totalFeesOriginal)} />
            <InfoItem label="Descuentos" value={formatCurrency(data.totalDiscounts)} />
            <InfoItem label="IGV" value={formatCurrency(data.totalIgv)} />
            <InfoItem label="Score usado" value={data.creditScoreUsed != null ? `${data.creditScoreUsed}` : '—'} />
            <InfoItem label="1er préstamo" value={data.isFirstLoan ? 'Sí' : 'No'} />
          </div>
        </CardContent>
      </Card>

      {/* Ajuste de límite */}
      {data.wasLimitAdjusted && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-amber-700 font-medium">Monto ajustado por límite de score</p>
            <p className="text-xs text-amber-600 mt-1">Límite: {formatCurrency(data.scoreLimitAmount)}</p>
            {data.limitNote && <p className="text-xs text-amber-600">{data.limitNote}</p>}
          </div>
        </div>
      )}

      {/* Cronograma */}
      {data.schedule && data.schedule.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cronograma de pagos ({data.schedule.length} cuotas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Vencimiento</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.schedule.map((s) => (
                    <tr key={s.installmentNo} className="border-b last:border-0">
                      <td className="py-2 font-mono">{s.installmentNo}</td>
                      <td className="py-2">{formatDate(s.dueDate)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm mt-0.5 ${highlight ? 'font-bold' : 'font-semibold'}`}>{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
