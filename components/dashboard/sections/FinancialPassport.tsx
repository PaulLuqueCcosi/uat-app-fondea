'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PassportFlipBook } from '@/components/passport/PassportFlipBook';
import { PassportErrorRouter } from '@/components/passport/PassportErrorStates';
import { getPassportSummary } from '@/app/actions/passport.actions';
import type { PassportSummary, PassportError } from '@/modules/passport';

type Status = 'loading' | 'success' | 'error';

/**
 * Pasaporte Financiero — Sección del dashboard.
 * Client component que fetchea datos via server action y muestra skeleton mientras carga.
 */
export function FinancialPassport() {
  const [status, setStatus] = useState<Status>('loading');
  const [summary, setSummary] = useState<PassportSummary | null>(null);
  const [error, setError] = useState<PassportError | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setStatus('loading');
    const result = await getPassportSummary();
    if (result.ok) {
      setSummary(result.data);
      setStatus('success');
    } else {
      setError(result.error as PassportError);
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return <FinancialPassportSkeleton />;
  }

  if (status === 'error' && error) {
    return <PassportErrorRouter error={error} onRetry={fetchData} />;
  }

  if (!summary) return null;

  return <PassportFlipBook summary={summary} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FinancialPassportSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex gap-1 rounded-xl overflow-hidden shadow-lg">
        <Skeleton className="w-[200px] h-[270px] md:w-[280px] md:h-[380px] rounded-none" />
        <Skeleton className="w-[200px] h-[270px] md:w-[280px] md:h-[380px] rounded-none hidden md:block" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-3 w-28 hidden sm:block" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
