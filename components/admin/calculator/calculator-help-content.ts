/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Contenido del modal grande "¿Cómo funciona la calculadora?" en /admin/calculator.
 * A propósito CORTO y puntual — es un recordatorio rápido para el admin, no un manual.
 * El detalle completo vive en calculator-field-info.ts (los popovers ⓘ por sección) y
 * en la descripción en lenguaje natural que aparece en cada vista de detalle de versión.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const GENERAL_INTRO =
  '3 configuraciones independientes — cada una con su propio historial de versiones: Oferta, Composición de cargos y Precios. Se encadenan en ese orden: la Oferta define qué existe, la Composición cómo se reparte el cobro, y los Precios cuánto se cobra.';

export const GENERAL_VERSIONING =
  'Cada cambio crea una versión nueva (v1, v2, v3...) — nada se sobrescribe.\n' +
  'Solo UNA versión de cada tipo puede estar activa a la vez — es la que usan los clientes ahora mismo.';

export const GENERAL_ACTIVATION_NOTE =
  'Activar reemplaza a la anterior al instante, sin período de transición ni botón "deshacer" — si te equivocas, activa otra versión. Los créditos ya desembolsados NO cambian: cada uno conserva la configuración con la que nació.';

export const GENERAL_COMPATIBILITY_NOTE =
  'Las 3 se validan entre sí. Si activar una deja a otra incompatible (ej. unos Precios que usan un grupo de cargos que ya no existe), esa otra se desactiva sola y el simulador de préstamos deja de calcular hasta resolverlo.';

// ─── Oferta (Disponibilidad) ──────────────────────────────────────────────────────

export const AVAILABILITY_INTRO =
  'Define qué existe: los rangos de score (Bajo/Medio/Alto) y qué montos, plazos y cuotas se pueden ofrecer.';

export const AVAILABILITY_GROUPS =
  'Se organiza en Grupos: cada uno junta montos con sus propias combinaciones de plazo y cuotas. Un monto no se puede repetir en dos grupos.';

// ─── Composición de cargos (Fee Groups) ────────────────────────────────────────────

export const FEES_INTRO =
  'Un grupo NO cobra un monto fijo — reparte un total entre cargos individuales (interés, gastos, tarifa...). Los % de un mismo grupo deben sumar 100%.';

export const FEES_GROUPS =
  'Cuánto se cobra en total NO se define acá — lo deciden los Precios que usen este grupo (tab Precios).';

// ─── Precios (Pricing Rules) ───────────────────────────────────────────────────────

export const RULES_INTRO =
  'Cada regla dice: para tal combinación de monto/plazo/score y tipo de cliente, usa tal grupo de cargos (% o S/ fijo) y tales descuentos.';

export const RULES_PRIORITY_DEFAULT =
  'Se evalúan por prioridad — la primera que coincide, gana. Debe existir una regla POR DEFECTO que atrape todo lo no cubierto por las demás.';

export const RULES_DISCOUNTS =
  'Los descuentos se aplican en cadena: primero todos los % (sobre el total original), luego todos los S/ fijos.';
