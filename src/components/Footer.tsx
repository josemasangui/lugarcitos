import React from 'react';
import { Seccion } from '../types';
import { getPathForSection } from '../services/router';
import { UtensilsCrossed, KeyRound } from 'lucide-react';

interface FooterProps {
  onSelectSeccion: (sec: Seccion) => void;
  logoUrl?: string | null;
  nombre?: string;
  slogan?: string;
  onOpenEditor: () => void;
  sobreNosotrosActivo?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectSeccion,
  logoUrl,
  nombre = 'Lugarcitos',
  slogan = 'sobre gustos hay algo escrito',
  onOpenEditor,
  sobreNosotrosActivo = false
}) => {
  const handleNavClick = (sec: Seccion, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    onSelectSeccion(sec);
  };

  return (
    <footer className="bg-[#181816] text-[#FAF8F5] py-10 px-6 mt-12 border-t-2 border-[#FED7C2]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full border border-[#FED7C2] flex items-center justify-center text-[#FED7C2] overflow-hidden flex-shrink-0 bg-white/5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-[#FED7C2]" />
            )}
          </div>
          <div>
            <div className="font-serif-title text-2xl sm:text-3xl leading-tight">
              {nombre}
            </div>
            <div className="font-serif-title italic text-[#FCE6A3] text-sm opacity-95">
              {slogan}
            </div>
          </div>
        </div>

        {/* Clean Navigation for readers without conspicuous editor button */}
        <div className="flex flex-wrap items-center gap-5 sm:gap-7 text-[11px] font-bold uppercase tracking-[2px]">
          <a
            href={getPathForSection('inicio')}
            onClick={(e) => handleNavClick('inicio', e)}
            className="text-[#FAF8F5]/70 hover:text-[#FCE6A3] transition-colors focus:outline-none"
          >
            Inicio
          </a>
          <a
            href={getPathForSection('resenas')}
            onClick={(e) => handleNavClick('resenas', e)}
            className="text-[#FAF8F5]/70 hover:text-[#FCE6A3] transition-colors focus:outline-none"
          >
            Reseñas
          </a>
          <a
            href={getPathForSection('mapa')}
            onClick={(e) => handleNavClick('mapa', e)}
            className="text-[#FAF8F5]/70 hover:text-[#FCE6A3] transition-colors focus:outline-none"
          >
            Mapa
          </a>
          <a
            href={getPathForSection('recetas')}
            onClick={(e) => handleNavClick('recetas', e)}
            className="text-[#FAF8F5]/70 hover:text-[#FCE6A3] transition-colors focus:outline-none"
          >
            Recetas
          </a>
          <a
            href={getPathForSection('pendientes')}
            onClick={(e) => handleNavClick('pendientes', e)}
            className="text-[#FAF8F5]/70 hover:text-[#FCE6A3] transition-colors focus:outline-none"
          >
            Pendientes
          </a>
          {sobreNosotrosActivo && (
            <a
              href={getPathForSection('sobre-nosotros')}
              onClick={(e) => handleNavClick('sobre-nosotros', e)}
              className="text-[#FAF8F5]/70 hover:text-[#FCE6A3] transition-colors focus:outline-none"
            >
              Sobre Nosotros
            </a>
          )}
        </div>
      </div>

      {/* Discrete bottom bar with hidden key shortcut */}
      <div className="max-w-6xl mx-auto mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-[#FAF8F5]/40 gap-2">
        <div className="flex items-center gap-2">
          <span>{nombre} · sobre gustos hay algo escrito</span>
          <button
            onClick={onOpenEditor}
            className="opacity-25 hover:opacity-90 transition-opacity p-0.5 text-[#FED7C2] cursor-pointer"
            title="Panel de redacción (o presione Ctrl + E)"
            aria-label="Acceso editor"
          >
            <KeyRound className="w-3 h-3" />
          </button>
        </div>
        <span>Notas gastronómicas y apuntes de sobremesa</span>
      </div>
    </footer>
  );
};
