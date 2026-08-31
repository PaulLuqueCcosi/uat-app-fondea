'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  History, CheckCircle2, XCircle, User, ShieldCheck, Cog,
  ChevronDown, ChevronRight, Code2,
} from 'lucide-react';
import type { CreditAuditEntry, CreditAuditModule, CreditActorType } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  /** Entradas tal como vienen del backend (orden ASC por occurredAt). */
  entries: CreditAuditEntry[];
}

const MODULE_LABELS: Record<CreditAuditModule, string> = {
  CORE: 'Crédito',
  PAYMENT: 'Pagos',
  PENALTY: 'Mora',
  NEGOTIATION: 'Negociación',
  AUDIT: 'Auditoría',
};

const MODULE_BADGE_VARIANT: Record<CreditAuditModule, 'default' | 'secondary' | 'outline'> = {
  CORE: 'default',
  PAYMENT: 'secondary',
  PENALTY: 'secondary',
  NEGOTIATION: 'secondary',
  AUDIT: 'outline',
};

const ACTOR_ICON: Record<CreditActorType, React.ElementType> = {
  SYSTEM: Cog,
  USER: User,
  ADMIN: ShieldCheck,
};

const ACTOR_LABELS: Record<CreditActorType, string> = {
  SYSTEM: 'Sistema',
  USER: 'Usuario',
  ADMIN: 'Admin',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/**
 * Nombres en español para los tipos de evento.
 *
 * Sin esto el fallback humaniza el enum ("Payment Declaration Approved"), que se lee pero
 * queda en inglés y con el vocabulario interno del backend. Solo hace falta declarar los
 * que aparecen seguido — el resto sigue usando el fallback.
 */
const EVENT_TYPE_LABELS: Record<string, string> = {
  // ── Ciclo de vida del crédito ──
  CREDIT_CREATED: 'Crédito creado',
  DISBURSEMENT_COMPLETED: 'Desembolso completado',
  CREDIT_STATUS_CHANGED: 'Cambio de estado',
  CREDIT_CLOSED: 'Crédito liquidado',
  CREDIT_SUSPENDED: 'Crédito suspendido',
  CREDIT_REACTIVATED: 'Crédito reactivado',
  CREDIT_WRITTEN_OFF: 'Crédito castigado',
  INTEREST_REPORTED_TO_FUND: 'Ganancia reportada al fondo',
  LOSS_REPORTED_TO_FUND: 'Pérdida reportada al fondo',
  CREDIT_RESULT_REPORTED_TO_FUND: 'Resultado reportado al fondo',
  CREDIT_CREATION_FAILED: 'Falló la creación del crédito',

  // ── Pagos y comprobantes ──
  PAYMENT_DECLARATION_SUBMITTED: 'Comprobante enviado por el cliente',
  PAYMENT_DECLARATION_APPROVED: 'Comprobante aprobado',
  PAYMENT_DECLARATION_REJECTED: 'Comprobante rechazado',
  PAYMENT_APPLIED: 'Pago aplicado',
  INSTALLMENT_PAID: 'Cuota liquidada',
  PAYMENT_FAILED: 'Falló el pago',

  // ── Mora ──
  INSTALLMENT_ACTIVATED: 'Cuota activada',
  INSTALLMENT_OVERDUE: 'Cuota vencida',
  PENALTY_ACCRUED: 'Mora acumulada',
  PENALTY_PROCESSING_FAILED: 'Falló el cálculo de mora',

  // ── Negociación ──
  NEGOTIATION_CREDIT_CREATED: 'Crédito de refinanciamiento creado',
  INSTALLMENT_NEGOTIATED: 'Cuota refinanciada',

  // ── Auditoría ──
  AUDIT_PERSIST_ERROR: 'Error al registrar auditoría',
};

function humanizeEventType(eventType: string) {
  return EVENT_TYPE_LABELS[eventType]
    ?? eventType
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function CreditTimelineSection({ entries }: Props) {
  // Más reciente primero — es lo que un admin quiere ver al entrar a la pestaña.
  const ordered = [...entries].reverse();

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <History className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sin eventos de auditoría registrados para este crédito.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Línea de tiempo de auditoría</h3>
        <Badge variant="outline" className="text-[10px] ml-auto">{entries.length} eventos</Badge>
      </div>

      <ol className="relative space-y-0">
        {ordered.map((entry, idx) => (
          <TimelineRow key={entry.id} entry={entry} isLast={idx === ordered.length - 1} />
        ))}
      </ol>
    </div>
  );
}

function TimelineRow({ entry, isLast }: { entry: CreditAuditEntry; isLast: boolean }) {
  const [showDetail, setShowDetail] = useState(false);
  const success = entry.outcome === 'SUCCESS';
  const ActorIcon = ACTOR_ICON[entry.actorType];
  const parsedDetail = entry.detail ? tryParseJson(entry.detail) : null;

  return (
    <li className="relative pl-8 pb-5">
      {/* Línea vertical conectando los puntos */}
      {!isLast && (
        <span className="absolute left-[9px] top-5 bottom-0 w-px bg-border" aria-hidden />
      )}
      {/* Punto de estado */}
      <span
        className={`absolute left-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
          success ? 'bg-success-50 text-success-700' : 'bg-destructive/10 text-destructive'
        }`}
      >
        {success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      </span>

      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
        <Badge variant={MODULE_BADGE_VARIANT[entry.module]} className="text-[10px]">
          {MODULE_LABELS[entry.module]}
        </Badge>
        <span className="text-xs font-mono text-muted-foreground">{humanizeEventType(entry.eventType)}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <ActorIcon className="h-3 w-3" /> {ACTOR_LABELS[entry.actorType]}
        </span>
      </div>

      <p className="text-sm">{entry.message ?? entry.eventType}</p>

      <div className="flex items-center gap-3 mt-1">
        <span className="text-[11px] text-muted-foreground">{formatDateTime(entry.occurredAt)}</span>
        {entry.refId && (
          <span className="text-[11px] text-muted-foreground font-mono">
            ref: {entry.refId.slice(0, 8)}…
          </span>
        )}
        {entry.detail && (
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <Code2 className="h-3 w-3" />
            Ver detalle
            {showDetail ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
      </div>

      {showDetail && entry.detail && (
        <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted/50 p-3 text-[11px] leading-relaxed">
          {parsedDetail !== null ? JSON.stringify(parsedDetail, null, 2) : entry.detail}
        </pre>
      )}
    </li>
  );
}
