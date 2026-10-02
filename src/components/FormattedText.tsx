import React from 'react';

interface FormattedTextProps {
  text?: string;
  className?: string;
}

/**
 * Sanitiza y limpia HTML permitiendo solo etiquetas seguras de formato
 */
function sanitizeHtml(raw: string): string {
  if (!raw) return '';
  // Elimina scripts, iframes, objetos y handlers de eventos
  let clean = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^"']*/gi, '');

  return clean;
}

/**
 * Renderiza texto enriquecido respetando negritas, cursivas, listas con viñetas
 * y párrafos justificados tanto si viene de Word como HTML o texto estructurado.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const hasHtml = /<\/?(b|strong|i|em|u|ul|ol|li|p|br|span)\b/i.test(text);

  if (hasHtml) {
    const cleanHtml = sanitizeHtml(text);
    return (
      <div
        className={`formatted-content text-justify text-stone-700 leading-relaxed space-y-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1 [&_li]:leading-normal [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Si es texto plano con viñetas tipo "•" o "- "
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-stone-700">
          {currentList.map((item, i) => (
            <li key={i} className="leading-normal">{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.replace(/^[•\-\*]\s*/, '');
      currentList.push(content);
    } else {
      flushList(`list-before-${index}`);
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${index}`} className="mb-2 text-stone-700 leading-relaxed text-justify">
            {trimmed}
          </p>
        );
      }
    }
  });
  flushList('list-end');

  return (
    <div className={`formatted-content text-justify text-stone-700 leading-relaxed ${className}`}>
      {elements}
    </div>
  );
};
