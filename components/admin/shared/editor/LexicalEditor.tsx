'use client';

import {
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import {
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from '@lexical/react/LexicalHorizontalRuleNode';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $isHeadingNode,
} from '@lexical/rich-text';
import { ListNode, ListItemNode, $isListNode } from '@lexical/list';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_CRITICAL,
  $isElementNode,
  $isDecoratorNode,
  type LexicalEditor as LexicalEditorType,
} from 'lexical';
import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';
import { $setBlocksType, $patchStyleText } from '@lexical/selection';
import {
  $getNearestNodeOfType,
  $getNearestBlockElementAncestorOrThrow,
} from '@lexical/utils';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Undo2, Redo2, Baseline, Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLang } from '@codemirror/lang-html';
import './lexical-editor.css';

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
}

export interface LexicalEditorRef {
  insertText: (text: string) => void;
}

// ── Tamaños de página (como el demo). El ancho manda el layout de la "hoja". ──
export interface PageSizeDef {
  label: string;
  /** Ancho de contenido a 96dpi (ya restando márgenes de 2cm por lado). */
  widthPx: number;
  /** Ancho total de la hoja a 96dpi. */
  sheetPx: number;
  heightPx: number;
}

const PAGE_SIZES: Record<string, PageSizeDef> = {
  A4:      { label: 'A4 (210 × 297 mm)',      sheetPx: 794,  widthPx: 642,  heightPx: 1123 },
  LETTER:  { label: 'Carta (8.5 × 11 in)',    sheetPx: 816,  widthPx: 664,  heightPx: 1056 },
  LEGAL:   { label: 'Oficio (8.5 × 14 in)',   sheetPx: 816,  widthPx: 664,  heightPx: 1344 },
};

/** Margen del documento = 2cm (≈76px @96dpi), igual que el PDF del backend. */
const PAGE_MARGIN_PX = 76;

const FONT_FAMILIES = [
  'Segoe UI', 'Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana',
];
const FONT_SIZES = ['10px', '11px', '12px', '13px', '14px', '15px', '16px', '18px', '20px', '24px', '28px'];

// ── Theme ─────────────────────────────────────────────────────────────────────
const theme = {
  paragraph: 'fondea-p',
  heading: { h1: 'fondea-h1', h2: 'fondea-h2', h3: 'fondea-h3' },
  list: { ul: 'fondea-ul', ol: 'fondea-ol', listitem: 'fondea-li' },
  text: {
    bold: 'fondea-bold',
    italic: 'fondea-italic',
    underline: 'fondea-underline',
    strikethrough: 'fondea-strike',
  },
  table: 'fondea-table',
  tableRow: 'fondea-tr',
  tableCell: 'fondea-td',
};

export const LexicalEditor = forwardRef<LexicalEditorRef, LexicalEditorProps>(
  function LexicalEditor({ value, onChange, height = 700 }, ref) {
    const [pageSize, setPageSize] = useState<keyof typeof PAGE_SIZES>('A4');
    const [showSource, setShowSource] = useState(false);
    const [sourceHtml, setSourceHtml] = useState('');
    const size = PAGE_SIZES[pageSize];

    const initialConfig = {
      namespace: 'FondeaContractEditor',
      theme,
      onError(error: Error) {
        console.error('[Lexical]', error);
      },
      nodes: [
        HeadingNode, QuoteNode, ListNode, ListItemNode,
        TableNode, TableCellNode, TableRowNode, HorizontalRuleNode,
      ],
    };

    return (
      <div className="rounded-lg border overflow-hidden flex flex-col">
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            showSource={showSource}
            onToggleSource={setShowSource}
            sourceHtml={sourceHtml}
            setSourceHtml={setSourceHtml}
          />

          {/* ── Vista de CÓDIGO (HTML con resaltado, editable) ── */}
          {showSource ? (
            <div className="fondea-html-source-wrap" style={{ height }}>
              <CodeMirror
                value={sourceHtml}
                onChange={setSourceHtml}
                extensions={[htmlLang()]}
                theme="dark"
                height="100%"
                style={{ height: '100%', fontSize: 13 }}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  autocompletion: true,
                }}
              />
            </div>
          ) : (
            /* ── Vista VISUAL (WYSIWYG) ── */
            <div
              className="fondea-doc-scroll"
              style={
                {
                  height,
                  ['--page-width' as string]: `${size.sheetPx}px`,
                  ['--page-height' as string]: `${size.heightPx}px`,
                  ['--page-margin-top' as string]: `${PAGE_MARGIN_PX}px`,
                  ['--page-margin-right' as string]: `${PAGE_MARGIN_PX}px`,
                  ['--page-margin-bottom' as string]: `${PAGE_MARGIN_PX}px`,
                  ['--page-margin-left' as string]: `${PAGE_MARGIN_PX}px`,
                } as React.CSSProperties
              }
            >
              <div className="fondea-doc-canvas">
                <RichTextPlugin
                  contentEditable={<ContentEditable className="fondea-doc-sheet" />}
                  placeholder={
                    <div className="fondea-placeholder">Diseña tu plantilla aquí…</div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </div>
            </div>
          )}

          <HistoryPlugin />
          <ListPlugin />
          <TablePlugin />
          <HorizontalRulePlugin />
          <OnChangePlugin
            onChange={(_editorState, editor) => {
              const html = editor.read(() => $generateHtmlFromNodes(editor, null));
              onChange(html);
            }}
          />
          <HtmlValuePlugin value={value} />
          <ImperativeHandlePlugin forwardedRef={ref} />
        </LexicalComposer>
      </div>
    );
  },
);

