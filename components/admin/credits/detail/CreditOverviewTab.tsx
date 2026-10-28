import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar, MapPin, AlertTriangle, Shield, Banknote, User,
} from 'lucide-react';
import { getDepartment, getProvince, getDistrict } from 'ubigeo-fns';
import type { AdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';
import type { PayoffCertificate } from '@/modules/admin/admin-constancias.types';
import { CreditCertificateCard } from './CreditCertificateCard';
import { DataRow } from '@/components/ui/data-row';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/admin-formatters';
import type { PenaltyBreakdownItem } from '@/modules/admin/admin-credit-detail.service';
import { PenaltyBreakdownTable } from './PenaltyBreakdownTable';
import { PenaltyStageMatrix } from './PenaltyStageMatrix';

interface Props {
  data: AdminCreditSummary;
  /** Null si el crédito no tiene constancia (no PAID_OFF, no STANDARD, o aún no se emitió). */
  certificate: PayoffCertificate | null;
  /** Mora del crédito por concepto (vista admin). */
  penaltyBreakdown?: PenaltyBreakdownItem[];
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

export function CreditOverviewTab({ data, certificate, penaltyBreakdown = [] }: Props) {
  const ubigeoNames = resolveUbigeoNames(data.ubigeoRegion, data.ubigeoProvince, data.ubigeoDistrict);
  const currentUbigeoNames = resolveUbigeoNames(data.currentUbigeoRegion, data.currentUbigeoProvince, data.currentUbigeoDistrict);

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
              <DataRow
                label={data.creditType === 'NEGOTIATION' ? 'Vigente desde' : 'Desembolso'}
                value={formatDateTime(data.disbursedAt)}
              />
              <DataRow label="Primera cuota" value={formatDate(data.firstDueDate)} />
              <DataRow label="Vencimiento final" value={formatDate(data.maturityDate)} />
              <DataRow label="En mora desde" value={data.overdueSince ? formatDate(data.overdueSince) : '—'} alert={!!data.overdueSince} />
              <DataRow label="Cerrado" value={data.closedAt ? formatDateTime(data.closedAt) : '—'} />
              <DataRow label="Creado" value={formatDateTime(data.createdAt)} />
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
                <DataRow label="Monto" value={formatCurrency(data.disbursement.amount)} bold />
                <DataRow label="Método" value={data.disbursement.method ?? '—'} />
                <DataRow
                  label="Estado"
                  value={DISBURSEMENT_STATUS[data.disbursement.status]?.label ?? data.disbursement.status}
                  valueClassName={DISBURSEMENT_STATUS[data.disbursement.status]?.color}
                />
                <DataRow label="Banco destino" value={data.disbursement.destinationBank ?? '—'} />
                <DataRow label="Cuenta" value={data.disbursement.destinationAccount ?? '—'} mono />
                <DataRow label="Titular" value={data.disbursement.destinationHolder ?? '—'} />
                <DataRow label="Referencia" value={data.disbursement.referenceNumber ?? '—'} mono />
                <DataRow label="Fecha envío" value={formatDateTime(data.disbursement.disbursedAt)} />
                <DataRow label="Reintentos" value={`${data.disbursement.retryCount}`} />
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

        {/* Ubicación de expediente — dirección declarada por el usuario */}
        {(data.ubigeoRegion || data.ubigeoProvince || data.ubigeoDistrict) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Ubicación de expediente
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Dirección declarada por el usuario (snapshot al desembolso)</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <DataRow label="Región" value={ubigeoNames.region ?? '—'} />
                <DataRow label="Provincia" value={ubigeoNames.province ?? '—'} />
                <DataRow label="Distrito" value={ubigeoNames.district ?? '—'} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ubicación actual — GPS/IP capturada al momento del submit de la solicitud */}
        {(data.currentUbigeoRegion || data.currentUbigeoProvince || data.currentUbigeoDistrict
          || data.currentLocationLat != null) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Ubicación actual (GPS/IP)
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Ubicación real desde donde se envió la solicitud — distinta de la de expediente
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <DataRow label="Región" value={currentUbigeoNames.region ?? '—'} />
                <DataRow label="Provincia" value={currentUbigeoNames.province ?? '—'} />
                <DataRow label="Distrito" value={currentUbigeoNames.district ?? '—'} />
              </div>
              {data.currentLocationLat != null && data.currentLocationLng != null && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <DataRow label="Latitud" value={data.currentLocationLat.toFixed(5)} mono />
                  <DataRow label="Longitud" value={data.currentLocationLng.toFixed(5)} mono />
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* Col 3: Sidebar */}
      <div className="space-y-4">
        {/* Constancia de No Adeudo — solo relevante si el crédito ya se liquidó */}
        {data.status === 'PAID_OFF' && <CreditCertificateCard certificate={certificate} />}

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

        {/* Mora por concepto del crédito (admin) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mora por concepto</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Suma de las cuotas que este crédito cobra directamente.
            </p>
          </CardHeader>
          <CardContent>
            <PenaltyBreakdownTable items={penaltyBreakdown} />
          </CardContent>
        </Card>

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
              {data.penaltyConfig.stages.length > 0 && (
                <PenaltyStageMatrix stages={data.penaltyConfig.stages} />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
