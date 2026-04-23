import FormLayout from '@/components/forms/labor';
import { FunnelLaborProfile } from '@/components/funnel/FunnelLaborProfile';
import { FunnelLaborProfileShadcn } from '@/components/funnel/FunnelLaborProfileShadcn';
import { Card, CardContent } from '@/components/ui/card';

export default function FunnelLaborPage() {
  // return <FunnelLaborProfileShadcn />;
  return (
    <div className='py-4'>
      <div className='mx-auto w-fit px-4 sm:px-6 lg:px-8'>
        <FunnelLaborProfileShadcn />
      </div>
    </div>);
  // return <FunnelLaborProfile />;
}