/**
 * Parsea HTML y lo agrega al root de forma segura. Lexical exige que los hijos directos del
 * root sean ElementNode/DecoratorNode — cualquier TextNode suelto (ej. un {{firma}} al nivel
 * raíz, o texto entre etiquetas) se envuelve en un párrafo para no romper el editor.
 */
function appendHtmlToRoot(editor: LexicalEditorType, html: string) {
  const root = $getRoot();
  root.clear();
  const dom = new DOMParser().parseFromString(html || '<p></p>', 'text/html');
  const nodes = $generateNodesFromDOM(editor, dom);

  let pendingInline: any[] = [];
  const flushInline = () => {
    if (pendingInline.length > 0) {
      const p = $createParagraphNode();
      p.append(...pendingInline);
      root.append(p);
      pendingInline = [];
    }
  };

  for (const node of nodes) {
    if ($isElementNode(node) || $isDecoratorNode(node)) {
      flushInline();
      root.append(node);
    } else {
      // TextNode / LineBreakNode sueltos → acumular y envolver en un párrafo
      pendingInline.push(node);
    }
  }
  flushInline();

  if (root.getChildrenSize() === 0) {
    root.append($createParagraphNode());
  }
}

// ── Plugin: carga el HTML inicial una sola vez ────────────────────────────────

function HtmlValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    editor.update(() => {
      appendHtmlToRoot(editor, value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return null;
}

// ── Plugin: expone insertText via ref ─────────────────────────────────────────

function ImperativeHandlePlugin({
  forwardedRef,
}: {
  forwardedRef: React.ForwardedRef<LexicalEditorRef>;
}) {
  const [editor] = useLexicalComposerContext();

  useImperativeHandle(forwardedRef, () => ({
    insertText: (text: string) => {
      editor.focus();
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(text);
        }
      });
    },
  }), [editor]);

  return null;
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

const BLOCK_TYPES: Record<string, string> = {
  paragraph: 'Normal',
  h1: 'Título 1',
  h2: 'Título 2',
  h3: 'Título 3',
  bullet: 'Lista con viñetas',
  number: 'Lista numerada',
};

