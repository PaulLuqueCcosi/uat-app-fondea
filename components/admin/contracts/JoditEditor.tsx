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
 * Wrapper de Jodit vanilla. Usa memo para evitar re-renders de React que
 * conflictúan con el DOM que Jodit manipula directamente.
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

          // Crear textarea dentro del container
          const textarea = document.createElement('textarea');
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(textarea);

          jodit = Jodit.make(textarea, {
            readonly: false,
            placeholder: placeholder ?? 'Diseña tu plantilla aquí...',
            height,
            buttons: [
              'bold', 'italic', 'underline', 'strikethrough', '|',
              'ul', 'ol', '|',
              'font', 'fontsize', 'brush', 'paragraph', '|',
              'image', 'table', 'link', '|',
              'align', 'indent', 'outdent', '|',
              'hr', '|',
              'undo', 'redo', '|',
              'source', 'fullsize',
            ],
            uploader: { insertImageAsBase64URI: true },
          });

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
          // Limpiar el DOM para evitar conflictos con React
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // Contenedor estable — React nunca toca su contenido interno
      return <div ref={containerRef} className="rounded-lg overflow-hidden border" />;
    }
  ),
  // memo: nunca re-renderizar (Jodit maneja su propio DOM)
  () => true
);
