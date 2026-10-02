import React, { useState, useMemo } from 'react';
import { SobreNosotrosData } from '../types';
import { FormattedText } from './FormattedText';
import { PhotoLightbox, LightboxPhoto } from './PhotoLightbox';
import { ArrowLeft, Sparkles, Camera, Maximize2 } from 'lucide-react';

interface SobreNosotrosViewProps {
  data?: SobreNosotrosData;
  onBack: () => void;
}

export const SobreNosotrosView: React.FC<SobreNosotrosViewProps> = ({ data, onBack }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!data || !data.activo) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif-title text-3xl text-[#181816] mb-3">Sección no disponible</h2>
        <p className="text-sm text-[#737373] mb-6">Esta página se encuentra temporalmente inactiva.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C85A32] text-white rounded-lg text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </button>
      </div>
    );
  }

  const { titulo, subtitulo, fotoPortada, texto, fotos = [] } = data;

  const normalizedPhotos = fotos
    .map((f, idx) => {
      if (typeof f === 'string') {
        return f.trim() ? { id: `p-${idx}`, url: f.trim(), pieDeFoto: '' } : null;
      }
      return f && f.url && f.url.trim() ? f : null;
    })
    .filter((f): f is { id: string; url: string; pieDeFoto?: string } => f !== null);

  // Lista unificada para el visor Lightbox en pantalla completa
  const allLightboxPhotos = useMemo<LightboxPhoto[]>(() => {
    const list: LightboxPhoto[] = [];

    // Foto de portada principal
    if (fotoPortada) {
      list.push({
        url: fotoPortada,
        title: titulo || 'Sobre Nosotros',
        caption: subtitulo ? `${titulo}: ${subtitulo}` : (titulo || 'Sobre Nosotros')
      });
    }

    // Postales de la galería
    normalizedPhotos.forEach((photo, i) => {
      list.push({
        url: photo.url,
        title: titulo || 'Sobre Nosotros',
        caption: photo.pieDeFoto || `Crónicas Visuales del Salón (Postal ${i + 1})`
      });
    });

    return list;
  }, [fotoPortada, titulo, subtitulo, normalizedPhotos]);

  const openLightboxAt = (idx: number) => {
    setLightboxIndex(Math.max(0, Math.min(idx, allLightboxPhotos.length - 1)));
    setLightboxOpen(true);
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fadeIn">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737373] hover:text-[#C85A32] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a la mesa principal
        </button>
      </div>

      {/* Header Eyebrow */}
      <div className="text-center mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF2EA] border border-[#FED7C2] text-[#C85A32] rounded-full text-[11px] font-bold uppercase tracking-[2.5px]">
          <Sparkles className="w-3.5 h-3.5" />
          Manifiesto & Memoria Gastronómica
        </span>
      </div>

      {/* Title & Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="font-serif-title text-3xl sm:text-5xl text-[#181816] tracking-tight leading-[1.15] mb-3">
          {titulo || 'Sobre Nosotros'}
        </h1>
        {subtitulo && (
          <p className="font-serif italic text-base sm:text-lg text-[#737373] leading-relaxed">
            {subtitulo}
          </p>
        )}
      </div>

      {/* Hero Cover Photo con disparador de ampliación */}
      {fotoPortada && (
        <div
          onClick={() => openLightboxAt(0)}
          className="relative group aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden shadow-lg border border-[#181816]/10 mb-10 bg-[#FAF8F5] cursor-zoom-in"
          title="Haz clic para ampliar la foto en pantalla completa"
        >
          <img
            src={fotoPortada}
            alt={titulo || 'Sobre Nosotros'}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-4 text-[10px] uppercase font-bold tracking-widest text-white/90 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded">
            Lugarcitos · Diario de Sobremesa
          </div>
          <div className="absolute bottom-3 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
            <Maximize2 className="w-3 h-3 text-[#FED7C2]" />
            <span>Ver foto grande</span>
          </div>
        </div>
      )}

      {/* Narrative Story (Strictly Justified Text with Word Formatting) */}
      <div className="max-w-2xl mx-auto mb-14">
        <FormattedText
          text={texto}
          className="text-justify leading-relaxed text-[#2A2926] text-base sm:text-[17px] font-serif"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 my-12 max-w-sm mx-auto">
        <div className="h-[1px] bg-[#181816]/15 flex-1" />
        <span className="text-[#C85A32] text-xs font-serif italic tracking-wider flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5" /> Galería de Momentos
        </span>
        <div className="h-[1px] bg-[#181816]/15 flex-1" />
      </div>

      {/* Photos Gallery */}
      {normalizedPhotos.length > 0 && (
        <section className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="font-serif-title text-2xl text-[#181816]">
              Crónicas Visuales del Salón ({normalizedPhotos.length} postales)
            </h3>
            <p className="text-xs text-[#737373] mt-1">
              Haz clic en cualquier imagen para verla en pantalla completa con su pie de foto.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalizedPhotos.map((photo, i) => {
              const targetIndex = fotoPortada ? i + 1 : i;

              return (
                <div
                  key={photo.id || i}
                  onClick={() => openLightboxAt(targetIndex)}
                  className="group rounded-xl overflow-hidden shadow-xs hover:shadow-xl border border-[#181816]/10 cursor-zoom-in bg-white transform hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  title="Haz clic para ampliar la foto"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF8F5]">
                    <img
                      src={photo.url}
                      alt={photo.pieDeFoto || `Postal ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-[11px] font-bold text-white bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                        <Maximize2 className="w-3.5 h-3.5 text-[#FED7C2]" /> Ampliar foto
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 text-[9px] font-mono text-white/90 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-none">
                      #{i + 1}
                    </div>
                  </div>

                  {photo.pieDeFoto && (
                    <figcaption className="p-3 text-xs text-[#181816]/85 italic bg-[#FAF8F5]/60 border-t border-[#181816]/5 flex items-start gap-1.5">
                      <span className="text-[#C85A32] not-italic font-bold">›</span>
                      <span>{photo.pieDeFoto}</span>
                    </figcaption>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Visor en Pantalla Completa (Lightbox) */}
      <PhotoLightbox
        photos={allLightboxPhotos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </article>
  );
};
