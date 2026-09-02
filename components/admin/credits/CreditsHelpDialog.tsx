'use client';

import { HelpCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { FormattedBlock } from '@/components/admin/shared/FormattedBlock';
import {
  CREDIT_STATUS_ORDER,
  INSTALLMENT_STATUS_INFO,
  creditStatusInfo,
} from '@/modules/admin/credit-status-labels';
import {
  CREDIT_TYPES,
  CREDIT_TYPES_NOTE,
  CREDIT_STATUS_FLOW,
  CREDIT_STATUS_DIAGRAM,
  CREDIT_STATUS_ACTIONS_NOTE,
  INSTALLMENT_STATUS_FLOW,
  INSTALLMENT_CALCULATION,
  INSTALLMENT_NOTE,
  MORA_STAGES,
  MORA_STAGES_NOTE,
} from './credits-help-content';

/**
 * Botón "?" + modal de ayuda de /admin/credits. Explica, con la lógica real del
 * sistema (no simplificada): tipos de crédito, estados y sus transiciones,
 * cuotas y las 7 etapas de mora/cobranza. Todo el contenido vive en
 * credits-help-content.ts — este componente solo lo presenta.
 */
export function CreditsHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            ¿Cómo funcionan los créditos?
          </Button>
        }
      />

      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>¿Cómo funcionan los créditos?</DialogTitle>
          <DialogDescription>
            Guía de referencia del dominio de créditos: tipos, estados, cuotas y mora.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tipos" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full shrink-0">
            <TabsTrigger value="tipos">Tipos</TabsTrigger>
            <TabsTrigger value="estados">Estados</TabsTrigger>
            <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
            <TabsTrigger value="mora">Mora</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-3 pr-1">
            <TabsContent value="tipos">
              <TiposTab />
            </TabsContent>
            <TabsContent value="estados">
              <EstadosTab />
            </TabsContent>
            <TabsContent value="cuotas">
              <CuotasTab />
            </TabsContent>
            <TabsContent value="mora">
              <MoraTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Tipos de crédito ──────────────────────────────────────────────────────

function TiposTab() {
  return (
    <div className="flex flex-col gap-4">
      {CREDIT_TYPES.map((type) => (
        <div key={type.code} className="rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={type.code === 'STANDARD' ? 'default' : 'secondary'}>
              {type.label}
            </Badge>
          </div>
          <p className="text-xs text-foreground/90 mb-2">{type.what}</p>
          <FormattedBlock text={type.details} />
        </div>
      ))}
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Nota
        </p>
        <FormattedBlock text={CREDIT_TYPES_NOTE} muted />
      </div>
    </div>
  );
}

// ─── Tab: Estados del crédito ───────────────────────────────────────────────────

function EstadosTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Flujo general
        </p>
        <FormattedBlock text={CREDIT_STATUS_DIAGRAM} muted />
      </div>

      {CREDIT_STATUS_ORDER.map((code) => {
        const info = creditStatusInfo(code);
        const flow = CREDIT_STATUS_FLOW.find((f) => f.code === code);
        return (
          <div key={code} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2.5 w-2.5 rounded-full ${info.dotClass}`} />
              <span className="text-sm font-semibold">{info.label}</span>
            </div>
            <p className="text-xs text-foreground/90 mb-1.5">{info.description}</p>
            {flow && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {flow.triggeredBy}
              </p>
            )}
          </div>
        );
      })}

      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Sobre suspender / reactivar / castigar
        </p>
        <FormattedBlock text={CREDIT_STATUS_ACTIONS_NOTE} muted />
      </div>
    </div>
  );
}

// ─── Tab: Cuotas ────────────────────────────────────────────────────────────────

function CuotasTab() {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(INSTALLMENT_STATUS_INFO).map(([code, info]) => {
        const flow = INSTALLMENT_STATUS_FLOW.find((f) => f.code === code);
        return (
          <div key={code} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={info.variant}>{info.label}</Badge>
            </div>
            <p className="text-xs text-foreground/90 mb-1.5">{info.description}</p>
            {flow && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {flow.triggeredBy}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Cómo se calculan los montos de cada cuota
        </p>
        <FormattedBlock text={INSTALLMENT_CALCULATION} />
      </div>

      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Nota
        </p>
        <FormattedBlock text={INSTALLMENT_NOTE} muted />
      </div>
    </div>
  );
}

// ─── Tab: Mora y cobranza ───────────────────────────────────────────────────────

function MoraTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Cada cuota vencida cae en exactamente una de estas 7 etapas, según cuántos
        días lleva atrasada. Las 7 etapas siempre suman el 100% de las cuotas en mora.
      </p>

      <div className="flex flex-col gap-2">
        {MORA_STAGES.map((stage) => (
          <div key={stage.key} className="flex items-center gap-2.5 rounded-lg border p-2.5">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-sm font-medium flex-1 min-w-0 truncate">
              {stage.label}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {stage.maxDays != null ? `${stage.minDays}-${stage.maxDays} días` : `${stage.minDays}+ días`}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Notas
        </p>
        <FormattedBlock text={MORA_STAGES_NOTE} muted />
      </div>
    </div>
  );
}
