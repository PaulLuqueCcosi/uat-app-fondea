import { getApplication } from '@/app/actions/loan.actions';
import { FunnelSummary } from '@/components/funnel/FunnelSummary';

export default async function FunnelSummaryPage() {
  const application = await getApplication();
  return <FunnelSummary application={application} />;
}
