import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, ListOrdered, RemoveFormatting, Eye, Edit3 } from 'lucide-react';
import { FormattedText } from './FormattedText';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

/**
 * Limpia el HTML generado por Microsoft Word o Google Docs
 * manteniendo únicamente negritas, cursivas, listas y párrafos limpios.
 */
function cleanWordHtml(html: string): string {
  // 1. Elimina encabezados XML, comentarios condicionales y estilos de Office
  let clean = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[[\s\S]*?\]>/g, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<meta[\s\S]*?>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '');

  // 2. Parsea con DOMParser en el navegador para extraer la estructura limpia
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');

    // Función recursiva para sanitizar nodos
    const sanitizeNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(false);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        // Convertir b y strong
        if (tag === 'b' || tag === 'strong' || el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 600) {
          const strong = document.createElement('strong');
          Array.from(el.childNodes).forEach(child => {
            const sanitizedChild = sanitizeNode(child);
            if (sanitizedChild) strong.appendChild(sanitizedChild);
          });
          return strong;
        }

        // Convertir i y em
        if (tag === 'i' || tag === 'em' || el.style.fontStyle === 'italic') {
          const em = document.createElement('em');
          Array.from(el.childNodes).forEach(child => {
            const sanitizedChild = sanitizeNode(child);
            if (sanitizedChild) em.appendChild(sanitizedChild);
          });
          return em;
        }

        // Listas
        if (tag === 'ul' || tag === 'ol' || tag === 'li') {
          const listEl = document.createElement(tag);
          Array.from(el.childNodes).forEach(child => {
            const sanitizedChild = sanitizeNode(child);
            if (sanitizedChild) listEl.appendChild(sanitizedChild);
          });
          return listEl;
        }

        // Párrafos y saltos
        if (tag === 'p' || tag === 'div') {
          // Detectar si Word usó un párrafo como viñeta (MsoListParagraph)
          const isWordBullet = el.className && el.className.includes('MsoList');
          const targetTag = isWordBullet ? 'li' : 'p';
          const p = document.createElement(targetTag);
          Array.from(el.childNodes).forEach(child => {
            const sanitizedChild = sanitizeNode(child);
            if (sanitizedChild) p.appendChild(sanitizedChild);
          });
          return p;
        }

        if (tag === 'br') {
          return document.createElement('br');
        }

        // Para cualquier otro contenedor (span, font, etc.), conservar solo el contenido interno sanitizado
        const fragment = document.createDocumentFragment();
        Array.from(el.childNodes).forEach(child => {
          const sanitizedChild = sanitizeNode(child);
          if (sanitizedChild) fragment.appendChild(sanitizedChild);
        });
        return fragment;
      }

      return null;
    };

    const container = document.createElement('div');
    Array.from(doc.body.childNodes).forEach(child => {
      const sanitized = sanitizeNode(child);
      if (sanitized) container.appendChild(sanitized);
    });

    let result = container.innerHTML.trim();
    // Limpia párrafos vacíos redundantes
    result = result.replace(/<p>\s*(<br>|&nbsp;)?\s*<\/p>/gi, '<br>');
    return result || html;
  } catch {
    return html;
  }
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí o pega desde Word...',
  minHeight = '140px',
  label,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const isUpdatingFromProps = useRef(false);

  // Sincronizar contenido inicial o externo
  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    if (value !== currentHtml && !isUpdatingFromProps.current) {
      // Si el valor recibido es texto plano sin HTML pero con saltos de línea
      if (value && !value.includes('<') && value.includes('\n')) {
        editorRef.current.innerHTML = value
          .split('\n')
          .map(line => (line.trim() ? `<p>${line}</p>` : '<br>'))
          .join('');
      } else {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    isUpdatingFromProps.current = true;
    const html = editorRef.current.innerHTML;
    // Si quedó solo un <br> vacío, limpiarlo
    if (html === '<br>' || html === '<p><br></p>' || html.trim() === '') {
      onChange('');
    } else {
      onChange(html);
    }
    setTimeout(() => {
      isUpdatingFromProps.current = false;
    }, 50);
  };

  const handleFormat = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Interceptar pegado desde Microsoft Word / Google Docs
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const plainText = clipboardData.getData('text/plain');

    let processedHtml = '';

    if (htmlData && (htmlData.includes('MsoNormal') || htmlData.includes('class="Mso') || htmlData.includes('<b') || htmlData.includes('<i') || htmlData.includes('<ul'))) {
      processedHtml = cleanWordHtml(htmlData);
    } else if (plainText) {
      // Manejar viñetas manuales como "•" o "-"
      const lines = plainText.split('\n');
      const inList = false;
      let buffer = '';

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const item = trimmed.replace(/^[•\-\*]\s*/, '');
          buffer += `<li>${item}</li>`;
        } else if (trimmed) {
          buffer += `<p>${trimmed}</p>`;
        }
      });

      if (buffer.includes('<li>')) {
        processedHtml = buffer.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
      } else {
        processedHtml = plainText.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
        processedHtml = `<p>${processedHtml}</p>`;
      }
    }

    if (processedHtml) {
      document.execCommand('insertHTML', false, processedHtml);
      handleInput();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
            {label}
          </label>
          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
            Respeta Word (Negrita, Cursiva, Viñetas)
          </span>
        </div>
      )}

      <div className="border border-stone-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-800/30 focus-within:border-amber-800 transition-all shadow-sm">
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-stone-50 border-b border-stone-200 text-stone-600">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleFormat('bold')}
              title="Negrita (Ctrl+B)"
              className="p-1.5 hover:bg-stone-200 rounded text-stone-700 hover:text-black transition-colors"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('italic')}
              title="Cursiva (Ctrl+I)"
              className="p-1.5 hover:bg-stone-200 rounded text-stone-700 hover:text-black transition-colors"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-stone-300 mx-1" />
            <button
              type="button"
              onClick={() => handleFormat('insertUnorderedList')}
              title="Viñetas con puntos"
              className="p-1.5 hover:bg-stone-200 rounded text-stone-700 hover:text-black transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('insertOrderedList')}
              title="Lista numerada (1, 2, 3...)"
              className="p-1.5 hover:bg-stone-200 rounded text-stone-700 hover:text-black transition-colors"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-stone-300 mx-1" />
            <button
              type="button"
              onClick={() => handleFormat('removeFormat')}
              title="Quitar formato"
              className="p-1.5 hover:bg-stone-200 rounded text-stone-500 hover:text-rose-600 transition-colors"
            >
              <RemoveFormatting className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`text-xs px-2.5 py-1 rounded font-medium flex items-center space-x-1.5 transition-colors ${
              showPreview
                ? 'bg-amber-800 text-white'
                : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            {showPreview ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa</span>
              </>
            )}
          </button>
        </div>

        {/* Área editable o Vista Previa */}
        {showPreview ? (
          <div
            className="p-3.5 bg-stone-50/50 overflow-y-auto"
            style={{ minHeight }}
          >
            <div className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-2">
              Vista previa justificada:
            </div>
            {value ? (
              <FormattedText text={value} className="text-sm" />
            ) : (
              <p className="text-stone-400 text-sm italic">Sin texto para previsualizar.</p>
            )}
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onBlur={handleInput}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className="p-3.5 text-stone-800 text-sm leading-relaxed outline-none overflow-y-auto text-justify empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_p]:mb-2 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic"
          />
        )}
      </div>
      <p className="text-[11px] text-stone-500 mt-1">
        Podés usar atajos de teclado: <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">Ctrl+B</kbd> para negrita, <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">Ctrl+I</kbd> para cursiva.
      </p>
    </div>
  );
};
