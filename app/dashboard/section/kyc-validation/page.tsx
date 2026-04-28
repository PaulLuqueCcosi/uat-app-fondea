import { FunnelKYCValidation } from '@/components/forms/funnel/FunnelKYCValidation';

export default function DashboardKYCValidationPage() {
  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelKYCValidation dashboardMode={true} />
      </div>
    </div>
  );
}