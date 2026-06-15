'use client';

import { useEffect, useState } from 'react';
import { Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PassportFlipBook } from '@/components/passport/PassportFlipBook';
import { PassportErrorRouter } from '@/components/passport/PassportErrorStates';
import { getPassportSummary } from '@/app/actions/passport.actions';
import type { PassportSummary, PassportError } from '@/modules/passport';

type Status = 'loading' | 'success' | 'error';

/**
 * Pasaporte Financiero — Sección del dashboard.
 * Envuelto en Card para coherencia con las demás secciones.
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Pasaporte Financiero
          </span>
        </CardTitle>
        <CardDescription>
          Tu nivel determina cuánto puedes solicitar. Gana puntos y desbloquea sellos.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {status === 'loading' && <FinancialPassportSkeleton />}
        {status === 'error' && error && (
          <PassportErrorRouter error={error} onRetry={fetchData} />
        )}
        {status === 'success' && summary && (
          <PassportFlipBook summary={summary} />
        )}
      </CardContent>

      <CardFooter>
        <Link
          href="/dashboard/pasaporte"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Ver pasaporte completo
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
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
