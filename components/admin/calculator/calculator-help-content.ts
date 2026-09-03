/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Contenido centralizado del modal de ayuda "¿Cómo funciona la calculadora?"
 * en /admin/calculator. Espejo fiel del motor de pricing real (fondea-calculator-service:
 * daoRegistry, PgConfigVersionDao, pricingEngine.ts, versionedSimulationService.ts) y
 * de los editores del propio admin (AvailabilityEditor, FeeGroupsEditor, PricingRulesEditor).
 *
 * Para editar cualquier explicación, SOLO se toca este archivo. El texto largo
 * admite `\n` para saltos de línea y `- ` al inicio de línea para viñetas
 * (mismo formato que credits-help-content.ts, renderizado por FormattedBlock).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── General: cómo funciona el sistema de versiones ────────────────────────────

export const GENERAL_INTRO =
  'El motor de pricing se configura con 3 tipos de configuración independientes: Disponibilidad, Tarifas y Reglas de Pricing. Cada una vive por separado y tiene su propio historial de versiones.';

export const GENERAL_VERSIONING =
  'Cada vez que guardas cambios, no se sobrescribe nada: se crea una versión NUEVA (v1, v2, v3...) que queda guardada junto a todas las anteriores.\n' +
  'De cada tipo, solo UNA versión puede estar "Activa" a la vez — es la que usan los clientes ahora mismo en producción.\n' +
  '"Nueva versión" siempre parte de duplicar una existente (ícono de copiar) — no hay forma de crear una configuración desde cero en el flujo normal.\n' +
  'Puedes ver el detalle de cualquier versión pasada (ícono de ojo), aunque ya no esté activa — nada se borra al reemplazarla.';

export const GENERAL_ACTIVATION_NOTE =
  'Activar una versión reemplaza a la anterior de inmediato — no hay período de transición ni rollback automático. Los clientes ven el cambio al instante en la calculadora pública.\n' +
  'Si te equivocas, la solución es activar otra versión (o duplicar la anterior y activarla de nuevo) — no existe un botón "deshacer".';

export const GENERAL_COMPATIBILITY_NOTE =
  'Las 3 configuraciones se validan cruzadas entre sí. Si activas una versión de Reglas que referencia un Grupo de Tarifas o un Score Range que no existe en la Disponibilidad/Tarifas actualmente activas, el sistema detecta la incompatibilidad.\n' +
  'Cuando eso pasa, la versión de Reglas queda desactivada en cascada — verás el banner rojo arriba de la página. Mientras no haya una versión de Reglas activa y compatible, el simulador de préstamos completo (landing pública, portal de clientes y el tab "Simular" de este mismo admin) deja de poder calcular nada.\n' +
  'Por eso conviene revisar el tab Reglas después de cualquier cambio en Disponibilidad o Tarifas, antes de dar por cerrado el trabajo.';

// ─── Disponibilidad ──────────────────────────────────────────────────────────────

export const AVAILABILITY_INTRO =
  'Define dos cosas independientes: los "Score Ranges" (los rangos de score interno bajo los que se agrupan los clientes, cada uno con su etiqueta y color) y qué combinaciones de Monto → Plazo (días) → Cuotas puede pedir un cliente.\n' +
  'Esta es la base de todo lo demás: las Reglas de Pricing seleccionan sobre estos mismos montos, plazos, cuotas y score ranges.';

export const AVAILABILITY_GROUPS =
  'Los montos se organizan en "Grupos". Un monto (S/500, por ejemplo) solo puede pertenecer a un grupo — no puede repetirse en dos grupos distintos.\n' +
  'Dentro de cada grupo, cada "Combinación" define qué plazos (en días) y cuántas cuotas admite ese conjunto de montos. Por ejemplo: S/500 a 15 días en 1 o 2 cuotas es una combinación; el mismo S/500 a 30 días en hasta 3 cuotas sería otra combinación distinta dentro del mismo grupo.\n' +
  'Un plazo no puede repetirse entre dos combinaciones del mismo grupo — el sistema lo marca como error de validación.';

export const AVAILABILITY_NOTE =
  'Los Score Ranges de este módulo son visuales y de simulación (afectan qué tasa/tarifa ve el cliente) — no confundir con el score interno 0-100 real de cada usuario, que se calcula en el módulo de scoring y es lo que determina en qué rango cae cada cliente concreto.';

// ─── Tarifas (Fee Groups) ────────────────────────────────────────────────────────

