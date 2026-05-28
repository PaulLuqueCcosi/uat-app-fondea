import { CreditCard, Briefcase, DollarSign, Users, MapPin, ChevronRight, Landmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getKYCData } from '@/app/actions/kyc.actions';
import { getLaborProfileStatus } from '@/app/actions/labor.actions';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { getAddressProfileStatus } from '@/app/actions/additional-address.actions';
import { getReferencesProfileStatus } from '@/app/actions/references.actions';
import { getBankAccountProfileStatus } from '@/app/actions/bank-account.actions';

interface ExpedienteSection {
  id: string;
  num: number;
  icon: React.ElementType;
  title: string;
  status: 'pending' | 'completed';
  path: string;
}

async function getExpedienteSections(): Promise<ExpedienteSection[]> {
  const [kyc, labor, economic, address, references, bankAccount] = await Promise.all([
    getKYCData(),
    getLaborProfileStatus(),
    getEconomicProfileStatus(),
    getAddressProfileStatus(),
    getReferencesProfileStatus(),
    getBankAccountProfileStatus(),
  ]);

  const kycVerified = kyc.data?.status === 'VERIFIED';

  return [
    { id: 'kyc', num: 1, icon: CreditCard, title: 'Verificación KYC', status: kycVerified ? 'completed' : 'pending', path: '/dashboard/section/kyc' },
    { id: 'labor', num: 2, icon: Briefcase, title: 'Perfil Laboral', status: labor.overall_verified ? 'completed' : 'pending', path: '/dashboard/section/labor' },
    { id: 'economic', num: 3, icon: DollarSign, title: 'Perfil Económico', status: economic.overall_verified ? 'completed' : 'pending', path: '/dashboard/section/economic' },
    { id: 'additional', num: 4, icon: MapPin, title: 'Info Adicional', status: address.overall_verified ? 'completed' : 'pending', path: '/dashboard/section/additional' },
    { id: 'references', num: 5, icon: Users, title: 'Referencias', status: references.overall_verified ? 'completed' : 'pending', path: '/dashboard/section/references' },
    { id: 'bank-account', num: 6, icon: Landmark, title: 'Cuenta Bancaria', status: bankAccount.overall_verified ? 'completed' : 'pending', path: '/dashboard/section/bank-account' },
  ];
}

async function ExpedienteContent() {
  const sections = await getExpedienteSections();
  const completedCount = sections.filter(s => s.status === 'completed').length;

  return (
    <Card>
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-dark">Mi Expediente</h2>
        <span className="ml-auto text-xs text-fondea-text">{completedCount}/{sections.length} completados</span>
      </div>
      <div className="divide-y divide-border">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                section.status === 'completed'
                  ? 'bg-secondary/20 text-success-600'
                  : 'bg-primary-50 text-primary'
              )}>
                {section.num}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={cn(
                  'text-xs sm:text-sm truncate',
                  section.status === 'completed' ? 'text-fondea-text line-through' : 'text-dark font-medium'
                )}>
                  {section.title}
                </span>
              </div>
              <Badge
                variant={section.status === 'completed' ? 'completed' : 'pending'}
                className="shrink-0 hidden sm:flex"
              />
              <a
                href={section.path}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 shrink-0"
              >
                <span className="hidden sm:inline">{section.status === 'completed' ? 'Editar' : 'Completar'}</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ExpedienteSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3">
            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-5 w-16 hidden sm:block shrink-0" />
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export const Expediente = Object.assign(ExpedienteContent, {
  Skeleton: ExpedienteSkeleton,
});
