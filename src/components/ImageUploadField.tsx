import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Check, Loader2, Link2 } from 'lucide-react';
import { uploadImageToCloud } from '../services/imageService';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  helpText?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'wide';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  helpText,
  aspectRatio = 'video',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
  };

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen (JPG, PNG, WEBP, etc.)');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const cloudUrl = await uploadImageToCloud(file);
      onChange(cloudUrl);
    } catch (err: any) {
      console.error(err);
      setUploadError('No se pudo subir la foto. Intenta nuevamente.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const aspectClasses = {
    video: 'aspect-[16/9]',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
  }[aspectRatio];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase font-bold tracking-wider text-[#181816]">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlFallback(!showUrlFallback)}
          className="text-[11px] text-[#737373] hover:text-[#C85A32] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Link2 className="w-3 h-3" />
          {showUrlFallback ? 'Ocultar URL' : 'O usar enlace URL'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        /* Preview state with photo displayed */
        <div className={`relative ${aspectClasses} rounded-lg overflow-hidden border border-[#181816]/15 bg-[#181816]/5 group`}>
          <img
            src={value}
            alt="Vista previa"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800';
            }}
          />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-white text-[#181816] text-xs font-bold uppercase tracking-wider rounded shadow hover:bg-[#FAF8F5] transition cursor-pointer flex items-center gap-1.5"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              Cambiar foto
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={isUploading}
              className="p-1.5 bg-red-600 text-white rounded shadow hover:bg-red-700 transition cursor-pointer"
              title="Quitar foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono flex items-center gap-1 backdrop-blur-xs">
            <Check className="w-3 h-3 text-emerald-400" /> Nube sincronizada
          </div>
        </div>
      ) : (
        /* Empty upload dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#C85A32] bg-[#FED7C2]/20'
              : 'border-[#181816]/20 bg-[#FAF8F5] hover:border-[#C85A32]/60 hover:bg-[#FAF8F5]/80'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-8 h-8 text-[#C85A32] animate-spin mb-2" />
              <p className="text-xs font-bold text-[#181816]">Optimizando y subiendo a la nube...</p>
              <p className="text-[11px] text-[#737373] mt-1">Listo para verse en cualquier teléfono o PC</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3">
              <div className="w-12 h-12 rounded-full bg-[#181816]/5 flex items-center justify-center text-[#C85A32] mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#181816] mb-1">
                Haz clic para subir desde tu dispositivo o arrastra la imagen aquí
              </p>
              <p className="text-[11px] text-[#737373]">
                JPG, JPEG, PNG, WEBP — Se optimiza automáticamente para carga ultraveloz
              </p>
            </div>
          )}
        </div>
      )}

      {/* URL fallback option if the user toggles it */}
      {showUrlFallback && (
        <div className="pt-1.5 animate-fadeIn">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="O escribe/pega la URL directa de la imagen (https://...)"
            className="w-full px-3 py-2 bg-white border border-[#181816]/20 rounded text-xs text-[#181816] focus:outline-none focus:border-[#C85A32]"
          />
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-600 font-medium">{uploadError}</p>
      )}

      {helpText && (
        <p className="text-[11px] text-[#737373]">{helpText}</p>
      )}
    </div>
  );
};
