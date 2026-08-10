'use client';

import { useCallback, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Handshake, MapPin, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CollectionsTabsProps {
  moraCount: number;
  agreementsCount: number;
  moraContent: ReactNode;
  agreementsContent: ReactNode;
  mapContent: ReactNode;
  analyticsContent: ReactNode;
}

export function CollectionsTabs({
  moraCount,
  agreementsCount,
  moraContent,
  agreementsContent,
  mapContent,
  analyticsContent,
}: CollectionsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'mora';

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`/admin/collections?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-4 w-full max-w-2xl">
        <TabsTrigger value="mora" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Mora
          {moraCount > 0 && (
            <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5 leading-none">
              {moraCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="agreements" className="gap-1.5">
          <Handshake className="h-3.5 w-3.5" />
          Acuerdos
          {agreementsCount > 0 && (
            <span className="ml-1 rounded-full bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 leading-none">
              {agreementsCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="map" className="gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Mapa NPL
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="mora" className="mt-6">{moraContent}</TabsContent>
      <TabsContent value="agreements" className="mt-6">{agreementsContent}</TabsContent>
      <TabsContent value="map" className="mt-6">{mapContent}</TabsContent>
      <TabsContent value="analytics" className="mt-6">{analyticsContent}</TabsContent>
    </Tabs>
  );
}
