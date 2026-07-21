import { RuleEditorPage } from '@/components/admin/evaluation-rules/RuleEditorPage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEvaluationRulePage({ params }: Props) {
  const { id } = await params;
  return <RuleEditorPage duplicateFromId={id} />;
}
