import React, { useState } from 'react';
import { Receta } from '../types';
import { getPathForDetail, getFullUrl } from '../services/router';
import { Clock, Users, ArrowRight, Share2, Check } from 'lucide-react';

interface RecipeCardProps {
  receta: Receta;
  onClick: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ receta, onClick }) => {
  const [copied, setCopied] = useState(false);
  const inicial = receta.titulo.charAt(0).toUpperCase();
  const path = getPathForDetail(receta, 'receta');

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

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl border border-[#181816]/10 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#CFE9D2] transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF8F5]">
        {receta.fotaPortada ? (
          <img
            src={receta.fotaPortada}
            alt={receta.titulo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 flex items-center justify-center font-serif-title text-6xl text-[#367643]/30 bg-gradient-to-br from-[#EEF7EF] via-[#FEF9E7] to-[#FAF8F5] ${
            receta.fotaPortada ? '-z-10' : 'z-0'
          }`}
        >
          {inicial}
        </div>

        {/* Top Badges: Category & Share Button */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            onClick={handleShareClick}
            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-[#181816] hover:text-[#367643] shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
            title="Copiar link individual"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#367643]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          <span className="bg-[#EEF7EF]/95 border border-[#CFE9D2] text-[#367643] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shadow-xs">
            Receta
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata info with reduced bottom margin */}
          <div className="flex items-center gap-3.5 text-xs font-semibold text-[#737373] mb-1.5">
            {receta.tiempo && (
              <span className="flex items-center gap-1 text-[#C85A32]">
                <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
                {receta.tiempo}
              </span>
            )}
            {receta.porciones && (
              <span className="flex items-center gap-1 text-[#367643]">
                <Users className="w-3.5 h-3.5 text-[#367643]" />
                {receta.porciones}
              </span>
            )}
          </div>

          {/* Title with reduced bottom margin and crisp link */}
          <h3 className="font-serif-title text-[22px] sm:text-2xl text-[#181816] group-hover:text-[#367643] transition-colors leading-snug mb-1">
            <a
              href={path}
              onClick={(e) => {
                e.preventDefault();
                onClick();
              }}
              className="hover:underline focus:outline-none"
            >
              {receta.titulo}
            </a>
          </h3>

          <p className="text-xs sm:text-sm text-[#737373] line-clamp-2 leading-relaxed mb-3 text-justify">
            {receta.descripcion.replace(/<[^>]+>/g, ' ')}
          </p>
        </div>

        <div className="pt-2.5 border-t border-[#181816]/5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#367643] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Ver receta <ArrowRight className="w-3 h-3" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#FEF9E7] text-[#B27B13] border border-[#FCE6A3] rounded">
            Casero
          </span>
        </div>
      </div>
    </article>
  );
};
