'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Mapa de campos técnicos → etiquetas en español
const FIELD_LABELS: Record<string, string> = {
  'kyc.age': 'Edad',
  'kyc.dni': 'DNI',
  'kyc.firstName': 'Nombre',
  'kyc.firstLastName': 'Apellido',
  'kyc.birthDate': 'Fecha de nacimiento',
  'labor.situation': 'Situación laboral',
  'labor.details.yearsOfActivity': 'Años de actividad',
  'labor.details.industry': 'Industria',
  'labor.details.businessRuc': 'RUC del negocio',
  'labor.income.monthlyIncome': 'Ingreso mensual',
  'labor.income.incomeReceiptMethod': 'Método de cobro',
  'labor.income.hasAdditionalIncome': 'Tiene ingresos adicionales',
  'economic.loanPurpose': 'Propósito del préstamo',
  'economic.monthlyExpenses': 'Gastos mensuales',
  'economic.hasDebts': 'Tiene deudas',
  'economic.totalDebts': 'Total deudas',
  'economic.debtsCount': 'Cantidad de deudas',
  'economic.hasProperty': 'Tiene propiedad',
  'economic.hasVehicle': 'Tiene vehículo',
  'economic.hasServices': 'Tiene servicios a nombre',
  'economic.educationLevel': 'Nivel educativo',
  'intention.amount': 'Monto solicitado',
  'intention.termDays': 'Plazo (días)',
  'intention.installmentCount': 'Número de cuotas',
  'intention.isFirstLoan': 'Primer préstamo',
  'calculated.monthlyPayment': 'Cuota mensual',
  'calculated.availableIncome': 'Ingreso disponible',
  'calculated.debtToIncomeRatio': 'Ratio deuda/ingreso',
  'calculated.paymentCapacityRatio': 'Ratio capacidad de pago',
  'calculated.currentScore': 'Score crediticio',
  'calculated.hasCurrentScore': 'Tiene score previo',
  'calculated.isReturningBorrower': 'Cliente recurrente',
};

const VALUE_LABELS: Record<string, string> = {
  'true': 'Sí',
  'false': 'No',
  'EMPLEADO_DEPENDIENTE': 'Empleado dependiente',
  'INDEPENDIENTE': 'Independiente',
  'EMPRESARIO': 'Empresario',
  'FREELANCE': 'Freelance',
  'CUENTA_BANCARIA': 'Cuenta bancaria',
  'EFECTIVO': 'Efectivo',
  'BILLETERA_DIGITAL': 'Billetera digital',
  'EDUCACION': 'Educación',
  'SALUD': 'Salud',
  'NEGOCIO': 'Negocio',
  'VIAJE': 'Viaje',
  'HOGAR': 'Hogar',
  'DEUDAS': 'Deudas',
  'OTRO': 'Otro',
  'UNIVERSITARIA': 'Universitaria',
  'POSGRADO': 'Posgrado',
  'TECNICA': 'Técnica',
  'SECUNDARIA': 'Secundaria',
  'PRIMARIA': 'Primaria',
};

interface RuleModuleCardProps {
  module: any;
  type: 'eliminatory' | 'scoring';
}

