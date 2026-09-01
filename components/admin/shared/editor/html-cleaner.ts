/**
 * Limpieza del HTML que produce Lexical antes de guardarlo / enviarlo al backend.
 *
 * Lexical serializa con detalles internos del editor que no queremos persistir:
 *   - class="fondea-h1" / "fondea-p" / etc. — clases del theme del editor, no del documento
 *   - <span style="white-space: pre-wrap;">...</span> — envoltorios de texto de Lexical
 *   - atributos dir="ltr" y estilos de padding-inline que Lexical agrega a listas
 *
 * El objetivo es dejar HTML semántico y limpio (headings, párrafos, tablas, estilos
 * inline legítimos como text-align/color/font-*), que:
 *   1. Pase el ContractTemplateValidator del backend (allowlist de tags/atributos).
 *   2. Se renderice fiel en el PDF (LocalPdfRenderingAdapter).
 *   3. Sea legible si el admin abre la vista de código HTML.
 *
 * Se ejecuta en el navegador (usa DOMParser).
 */

/** Estilos inline que SÍ conservamos (afectan el render del documento/PDF). */
const KEEP_STYLES = new Set([
  'text-align',
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'font-size',
  'font-family',
  'text-decoration',
  'width',
  'vertical-align',
]);

/** Clases internas del editor que se eliminan (no son parte del documento). */
const EDITOR_CLASS_PREFIX = 'fondea-';
/** Clases del playground de Lexical que también se limpian. */
const PLAYGROUND_CLASS_PREFIX = 'PlaygroundEditorTheme__';

export function cleanLexicalHtml(rawHtml: string): string {
  if (typeof window === 'undefined' || !rawHtml) return rawHtml;

  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const body = doc.body;

  cleanElement(body);

  // Desenvuelve <span> que quedaron sin estilos útiles (los de white-space de Lexical).
  unwrapUselessSpans(body);

  return body.innerHTML.trim();
}

function cleanElement(el: Element) {
  // Recorremos en profundidad primero (para poder desenvolver de adentro hacia afuera).
  Array.from(el.children).forEach((child) => cleanElement(child));

  // 1. quitar clases del editor
  const classAttr = el.getAttribute('class');
  if (classAttr) {
    const kept = classAttr
      .split(/\s+/)
      .filter((c) => c && !c.startsWith(EDITOR_CLASS_PREFIX) && !c.startsWith(PLAYGROUND_CLASS_PREFIX));
    if (kept.length > 0) el.setAttribute('class', kept.join(' '));
    else el.removeAttribute('class');
  }

  // 2. limpiar dir="ltr" que Lexical agrega por defecto
  if (el.getAttribute('dir') === 'ltr') el.removeAttribute('dir');

  // 3. filtrar estilos inline: conservar solo los que afectan el documento
  const style = el.getAttribute('style');
  if (style) {
    const kept = style
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((decl) => {
        const prop = decl.split(':')[0]?.trim().toLowerCase();
        if (!prop) return false;
        // descartar white-space:pre-wrap (envoltorio de Lexical) y paddings de lista
        if (prop === 'white-space') return false;
        if (prop.startsWith('padding-inline')) return false;
        return KEEP_STYLES.has(prop);
      });
    if (kept.length > 0) el.setAttribute('style', kept.join('; '));
    else el.removeAttribute('style');
  }
}

/**
 * Desenvuelve spans que no aportan nada (sin estilo ni atributos), reemplazándolos por su
 * contenido. Lexical envuelve cada corrida de texto en <span> — sin estilo, sobran.
 */
function unwrapUselessSpans(root: Element) {
  const spans = Array.from(root.querySelectorAll('span'));
  for (const span of spans) {
    const hasStyle = span.getAttribute('style');
    const hasClass = span.getAttribute('class');
    if (!hasStyle && !hasClass) {
      // reemplaza el span por sus hijos
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
      }
    }
  }
}
