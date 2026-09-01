/**
 * Contenido de botones con icono y/o spinner, sin romper la hidratación.
 *
 * <p><b>El bug que evita</b> (ver `.kiro/skills/button-spinner-hydration.md`):
 * <pre>
 * NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which
 * the new node is to be inserted is not a child of this node.
 * </pre>
 *
 * <p>Se dispara con este patrón, que parece inocente:
 * <pre>
 * // ❌ MAL — icono self-closing + texto suelto como siblings directos
 * &lt;Button&gt;
 *   {loading ? &lt;Loader2 className="animate-spin" /&gt; : &lt;Upload /&gt;}
 *   {ya ? 'Reemplazar' : 'Subir'}
 * &lt;/Button&gt;
 * </pre>
 *
 * <p>Cuando el flag cambia, React tiene que swapear el elemento y reubicar el nodo de
 * texto hermano. Si el DOM que encuentra no coincide con el que espera, `insertBefore`
 * falla y tumba la pantalla.
 *
 * <p>La solución del skill: un único elemento raíz, todos los hijos como elementos
 * explícitos con cierre, y el texto siempre envuelto en `<span>` — nunca suelto.
 *
 * <p>Solo elementos inline adentro: `<span>` y `<svg>`. Nunca `<div>` (es HTML inválido
 * dentro de `<button>`).
 */

import type { LucideIcon } from 'lucide-react';

interface ButtonContentProps {
  /** Muestra el spinner en lugar del icono. */
  loading?: boolean;
  /** Icono en estado normal. Se omite si no aplica. */
  icon?: LucideIcon;
  /** Texto del botón. */
  label: string;
  /** Texto alternativo mientras carga. Si no se pasa, se mantiene `label`. */
  loadingLabel?: string;
  /** Tamaño del icono y del spinner. */
  iconClassName?: string;
  /**
   * Color del spinner. Por defecto hereda el color del texto del botón
   * (`currentColor`), así funciona igual en botones claros y oscuros — el spinner
   * hardcodeado en blanco desaparecía en botones `variant="outline"`.
   */
  spinnerClassName?: string;
}

export function ButtonContent({
  loading = false,
  icon: Icon,
  label,
  loadingLabel,
  iconClassName = 'h-4 w-4',
  spinnerClassName = 'border-current border-t-transparent',
}: ButtonContentProps) {
  return (
    <span className="inline-flex items-center gap-2">
      {loading ? (
        <span
          role="status"
          aria-label="Cargando"
          className={`block animate-spin rounded-full border-2 ${iconClassName} ${spinnerClassName}`}
        ></span>
      ) : Icon ? (
        <Icon className={iconClassName} aria-hidden="true" />
      ) : null}
      <span>{loading ? (loadingLabel ?? label) : label}</span>
    </span>
  );
}
