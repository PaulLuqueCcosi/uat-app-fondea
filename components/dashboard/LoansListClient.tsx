'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import { DeleteApplicationButton } from './sections/DeleteApplicationButton';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    SUBMITTED: 'Enviada',
    PROCESSING: 'En evaluación',
    PRE_APPROVED: 'Pre-aprobada',
    PENDING_DOCUMENTS: 'Pendiente de docs',
    PENDING_SIGNATURE: 'Pendiente de firma',
    APPROVED: 'Aprobada',
    REJECTED_BY_USER: 'Rechazada por usuario',
    REJECTED: 'Rechazada',
    FAILED: 'Fallida',
    BLOCKED: 'Bloqueada',
    EXPIRED: 'Expirada',
  };
  return map[status] ?? status;
}

function getStatusVariant(status: ApplicationStatus): 'success' | 'completed' | 'warning' | 'pending' | 'error' {
  switch (status) {
    case 'APPROVED':
    case 'PRE_APPROVED':
      return 'success';
    case 'SUBMITTED':
    case 'PROCESSING':
    case 'PENDING_DOCUMENTS':
    case 'PENDING_SIGNATURE':
      return 'warning';
    case 'REJECTED':
    case 'REJECTED_BY_USER':
    case 'FAILED':
    case 'BLOCKED':
    case 'EXPIRED':
      return 'error';
    default:
      return 'pending';
  }
}

// ── Filtros ───────────────────────────────────────────────────────────────────

type FilterKey = 'ALL' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

interface FilterDef {
  key: FilterKey;
  label: string;
  statuses: ApplicationStatus[] | null; // null = todos
}

const FILTERS: FilterDef[] = [
  { key: 'ALL', label: 'Todas', statuses: null },
  {
    key: 'IN_PROGRESS',
    label: 'En curso',
    statuses: ['SUBMITTED', 'PROCESSING', 'PRE_APPROVED', 'PENDING_DOCUMENTS', 'PENDING_SIGNATURE'],
  },
  { key: 'APPROVED', label: 'Aprobadas', statuses: ['APPROVED'] },
  {
    key: 'REJECTED',
    label: 'Rechazadas',
    statuses: ['REJECTED', 'REJECTED_BY_USER', 'FAILED', 'BLOCKED'],
  },
  { key: 'EXPIRED', label: 'Expiradas', statuses: ['EXPIRED'] },
];

// ── Componente ────────────────────────────────────────────────────────────────

interface LoansListClientProps {
  applications: ApplicationRecord[];
}

export function LoansListClient({ applications }: LoansListClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  const filtered = useMemo(() => {
    const def = FILTERS.find((f) => f.key === activeFilter);
    if (!def || def.statuses === null) return applications;
    return applications.filter((app) => def.statuses!.includes(app.status));
  }, [applications, activeFilter]);

  const counts = useMemo(() => {
    const result: Record<FilterKey, number> = {
      ALL: applications.length,
      IN_PROGRESS: 0,
      APPROVED: 0,
      REJECTED: 0,
      EXPIRED: 0,
    };
    for (const app of applications) {
      for (const f of FILTERS) {
        if (f.key === 'ALL') continue;
        if (f.statuses?.includes(app.status)) {
          result[f.key]++;
        }
      }
    }
    return result;
  }, [applications]);

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const count = counts[f.key];
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              {f.label}
              <span
                className={cn(
                  'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-semibold',
                  isActive ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Listado */}
      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-dark">Mis Solicitudes</h2>
          <span className="ml-auto text-xs text-fondea-text">
            {filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'}
          </span>
        </div>

        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-fondea-text mb-3">
                {applications.length === 0
                  ? 'Aún no tienes solicitudes'
                  : 'No hay solicitudes en esta categoría'}
              </p>
              {applications.length === 0 && (
                <Link
                  href="/solicitar"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Crear primera solicitud
                </Link>
              )}
            </div>
          ) : (
            filtered.map((app) => (
              <Link
                key={app.id}
                href={`/solicitudes/${app.id}`}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-background transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">
                    Solicitud #{app.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-fondea-text">
                    {app.submittedAt ? formatDate(app.submittedAt) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DeleteApplicationButton applicationId={app.id} />
                  <Badge variant={getStatusVariant(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-fondea-text" />
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
