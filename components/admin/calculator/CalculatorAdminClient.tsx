'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Receipt, Tag, FlaskConical } from 'lucide-react';
import { VersionsTab } from './tabs/VersionsTab';
import { SimulatorTab } from './tabs/SimulatorTab';
import type { ActiveSummary, ConfigType } from '@/modules/admin/calculator-admin.service';

interface CalculatorAdminClientProps {
  initialSummary: ActiveSummary | null;
}

export function CalculatorAdminClient({ initialSummary }: CalculatorAdminClientProps) {
  const [activeTab, setActiveTab] = useState('availability');

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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="h-auto p-1 grid grid-cols-4 gap-1">
        <TabsTrigger value="availability" className="gap-2 py-2.5">
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">Disponibilidad</span>
          <span className="sm:hidden">Montos</span>
        </TabsTrigger>
        <TabsTrigger value="fees" className="gap-2 py-2.5">
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Tarifas</span>
          <span className="sm:hidden">Fees</span>
        </TabsTrigger>
        <TabsTrigger value="rules" className="gap-2 py-2.5">
          <Tag className="h-4 w-4" />
          <span className="hidden sm:inline">Reglas</span>
          <span className="sm:hidden">Reglas</span>
        </TabsTrigger>
        <TabsTrigger value="simulator" className="gap-2 py-2.5">
          <FlaskConical className="h-4 w-4" />
          <span className="hidden sm:inline">Probar</span>
          <span className="sm:hidden">Test</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="availability" className="mt-6">
        <VersionsTab configType="AVAILABILITY" activeVersion={initialSummary.AVAILABILITY} />
      </TabsContent>

      <TabsContent value="fees" className="mt-6">
        <VersionsTab configType="FEE_GROUPS" activeVersion={initialSummary.FEE_GROUPS} />
      </TabsContent>

      <TabsContent value="rules" className="mt-6">
        <VersionsTab configType="PRICING_RULES" activeVersion={initialSummary.PRICING_RULES} />
      </TabsContent>

      <TabsContent value="simulator" className="mt-6">
        <SimulatorTab />
      </TabsContent>
    </Tabs>
  );
}
