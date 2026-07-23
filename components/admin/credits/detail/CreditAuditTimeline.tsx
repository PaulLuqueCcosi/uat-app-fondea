import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CreditCard, Receipt, AlertTriangle, RotateCcw } from 'lucide-react';
import type { AdminCreditFullDetail, CreditAuditEventInfo, InstallmentAuditEventInfo } from '@/modules/admin/admin-credit-detail.service';

interface CreditAuditTimelineProps {
  data: AdminCreditFullDetail;
}

function getEventIcon(eventType: string) {
  const type = eventType.toUpperCase();
  if (type.includes('PAYMENT')) return Receipt;
  if (type.includes('DISBURSEMENT')) return CreditCard;
  if (type.includes('OVERDUE') || type.includes('DEFAULT')) return AlertTriangle;
  if (type.includes('REVERSAL')) return RotateCcw;
  return Clock;
}

function formatEvent(e: CreditAuditEventInfo | InstallmentAuditEventInfo) {
  const isInstallment = 'installment_no' in e;
  return {
    id: e.id,
    title: e.description,
    subtitle: isInstallment ? `Cuota ${(e as InstallmentAuditEventInfo).installment_no}` : 'Crédito',
    triggeredBy: e.triggered_by,
    createdAt: e.created_at,
    icon: getEventIcon(e.event_type),
  };
}

export function CreditAuditTimeline({ data }: CreditAuditTimelineProps) {
  const allEvents = [
    ...data.credit_audit_events.map((e) => ({ ...formatEvent(e), scope: 'Crédito' as const })),
    ...data.installment_audit_events.map((e) => ({ ...formatEvent(e), scope: 'Cuota' as const })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" /> Historial de eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin eventos registrados</p>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            {allEvents.map((event) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="relative flex gap-3">
                  <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                    <Icon className="h-2 w-2 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(event.createdAt).toLocaleString('es-PE')}
                      <span className="mx-1">·</span>
                      <span className="font-mono">{event.triggeredBy}</span>
                      <span className="mx-1">·</span>
                      <span>{event.scope}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
