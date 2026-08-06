import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, AlertTriangle, ListChecks, History } from 'lucide-react';
import type { BuroReport, BuroHistoryEntry } from '@/modules/admin';

const SBS_LABEL: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  NORMAL: { label: 'Normal', variant: 'success' },
  CPP: { label: 'Con problemas potenciales', variant: 'warning' },
  DEFICIENTE: { label: 'Deficiente', variant: 'error' },
  DUDOSO: { label: 'Dudoso', variant: 'error' },
  PERDIDA: { label: 'Pérdida', variant: 'error' },
};

const CREDIT_TYPE_LABEL: Record<string, string> = {
  CONSUMO: 'Consumo',
  HIPOTECARIO: 'Hipotecario',
  TARJETA_CREDITO: 'Tarjeta de crédito',
  VEHICULAR: 'Vehicular',
  MICROEMPRESA: 'Microempresa',
  PEQUEÑA_EMPRESA: 'Pequeña empresa',
  COMERCIAL: 'Comercial',
  OTRO: 'Otro',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sbsBadge(code: string | null) {
  if (!code) return null;
  const info = SBS_LABEL[code];
  return <Badge variant={info?.variant ?? 'secondary'}>{info?.label ?? code}</Badge>;
}

interface Props {
  userId: string;
  report: BuroReport | null;
  history: BuroHistoryEntry[];
}

export function BuroDetail({ report, history }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {report?.isValid !== false ? (
              <ShieldCheck className="h-4 w-4 text-primary" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            )}
            Buró Crediticio
            {report && <Badge variant="outline" className="ml-auto">{report.provider}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold text-primary">{report.buroScore ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center flex flex-col items-center justify-center gap-1">
                  <p className="text-[11px] text-muted-foreground">Clasificación</p>
                  {sbsBadge(report.worstClassification)}
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Deudas totales</p>
                  <p className="text-2xl font-bold">{report.totalDebtsCount}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${report.overdueDebtsCount > 0 ? 'bg-red-50' : 'bg-muted/50'}`}>
                  <p className="text-[11px] text-muted-foreground">En mora</p>
                  <p className={`text-2xl font-bold ${report.overdueDebtsCount > 0 ? 'text-red-600' : ''}`}>
                    {report.overdueDebtsCount}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">Monto total reportado</p>
                  <p className="text-sm font-semibold font-mono mt-0.5">{formatMoney(report.totalDebtAmount)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">Monto en mora</p>
                  <p className="text-sm font-semibold font-mono mt-0.5">{formatMoney(report.overdueDebtAmount)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">Entidades / Protestos</p>
                  <p className="text-sm font-semibold mt-0.5">{report.entitiesCount} / {report.protestsCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">Consultado / vence</p>
                  <p className="text-sm font-semibold mt-0.5">{formatDate(report.consultedAt)} · {formatDate(report.expiresAt)}</p>
                </div>
              </div>
              {!report.isValid && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mt-3">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Este reporte venció — considerá volver a consultar antes de usarlo para una decisión.
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Este usuario no tiene ningún reporte de buró consultado todavía.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deudas detalladas */}
      {report && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" /> Deudas reportadas
              <span className="text-xs font-normal text-muted-foreground">({report.debts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.debts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin deudas reportadas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-0">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground first:pl-0">Entidad</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Original</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Saldo</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Días mora</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Clasificación</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground last:pr-0">Reportado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.debts.map((debt, i) => (
                      <tr key={i} className={`border-b last:border-0 ${debt.daysOverdue > 0 ? 'bg-red-50/50' : ''}`}>
                        <td className="px-2 py-2 first:pl-0">{debt.entityName}</td>
                        <td className="px-2 py-2">{CREDIT_TYPE_LABEL[debt.creditType] ?? debt.creditType}</td>
                        <td className="px-2 py-2 text-right font-mono">{formatMoney(debt.originalAmount)}</td>
                        <td className="px-2 py-2 text-right font-mono">{formatMoney(debt.outstandingAmount)}</td>
                        <td className="px-2 py-2 text-right">
                          {debt.daysOverdue > 0 ? (
                            <span className="font-semibold text-red-600">{debt.daysOverdue}</span>
                          ) : '0'}
                        </td>
                        <td className="px-2 py-2">{sbsBadge(debt.classification)}</td>
                        <td className="px-2 py-2 text-muted-foreground last:pr-0">{formatDate(debt.reportedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial de consultas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Historial de consultas
            <span className="text-xs font-normal text-muted-foreground">({history.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin consultas previas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-0">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground first:pl-0">Fecha</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Proveedor</th>
                    <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Score</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Clasificación</th>
                    <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Deuda reportada</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground last:pr-0">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="px-2 py-2 first:pl-0">{formatDate(h.consultedAt)}</td>
                      <td className="px-2 py-2">{h.provider}</td>
                      <td className="px-2 py-2 text-right font-mono">{h.buroScore ?? '—'}</td>
                      <td className="px-2 py-2">{sbsBadge(h.worstClassification)}</td>
                      <td className="px-2 py-2 text-right font-mono">{formatMoney(h.totalDebtAmount)}</td>
                      <td className="px-2 py-2 last:pr-0">
                        {h.isValid ? <Badge variant="success">Vigente</Badge> : <Badge variant="secondary">Vencido</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground italic mt-3">
            El historial solo guarda un resumen de cada consulta pasada — el desglose completo de deudas
            únicamente está disponible para el reporte más reciente (arriba).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
