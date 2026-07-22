'use client';

import { useSearchParams } from 'next/navigation';
import { RuleEditorPage } from '@/components/admin/evaluation-rules/RuleEditorPage';

export default function NewEvaluationRulePage() {
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from') ?? undefined;

  return <RuleEditorPage duplicateFromId={fromId} />;
}
