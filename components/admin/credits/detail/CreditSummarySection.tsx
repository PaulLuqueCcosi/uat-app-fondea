import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, User, Banknote, MapPin, Calendar, AlertTriangle, Shield, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { AdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';
import { creditStatusInfo } from '@/modules/admin/credit-status-labels';

interface Props {
  data: AdminCreditSummary;
}

// Labels centralizados en `modules/admin/credit-status-labels`.

const DISBURSEMENT_STATUS: Record<string, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function buildFullName(client: AdminCreditSummary['client']) {
  if (!client) return '—';
  return [client.firstName, client.secondName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ');
}

// ── Component ────────────────────────────────────────────────────────────────

export function CreditSummarySection({ data }: Props) {
  const statusConfig = creditStatusInfo(data.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Detalle del Crédito</h1>
            <p className="text-xs text-muted-foreground font-mono">#{data.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.creditType === 'NEGOTIATION' && (
            <Badge variant="secondary" className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Refinanciamiento
            </Badge>
          )}
          <Badge variant={statusConfig.variant} title={statusConfig.description}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Qué significa el estado — el admin necesita saber si el crédito acumula mora,
          acepta pagos o está congelado antes de operar sobre él. */}
      {statusConfig.description && (
        <p className="text-xs text-muted-foreground">{statusConfig.description}</p>
      )}

      {/* Origen — solo si es crédito de negociación */}
      {data.creditType === 'NEGOTIATION' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <RefreshCw className="h-4 w-4 text-primary" />
                Crédito de refinanciamiento — no tuvo desembolso real
              </span>
              {data.originCreditId && (
                <Link href={`/admin/credits/${data.originCreditId}`}>
                  <Badge variant="outline" className="cursor-pointer text-xs">Ver crédito origen</Badge>
                </Link>
              )}
              {data.rootCreditId && data.rootCreditId !== data.originCreditId && (
                <Link href={`/admin/credits/${data.rootCreditId}`}>
                  <Badge variant="outline" className="cursor-pointer text-xs">Ver crédito raíz</Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Col 1-2: Datos financieros */}
        <div className="lg:col-span-2 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Capital" value={formatCurrency(data.principal)} />
            <KpiCard label="Total a pagar" value={formatCurrency(data.totalDue)} />
            <KpiCard label="Cuotas" value={`${data.installmentCount}`} />
            <KpiCard label="Plazo" value={`${data.termDays} días`} />
          </div>

          {/* Info del crédito */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Fechas y estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoItem label="Desembolso" value={formatDateTime(data.disbursedAt)} />
                <InfoItem label="Primera cuota" value={formatDate(data.firstDueDate)} />
                <InfoItem label="Vencimiento" value={formatDate(data.maturityDate)} />
                <InfoItem label="En mora desde" value={data.overdueSince ? formatDate(data.overdueSince) : 'Al día'} />
                <InfoItem label="Cerrado" value={data.closedAt ? formatDateTime(data.closedAt) : '—'} />
                <InfoItem label="Creado" value={formatDateTime(data.createdAt)} />
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          {(data.ubigeoRegion || data.ubigeoProvince || data.ubigeoDistrict) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Ubicación (snapshot)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <InfoItem label="Región" value={data.ubigeoRegion ?? '—'} />
                  <InfoItem label="Provincia" value={data.ubigeoProvince ?? '—'} />
                  <InfoItem label="Distrito" value={data.ubigeoDistrict ?? '—'} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Penalty Config */}
          {data.penaltyConfig && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Configuración de mora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-2">{data.penaltyConfig.name}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1.5 font-medium text-muted-foreground">Rango</th>
                        <th className="text-left py-1.5 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-right py-1.5 font-medium text-muted-foreground">Valor</th>
                        <th className="text-left py-1.5 font-medium text-muted-foreground">Base</th>
                        <th className="text-left py-1.5 font-medium text-muted-foreground">Etiqueta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.penaltyConfig.ranges.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5">
                            <span className="inline-flex items-center gap-1">
                              {r.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />}
                              Día {r.fromDay}{r.toDay ? `–${r.toDay}` : '+'}
                            </span>
                          </td>
                          <td className="py-1.5">{r.type}</td>
                          <td className="py-1.5 text-right font-mono">
                            {r.type === 'PERCENTAGE' ? `${r.value}%` : formatCurrency(r.value)}
                          </td>
                          <td className="py-1.5">{r.base ?? '—'}</td>
                          <td className="py-1.5">{r.label ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Col 3: Sidebar */}
        <div className="space-y-4">
          {/* Cliente */}
          {data.client && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-sm">{buildFullName(data.client)}</p>
                {data.client.documentNumber && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">DNI {data.client.documentNumber}</p>
                )}
                <div className="mt-3">
                  <Link href={`/admin/users/${data.userId}`}>
                    <Badge variant="outline" className="cursor-pointer text-xs">Ver perfil</Badge>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desembolso */}
          {data.disbursement && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Desembolso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoItem label="Monto" value={formatCurrency(data.disbursement.amount)} />
                <InfoItem label="Método" value={data.disbursement.method ?? '—'} />
                <InfoItem label="Banco" value={data.disbursement.destinationBank ?? '—'} />
                <InfoItem label="Cuenta" value={data.disbursement.destinationAccount ?? '—'} />
                <InfoItem label="Titular" value={data.disbursement.destinationHolder ?? '—'} />
                <InfoItem label="Referencia" value={data.disbursement.referenceNumber ?? '—'} />
                <InfoItem label="Estado" value={DISBURSEMENT_STATUS[data.disbursement.status] ?? data.disbursement.status} />
                <InfoItem label="Fecha" value={formatDateTime(data.disbursement.disbursedAt)} />
                {data.disbursement.failureReason && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{data.disbursement.failureReason}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Link a solicitud */}
          {data.applicationId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Solicitud de origen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-mono mb-2">#{data.applicationId.slice(0, 8)}</p>
                {data.approvalSnapshot && (
                  <div className="space-y-2 mb-3">
                    {data.approvalSnapshot.creditScore != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Score al aprobar</span>
                        <span className="text-sm font-mono font-semibold">{data.approvalSnapshot.creditScore}</span>
                      </div>
                    )}
                    {data.approvalSnapshot.passportPoints != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Puntos pasaporte</span>
                        <span className="text-sm font-mono font-semibold">{data.approvalSnapshot.passportPoints} pts</span>
                      </div>
                    )}
                  </div>
                )}
                <Link href={`/admin/applications/${data.applicationId}`}>
                  <Badge variant="outline" className="cursor-pointer text-xs">Ver solicitud</Badge>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
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
