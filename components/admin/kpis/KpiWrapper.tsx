'use client';

import { useState, useCallback, useEffect, ReactNode } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Wrapper genérico para KPIs con fetch individual + refresh.
 * Cada card llama SOLO a su propio endpoint.
 */
interface KpiWrapperProps<T> {
  /** URL del endpoint del backend (relativa, ej: "/api/v1/admin/dashboard-kpis/active-loans") */
  endpoint: string;
  /** Query params opcionales (ej: "?days=30") */
  params?: string;
  /** Render function que recibe la data */
  render: (data: T) => ReactNode;
  /** Render de error */
  errorLabel: string;
  /** Clase CSS del contenedor */
  className?: string;
}

export function KpiCard<T>({ endpoint, params = '', render, errorLabel, className = '' }: KpiWrapperProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/kpis${endpoint}${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return <div className={`h-32 bg-muted animate-pulse rounded-lg ${className}`} />;
  }

  if (error && !data) {
    return (
      <div className={`h-32 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 ${className}`}>
        <p className="text-xs text-muted-foreground">{errorLabel}</p>
        <p className="text-xs text-red-500">Error al cargar</p>
        <Button variant="ghost" size="sm" onClick={fetchData} className="h-6 text-[10px]">
          <RotateCcw className="h-3 w-3 mr-1" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`relative group ${className}`}>
      {render(data)}
      <Button
        variant="ghost"
        size="icon"
        onClick={fetchData}
        disabled={loading}
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Refrescar este KPI"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RotateCcw className="h-3 w-3" />
        )}
      </Button>
      {loading && data && (
        <div className="absolute inset-0 bg-background/40 rounded-lg" />
      )}
    </div>
  );
}
