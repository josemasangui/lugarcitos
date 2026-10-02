import React, { useState, useMemo } from 'react';
import { Resena, Receta } from '../types';
import { calculateAverageRating } from '../services/storage';
import { getPathForDetail, getFullUrl } from '../services/router';
import { ForkRating } from './ForkRating';
import { CuteTicket } from './CuteTicket';
import { FormattedText } from './FormattedText';
import { PhotoLightbox, LightboxPhoto } from './PhotoLightbox';
import { InstagramStoryModal } from './InstagramStoryModal';
import { ArrowLeft, Clock, Users, MapPin, Check, Share2, Link as LinkIcon, Navigation, Printer, Plus, Minus, Maximize2, Instagram, Sparkles } from 'lucide-react';

interface DetailViewProps {
  item: Resena | Receta;
  tipo: 'resena' | 'receta';
  ratingSymbol?: string;
  onBack: () => void;
  onViewOnMap?: (item: Resena) => void;
}

/**
 * Escala las cantidades de los ingredientes según las porciones seleccionadas
 */
function scaleIngredient(ing: string, ratio: number): string {
  if (ratio === 1) return ing;
  return ing.replace(/^([\d.,]+|\d+\/\d+)/, (match) => {
    let num = 0;
    if (match.includes('/')) {
      const [a, b] = match.split('/');
      num = parseFloat(a) / parseFloat(b);
    } else {
      num = parseFloat(match.replace(',', '.'));
    }
    if (isNaN(num)) return match;
    const scaled = num * ratio;
    return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1).replace(/\.0$/, '');
  });
}

