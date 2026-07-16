'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook genérico para fetch de un KPI individual.
 * Cada card llama a su propio endpoint y puede refrescar independientemente.
 */
export function useKpi<T>(kpiName: string, days: number = 30) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/kpis/${kpiName}?days=${days}`);
      if (!res.ok) {
        setError(`Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }, [kpiName, days]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}
