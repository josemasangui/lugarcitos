import React, { useState } from 'react';
import { Resena } from '../types';
import { calculateAverageRating } from '../services/storage';
import { getPathForDetail, getFullUrl } from '../services/router';
import { ForkRating } from './ForkRating';
import { InstagramStoryModal } from './InstagramStoryModal';
import { MapPin, ArrowRight, Share2, Check, Instagram } from 'lucide-react';

interface ReviewCardProps {
  resena: Resena;
  ratingSymbol?: string;
  onClick: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  resena,
  ratingSymbol = '🍴',
  onClick
}) => {
  const [copied, setCopied] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const promedio = calculateAverageRating(resena.calificaciones);
  const inicial = resena.titulo.charAt(0).toUpperCase();
  const path = getPathForDetail(resena, 'resena');

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const fullUrl = getFullUrl(path);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Pastel tag styling based on category
  const getTagPastelStyle = (tag?: string) => {
    const t = (tag || '').toLowerCase();
    if (t.includes('parrilla') || t.includes('carne')) {
      return 'bg-[#FFF2EA] text-[#C85A32] border-[#FED7C2]';
    }
    if (t.includes('bodegon') || t.includes('milanesa')) {
      return 'bg-[#FEF9E7] text-[#B27B13] border-[#FCE6A3]';
    }
    if (t.includes('pasta') || t.includes('italia')) {
      return 'bg-[#EEF7EF] text-[#367643] border-[#CFE9D2]';
    }
    if (t.includes('cava') || t.includes('vino')) {
      return 'bg-[#F6F2FC] text-[#6E44AF] border-[#DFD3F4]';
    }
    return 'bg-[#EEF7FA] text-[#227090] border-[#CAE8F2]';
  };

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl border border-[#181816]/10 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#FED7C2] transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Image with fallback */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF8F5]">
        {resena.fotaPortada ? (
          <img
            src={resena.fotaPortada}
            alt={resena.titulo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 flex items-center justify-center font-serif-title text-6xl text-[#C85A32]/30 bg-gradient-to-br from-[#FFF2EA] via-[#FAF8F5] to-[#EEF7EF] ${
            resena.fotaPortada ? '-z-10' : 'z-0'
          }`}
        >
          {inicial}
        </div>

        {/* Destacado del Mes Badge */}
        {resena.destacadoDelMes && (
          <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/95 text-white text-[10px] uppercase font-extrabold tracking-wider shadow-md backdrop-blur-xs border border-amber-300 animate-fadeIn">
            <span>★ Destacado del Mes</span>
          </div>
        )}

        {/* Top Badges: Instagram Story, Share & Price */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsStoryOpen(true);
            }}
            className="p-1.5 rounded-full bg-white/90 hover:bg-[#FFF2EA] text-[#181816] hover:text-[#C85A32] shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
            title="Crear tarjeta para Instagram Stories"
          >
            <Instagram className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShareClick}
            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-[#181816] hover:text-[#C85A32] shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
            title="Copiar link individual"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#367643]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          <div className="bg-[#FFF2EA]/95 border border-[#FED7C2] text-[#C85A32] px-2 py-0.5 rounded text-xs font-bold tracking-widest shadow-xs">
            {'$'.repeat(Math.max(1, Math.min(5, resena.precio || 3)))}
          </div>
        </div>
      </div>

      {/* Content with reduced title spacing */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Rating bar with less bottom margin */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <ForkRating score={promedio} symbol={ratingSymbol} size={14} />
            {resena.fecha && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373]">
                {resena.fecha}
              </span>
            )}
          </div>

          {/* Title with reduced bottom margin and crisp link */}
          <h3 className="font-serif-title text-[22px] sm:text-2xl text-[#181816] group-hover:text-[#C85A32] transition-colors leading-snug mb-1">
            <a
              href={path}
              onClick={(e) => {
                e.preventDefault();
                onClick();
              }}
              className="hover:underline focus:outline-none"
            >
              {resena.titulo}
            </a>
          </h3>

          {/* Location directly under title */}
          {resena.ubicacion && (
            <div className="flex items-center gap-1 text-xs text-[#737373] mb-2">
              <MapPin className="w-3 h-3 text-[#C85A32] flex-shrink-0" />
              <span className="truncate">{resena.ubicacion}</span>
            </div>
          )}

          {/* Excerpt with less margin */}
          <p className="text-xs sm:text-sm text-[#737373] line-clamp-2 leading-relaxed mb-2.5 text-justify">
            {resena.resena.replace(/<[^>]+>/g, ' ')}
          </p>

          {/* Plato Insignia (Qué pedir sí o sí) */}
          {resena.platoInsignia && (
            <div className="mb-2 px-2.5 py-1.5 bg-[#FFF2EA] border border-[#FED7C2]/70 rounded text-[11px] text-[#C85A32] truncate">
              <span className="font-bold text-[10px] uppercase tracking-wide mr-1">★ Pedir sí o sí:</span>
              <span className="font-medium text-[#181816]">{resena.platoInsignia}</span>
            </div>
          )}

          {/* Ocasion pills */}
          {resena.ocasion && resena.ocasion.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {resena.ocasion.slice(0, 2).map((oc) => (
                <span
                  key={oc}
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#181816]/10 text-[#737373]"
                >
                  {oc}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions with pastel badge */}
        <div className="pt-2.5 border-t border-[#181816]/5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#C85A32] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Leer reseña <ArrowRight className="w-3 h-3" />
          </span>
          {resena.etiquetas && resena.etiquetas.length > 0 && (
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded ${getTagPastelStyle(
                resena.etiquetas[0]
              )}`}
            >
              {resena.etiquetas[0]}
            </span>
          )}
        </div>
      </div>

      {/* Modal para Instagram Stories */}
      {isStoryOpen && (
        <InstagramStoryModal
          resena={resena}
          ratingSymbol={ratingSymbol}
          isOpen={isStoryOpen}
          onClose={() => setIsStoryOpen(false)}
        />
      )}
    </article>
  );
};
