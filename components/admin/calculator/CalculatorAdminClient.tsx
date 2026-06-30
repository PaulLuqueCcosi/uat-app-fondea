'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvailabilityTab } from './tabs/AvailabilityTab';
import { FeeGroupsTab } from './tabs/FeeGroupsTab';
import { PricingRulesTab } from './tabs/PricingRulesTab';
import type {
  AvailabilityConfig,
  FeeGroup,
  PricingRulesConfig,
  ConfigEntry,
} from '@/modules/admin/calculator-admin.service';

interface CalculatorAdminClientProps {
  initialConfig: {
    AVAILABILITY: ConfigEntry<AvailabilityConfig>;
    FEE_GROUPS: ConfigEntry<FeeGroup[]>;
    PRICING_RULES: ConfigEntry<PricingRulesConfig>;
  } | null;
}

export function CalculatorAdminClient({ initialConfig }: CalculatorAdminClientProps) {
  if (!initialConfig) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive font-medium">
          No se pudo cargar la configuración del motor de pricing.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Verifica que el servicio de calculadora esté activo.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="availability" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
        <TabsTrigger value="fees">Tarifas</TabsTrigger>
        <TabsTrigger value="rules">Reglas de Precio</TabsTrigger>
      </TabsList>

      <TabsContent value="availability" className="mt-6">
        <AvailabilityTab
          data={initialConfig.AVAILABILITY.data}
          version={initialConfig.AVAILABILITY.version}
          updatedAt={initialConfig.AVAILABILITY.updatedAt}
        />
      </TabsContent>

      <TabsContent value="fees" className="mt-6">
        <FeeGroupsTab
          data={initialConfig.FEE_GROUPS.data}
          version={initialConfig.FEE_GROUPS.version}
          updatedAt={initialConfig.FEE_GROUPS.updatedAt}
        />
      </TabsContent>

      <TabsContent value="rules" className="mt-6">
        <PricingRulesTab
          data={initialConfig.PRICING_RULES.data}
          version={initialConfig.PRICING_RULES.version}
          updatedAt={initialConfig.PRICING_RULES.updatedAt}
        />
      </TabsContent>
    </Tabs>
  );
}