function ToolbarPlugin({
  pageSize,
  onPageSizeChange,
  showSource,
  onToggleSource,
  sourceHtml,
  setSourceHtml,
}: {
  pageSize: string;
  onPageSizeChange: (v: keyof typeof PAGE_SIZES) => void;
  showSource: boolean;
  onToggleSource: (v: boolean) => void;
  sourceHtml: string;
  setSourceHtml: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  // Alterna entre vista visual y código HTML.
  const toggleSource = () => {
    if (!showSource) {
      // entrando a código: leer el HTML actual del editor
      const html = editor.read(() => $generateHtmlFromNodes(editor, null));
      setSourceHtml(formatHtml(html));
      onToggleSource(true);
    } else {
      // saliendo de código: re-parsear el HTML editado de vuelta al editor (seguro para root)
      editor.update(() => {
        appendHtmlToRoot(editor, sourceHtml);
      });
      onToggleSource(false);
    }
  };
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [fontSize, setFontSize] = useState('15px');
  const [fontFamily, setFontFamily] = useState('Segoe UI');

  // Lee el estado del bloque/marcas donde está el cursor para reflejarlo en la toolbar.
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsStrike(selection.hasFormat('strikethrough'));

    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : $getNearestBlockElementAncestorOrThrow(anchorNode);
    const elementKey = element.getKey();
    const elementDOM = editor.getElementByKey(elementKey);

    if (elementDOM !== null) {
      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        const type = parentList ? parentList.getListType() : element.getListType();
        setBlockType(type);
      } else if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else {
        setBlockType(element.getType());
      }
    }

    // font-size / font-family desde el estilo inline de la selección
    const fs = getSelectionStyle(selection, 'font-size') || '15px';
    const ff = getSelectionStyle(selection, 'font-family') || 'Segoe UI';
    setFontSize(fs);
    setFontFamily(ff.replace(/['"]/g, ''));
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => { updateToolbar(); return false; },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    const unregisterUndo = editor.registerCommand(
      CAN_UNDO_COMMAND, (p) => { setCanUndo(p); return false; }, COMMAND_PRIORITY_LOW,
    );
    const unregisterRedo = editor.registerCommand(
      CAN_REDO_COMMAND, (p) => { setCanRedo(p); return false; }, COMMAND_PRIORITY_LOW,
    );
    const unregisterUpdate = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateToolbar());
    });
    return () => { unregisterUndo(); unregisterRedo(); unregisterUpdate(); };
  }, [editor, updateToolbar]);

  // ── acciones de bloque ──
  const formatBlock = (type: string) => {
    if (type === 'paragraph') {
      editor.update(() => {
        const s = $getSelection();
        if ($isRangeSelection(s)) $setBlocksType(s, () => $createParagraphNode());
      });
    } else if (type === 'h1' || type === 'h2' || type === 'h3') {
      editor.update(() => {
        const s = $getSelection();
        if ($isRangeSelection(s)) $setBlocksType(s, () => $createHeadingNode(type));
      });
    } else if (type === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (type === 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const applyStyle = (styles: Record<string, string>) => {
    editor.update(() => {
      const s = $getSelection();
      if ($isRangeSelection(s)) $patchStyleText(s, styles);
    });
  };

  // En modo código, la toolbar de formato no aplica: solo el botón para volver al visual.
  if (showSource) {
    return (
      <div className="flex items-center gap-2 border-b bg-card px-2 py-1.5">
        <IconBtn label="Volver al editor visual" active onClick={toggleSource}>
          <Code2 className="h-4 w-4" />
        </IconBtn>
        <span className="text-xs text-muted-foreground">
          Editando el HTML directamente. Al volver al editor visual se aplican los cambios.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b bg-card px-2 py-1.5">
      {/* Deshacer / Rehacer */}
      <IconBtn label="Deshacer" disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
        <Undo2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Rehacer" disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
        <Redo2 className="h-4 w-4" />
      </IconBtn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Tipo de bloque */}
      <NativeSelect
        size="sm"
        value={['h1', 'h2', 'h3', 'bullet', 'number', 'paragraph'].includes(blockType) ? blockType : 'paragraph'}
        onChange={(e) => formatBlock(e.target.value)}
        title="Estilo de párrafo"
      >
        <NativeSelectOption value="paragraph">Normal</NativeSelectOption>
        <NativeSelectOption value="h1">Título 1</NativeSelectOption>
        <NativeSelectOption value="h2">Título 2</NativeSelectOption>
        <NativeSelectOption value="h3">Título 3</NativeSelectOption>
        <NativeSelectOption value="bullet">Lista viñetas</NativeSelectOption>
        <NativeSelectOption value="number">Lista numerada</NativeSelectOption>
      </NativeSelect>

      {/* Fuente */}
      <NativeSelect
        size="sm"
        value={FONT_FAMILIES.includes(fontFamily) ? fontFamily : 'Segoe UI'}
        onChange={(e) => applyStyle({ 'font-family': e.target.value })}
        title="Fuente"
      >
        {FONT_FAMILIES.map((f) => (
          <NativeSelectOption key={f} value={f}>{f}</NativeSelectOption>
        ))}
      </NativeSelect>

      {/* Tamaño */}
      <NativeSelect
        size="sm"
        value={FONT_SIZES.includes(fontSize) ? fontSize : '15px'}
        onChange={(e) => applyStyle({ 'font-size': e.target.value })}
        title="Tamaño de letra"
      >
        {FONT_SIZES.map((s) => (
          <NativeSelectOption key={s} value={s}>{s.replace('px', '')}</NativeSelectOption>
        ))}
      </NativeSelect>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Marcas */}
      <IconBtn label="Negrita" active={isBold} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>
        <Bold className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Cursiva" active={isItalic} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}>
        <Italic className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Subrayado" active={isUnderline} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}>
        <UnderlineIcon className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Tachado" active={isStrike} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}>
        <Strikethrough className="h-4 w-4" />
      </IconBtn>

      {/* Color de texto */}
      <ColorButton onPick={(color) => applyStyle({ color })} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Alineación */}
      <IconBtn label="Alinear a la izquierda" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}>
        <AlignLeft className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Centrar" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}>
        <AlignCenter className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Alinear a la derecha" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}>
        <AlignRight className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Justificar" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}>
        <AlignJustify className="h-4 w-4" />
      </IconBtn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Listas rápidas + línea horizontal */}
      <IconBtn label="Lista con viñetas" onClick={() => formatBlock('bullet')}>
        <List className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Lista numerada" onClick={() => formatBlock('number')}>
        <ListOrdered className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Insertar línea horizontal" onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}>
        <Minus className="h-4 w-4" />
      </IconBtn>

      {/* Ver / editar HTML */}
      <IconBtn label="Ver / editar HTML" onClick={toggleSource}>
        <Code2 className="h-4 w-4" />
      </IconBtn>

      {/* Tamaño de página — a la derecha */}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Tamaño</span>
        <NativeSelect
          size="sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange(e.target.value as keyof typeof PAGE_SIZES)}
          title="Tamaño de página"
        >
          {Object.entries(PAGE_SIZES).map(([key, def]) => (
            <NativeSelectOption key={key} value={key}>{def.label}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function IconBtn({
  onClick, active, disabled, label, children,
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
      className={active ? 'h-8 w-8 bg-primary/10 text-primary' : 'h-8 w-8'}
      onMouseDown={(e) => e.preventDefault()}
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

const TEXT_COLORS = [
  '#111827', '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
  '#0087AD', '#00A1CD', '#2563eb', '#7c3aed', '#db2777',
  '#6b7280', '#000000',
];

function ColorButton({ onPick }: { onPick: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            onMouseDown={(e) => e.preventDefault()}
            title="Color de texto"
            aria-label="Color de texto"
          />
        }
      >
        <Baseline className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-6 gap-1.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(c); setOpen(false); }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── util: formatear HTML para que sea legible en el editor de código ──────────

/**
 * Indenta el HTML de forma simple para lectura humana en el textarea de código.
 * No es un formateador perfecto (no reordena atributos ni maneja <pre>), pero
 * convierte el HTML de una línea en algo editable con saltos por etiqueta de bloque.
 */
function formatHtml(html: string): string {
  if (!html) return '';
  const BLOCK = /<\/?(div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|hr|section|header|footer|blockquote)\b[^>]*>/gi;
  // inserta salto de línea antes de cada etiqueta de bloque
  const withBreaks = html.replace(BLOCK, (m) => `\n${m}`).replace(/^\n/, '');
  return withBreaks;
}

// ── util: leer estilo inline de la selección ──────────────────────────────────

function getSelectionStyle(selection: any, property: string): string {
  try {
    const nodes = selection.getNodes();
    for (const node of nodes) {
      if (typeof node.getStyle === 'function') {
        const style = node.getStyle();
        const match = style.match(new RegExp(`${property}:\\s*([^;]+)`));
        if (match) return match[1].trim();
      }
    }
  } catch {
    // ignore
  }
  return '';
}
