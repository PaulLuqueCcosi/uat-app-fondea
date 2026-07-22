'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Receipt, Tag, FlaskConical, Loader2 } from 'lucide-react';
import { VersionsTab } from './tabs/VersionsTab';
import { SimulatorTab } from './tabs/SimulatorTab';
import { getActiveSummaryAction } from '@/app/actions/calculator-admin.actions';
import type { ActiveSummary, ConfigType } from '@/modules/admin/calculator-admin.service';

export function CalculatorAdminClient() {
  const [activeTab, setActiveTab] = useState('availability');
  const [summary, setSummary] = useState<ActiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getActiveSummaryAction();
      setSummary(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando configuraciones...</span>
      </div>
    );
  }

  if (!summary) {
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
      <TabsList className="h-9 p-1">
        <TabsTrigger value="availability" className="gap-1.5 text-xs px-3">
          <Layers className="h-3.5 w-3.5" />
          Disponibilidad
        </TabsTrigger>
        <TabsTrigger value="fees" className="gap-1.5 text-xs px-3">
          <Receipt className="h-3.5 w-3.5" />
          Tarifas
        </TabsTrigger>
        <TabsTrigger value="rules" className="gap-1.5 text-xs px-3">
          <Tag className="h-3.5 w-3.5" />
          Reglas
        </TabsTrigger>
        <TabsTrigger value="simulator" className="gap-1.5 text-xs px-3">
          <FlaskConical className="h-3.5 w-3.5" />
          Simular
        </TabsTrigger>
      </TabsList>

      <TabsContent value="availability" className="mt-4">
        <VersionsTab configType="AVAILABILITY" activeVersion={summary.AVAILABILITY} />
      </TabsContent>

      <TabsContent value="fees" className="mt-4">
        <VersionsTab configType="FEE_GROUPS" activeVersion={summary.FEE_GROUPS} />
      </TabsContent>

      <TabsContent value="rules" className="mt-4">
        <VersionsTab configType="PRICING_RULES" activeVersion={summary.PRICING_RULES} />
      </TabsContent>

      <TabsContent value="simulator" className="mt-4">
        <SimulatorTab />
      </TabsContent>
    </Tabs>
  );
}