export function RuleModuleCard({ module, type }: RuleModuleCardProps) {
  const [expanded, setExpanded] = useState(true);
  const rules = module.rules ?? [];

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardHeader
        className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium">{module.label ?? module.module}</span>
            <Badge variant="secondary" className="text-[10px]">{rules.length} regla{rules.length !== 1 ? 's' : ''}</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-3">
          <div className="space-y-2">
            {rules.map((rule: any, idx: number) => (
              <div key={rule.id ?? idx} className="rounded-md border p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{rule.label}</span>
                  <div className="flex items-center gap-1.5">
                    {type === 'scoring' && rule.points !== undefined && (
                      <Badge variant={rule.points >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                        {rule.points > 0 ? '+' : ''}{rule.points} pts
                      </Badge>
                    )}
                  </div>
                </div>
                {rule.description && (
                  <p className="text-[11px] text-muted-foreground mb-2">{rule.description}</p>
                )}
                {/* Mostrar la lógica de forma legible */}
                <div className="mt-2">
                  <LogicDisplay logic={rule.logic} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Muestra la lógica JsonLogic de forma legible y estructurada.
 */
function LogicDisplay({ logic }: { logic: any }) {
  if (!logic || typeof logic !== 'object') {
    return <span className="text-[10px] text-muted-foreground italic">Sin lógica configurada</span>;
  }

  return (
    <div className="space-y-1">
      <LogicNode logic={logic} depth={0} />
    </div>
  );
}

function LogicNode({ logic, depth }: { logic: any; depth: number }) {
  if (!logic || typeof logic !== 'object') {
    return <span className="text-[11px]">{formatValue(logic)}</span>;
  }

  const keys = Object.keys(logic);
  if (keys.length === 0) return null;

  const operator = keys[0];
  const args = logic[operator];

  // Variable reference
  if (operator === 'var') {
    return <span className="text-[11px] font-medium text-primary">{getFieldLabel(String(args))}</span>;
  }

  // Logical AND/OR
  if (operator === 'and' || operator === 'or') {
    const label = operator === 'and' ? 'Todas deben cumplirse:' : 'Al menos una debe cumplirse:';
    const conditions = args as any[];

    return (
      <div className={`${depth > 0 ? 'ml-3 pl-3 border-l-2 border-muted-foreground/20' : ''}`}>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <div className="mt-1 space-y-1">
          {conditions.map((cond, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] text-muted-foreground mt-0.5">•</span>
              <LogicNode logic={cond} depth={depth + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If/then/else
  if (operator === 'if') {
    const [cond, thenVal, elseVal] = args as any[];
    return (
      <div className={`${depth > 0 ? 'ml-3 pl-3 border-l-2 border-muted-foreground/20' : ''}`}>
        <div className="text-[11px]">
          <span className="font-semibold text-amber-600">SI </span>
          <LogicNode logic={cond} depth={depth + 1} />
        </div>
        <div className="text-[11px] ml-3">
          <span className="font-semibold text-green-600">→ </span>
          <LogicNode logic={thenVal} depth={depth + 1} />
        </div>
        <div className="text-[11px] ml-3">
          <span className="font-semibold text-muted-foreground">SINO → </span>
          <LogicNode logic={elseVal} depth={depth + 1} />
        </div>
      </div>
    );
  }

  // Comparison operators (2 args)
  if (Array.isArray(args) && args.length === 2) {
    const opLabel = getOperatorLabel(operator);
    return (
      <span className="text-[11px] inline-flex items-center gap-1 flex-wrap">
        <LogicNode logic={args[0]} depth={depth + 1} />
        <span className="font-mono text-muted-foreground bg-muted px-1 rounded text-[10px]">{opLabel}</span>
        <LogicNode logic={args[1]} depth={depth + 1} />
      </span>
    );
  }

  // In operator with array
  if (operator === 'in' && Array.isArray(args) && args.length === 2) {
    return (
      <span className="text-[11px] inline-flex items-center gap-1 flex-wrap">
        <LogicNode logic={args[0]} depth={depth + 1} />
        <span className="font-mono text-muted-foreground bg-muted px-1 rounded text-[10px]">está en</span>
        <span className="text-[11px]">[{(args[1] as any[]).map(v => formatValue(v)).join(', ')}]</span>
      </span>
    );
  }

  // Fallback: mostrar como JSON compacto
  return <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{JSON.stringify(logic)}</code>;
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function getOperatorLabel(op: string): string {
  const labels: Record<string, string> = {
    '>=': '≥',
    '<=': '≤',
    '>': '>',
    '<': '<',
    '==': '=',
    '===': '=',
    '!=': '≠',
    '!==': '≠',
    '/': '÷',
    '-': '−',
    '+': '+',
    '*': '×',
  };
  return labels[op] ?? op;
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return 'nulo';
  if (val === true) return 'Sí';
  if (val === false) return 'No';
  const str = String(val);
  return VALUE_LABELS[str] ?? str;
}
