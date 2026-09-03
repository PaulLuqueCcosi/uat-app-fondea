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
  FEES_INTRO,
  FEES_GROUPS,
  RULES_INTRO,
  RULES_PRIORITY_DEFAULT,
  RULES_DISCOUNTS,
} from './calculator-help-content';

/**
 * Botón "?" + modal de ayuda de /admin/calculator. A propósito CORTO — un recordatorio
 * rápido de los 4 puntos clave por sección, no un manual. El detalle línea por línea vive
 * en los popovers ⓘ de cada sección del editor y en la descripción de cada versión.
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

      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>¿Cómo funciona la calculadora?</DialogTitle>
          <DialogDescription>Lo esencial de cada sección, en corto.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full shrink-0">
            <TabsTrigger value="general" className="gap-1.5">
              <Info className="h-3.5 w-3.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="disponibilidad" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Disponib.
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

          <div className="mt-3">
            <TabsContent value="general">
              <div className="flex flex-col gap-2.5 text-xs text-foreground/90 leading-relaxed">
                <FormattedBlock text={GENERAL_INTRO} />
                <FormattedBlock text={GENERAL_VERSIONING} />
                <FormattedBlock text={GENERAL_ACTIVATION_NOTE} />
                <FormattedBlock text={GENERAL_COMPATIBILITY_NOTE} muted />
              </div>
            </TabsContent>
            <TabsContent value="disponibilidad">
              <div className="flex flex-col gap-2.5 text-xs text-foreground/90 leading-relaxed">
                <FormattedBlock text={AVAILABILITY_INTRO} />
                <FormattedBlock text={AVAILABILITY_GROUPS} muted />
              </div>
            </TabsContent>
            <TabsContent value="tarifas">
              <div className="flex flex-col gap-2.5 text-xs text-foreground/90 leading-relaxed">
                <FormattedBlock text={FEES_INTRO} />
                <FormattedBlock text={FEES_GROUPS} muted />
              </div>
            </TabsContent>
            <TabsContent value="reglas">
              <div className="flex flex-col gap-2.5 text-xs text-foreground/90 leading-relaxed">
                <FormattedBlock text={RULES_INTRO} />
                <FormattedBlock text={RULES_PRIORITY_DEFAULT} />
                <FormattedBlock text={RULES_DISCOUNTS} muted />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <p className="text-[11px] text-muted-foreground border-t pt-2">
          Más detalle: el ícono ⓘ junto a cada sección del editor, y la descripción de cada versión.
        </p>
      </DialogContent>
    </Dialog>
  );
}
