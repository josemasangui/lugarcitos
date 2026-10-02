import React, { useRef, useState } from 'react';
import { FotoItem } from '../types';
import { Plus, X, UploadCloud, Loader2, Image as ImageIcon, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { uploadImageToCloud } from '../services/imageService';

interface GalleryManagerProps {
  fotos?: (FotoItem | string)[];
  onChange: (fotos: FotoItem[]) => void;
  maxPhotos?: number;
  label?: string;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({
  fotos = [],
  onChange,
  maxPhotos = 15,
  label = 'Galería de fotos adicionales (hasta 15 fotos con pie de foto)',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Normalize photos into standard FotoItem array
  const normalizedFotos: FotoItem[] = fotos.map((f, idx) => {
    if (typeof f === 'string') {
      return { id: `foto-${idx}-${Date.now()}`, url: f, pieDeFoto: '' };
    }
    return {
      id: f.id || `foto-${idx}`,
      url: f.url || '',
      pieDeFoto: f.pieDeFoto || '',
    };
  });

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newItems: FotoItem[] = [...normalizedFotos];

    try {
      for (let i = 0; i < files.length; i++) {
        if (newItems.length >= maxPhotos) break;
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const cloudUrl = await uploadImageToCloud(file);
        newItems.push({
          id: `foto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: cloudUrl,
          pieDeFoto: '',
        });
      }
      onChange(newItems);
    } catch (err) {
      console.error('Error al procesar galería de fotos:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePieDeFotoChange = (id: string, text: string) => {
    const updated = normalizedFotos.map((item) =>
      item.id === id ? { ...item, pieDeFoto: text } : item
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    const updated = normalizedFotos.filter((item) => item.id !== id);
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= normalizedFotos.length) return;

    const copy = [...normalizedFotos];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onChange(copy);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between border-b border-[#181816]/10 pb-2">
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-[#181816]">
            {label}
          </label>
          <p className="text-[11px] text-[#737373]">
            Sube fotos desde tu computadora o celular y aclara cada una con su pie de foto explicativo.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#C85A32] bg-[#FED7C2]/40 px-2 py-0.5 rounded">
          {normalizedFotos.length} / {maxPhotos} fotos
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/*"
        onChange={handleMultipleFiles}
        className="hidden"
      />

      {/* List of uploaded gallery items */}
      <div className="space-y-3">
        {normalizedFotos.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row gap-3 p-3 bg-white border border-[#181816]/10 rounded-lg shadow-xs hover:border-[#C85A32]/40 transition-colors"
          >
            {/* Image Preview Thumbnail */}
            <div className="relative w-full sm:w-28 h-24 shrink-0 rounded overflow-hidden bg-[#181816]/5 border border-[#181816]/10">
              <img
                src={item.url}
                alt={item.pieDeFoto || `Foto ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400';
                }}
              />
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                #{index + 1}
              </span>
            </div>

            {/* Caption Input */}
            <div className="flex-1 flex flex-col justify-between gap-2">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#181816]/80 mb-1">
                  Pie de foto explicativo
                </label>
                <input
                  type="text"
                  value={item.pieDeFoto || ''}
                  onChange={(e) => handlePieDeFotoChange(item.id, e.target.value)}
                  placeholder="Ej. Detalle del emplatado, ambiente de la terraza, punto de la carne..."
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#181816]/15 rounded text-xs text-[#181816] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#737373]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-[#181816]/5 rounded disabled:opacity-30 cursor-pointer"
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === normalizedFotos.length - 1}
                    className="p-1 hover:bg-[#181816]/5 rounded disabled:opacity-30 cursor-pointer"
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Eliminar foto
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Button to add more photos */}
      {normalizedFotos.length < maxPhotos && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-3 px-4 border-2 border-dashed border-[#181816]/20 hover:border-[#C85A32] bg-[#FAF8F5] hover:bg-[#FED7C2]/20 rounded-lg text-xs font-bold uppercase tracking-wider text-[#181816] transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#C85A32]" />
              Optimizando y subiendo fotos a la nube...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 text-[#C85A32]" />
              + Subir foto(s) desde la computadora o celular
            </>
          )}
        </button>
      )}
    </div>
  );
};