export const DetailView: React.FC<DetailViewProps> = ({
  item,
  tipo,
  ratingSymbol = '🍴',
  onBack,
  onViewOnMap
}) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  const isResena = tipo === 'resena';
  const resena = isResena ? (item as Resena) : null;
  const receta = !isResena ? (item as Receta) : null;

  // Colección de fotos para el visor en pantalla completa (Lightbox)
  const allLightboxPhotos = useMemo<LightboxPhoto[]>(() => {
    const list: LightboxPhoto[] = [];

    // 1. Portada principal
    if (item.fotaPortada) {
      list.push({
        url: item.fotaPortada,
        title: item.titulo,
        caption: isResena
          ? `Portada de ${item.titulo}`
          : `Plato finalizado: ${item.titulo}`
      });
    }

    // 2. Galería adicional con sus pies de foto
    if (item.galeria && item.galeria.length > 0) {
      item.galeria.forEach((foto, i) => {
        const url = typeof foto === 'string' ? foto : foto.url;
        const caption = typeof foto === 'string' ? '' : foto.pieDeFoto;
        if (url) {
          list.push({
            url,
            title: item.titulo,
            caption: caption || `${item.titulo} (Foto ${i + 1})`
          });
        }
      });
    }

    return list;
  }, [item, isResena]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  const openLightboxAt = (index: number) => {
    if (allLightboxPhotos.length === 0) return;
    setLightboxIndex(Math.max(0, Math.min(index, allLightboxPhotos.length - 1)));
    setLightboxOpen(true);
  };

  // Calculador dinámico de porciones en recetas
  const baseServings = receta?.porciones
    ? parseInt(receta.porciones) || 4
    : 4;
  const [servings, setServings] = useState<number>(baseServings);
  const servingsRatio = servings / (baseServings || 1);

  const contentText = isResena ? resena?.resena || '' : receta?.descripcion || '';
  const wordCount = contentText.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const averageRating = resena ? calculateAverageRating(resena.calificaciones) : 0;
  const path = getPathForDetail(item, tipo);
  const fullUrl = getFullUrl(path);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const googleMapsUrl = resena
    ? resena.lat && resena.lng
      ? `https://www.google.com/maps/search/?api=1&query=${resena.lat},${resena.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${resena.titulo} ${resena.ubicacion || 'Buenos Aires'}`
        )}`
    : '';

  const wazeUrl = resena
    ? `https://waze.com/ul?q=${encodeURIComponent(
        `${resena.titulo} ${resena.ubicacion || 'Buenos Aires'}`
      )}&navigate=yes`
    : '';

  return (
    <article className="max-w-3xl mx-auto py-4 px-4 sm:px-6 animate-fadeIn print-container">
      {/* Top action bar with reduced vertical spacing (hidden on print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#181816]/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[1.5px] text-[#737373] hover:text-[#C85A32] transition-colors focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a {isResena ? 'reseñas' : 'recetas'}
        </button>

        {/* Shareable URL Badge & Actions */}
        <div className="flex items-center gap-2">
          {!isResena && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              title="Imprimir receta o guardar en PDF limpio"
            >
              <Printer className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Imprimir / PDF</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF2EA] border border-[#FED7C2] rounded text-[11px] text-[#C85A32] font-mono">
            <LinkIcon className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{path}</span>
          </div>

          {isResena && resena && (
            <button
              onClick={() => setStoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#FFF2EA] to-[#FED7C2]/60 hover:from-[#FED7C2] hover:to-[#FED7C2] text-[#C85A32] border border-[#FED7C2] rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              title="Crear postal vertical estética para Historias de Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instagram Story</span>
              <span className="sm:hidden">Story</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
              copiedLink
                ? 'bg-[#EEF7EF] text-[#367643] border border-[#CFE9D2]'
                : 'bg-white hover:bg-[#FFF2EA] text-[#181816] hover:text-[#C85A32] border border-[#181816]/15 hover:border-[#FED7C2]'
            }`}
            title="Copiar link propio para compartir"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#367643]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? '¡Link copiado!' : 'Copiar link'}</span>
          </button>
        </div>
      </div>

      {/* Destacado del Mes Hero Ribbon */}
      {isResena && resena?.destacadoDelMes && (
        <div className="no-print mb-4 p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-50 to-orange-50/80 border border-amber-300 rounded-xl flex items-center gap-3 shadow-xs animate-fadeIn">
          <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-900 block">
              ★ Destacado del Mes · Recomendación del Autor
            </span>
            <span className="text-xs text-amber-800/90 font-medium">
              Elegido especial por su propuesta culinaria, atención excepcional y sobremesa memorable.
            </span>
          </div>
        </div>
      )}

      {/* Cover Image with reduced margin & Lightbox Zoom Trigger */}
      {item.fotaPortada && (
        <div
          onClick={() => openLightboxAt(0)}
          className="relative group w-full h-72 sm:h-[420px] rounded-xl overflow-hidden mb-4 shadow-md border border-[#181816]/10 print:h-64 cursor-zoom-in"
          title="Haz clic para ampliar la foto en pantalla completa"
        >
          <img
            src={item.fotaPortada}
            alt={item.titulo}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors pointer-events-none" />
          <div className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
            <Maximize2 className="w-3 h-3 text-[#FED7C2]" />
            <span>Ver foto grande</span>
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="font-serif-title text-3xl sm:text-5xl text-[#181816] text-center leading-tight mb-1.5">
        {item.titulo}
      </h1>

      {/* Reading time & sub-tag & date */}
      <div className="text-center text-xs text-[#737373] mb-3 flex flex-wrap items-center justify-center gap-3">
        <span>⏱️ Lectura: {readingTimeMinutes} min</span>
        <span>·</span>
        <span className="text-[#C85A32] font-semibold">{isResena ? 'Reseña Gastronómica' : 'Receta Casera'}</span>
        {isResena && resena?.fecha && (
          <>
            <span>·</span>
            <span className="text-stone-700 font-medium">📅 Visita: {resena.fecha}</span>
          </>
        )}
      </div>

      {/* Sub-header info for Reseña */}
      {isResena && resena && (
        <div className="mb-6 text-center">
          {resena.ubicacion && (
            <div className="flex flex-col items-center justify-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#737373]">
                <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>{resena.ubicacion}</span>
                {onViewOnMap && (
                  <button
                    onClick={() => onViewOnMap(resena)}
                    className="ml-1 text-xs font-bold text-[#C85A32] hover:underline cursor-pointer"
                  >
                    (Ver en mapa)
                  </button>
                )}
              </div>

              {/* Botón Cómo llegar con Google Maps y Waze */}
              <div className="no-print inline-flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mr-1">
                  Cómo llegar:
                </span>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF2EA] hover:bg-[#FED7C2] text-[#C85A32] border border-[#FED7C2] transition-colors shadow-2xs cursor-pointer"
                  title="Abrir en Google Maps"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Google Maps
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF7FA] hover:bg-[#CAE8F2] text-[#227090] border border-[#CAE8F2] transition-colors shadow-2xs cursor-pointer"
                  title="Abrir en Waze"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Waze
                </a>
              </div>
            </div>
          )}

          {resena.ocasion && resena.ocasion.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373] mr-1">
                Ideal para:
              </span>
              {resena.ocasion.map((oc) => (
                <span
                  key={oc}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F5] border border-[#181816]/15 text-[#181816]"
                >
                  {oc}
                </span>
              ))}
            </div>
          )}

          {/* Il Conto: Ticket de comanda vintage con bordes dentados y sello */}
          <CuteTicket
            resena={resena}
            ratingSymbol={ratingSymbol}
            onViewOnMap={onViewOnMap}
          />
        </div>
      )}

      {/* Sub-header info for Receta with portion calculator */}
      {!isResena && receta && (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-2.5 px-4 my-3 bg-[#EEF7EF] border border-[#CFE9D2] rounded-lg text-xs font-bold text-[#367643]">
          {receta.tiempo && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C85A32]" /> {receta.tiempo}
            </span>
          )}

          {/* Calculador interactivo de porciones */}
          <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-md border border-[#CFE9D2] shadow-2xs">
            <Users className="w-3.5 h-3.5 text-[#367643]" />
            <span className="text-stone-700">Porciones:</span>
            <div className="flex items-center gap-1.5 no-print">
              <button
                type="button"
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                title="Reducir porciones"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono text-sm font-bold text-[#367643] min-w-[20px] text-center">
                {servings}
              </span>
              <button
                type="button"
                onClick={() => setServings(servings + 1)}
                className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                title="Aumentar porciones"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="print:inline hidden text-[#367643] font-bold">{servings}</span>
          </div>
        </div>
      )}

      {/* Dynamic Custom Tags */}
      {item.etiquetas && item.etiquetas.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
          {item.etiquetas.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FED7C2]/40 text-[#C85A32] border border-[#FED7C2]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Main Narrative Content with Drop Cap and Justified Formatted Text */}
      <div className="mb-8">
        <FormattedText
          text={contentText}
          className="text-justify text-base sm:text-lg leading-relaxed text-[#181816]"
        />
      </div>

      {/* Extra sections for Recipe */}
      {!isResena && receta && (
        <div className="space-y-6 my-6 pt-5 border-t border-[#181816]/10 print-break-inside-avoid">
          {receta.ingredientes && receta.ingredientes.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#CFE9D2] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="font-serif-title text-2xl text-[#181816]">
                  Ingredientes necesarios
                </h3>
                <div className="flex items-center gap-2">
                  {servingsRatio !== 1 && (
                    <span className="text-[11px] font-sans font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Cantidades ajustadas para {servings} {servings === 1 ? 'porción' : 'porciones'}
                    </span>
                  )}
                  <span className="text-xs font-sans font-semibold text-[#367643] bg-[#EEF7EF] px-2 py-0.5 rounded">
                    {receta.ingredientes.length} items
                  </span>
                </div>
              </div>
              <ul className="space-y-2">
                {receta.ingredientes.map((ing, idx) => {
                  const scaledIng = scaleIngredient(ing, servingsRatio);
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleIngredient(idx)}
                      className="flex items-start gap-2.5 text-sm cursor-pointer select-none group"
                    >
                      <span
                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors mt-0.5 ${
                          checkedIngredients[idx]
                            ? 'bg-[#367643] border-[#367643] text-white'
                            : 'border-[#181816]/20 bg-white group-hover:border-[#367643]'
                        }`}
                      >
                        {checkedIngredients[idx] && <Check className="w-3 h-3" />}
                      </span>
                      <span
                        className={`transition-colors leading-relaxed ${
                          checkedIngredients[idx]
                            ? 'line-through text-[#737373]'
                            : 'text-[#181816]'
                        }`}
                      >
                        {scaledIng}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {receta.pasos && receta.pasos.length > 0 && (
            <div className="print-break-inside-avoid">
              <h3 className="font-serif-title text-2xl text-[#181816] mb-4">
                Preparación paso a paso
              </h3>
              <ol className="space-y-4">
                {receta.pasos.map((paso, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-lg bg-white border border-[#181816]/10 shadow-xs"
                  >
                    <span className="font-serif-title text-lg text-[#C85A32] w-7 h-7 rounded-full bg-[#FFF2EA] border border-[#FED7C2] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="text-sm text-[#181816] leading-relaxed pt-0.5 text-justify w-full">
                      <FormattedText text={paso} className="text-justify" />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Photo Gallery with Captions and Lightbox Zoom */}
      {item.galeria && item.galeria.length > 0 && (
        <section className="my-8 pt-6 border-t border-[#181816]/10 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif-title text-2xl sm:text-3xl text-[#181816]">
                Galería fotográfica & momentos
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Haz clic en cualquier foto para verla en pantalla completa con su pie de foto.
              </p>
            </div>
            <span className="text-xs font-mono text-[#737373] bg-[#181816]/5 px-2.5 py-1 rounded-full">
              {item.galeria.length} fotos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {item.galeria.map((foto, idx) => {
              const url = typeof foto === 'string' ? foto : foto.url;
              const caption = typeof foto === 'string' ? '' : foto.pieDeFoto;
              if (!url) return null;

              // El índice en la lista de lightbox (considerando si hay foto de portada en el índice 0)
              const targetIndex = item.fotaPortada ? idx + 1 : idx;

              return (
                <figure
                  key={idx}
                  onClick={() => openLightboxAt(targetIndex)}
                  className="group overflow-hidden rounded-xl bg-white border border-[#181816]/10 shadow-xs hover:border-[#C85A32]/40 transition-all flex flex-col cursor-zoom-in"
                  title="Haz clic para ampliar la foto"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#181816]/5 relative">
                    <img
                      src={url}
                      alt={caption || `${item.titulo} foto ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-400"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-stone-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md transition-opacity flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-[#C85A32]" />
                        Ampliar foto
                      </span>
                    </div>
                  </div>
                  {caption && (
                    <figcaption className="p-3 text-xs text-[#181816]/80 italic border-t border-[#181816]/5 bg-[#FAF8F5]/50 flex items-start gap-1.5">
                      <span className="text-[#C85A32] not-italic font-bold">›</span>
                      <span>{caption}</span>
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom Back Button & Share Bar (hidden on print) */}
      <div className="no-print pt-6 border-t border-[#181816]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-[#181816] text-[#FAF8F5] hover:bg-[#C85A32] rounded font-bold text-xs uppercase tracking-[2px] transition-colors shadow-xs cursor-pointer"
        >
          ← Volver a {isResena ? 'reseñas' : 'recetas'}
        </button>

        <button
          onClick={handleShare}
          className="text-xs uppercase font-bold tracking-wider text-[#C85A32] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" /> Compartir este artículo ({path})
        </button>
      </div>

      {/* Visor de Fotos en Pantalla Completa (Lightbox) */}
      <PhotoLightbox
        photos={allLightboxPhotos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Creador de Tarjetas para Historias de Instagram */}
      {isResena && resena && (
        <InstagramStoryModal
          resena={resena}
          ratingSymbol={ratingSymbol}
          isOpen={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
        />
      )}
    </article>
  );
};
