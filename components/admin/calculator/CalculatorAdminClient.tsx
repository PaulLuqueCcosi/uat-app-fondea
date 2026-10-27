'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Receipt, Tag, FlaskConical, Loader2, AlertTriangle } from 'lucide-react';
import { VersionsTab } from './tabs/VersionsTab';
import { SimulatorTab } from './tabs/SimulatorTab';
import { CalculatorFlowSteps } from './CalculatorFlowSteps';
import { getActiveSummaryAction } from '@/app/actions/calculator-admin.actions';
import type { ActiveSummary, ConfigType } from '@/modules/admin/calculator-admin.service';

export function CalculatorAdminClient() {
  const [activeTab, setActiveTab] = useState('availability');
  const [summary, setSummary] = useState<ActiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Recarga el resumen de versiones activas. Se llama al montar y cada vez que una
  // VersionsTab activa una versión, para que el flujo de arriba ("v1 activa / v2
  // activa...") no quede desincronizado con la tabla tras una activación.
  const refreshSummary = useCallback(async () => {
    const data = await getActiveSummaryAction();
    setSummary(data);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await refreshSummary();
      setLoading(false);
    }
    load();
  }, [refreshSummary]);

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
          No se pudo cargar la configuración de la calculadora.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Verifica que el servicio de calculadora esté activo e inténtalo de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {summary.validation?.pricingRulesCompatible === false && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-destructive">
              Los Precios activos ya no son compatibles con la Oferta o la Composición de cargos actuales.
            </p>
            {summary.validation.pricingRulesErrors.map((err, i) => (
              <p key={i} className="text-[11px] text-destructive/80">• {err}</p>
            ))}
          </div>
        </div>
      )}

      <CalculatorFlowSteps summary={summary} />

      <Tabs value={activeTab} onValueChange={(v) => { if (v) setActiveTab(v); }} className="w-full">
      <TabsList className="h-9 p-1">
        <TabsTrigger value="availability" className="gap-1.5 text-xs px-3">
          <Layers className="h-3.5 w-3.5" />
          Oferta
        </TabsTrigger>
        <TabsTrigger value="fees" className="gap-1.5 text-xs px-3">
          <Receipt className="h-3.5 w-3.5" />
          Composición de cargos
        </TabsTrigger>
        <TabsTrigger value="rules" className="gap-1.5 text-xs px-3">
          <Tag className="h-3.5 w-3.5" />
          Precios
        </TabsTrigger>
        <TabsTrigger value="simulator" className="gap-1.5 text-xs px-3">
          <FlaskConical className="h-3.5 w-3.5" />
          Simulador
        </TabsTrigger>
      </TabsList>

      <TabsContent value="availability" className="mt-4">
        <VersionsTab configType="AVAILABILITY" activeVersion={summary.AVAILABILITY} onActivated={refreshSummary} />
      </TabsContent>

      <TabsContent value="fees" className="mt-4">
        <VersionsTab configType="FEE_GROUPS" activeVersion={summary.FEE_GROUPS} onActivated={refreshSummary} />
      </TabsContent>

      <TabsContent value="rules" className="mt-4">
        <VersionsTab configType="PRICING_RULES" activeVersion={summary.PRICING_RULES} onActivated={refreshSummary} />
      </TabsContent>

      <TabsContent value="simulator" className="mt-4">
        <SimulatorTab />
      </TabsContent>
      </Tabs>
    </div>
  );
}
