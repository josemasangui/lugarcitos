import React, { useState, useRef } from 'react';
import { Seccion } from '../types';
import { getPathForSection } from '../services/router';
import { Menu, X, UtensilsCrossed, Dices } from 'lucide-react';

interface HeaderProps {
  seccionActual: Seccion;
  onSelectSeccion: (sec: Seccion) => void;
  logoUrl?: string | null;
  nombre?: string;
  onOpenEditor: () => void;
  onOpenRandomPicker?: () => void;
  sobreNosotrosActivo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  seccionActual,
  onSelectSeccion,
  logoUrl,
  nombre = 'Lugarcitos',
  onOpenEditor,
  onOpenRandomPicker,
  sobreNosotrosActivo = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<any>(null);

  const navItems: { id: Seccion; label: string }[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'resenas', label: 'Reseñas' },
    { id: 'mapa', label: 'Mapa' },
    { id: 'recetas', label: 'Recetas' },
    { id: 'pendientes', label: 'Pendientes' },
    ...(sobreNosotrosActivo ? [{ id: 'sobre-nosotros' as Seccion, label: 'Sobre Nosotros' }] : [])
  ];

  const handleNavClick = (id: Seccion, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    onSelectSeccion(id);
    setMobileMenuOpen(false);
  };

  // Secret 3-click on logo to trigger editor
  const handleLogoClick = (e: React.MouseEvent) => {
    clickCountRef.current++;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenEditor();
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 600);

    handleNavClick('inicio', e);
  };

  return (
    <>
      {/* Top Banner with lively pastel accents */}
      <div className="border-b border-[#FED7C2]/60 bg-gradient-to-r from-[#FFF2EA] via-[#FEF9E7] to-[#EEF7EF]">
        <div className="max-w-6xl mx-auto px-6 py-1.5 flex items-center justify-between text-[10px] tracking-[2px] uppercase font-bold text-[#C85A32]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32]" />
            Edición Especial
          </span>
          <span className="hidden sm:block flex-1 mx-4 h-[1px] bg-[#FED7C2]"></span>
          <span className="text-[#367643] italic normal-case tracking-normal text-xs font-serif-title font-normal hidden md:inline">
            sobre gustos hay algo escrito
          </span>
          <span className="hidden sm:block flex-1 mx-4 h-[1px] bg-[#CFE9D2]"></span>
          <span className="text-[#B27B13]">Apuntes Gastronómicos</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/92 backdrop-blur-md border-b border-[#181816]/10 transition-all duration-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Title with Secret 3-Click */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-3 text-left group cursor-pointer select-none"
            title="Lugarcitos"
          >
            <div className="w-9 h-9 rounded-full border border-[#FED7C2] flex items-center justify-center text-[#C85A32] bg-[#FFF2EA] overflow-hidden transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105 flex-shrink-0 shadow-xs">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed className="w-4 h-4 text-[#C85A32]" />
              )}
            </div>
            <div>
              <h1 className="font-serif-title text-2xl sm:text-[26px] text-[#181816] tracking-tight leading-none group-hover:text-[#C85A32] transition-colors">
                {nombre}
              </h1>
            </div>
          </div>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = seccionActual === item.id;
                const path = getPathForSection(item.id);
                return (
                  <a
                    key={item.id}
                    href={path}
                    onClick={(e) => handleNavClick(item.id, e)}
                    className={`text-[11px] font-bold uppercase tracking-[2px] transition-all relative py-1 cursor-pointer focus:outline-none ${
                      isActive
                        ? 'text-[#C85A32] opacity-100'
                        : 'text-[#181816] opacity-65 hover:opacity-100 hover:text-[#C85A32]'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-[#C85A32] rounded-full" />
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Cute Roulette Button */}
            {onOpenRandomPicker && (
              <button
                onClick={onOpenRandomPicker}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF2EA] border border-[#FED7C2] text-[#C85A32] text-[11px] font-bold uppercase tracking-wider hover:bg-[#C85A32] hover:text-white transition-all shadow-2xs cursor-pointer"
                title="Elegir al azar dónde comer hoy"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>¿Dónde comemos?</span>
              </button>
            )}
          </div>

          {/* Mobile menu and roulette button */}
          <div className="flex items-center gap-2 md:hidden">
            {onOpenRandomPicker && (
              <button
                onClick={onOpenRandomPicker}
                className="p-2 rounded-full bg-[#FFF2EA] text-[#C85A32] border border-[#FED7C2]"
                title="¿Dónde comemos?"
              >
                <Dices className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-[#181816] hover:text-[#C85A32] transition-colors focus:outline-none cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#181816]/95 backdrop-blur-md text-[#FAF8F5] flex flex-col justify-center items-center p-8 animate-fadeIn">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-[#C85A32] hover:border-[#C85A32] transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-xs uppercase font-bold tracking-[3px] text-[#FED7C2] mb-6 text-center">
            {nombre} · sobre gustos hay algo escrito
          </div>

          <nav className="flex flex-col items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={getPathForSection(item.id)}
                onClick={(e) => handleNavClick(item.id, e)}
                className={`font-serif-title text-3xl sm:text-4xl transition-all cursor-pointer focus:outline-none ${
                  seccionActual === item.id
                    ? 'text-[#FCE6A3] scale-105'
                    : 'text-[#FAF8F5] opacity-75 hover:opacity-100 hover:text-[#FCE6A3]'
                }`}
              >
                {item.label}
              </a>
            ))}

            {onOpenRandomPicker && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRandomPicker();
                }}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFF2EA] text-[#C85A32] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Dices className="w-4 h-4" />
                ¿Dónde comemos hoy?
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
};
