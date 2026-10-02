import React, { useState } from 'react';
import { Plus, X, Tag as TagIcon } from 'lucide-react';

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  suggestions?: string[];
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tags = [],
  onChange,
  label = 'Etiquetas / Tags',
  placeholder = 'Escribe un tag y presiona Enter o Agregar...',
  suggestions = ['Parrilla', 'Pastas', 'Bodegón', 'Cafetería', 'Vinos', 'Terraza', 'Romántico', 'Brunch'],
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tagText: string) => {
    const trimmed = tagText.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const availableSuggestions = suggestions.filter(
    (sug) => !tags.some((t) => t.toLowerCase() === sug.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase font-bold tracking-wider text-[#181816]">
        {label}
      </label>

      {/* Input + Button row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#181816]/20 rounded text-xs text-[#181816] focus:outline-none focus:border-[#C85A32]"
          />
          <TagIcon className="w-3.5 h-3.5 text-[#737373] absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="button"
          onClick={() => addTag(inputValue)}
          disabled={!inputValue.trim()}
          className="px-3 py-2 bg-[#181816] text-white hover:bg-[#C85A32] disabled:opacity-40 disabled:hover:bg-[#181816] rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>

      {/* Active tags badges */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#181816]/5 border border-[#181816]/15 rounded-full text-xs font-medium text-[#181816]"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="text-[#737373] hover:text-red-600 cursor-pointer p-0.5"
                title="Quitar etiqueta"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestions cloud */}
      {availableSuggestions.length > 0 && (
        <div className="pt-1">
          <p className="text-[10px] uppercase font-bold text-[#737373] mb-1">
            Sugerencias rápidas:
          </p>
          <div className="flex flex-wrap gap-1">
            {availableSuggestions.slice(0, 8).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => addTag(sug)}
                className="px-2 py-0.5 rounded text-[11px] bg-[#FAF8F5] border border-[#181816]/10 text-[#737373] hover:border-[#C85A32] hover:text-[#C85A32] transition cursor-pointer"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
