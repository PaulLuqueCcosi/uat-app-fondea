'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface JoditEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
  placeholder?: string;
}

export interface JoditEditorRef {
  insertText: (text: string) => void;
}

export const JoditEditor = forwardRef<JoditEditorRef, JoditEditorProps>(
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
        if (jodit) jodit.destruct();
        editorRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={containerRef} className="rounded-lg overflow-hidden border" />;
  }
);
