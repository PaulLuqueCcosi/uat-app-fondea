/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Contenido de los popovers "ⓘ" puntuales dentro de los editores de /admin/calculator
 * (Disponibilidad, Tarifas, Reglas). Complementa al modal grande de
 * CalculatorHelpDialog (calculator-help-content.ts) — acá el texto es corto y vive
 * pegado al control exacto que explica, para no obligar a abrir el modal grande
 * cada vez. Mismo formato que metric-info.ts: InfoPopoverContent (title/what/
 * calculation/notes), consumido por InfoPopover.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { InfoPopoverContent } from '@/components/admin/shared/InfoPopover';

export const SCORE_RANGES_INFO: InfoPopoverContent = {
  title: 'Rangos de Score Crediticio',
  what: 'Los 3 segmentos de cliente (Bajo/Medio/Alto) que usa el motor de pricing para elegir qué Regla aplicar — no se puede agregar un 4º rango ni quitar uno desde esta pantalla, siempre son estos 3.',
  calculation:
    'Deben cubrir de 0 a 1000 exactamente, sin solaparse ni dejar huecos — el editor valida esto al vuelo y no deja guardar si falla.\n' +
    'El código de cada rango (ej. "BAJO") se genera automáticamente del nombre, en mayúsculas — es lo que los Precios usan para seleccionar por score range.',
  notes:
    'No confundir con el score interno 0-100 real de cada usuario (ese se calcula en el módulo de Scoring) — este 0-1000 es solo la escala que usa la calculadora para simular.',
};

// Nota: el código de rango (ej. "BAJO") lo usan los Precios para seleccionar por score range.

export const AVAILABILITY_GROUPS_INFO: InfoPopoverContent = {
  title: 'Montos y Plazos Disponibles',
  what: 'El catálogo de qué se puede prestar: qué montos existen, y para cada uno, a qué plazos (días) y en cuántas cuotas se puede pagar.',
  calculation:
    'Se organiza en Tramos: cada tramo junta un conjunto de montos con sus propias Combinaciones de plazo+cuotas.\n' +
    'Un monto (ej. S/500) solo puede vivir en UN tramo — no se puede repetir en dos tramos distintos.\n' +
    'Un plazo tampoco puede repetirse entre dos combinaciones del mismo tramo.',
  notes:
    'Los Precios (tab Precios) seleccionan sobre estos mismos montos/plazos/cuotas — si agregas una combinación nueva acá, revisa si alguna regla necesita cubrirla explícitamente.',
};

export const FEE_GROUPS_INFO: InfoPopoverContent = {
  title: 'Grupos de cargos',
  what: 'Un grupo NO es una tarifa con un monto fijo — es una receta de reparto: define cómo se divide un total entre distintos cargos individuales (interés, gastos, tarifa...).',
  calculation:
    'Cada cargo dentro del grupo tiene su propio % de participación. Los % de todos los cargos de un mismo grupo deben sumar exactamente 100%.\n' +
    'El "total" que se reparte NO se define acá — lo definen los Precios que usen este grupo (tab Precios), incluyendo si ese total es % del monto prestado o un monto fijo en soles.',
  notes:
    'El catálogo de cargos (código + nombre) es compartido entre todos los grupos — puedes crear uno nuevo al vuelo sin salir de esta pantalla.',
};

export const PRICING_RULES_INTRO_INFO: InfoPopoverContent = {
  title: 'Reglas de Pricing',
  what: 'Cada regla decide, para una combinación de monto/plazo/cuotas/score y tipo de cliente, qué tarifas y descuentos aplican.',
  calculation:
    'Se evalúan por prioridad (número más alto primero). La PRIMERA regla cuyos selectores y condición coincidan gana — las demás se ignoran para esa simulación.\n' +
    'Debe existir exactamente una regla DEFAULT: sus selectores se ignoran, atrapa todo lo que ninguna otra regla cubrió.\n' +
    'Entre todas las reglas (incluida la DEFAULT) deben quedar cubiertos ambos casos de "Primer préstamo" (true y false) — si no, ese tipo de cliente no puede simular.',
  notes:
    'Un selector vacío (sin nada seleccionado) = comodín, aplica a cualquier valor de esa dimensión.',
};

