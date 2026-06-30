'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Layers, Receipt, Tag, FlaskConical } from 'lucide-react';
import { AvailabilityTab } from './tabs/AvailabilityTab';
import { FeeGroupsTab } from './tabs/FeeGroupsTab';
import { PricingRulesTab } from './tabs/PricingRulesTab';
import { SimulatorTab } from './tabs/SimulatorTab';
import { getConfigByTypeAction } from '@/app/actions/calculator-admin.actions';
import type { ConfigSummary, ConfigEntry } from '@/modules/admin/calculator-admin.service';

interface CalculatorAdminClientProps {
  initialSummary: ConfigSummary | null;
}

export function CalculatorAdminClient({ initialSummary }: CalculatorAdminClientProps) {
  const [activeTab, setActiveTab] = useState('availability');
  const [configData, setConfigData] = useState<Record<string, ConfigEntry | null>>({});
  const [loading, setLoading] = useState(false);

  // Cargar data completa cuando se cambia de tab
  useEffect(() => {
    const typeMap: Record<string, string> = {
      availability: 'AVAILABILITY',
      fees: 'FEE_GROUPS',
      rules: 'PRICING_RULES',
    };
    const configType = typeMap[activeTab];
    if (!configType || configData[configType]) return;

    setLoading(true);
    getConfigByTypeAction(configType as any).then((data) => {
      setConfigData((prev) => ({ ...prev, [configType]: data }));
      setLoading(false);
    });
  }, [activeTab, configData]);

  if (!initialSummary) {
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

  const hasDrafts =
    initialSummary.AVAILABILITY.hasPendingChanges ||
    initialSummary.FEE_GROUPS.hasPendingChanges ||
    initialSummary.PRICING_RULES.hasPendingChanges;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="h-auto p-1 grid grid-cols-4 gap-1">
        <TabsTrigger value="availability" className="gap-2 py-2.5 relative">
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">Disponibilidad</span>
          <span className="sm:hidden">Montos</span>
          {initialSummary.AVAILABILITY.hasPendingChanges && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning-500" />
          )}
        </TabsTrigger>
        <TabsTrigger value="fees" className="gap-2 py-2.5 relative">
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Tarifas</span>
          <span className="sm:hidden">Fees</span>
          {initialSummary.FEE_GROUPS.hasPendingChanges && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning-500" />
          )}
        </TabsTrigger>
        <TabsTrigger value="rules" className="gap-2 py-2.5 relative">
          <Tag className="h-4 w-4" />
          <span className="hidden sm:inline">Reglas</span>
          <span className="sm:hidden">Reglas</span>
          {initialSummary.PRICING_RULES.hasPendingChanges && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning-500" />
          )}
        </TabsTrigger>
        <TabsTrigger value="simulator" className="gap-2 py-2.5 relative">
          <FlaskConical className="h-4 w-4" />
          <span className="hidden sm:inline">Probar</span>
          <span className="sm:hidden">Test</span>
          {hasDrafts && (
            <Badge variant="warning" className="absolute -top-1 -right-1 text-[9px] px-1 py-0">
              DRAFT
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="availability" className="mt-6">
        {loading && !configData.AVAILABILITY ? (
          <LoadingSkeleton />
        ) : configData.AVAILABILITY ? (
          <AvailabilityTab config={configData.AVAILABILITY} />
        ) : null}
      </TabsContent>

      <TabsContent value="fees" className="mt-6">
        {loading && !configData.FEE_GROUPS ? (
          <LoadingSkeleton />
        ) : configData.FEE_GROUPS ? (
          <FeeGroupsTab config={configData.FEE_GROUPS} />
        ) : null}
      </TabsContent>

      <TabsContent value="rules" className="mt-6">
        {loading && !configData.PRICING_RULES ? (
          <LoadingSkeleton />
        ) : configData.PRICING_RULES ? (
          <PricingRulesTab config={configData.PRICING_RULES} />
        ) : null}
      </TabsContent>

      <TabsContent value="simulator" className="mt-6">
        <SimulatorTab hasDrafts={hasDrafts} />
      </TabsContent>
    </Tabs>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="h-32 rounded-lg bg-muted animate-pulse" />
      <div className="h-32 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}
