import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export interface LightboxPhoto {
  url: string;
  caption?: string;
  title?: string;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  initialIndex = 0,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Sincronizar índice inicial cuando se abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
    }
  }, [isOpen, initialIndex, photos.length]);

  // Bloquear scroll de la página de fondo sin perder la posición
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Atajos de teclado: Escape, Flecha Izquierda, Flecha Derecha
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Soporte para gestos táctiles (Swipe en celulares y tablets)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Solo si el deslizamiento es predominantemente horizontal
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visor de fotografía en pantalla completa"
      className="fixed inset-0 z-100 flex flex-col justify-between bg-black/92 backdrop-blur-md animate-fadeIn transition-opacity duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Barra Superior con Contador y Botón de Cierre [X] */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 z-20">
        <div className="flex items-center gap-2">
          <span className="text-white/80 font-mono text-xs font-medium tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            {currentIndex + 1} / {photos.length}
          </span>
          {currentPhoto.title && (
            <span className="text-white/70 text-xs truncate max-w-[200px] sm:max-w-sm hidden sm:inline">
              · {currentPhoto.title}
            </span>
          )}
        </div>

        {/* Botón X discreto y accesible */}
        <button
          onClick={onClose}
          type="button"
          title="Cerrar visor (Escape)"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Área Central: Imagen y Flechas de Navegación */}
      <div
        className="relative flex-1 flex items-center justify-center px-2 sm:px-12 overflow-hidden cursor-pointer"
        onClick={(e) => {
          // Si hace clic en el área oscura de fondo, cerrar
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Flecha Anterior */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="Foto anterior (Flecha Izquierda)"
            className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/10 backdrop-blur-xs transition-all cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Imagen Centrada */}
        <div
          className="max-w-[92vw] sm:max-w-[85vw] max-h-[75vh] flex items-center justify-center cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            key={currentPhoto.url}
            src={currentPhoto.url}
            alt={currentPhoto.caption || currentPhoto.title || `Fotografía ${currentIndex + 1}`}
            className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl select-none animate-fadeIn transition-transform duration-200"
            draggable={false}
          />
        </div>

        {/* Flecha Siguiente */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="Foto siguiente (Flecha Derecha)"
            className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/10 backdrop-blur-xs transition-all cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Pie de Foto Inferior */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          {currentPhoto.caption ? (
            <p className="text-white text-sm sm:text-base font-medium leading-relaxed drop-shadow-md text-justify sm:text-center">
              {currentPhoto.caption}
            </p>
          ) : currentPhoto.title ? (
            <p className="text-white/80 text-xs sm:text-sm font-medium tracking-wide">
              {currentPhoto.title}
            </p>
          ) : (
            <p className="text-white/50 text-xs italic">
              Fotografía {currentIndex + 1} de {photos.length}
            </p>
          )}
          <p className="text-white/40 text-[11px] mt-1 hidden sm:block">
            Usa las flechas del teclado para navegar · Presiona Esc para volver
          </p>
        </div>
      </div>
    </div>
  );
};
