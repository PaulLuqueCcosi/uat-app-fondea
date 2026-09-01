'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef, memo } from 'react';

interface JoditEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
  placeholder?: string;
}

export interface JoditEditorRef {
  insertText: (text: string) => void;
}

/**
 * CSS que se inyecta DENTRO del área de edición de Jodit para que editar se sienta como una hoja
 * de Google Docs / Word y sea WYSIWYG FIEL al PDF final.
 *
 * El backend genera el PDF en A4 con margen 2cm y estos estilos base (ver
 * LocalPdfRenderingAdapter.wrapHtml): font-family 'Segoe UI'..., line-height 1.6, color #333,
 * y tablas con borde. Replicamos aquí ese "papel" exacto para que el ancho de línea, la fuente
 * y el espaciado que ve el admin coincidan con lo que saldrá impreso:
 *
 *   - Hoja A4:  210mm de ancho ≈ 794px @96dpi
 *   - Margen:   2cm por lado   ≈ 76px  (área de texto ≈ 170mm ≈ 642px)
 *
 * Es SOLO presentación del editor — no se guarda en el htmlContent del template ni se toca el
 * contenido del admin.
 */
const A4_WIDTH_PX = 794;
const PAGE_MARGIN_PX = 76; // 2cm @96dpi

const DOCUMENT_EDITING_CSS = `
  /* Fondo tipo "escritorio" alrededor de la hoja — va en el contenedor externo de Jodit.
     overflow:auto para poder desplazarse por la hoja A4 completa (más alta que el editor). */
  .jodit-workplace {
    background: #f1f3f5 !important;
    overflow: auto !important;
  }
  /* El área editable ES la hoja A4: caja blanca, ancho de página, margen 2cm y sombra,
     centrada sobre el fondo gris. Padding = margen del PDF para que el ancho de línea coincida.
     Selector con alta especificidad + !important para ganarle a la regla de Jodit
     ".jodit .jodit-workplace .jodit-wysiwyg { width:100% }". */
  .jodit-container .jodit-workplace .jodit-wysiwyg,
  .jodit .jodit-workplace .jodit-wysiwyg {
    width: ${A4_WIDTH_PX}px !important;
    max-width: 100% !important;
    min-height: 1123px !important;   /* 297mm @96dpi — alto de una hoja A4 */
    margin: 32px auto !important;
    background: #ffffff !important;
    padding: ${PAGE_MARGIN_PX}px !important;   /* 2cm, igual que @page margin del PDF */
    box-shadow: 0 1px 6px rgba(0,0,0,0.15);
    box-sizing: border-box !important;
    /* Tipografía y color IDÉNTICOS al PDF (ver LocalPdfRenderingAdapter.wrapHtml) */
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
  }
  .jodit-wysiwyg h1, .jodit-wysiwyg h2, .jodit-wysiwyg h3 {
    color: #1a1a1a;
  }
  /* Tablas idénticas al PDF */
  .jodit-wysiwyg table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }
  .jodit-wysiwyg th, .jodit-wysiwyg td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  .jodit-wysiwyg th {
    background-color: #f5f5f5;
  }
`;

/**
 * Wrapper de Jodit vanilla. Usa memo para evitar re-renders de React que conflictúan con el
 * DOM que Jodit manipula directamente.
 */
export const JoditEditor = memo(
  forwardRef<JoditEditorRef, JoditEditorProps>(
    function JoditEditor({ value, onChange, height = 500, placeholder }, ref) {
      const containerRef = useRef<HTMLDivElement>(null);
      const editorRef = useRef<any>(null);
      const onChangeRef = useRef(onChange);
      onChangeRef.current = onChange;
      const initialValueRef = useRef(value);

      useImperativeHandle(ref, () => ({
        insertText: (text: string) => {
          if (editorRef.current) {
            editorRef.current.selection.insertHTML(text);
          }
        },
      }));

      useEffect(() => {
        let jodit: any;
        let destroyed = false;

        async function init() {
          const { Jodit } = await import('jodit');
          await import('jodit/es2021/jodit.min.css');

          if (destroyed || !containerRef.current) return;

          const textarea = document.createElement('textarea');
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(textarea);

          jodit = Jodit.make(textarea, {
            readonly: false,
            placeholder: placeholder ?? 'Diseña tu plantilla aquí...',
            // 'height' controla el alto del contenedor (la ventana con scroll), no la hoja.
            // La hoja A4 tiene su propio min-height (1123px) vía CSS.
            height,
            // Evita que Jodit fije min-height inline en el área editable — dejamos que la hoja
            // A4 controle su altura desde el CSS de "modo documento".
            minHeight: 0,
            // Control custom para la línea horizontal. El comando nativo 'hr'
            // (insertHorizontalRule) falla silenciosamente en este build cuando el foco pasa a la
            // toolbar (pierde la selección). Usamos selection.insertHTML — el MISMO mecanismo que
            // ya inserta las variables sin problema — para que sea consistente y confiable.
            controls: {
              hrLine: {
                iconURL:
                  'data:image/svg+xml;base64,' +
                  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor"/></svg>'),
                tooltip: 'Insertar línea horizontal',
                exec: (editor: any) => {
                  editor.selection.insertHTML('<hr/><p><br/></p>');
                },
              },
            },
            buttons: [
              'bold', 'italic', 'underline', 'strikethrough', '|',
              'ul', 'ol', '|',
              'font', 'fontsize', 'brush', 'paragraph', '|',
              'image', 'table', 'link', '|',
              'align', 'indent', 'outdent', '|',
              'hrLine', '|',
              'undo', 'redo', '|',
              'source', 'fullsize',
            ],
            uploader: { insertImageAsBase64URI: true },
          });

          // Estilo de "modo documento" en el área de edición — solo presentación, no se guarda.
          injectEditingStyles(jodit);

          jodit.value = initialValueRef.current;
          jodit.events.on('change', () => {
            onChangeRef.current(jodit.value);
          });

          editorRef.current = jodit;
        }

        init();

        return () => {
          destroyed = true;
          if (jodit) {
            jodit.destruct();
          }
          editorRef.current = null;
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return <div ref={containerRef} className="rounded-lg overflow-hidden border" />;
    }
  ),
  () => true
);

/**
 * Inyecta el CSS de edición en el área WYSIWYG de Jodit. Jodit v3 por defecto NO usa iframe, así
 * que el WYSIWYG vive en el mismo document — inyectamos el <style> una sola vez ahí.
 */
function injectEditingStyles(jodit: any) {
  try {
    const doc: Document =
      jodit.editorDocument ?? jodit.ed ?? (typeof document !== 'undefined' ? document : null);
    if (!doc) return;

    const STYLE_ID = 'fondea-jodit-doc-style';
    if (doc.getElementById(STYLE_ID)) return; // ya inyectado

    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = DOCUMENT_EDITING_CSS;
    (doc.head ?? doc.body ?? doc.documentElement).appendChild(style);
  } catch {
    // Si Jodit cambia su API interna, el editor sigue funcionando sin el estilo de hoja.
  }
}