export const PRICING_RULE_FEE_GROUPS_INFO: InfoPopoverContent = {
  title: 'Grupos de cargos de la regla',
  what: 'Qué grupo(s) de cargos (definidos en el tab Composición de cargos) usa esta regla, y cuánto vale cada uno.',
  calculation:
    '"%" = el valor es una tasa sobre el monto prestado (ej. 20% de un préstamo de S/1000 = S/200 en total para ese grupo).\n' +
    '"S/" = el valor ya es un monto fijo en soles — igual sin importar cuánto pida el cliente.\n' +
    'Ese total (ya en soles) es el que luego se reparte entre los cargos del grupo, según los % definidos en el tab Composición de cargos.',
  notes:
    'Si dos grupos de la misma regla producen el mismo cargo (ej. ambos tienen INTEREST), el motor suma los montos automáticamente — no aparece duplicado.',
};

export const PRICING_RULE_DISCOUNTS_INFO: InfoPopoverContent = {
  title: 'Descuentos de la regla',
  what: 'Ajustes que se restan del total de cargos de esta regla, antes de calcular el IGV.',
  calculation:
    'Se aplican en cadena según el campo Orden: primero TODOS los descuentos "%" (sobre el total de cargos original), luego TODOS los "S/" (sobre lo que quedó después de los %) — no en el orden que los muestra la tabla si mezclas tipos.\n' +
    'Cada descuento puede tener su propia condición "Primer préstamo / Recurrentes / Cualquiera", independiente de la condición de la regla completa.',
  notes:
    'El resultado nunca es negativo: si los descuentos superan el total de cargos, el sistema lo deja en S/0, nunca cobra de menos.',
};

export const SIMULATOR_VERSIONS_INFO: InfoPopoverContent = {
  title: 'Simulador — versiones a probar',
  what: 'Corre el motor de pricing real con las 3 versiones que elijas (Oferta + Composición de cargos + Precios), sin necesidad de activarlas primero.',
  calculation:
    'Por defecto arrancan seleccionadas las 3 versiones ACTIVAS — cambia cualquiera para previsualizar una versión en borrador antes de publicarla.\n' +
    'El toggle "Simular como primer préstamo" decide si se incluyen los descuentos marcados solo-primer-préstamo.',
  notes:
    'Esto usa el mismo motor de cálculo que ven los clientes reales (misma lógica, no una aproximación) — es la forma más confiable de verificar un cambio antes de activarlo.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Explicación en lenguaje natural de qué configura cada tipo — en una sola línea.
// Se muestra como banner arriba de cada editor (crear/editar) y en el detalle de
// versión, para que el admin sepa qué logra esta configuración sin abrir ningún popover.
// Fuente única: antes estaba duplicada en la página de detalle.
// ─────────────────────────────────────────────────────────────────────────────

/** Keyed por el segmento de ruta en minúsculas (availability | fee_groups | pricing_rules). */
export const TYPE_EXPLANATION: Record<string, string> = {
  availability:
    'Esta configuración define QUÉ existe para el cliente: los rangos de score (Bajo/Medio/Alto) y qué montos, plazos y cuotas se pueden ofrecer.',
  fee_groups:
    'Esta configuración define CÓMO se reparte el cobro: grupos que distribuyen un total entre distintos cargos (interés, gastos, tarifa...). El total lo deciden los Precios.',
  pricing_rules:
    'Esta configuración define CUÁNTO se cobra: qué grupo de cargos y qué descuentos aplican según el monto, plazo, score y si es primer préstamo o no.',
};
