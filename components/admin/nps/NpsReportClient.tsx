'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  RefreshCw,
  Loader2,
  X,
  Users,
} from 'lucide-react';
import {
  DEFAULT_NPS_RANGES,
  type NpsDistributionResponse,
  type UserNpsSurveyItem,
} from '@/modules/admin';

const RANGE_VISUALS: Record<string, { label: string; text: string; border: string; bg: string; dot: string }> = {
  detractors: {
    label: 'Detractores',
    text: 'text-red-700',
    border: 'border-red-200',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
  },
  passives: {
    label: 'Pasivos',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
  },
  promoters: {
    label: 'Promotores',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
  },
};

interface NpsReportClientProps {
  distribution: NpsDistributionResponse | null;
  surveys: {
    data: UserNpsSurveyItem[];
    pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  };
  userName: string | null;
  documentNumber: string | null;
  currentDni: string;
}

function classifyRange(min: number): string {
  if (min >= 9) return 'promoters';
  if (min >= 7) return 'passives';
  return 'detractors';
}

function calculateNpsScore(distribution: NpsDistributionResponse | null): number | null {
  if (!distribution) return null;
  const promoters = distribution.ranges.find((r) => r.min >= 9);
  const detractors = distribution.ranges.find((r) => r.max <= 6);
  const promotersPercentage = promoters?.percentage ?? 0;
  const detractorsPercentage = detractors?.percentage ?? 0;
  return Math.round(promotersPercentage - detractorsPercentage);
}

export function NpsReportClient({
  distribution,
  surveys,
  userName,
  documentNumber,
  currentDni,
}: NpsReportClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [dni, setDni] = useState(currentDni);

  const npsScore = useMemo(() => calculateNpsScore(distribution), [distribution]);

  const updateUrl = useCallback(
    (newParams: URLSearchParams) => {
      startTransition(() => {
        router.push(`/admin/nps?${newParams.toString()}`);
      });
    },
    [router]
  );

  const handleSearchDni = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (dni.trim()) params.set('dni', dni.trim());
    else params.delete('dni');

    updateUrl(params);
  }, [searchParams, dni, updateUrl]);

  const handleClearDni = useCallback(() => {
    setDni('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('dni');
    params.set('page', '1');
    updateUrl(params);
  }, [searchParams, updateUrl]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    updateUrl(params);
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('size', String(newSize));
    params.set('page', '1');
    updateUrl(params);
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const columns: ColumnDef<UserNpsSurveyItem, unknown>[] = [
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.original.score;
        const variant: 'default' | 'success' | 'warning' | 'destructive' =
          score >= 9 ? 'success' : score >= 7 ? 'warning' : 'destructive';
        return <Badge variant={variant}>{score}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleString('es-PE')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {/* NPS Score KPI */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">NPS Score</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-extrabold tracking-tight text-foreground">
                  {npsScore ?? 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                % Promotores − % Detractores
              </p>
            </div>

            {distribution && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {distribution.total_responses} respuestas en total
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Escala del 1 al 10
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribución NPS */}
      {distribution && distribution.ranges.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {distribution.ranges.map((range, index) => {
            const key = classifyRange(range.min);
            const defaultConfig = DEFAULT_NPS_RANGES.find((r) => r.key === key) ?? DEFAULT_NPS_RANGES[0];
            const visuals = RANGE_VISUALS[key] ?? {
              label: defaultConfig.label,
              text: 'text-slate-700',
              border: 'border-slate-200',
              bg: 'bg-slate-50',
              dot: 'bg-slate-400',
            };
            return (
              <Card
                key={index}
                className={`border ${visuals.border} ${visuals.bg}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${visuals.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${visuals.text}`}>
                        {visuals.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {defaultConfig.description}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">
                          {range.percentage.toFixed(0)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {range.count} resp.
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Scores {range.min}-{range.max}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Búsqueda y resultados del cliente */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Respuestas del cliente</CardTitle>
              <CardDescription>
                {documentNumber
                  ? `${surveys.pagination.totalItems} respuestas encontradas para ${userName ?? '—'} — DNI ${documentNumber}`
                  : 'Busca un cliente por DNI para ver sus respuestas NPS'}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por DNI"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchDni();
                  }}
                  disabled={isPending}
                  className="pl-9 h-10 text-sm w-56"
                />
              </div>
              <Button size="sm" onClick={handleSearchDni} disabled={isPending} className="h-10 text-sm gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
              {documentNumber && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDni}
                  disabled={isPending}
                  className="h-10 px-2 text-muted-foreground"
                  aria-label="Quitar filtro de cliente"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {!documentNumber ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-foreground">Ningún cliente seleccionado</p>
              <p className="text-xs mt-1">Ingresa el DNI y presiona Buscar para ver sus respuestas.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={surveys.data}
              pagination={surveys.pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              enableExport={true}
              exportFileName="nps_respuestas_cliente.xlsx"
              getExportData={() => surveys.data}
              exportFilterLabel={documentNumber ? `Cliente: ${userName ?? '—'} — DNI ${documentNumber}` : undefined}
              isLoading={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
