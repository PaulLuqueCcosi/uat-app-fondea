'use client';

import {
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Minus, Undo2, Redo2, Heading2, Heading3, Table as TableIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import './tiptap-editor.css';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Alto del área visible del editor (la hoja hace scroll dentro). */
  height?: number | string;
  placeholder?: string;
}

export interface TiptapEditorRef {
  /** Inserta HTML/texto en la posición del cursor — usado por el sidebar de variables. */
  insertText: (text: string) => void;
}

/**
 * Editor de documentos basado en Tiptap (ProseMirror), reemplazo de Jodit.
 *
 * <p>Expone la MISMA interfaz que el antiguo JoditEditor ({@code value}, {@code onChange},
 * {@code ref.insertText}) para que el resto del código (TemplateEditorClient) no cambie.
 *
 * <p>El área de edición simula una hoja A4 (210mm, margen 2cm) con la misma tipografía que el
 * PDF final (ver LocalPdfRenderingAdapter), para que editar sea WYSIWYG fiel a lo impreso.
 *
 * <p>A diferencia de Jodit, los comandos (línea horizontal, listas, etc.) van por la API de
 * ProseMirror y NO pierden la selección al hacer click en la toolbar — que era el bug del
 * botón hr en Jodit.
 */
export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  function TiptapEditor({ value, onChange, height = 700 }, ref) {
    const editor = useEditor({
      immediatelyRender: false, // requerido en Next.js SSR
      extensions: [
        // StarterKit v3 ya incluye Underline, HorizontalRule, listas, headings, etc.
        StarterKit,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: value || '<p></p>',
      editorProps: {
        attributes: {
          class: 'fondea-doc-sheet',
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        editor?.chain().focus().insertContent(text).run();
      },
    }), [editor]);

    // Si el valor externo cambia (ej. cancelar edición), resincronizar sin romper el cursor.
    useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    if (!editor) {
      return (
        <div className="rounded-lg border bg-muted/30 flex items-center justify-center" style={{ height }}>
          <span className="text-xs text-muted-foreground">Cargando editor…</span>
        </div>
      );
    }

    return (
      <div className="rounded-lg border overflow-hidden flex flex-col">
        <Toolbar editor={editor} />
        <div className="overflow-auto bg-[#f1f3f5]" style={{ height }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b bg-card px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        label="Negrita"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        label="Cursiva"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        label="Subrayado"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        label="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        label="Título"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        label="Subtítulo"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        label="Lista con viñetas"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        label="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        label="Alinear a la izquierda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        label="Centrar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        label="Alinear a la derecha"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Línea horizontal — comando nativo de Tiptap, sin el bug de foco de Jodit */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Insertar línea horizontal"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        label="Insertar tabla"
      >
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Deshacer"
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Rehacer"
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('h-8 w-8', active && 'bg-primary/10 text-primary')}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}
