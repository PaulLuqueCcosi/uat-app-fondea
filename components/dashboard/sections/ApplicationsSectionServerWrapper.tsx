import { getApplicationsAction } from '@/app/actions/application.actions';
import { ApplicationsSectionServer } from './ApplicationsSectionServer';

export async function ApplicationsSectionServerWrapper() {
  const applicationsData = await getApplicationsAction();
  return <ApplicationsSectionServer applications={applicationsData?.applications ?? []} />;
}
