import { getUserScoreEvaluations, getUserBuroReport } from '@/modules/admin';
import { formatDate } from '@/components/admin/users/score-format';
import { ScoreTab } from '@/components/admin/users/ScoreTab';

export default async function AdminUserScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [evaluations, buro] = await Promise.all([
    getUserScoreEvaluations(id),
    getUserBuroReport(id),
  ]);

  const evaluationDates = Object.fromEntries(evaluations.map((e) => [e.id, formatDate(e.createdAt)]));

  return (
    <ScoreTab
      userId={id}
      evaluations={evaluations}
      evaluationDates={evaluationDates}
      buro={buro}
      buroConsultedAtDisplay={buro ? formatDate(buro.consultedAt) : null}
      buroExpiresAtDisplay={buro ? formatDate(buro.expiresAt) : null}
    />
  );
}
