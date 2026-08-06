import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getEvaluationDetail } from '@/modules/admin';
import { getActiveSummary, getVersionById } from '@/modules/admin/calculator-admin.service';
import type { AvailabilityConfig, ScoreRange } from '@/modules/admin/calculator-admin.service';
import { EvaluationBreakdown, type AvailabilityMatch } from '@/components/admin/users/EvaluationBreakdown';
import { formatDateTime } from '@/components/admin/users/score-format';

export default async function AdminUserEvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string; evaluationId: string }>;
}) {
  const { id, evaluationId } = await params;
  const evaluation = await getEvaluationDetail(evaluationId);

  if (!evaluation || evaluation.userId !== id) notFound();

  // Cruce con los rangos de score de la Disponibilidad activa (calculadora de
  // pricing — servicio aparte, ver modules/admin/calculator-admin.service.ts).
  // Puramente informativo: si el calculator no responde, la página de score
  // sigue funcionando igual, solo sin este dato.
  let availabilityMatch: AvailabilityMatch | null = null;
  const summary = await getActiveSummary();
  const activeAvailability = summary?.AVAILABILITY ?? null;
  if (activeAvailability) {
    const full = await getVersionById('AVAILABILITY', activeAvailability.id);
    const data = full?.data as AvailabilityConfig | undefined;
    const ranges: ScoreRange[] = data?.scoreRanges ?? [];
    const range = ranges.find((r) => evaluation.totalScore >= r.minScore && evaluation.totalScore <= r.maxScore) ?? null;
    availabilityMatch = {
      range,
      configId: activeAvailability.id,
      configVersion: activeAvailability.version,
    };
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/users/${id}/score`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al score
      </Link>
      <EvaluationBreakdown
        evaluation={evaluation}
        createdAtDisplay={formatDateTime(evaluation.createdAt)}
        availabilityMatch={availabilityMatch}
      />
    </div>
  );
}
