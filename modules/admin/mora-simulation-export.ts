/**
 * Exportación del simulador de mora a CSV y PDF.
 *
 * Todo se genera en el navegador a partir del resultado ya calculado: no hay endpoint nuevo ni se
 * vuelve a simular. El PDF carga `jspdf` solo al exportar para no pesar en la carga de la pantalla.
 */

import type { SimulatePenaltyResponse } from './admin-penalty.types';
import { MATRIX_CONCEPTS, conceptLabel, type ChargeConcept } from '@/modules/shared/charge-concepts';

/** Con qué datos y configuración se hizo la simulación que se exporta. */
export interface SimulationExportContext {
  /** Nombre de la configuración usada (o un texto que diga que es un borrador sin guardar). */
  configName: string;
  /** Montos de la cuota por concepto (los vacíos no están). */
  amounts: Partial<Record<ChargeConcept, number>>;
  periodDays: number;
  overdueCapital: number;
  fromDay: number;
  toDay: number;
  /** De dónde salieron los montos, si vienen de un préstamo real de la calculadora. */
  origin?: string | null;
}

const money = (value: number | undefined) => (value ?? 0).toFixed(2);
const dayTotal = (charges: Partial<Record<ChargeConcept, number>>) =>
  Object.values(charges).reduce<number>((sum, v) => sum + (v ?? 0), 0);

/** Datos de la cuota usados, en texto (para el encabezado del CSV y del PDF). */
export function describeInputs(ctx: SimulationExportContext): string[] {
  const montos = (Object.keys(ctx.amounts) as ChargeConcept[])
    .map((c) => `${conceptLabel(c)} S/ ${money(ctx.amounts[c])}`)
    .join(' · ');
  return [
    `Configuración: ${ctx.configName}`,
    ctx.origin ? `Datos: ${ctx.origin}` : 'Datos: ingresados a mano',
    `Cuota: ${montos || 'sin conceptos'} · período de ${ctx.periodDays} días · capital vencido S/ ${money(ctx.overdueCapital)}`,
    `Días de mora simulados: ${ctx.fromDay} a ${ctx.toDay}`,
  ];
}

/** Nombre de archivo, por ejemplo `simulacion-mora-dias-1-a-100-2026-10-27.csv`. */
export function exportFileName(ctx: SimulationExportContext, extension: 'csv' | 'pdf', now = new Date()): string {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `simulacion-mora-dias-${ctx.fromDay}-a-${ctx.toDay}-${date}.${extension}`;
}

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * CSV con separador coma, punto decimal y BOM UTF-8 (para que Excel respete las tildes).
 * Primero las líneas de contexto, una línea en blanco, la tabla por día y el total del rango.
 */
export function simulationToCsv(result: SimulatePenaltyResponse, ctx: SimulationExportContext): string {
  const lines: string[] = describeInputs(ctx).map((l) => csvCell(l));
  lines.push('');
  lines.push(['Día de mora', ...MATRIX_CONCEPTS.map((c) => conceptLabel(c)), 'Total del día'].map(csvCell).join(','));
  for (const d of result.perDay) {
    lines.push([d.day, ...MATRIX_CONCEPTS.map((c) => money(d.charges[c])), money(dayTotal(d.charges))].map(csvCell).join(','));
  }
  lines.push(['Total del rango', ...MATRIX_CONCEPTS.map((c) => money(result.totals[c])), money(dayTotal(result.totals))].map(csvCell).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSimulationCsv(result: SimulatePenaltyResponse, ctx: SimulationExportContext): void {
  saveBlob(new Blob([simulationToCsv(result, ctx)], { type: 'text/csv;charset=utf-8' }), exportFileName(ctx, 'csv'));
}

/** PDF A4 con el contexto arriba y la tabla por día (con total del rango como pie). */
export async function downloadSimulationPdf(result: SimulatePenaltyResponse, ctx: SimulationExportContext): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const margin = 40;
  doc.setFontSize(15);
  doc.text('Simulación de mora', margin, 46);
  doc.setFontSize(9);
  doc.setTextColor(90);
  const context = describeInputs(ctx).flatMap((l) => doc.splitTextToSize(l, doc.internal.pageSize.getWidth() - margin * 2) as string[]);
  doc.text(context, margin, 64);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 64 + context.length * 12 + 10,
    margin: { left: margin, right: margin },
    head: [['Día de mora', ...MATRIX_CONCEPTS.map((c) => conceptLabel(c)), 'Total del día']],
    body: result.perDay.map((d) => [String(d.day), ...MATRIX_CONCEPTS.map((c) => money(d.charges[c])), money(dayTotal(d.charges))]),
    foot: [['Total del rango', ...MATRIX_CONCEPTS.map((c) => money(result.totals[c])), money(dayTotal(result.totals))]],
    styles: { fontSize: 8, halign: 'right', cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], halign: 'right' },
    footStyles: { fillColor: [226, 232, 240], textColor: 20, fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left' } },
    showFoot: 'lastPage',
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${pages} · Generado el ${new Date().toLocaleString('es-PE')}`, margin, doc.internal.pageSize.getHeight() - 20);
  }
  doc.save(exportFileName(ctx, 'pdf'));
}
