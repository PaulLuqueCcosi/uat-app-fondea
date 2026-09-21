'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  History, CheckCircle2, XCircle, User, ShieldCheck, Cog,
  ChevronDown, ChevronRight, Code2,
} from 'lucide-react';
import { formatDateTime } from '@/lib/admin-formatters';

/**
 * Generic audit timeline entry — compatible with both Application and Credit audit schemas.
 */
export interface AuditTimelineEntry {
  id: string;
  eventType: string;
  module: string;
  actorType: string;
  outcome: string;
  message: string | null;
  detail: string | null;
  occurredAt: string;
  refId: string | null;
}

interface AuditTimelineProps {
  entries: AuditTimelineEntry[];
  moduleLabels: Record<string, { label: string; color: string }>;
  eventLabels?: Record<string, string>;
  emptyMessage?: string;
  refIdSuffix?: (entry: AuditTimelineEntry) => string | null;
}

const ACTOR_ICON: Record<string, React.ElementType> = {
  SYSTEM: Cog,
  USER: User,
  ADMIN: ShieldCheck,
};

const ACTOR_LABELS: Record<string, string> = {
  SYSTEM: 'Sistema',
  USER: 'Usuario',
  ADMIN: 'Admin',
};

function humanizeEventType(eventType: string, eventLabels?: Record<string, string>) {
  if (eventLabels && eventLabels[eventType]) {
    return eventLabels[eventType];
  }
  return eventType
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

export function AuditTimeline({
  entries,
  moduleLabels,
  eventLabels,
  emptyMessage = 'Sin eventos de auditoría registrados.',
  refIdSuffix,
}: AuditTimelineProps) {
  // Más reciente primero — es lo que un admin quiere ver al entrar a la pestaña.
  const ordered = [...entries].reverse();

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center bg-card">
        <History className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Línea de tiempo de auditoría</h3>
        <Badge variant="outline" className="text-[10px] ml-auto">{entries.length} eventos</Badge>
      </div>

      <ol className="relative space-y-0">
        {ordered.map((entry, idx) => (
          <TimelineRow
            key={entry.id}
            entry={entry}
            isLast={idx === ordered.length - 1}
            moduleLabels={moduleLabels}
            eventLabels={eventLabels}
            refIdSuffix={refIdSuffix}
          />
        ))}
      </ol>
    </div>
  );
}

function TimelineRow({
  entry,
  isLast,
  moduleLabels,
  eventLabels,
  refIdSuffix,
}: {
  entry: AuditTimelineEntry;
  isLast: boolean;
  moduleLabels: Record<string, { label: string; color: string }>;
  eventLabels?: Record<string, string>;
  refIdSuffix?: (entry: AuditTimelineEntry) => string | null;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const success = entry.outcome === 'SUCCESS';
  const ActorIcon = ACTOR_ICON[entry.actorType] ?? Cog;
  const parsedDetail = entry.detail ? tryParseJson(entry.detail) : null;

  const moduleConfig = moduleLabels[entry.module] ?? { label: entry.module, color: 'default' };
  const badgeVariant = moduleConfig.color as 'default' | 'secondary' | 'outline';

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
        <Badge variant={badgeVariant} className="text-[10px]">
          {moduleConfig.label}
        </Badge>
        <span className="text-xs font-mono text-muted-foreground">{humanizeEventType(entry.eventType, eventLabels)}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <ActorIcon className="h-3 w-3" /> {ACTOR_LABELS[entry.actorType] ?? entry.actorType}
        </span>
      </div>

      <p className="text-sm">{entry.message ?? entry.eventType}</p>

      <div className="flex items-center gap-3 mt-1">
        <span className="text-[11px] text-muted-foreground">{formatDateTime(entry.occurredAt)}</span>
        {entry.refId && (
          <span className="text-[11px] text-muted-foreground font-mono">
            ref: {entry.refId.slice(0, 8)}…
            {refIdSuffix && refIdSuffix(entry)}
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
