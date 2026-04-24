import { FunnelEconomicProfile } from '@/components/funnel/FunnelEconomicProfile';
import { FunnelEconomicProfileShadcn } from '@/components/funnel/FunnelEconomicProfileShadcn';

export default function FunnelEconomicPage() {
  return (
    <div className='py-4'>
      <div className='mx-auto w-fit px-4 sm:px-6 lg:px-8'>
        <FunnelEconomicProfileShadcn />
      </div>
    </div>
  );
  // return <FunnelEconomicProfile />;
}
