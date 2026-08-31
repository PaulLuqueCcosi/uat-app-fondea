'use client';

import { useCallback, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, BarChart3, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MarketingTabsProps {
  referralsCount: number;
  funnelContent: ReactNode;
  analyticsContent: ReactNode;
  referralsContent: ReactNode;
}

export function MarketingTabs({
  referralsCount,
  funnelContent,
  analyticsContent,
  referralsContent,
}: MarketingTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'funnel';

  const handleTabChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`/admin/marketing?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-3 w-full max-w-lg">
        <TabsTrigger value="funnel" className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Funnel
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="referrals" className="gap-1.5">
          <Gift className="h-3.5 w-3.5" />
          Referidos
          {referralsCount > 0 && (
            <span className="ml-1 rounded-full bg-primary text-white text-[10px] px-1.5 py-0.5 leading-none">
              {referralsCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="funnel" className="mt-6">{funnelContent}</TabsContent>
      <TabsContent value="analytics" className="mt-6">{analyticsContent}</TabsContent>
      <TabsContent value="referrals" className="mt-6">{referralsContent}</TabsContent>
    </Tabs>
  );
}
