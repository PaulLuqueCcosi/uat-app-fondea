'use client';

import { HelpCircle, Info, Layers, Receipt, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FormattedBlock } from '@/components/admin/shared/FormattedBlock';
import {
  GENERAL_INTRO,
  GENERAL_VERSIONING,
  GENERAL_ACTIVATION_NOTE,
  GENERAL_COMPATIBILITY_NOTE,
  AVAILABILITY_INTRO,
  AVAILABILITY_GROUPS,
  AVAILABILITY_NOTE,
  FEES_INTRO,
  FEES_GROUPS,
  FEES_NOTE,
  RULES_INTRO,
  RULES_SELECTORS,
  RULES_PRIORITY_DEFAULT,
  RULES_PACKAGE,
  RULES_DISCOUNTS,
  RULES_NOTE,
} from './calculator-help-content';

/**
 * Botón "?" + modal de ayuda de /admin/calculator. Explica, con la lógica real del
 * motor de pricing (no simplificada): el sistema de versiones y validación cruzada,
 * Disponibilidad, Tarifas y Reglas de Pricing. Todo el contenido vive en
 * calculator-help-content.ts — este componente solo lo presenta.
 */
export function CalculatorHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            ¿Cómo funciona la calculadora?
          </Button>
        }
      />

      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>¿Cómo funciona la calculadora?</DialogTitle>
          <DialogDescription>
            Guía de referencia del motor de pricing: versiones, disponibilidad, tarifas y reglas.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full shrink-0">
            <TabsTrigger value="general" className="gap-1.5">
              <Info className="h-3.5 w-3.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="disponibilidad" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Disponibilidad
            </TabsTrigger>
            <TabsTrigger value="tarifas" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Tarifas
            </TabsTrigger>
            <TabsTrigger value="reglas" className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Reglas
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-3 pr-1">
            <TabsContent value="general">
              <GeneralTab />
            </TabsContent>
            <TabsContent value="disponibilidad">
              <DisponibilidadTab />
            </TabsContent>
            <TabsContent value="tarifas">
              <TarifasTab />
            </TabsContent>
            <TabsContent value="reglas">
              <ReglasTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: General (versionado) ──────────────────────────────────────────────────

function GeneralTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-foreground/90">{GENERAL_INTRO}</p>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold mb-1.5">Sistema de versiones</p>
        <FormattedBlock text={GENERAL_VERSIONING} />
      </div>

      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Al activar una versión
        </p>
        <FormattedBlock text={GENERAL_ACTIVATION_NOTE} muted />
      </div>

      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive mb-1">
          Validación cruzada entre configuraciones
        </p>
        <FormattedBlock text={GENERAL_COMPATIBILITY_NOTE} />
      </div>
    </div>
  );
}

// ─── Tab: Disponibilidad ─────────────────────────────────────────────────────────

function DisponibilidadTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-foreground/90">{AVAILABILITY_INTRO}</p>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold mb-1.5">Grupos y combinaciones</p>
        <FormattedBlock text={AVAILABILITY_GROUPS} />
      </div>

      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Nota
        </p>
        <FormattedBlock text={AVAILABILITY_NOTE} muted />
      </div>
    </div>
  );
}

// ─── Tab: Tarifas ────────────────────────────────────────────────────────────────

function TarifasTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-foreground/90">{FEES_INTRO}</p>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold mb-1.5">Cargos y distribución</p>
        <FormattedBlock text={FEES_GROUPS} />
      </div>

      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Nota
        </p>
        <FormattedBlock text={FEES_NOTE} muted />
      </div>
    </div>
  );
}

// ─── Tab: Reglas de Pricing ──────────────────────────────────────────────────────

function ReglasTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-foreground/90">{RULES_INTRO}</p>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold mb-1.5">Selectores y condición</p>
        <FormattedBlock text={RULES_SELECTORS} />
      </div>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold mb-1.5">Prioridad y regla DEFAULT</p>
        <FormattedBlock text={RULES_PRIORITY_DEFAULT} />
      </div>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold mb-1.5">Paquete: tarifas y descuentos</p>
        <FormattedBlock text={RULES_PACKAGE} />
      </div>

      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold mb-1.5">Cómo se aplican los descuentos</p>
        <FormattedBlock text={RULES_DISCOUNTS} />
      </div>

      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Nota
        </p>
        <FormattedBlock text={RULES_NOTE} muted />
      </div>
    </div>
  );
}