export const FEES_INTRO =
  'Un "Grupo de Tarifas" no es una tarifa única — es cómo se reparte el 100% de la tasa total del crédito entre distintos cargos individuales (por ejemplo: comisión, seguro, gestión).';

export const FEES_GROUPS =
  'Cada grupo tiene una lista de "cargos" (splits), y cada cargo tiene su propio % de participación dentro del grupo.\n' +
  'Los % de todos los cargos de un mismo grupo deben sumar exactamente 100% — si no suman 100%, el editor lo marca en rojo y no deja guardar.\n' +
  'El catálogo de cargos (código + nombre) es compartido entre todos los grupos: se elige uno existente de la lista, o se crea uno nuevo al vuelo desde el mismo editor sin salir de la pantalla.';

export const FEES_NOTE =
  'El valor total que efectivamente paga el cliente por un grupo de tarifas NO se define acá — se define en la Regla de Pricing que usa ese grupo (ver tab Reglas, sección "Grupos de tarifas"), incluyendo si ese valor es % del monto prestado o un monto fijo en soles. Este módulo solo define CÓMO se reparte ese total entre los cargos, no CUÁNTO es.';

// ─── Reglas de Pricing ───────────────────────────────────────────────────────────

export const RULES_INTRO =
  'Cada regla combina tres cosas: A QUÉ combinaciones de préstamo aplica (selectores), BAJO QUÉ condición del cliente, y QUÉ paquete de tarifas y descuentos le corresponde.';

export const RULES_SELECTORS =
  'Los selectores son: Score Ranges, Montos, Plazos y Cuotas — los mismos definidos en Disponibilidad.\n' +
  'Un selector vacío significa "todos" (comodín) — por ejemplo, si no seleccionas ningún monto específico, la regla aplica a cualquier monto.\n' +
  'Además, cada regla puede tener una condición de "Primer préstamo": aplica solo a clientes nuevos, solo a recurrentes, o a cualquiera.';

export const RULES_PRIORITY_DEFAULT =
  'Las reglas se evalúan en orden de prioridad (número más alto se evalúa primero). La PRIMERA regla cuyos selectores y condición coincidan con la simulación es la que se aplica — las demás se ignoran.\n' +
  'Debe existir exactamente una regla marcada como DEFAULT. Sus propios selectores se ignoran: atrapa cualquier combinación de monto/plazo/cuotas/score que ninguna otra regla haya cubierto. El editor no deja guardar si falta la DEFAULT o si hay más de una.\n' +
  'Entre todas las reglas (incluida la DEFAULT) deben quedar cubiertos ambos casos de "Primer préstamo": true y false. Si ningún conjunto de reglas cubre uno de los dos casos, ese tipo de cliente se queda sin poder simular nada.';

export const RULES_PACKAGE =
  'El paquete de cada regla tiene dos partes:\n' +
  '- Grupos de Tarifas: uno o más grupos (de los definidos en el tab Tarifas), cada uno con un valor y un tipo de cálculo. "%" significa que el valor es una tasa sobre el monto prestado (ej. 20% de un préstamo de S/1000 = S/200); "S/" significa que el valor ya es un monto fijo en soles, igual sin importar cuánto pida el cliente. Ese total (en soles) es el que luego se reparte entre los cargos del grupo, según sus splits.\n' +
  '- Descuentos: una lista ordenada, cada uno % o monto fijo.';

export const RULES_DISCOUNTS =
  'Los descuentos de una regla se aplican en cadena, en el orden que definas (campo Orden) — cada uno se calcula sobre el resultado que dejó el anterior, no sobre el monto original.\n' +
  'Cada descuento puede tener su propia condición "Primer préstamo/Recurrentes/Cualquiera", independiente de la condición de la regla completa. Esto permite que una regla aplique a todos los clientes, pero un descuento específico dentro de ella (por ejemplo "FIRST-LOAN-...") solo beneficie a los de primer préstamo.\n' +
  'El catálogo de descuentos (código + nombre + descripción visible al cliente) es compartido entre reglas, igual que el catálogo de cargos — la descripción es lo que el cliente ve en el detalle de su simulación.';

export const RULES_NOTE =
  'El simulador de préstamos (tab Simular de este mismo admin, y la calculadora que ven los clientes reales) es exactamente el mismo motor evaluando estas reglas — si algo no calcula como esperas en producción, reprodúcelo primero ahí antes de sospechar de un bug distinto.';
