import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar, MapPin, AlertTriangle, Shield, Banknote, User,
} from 'lucide-react';
import { getDepartment, getProvince, getDistrict } from 'ubigeo-fns';
import type { AdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  data: AdminCreditSummary;
}

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value + (value.includes('T') ? '' : 'T00:00:00'));
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
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

const DISBURSEMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-amber-600' },
  COMPLETED: { label: 'Completado', color: 'text-emerald-600' },
  FAILED: { label: 'Fallido', color: 'text-red-600' },
};

/**
 * getDepartment/getProvince/getDistrict (ubigeo-fns) necesitan el código completo
 * de 6 dígitos — con el distrito alcanza para resolver los 3 nombres a la vez.
 */
function resolveUbigeoNames(region: string | null, province: string | null, district: string | null) {
  if (district) {
    return {
      region: getDepartment(district) ?? region,
      province: getProvince(district) ?? province,
      district: getDistrict(district) ?? district,
    };
  }
  return { region, province, district };
}

export function CreditOverviewTab({ data }: Props) {
  const ubigeoNames = resolveUbigeoNames(data.ubigeoRegion, data.ubigeoProvince, data.ubigeoDistrict);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Col 1-2: Info principal */}
      <div className="lg:col-span-2 space-y-4">
        {/* Fechas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Cronología
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <DataField
                label={data.creditType === 'NEGOTIATION' ? 'Vigente desde' : 'Desembolso'}
                value={formatDateTime(data.disbursedAt)}
              />
              <DataField label="Primera cuota" value={formatDate(data.firstDueDate)} />
              <DataField label="Vencimiento final" value={formatDate(data.maturityDate)} />
              <DataField label="En mora desde" value={data.overdueSince ? formatDate(data.overdueSince) : '—'} alert={!!data.overdueSince} />
              <DataField label="Cerrado" value={data.closedAt ? formatDateTime(data.closedAt) : '—'} />
              <DataField label="Creado" value={formatDateTime(data.createdAt)} />
            </div>
          </CardContent>
        </Card>

        {/* Desembolso */}
        {data.disbursement && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" /> Desembolso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DataField label="Monto" value={formatCurrency(data.disbursement.amount)} bold />
                <DataField label="Método" value={data.disbursement.method ?? '—'} />
                <DataField
                  label="Estado"
                  value={DISBURSEMENT_STATUS[data.disbursement.status]?.label ?? data.disbursement.status}
                  valueClassName={DISBURSEMENT_STATUS[data.disbursement.status]?.color}
                />
                <DataField label="Banco destino" value={data.disbursement.destinationBank ?? '—'} />
                <DataField label="Cuenta" value={data.disbursement.destinationAccount ?? '—'} mono />
                <DataField label="Titular" value={data.disbursement.destinationHolder ?? '—'} />
                <DataField label="Referencia" value={data.disbursement.referenceNumber ?? '—'} mono />
                <DataField label="Fecha envío" value={formatDateTime(data.disbursement.disbursedAt)} />
                <DataField label="Reintentos" value={`${data.disbursement.retryCount}`} />
              </div>
              {data.disbursement.failureReason && (
                <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-xs font-medium text-red-700">Motivo de fallo:</p>
                  <p className="text-xs text-red-600 mt-0.5">{data.disbursement.failureReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ubicación */}
        {(data.ubigeoRegion || data.ubigeoProvince || data.ubigeoDistrict) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Ubicación del cliente (snapshot)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <DataField label="Región" value={ubigeoNames.region ?? '—'} />
                <DataField label="Provincia" value={ubigeoNames.province ?? '—'} />
                <DataField label="Distrito" value={ubigeoNames.district ?? '—'} />
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
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-sm">{buildFullName(data.client)}</p>
                {data.client.documentNumber && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">DNI {data.client.documentNumber}</p>
                )}
              </div>
              <Separator />
              <Link href={`/admin/users/${data.userId}`} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                Ver perfil completo →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Solicitud de origen */}
        {data.applicationId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> Solicitud de origen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground font-mono">#{data.applicationId.slice(0, 12)}</p>
              {data.approvalSnapshot && (
                <div className="space-y-2">
                  {data.approvalSnapshot.creditScore != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Score al aprobar</span>
                      <span className="text-sm font-mono font-bold">{data.approvalSnapshot.creditScore}</span>
                    </div>
                  )}
                  {data.approvalSnapshot.passportPoints != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Pts. pasaporte</span>
                      <span className="text-sm font-mono font-bold">{data.approvalSnapshot.passportPoints}</span>
                    </div>
                  )}
                </div>
              )}
              <Separator />
              <Link href={`/admin/applications/${data.applicationId}`} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                Ver solicitud →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Configuración de mora */}
        {data.penaltyConfig && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Configuración de mora del crédito
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Con la que se creó el crédito — queda fija aunque luego se actualice la configuración por defecto.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-sm font-medium">{data.penaltyConfig.name}</span>
                <Badge variant={data.penaltyConfig.isActive ? 'default' : 'outline'} className="text-[10px]">
                  {data.penaltyConfig.isActive ? 'Sigue siendo la config. por defecto' : 'Ya no es la config. por defecto'}
                </Badge>
              </div>
              {data.penaltyConfig.ranges.length > 0 && (
                <div className="rounded-md border overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Rango</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Valor</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.penaltyConfig.ranges.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center gap-1.5">
                              {r.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />}
                              Día {r.fromDay}{r.toDay ? `–${r.toDay}` : '+'}
                            </span>
                          </td>
                          <td className="py-2 px-3">{r.type === 'PERCENTAGE' ? 'Porcentaje' : 'Fijo'}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            {r.type === 'PERCENTAGE' ? `${r.value}%` : formatCurrency(r.value)}
                          </td>
                          <td className="py-2 px-3">{r.base === 'INSTALLMENT' ? 'Cuota' : r.base === 'PRINCIPAL' ? 'Capital' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DataField({ label, value, bold, mono, alert, valueClassName }: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  alert?: boolean;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono text-xs' : ''} ${alert ? 'text-red-600' : ''} ${valueClassName ?? ''}`}>
        {value}
      </p>
    </div>
  );
}
