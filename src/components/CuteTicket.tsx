import React, { useState } from 'react';
import { Resena } from '../types';
import { calculateAverageRating } from '../services/storage';
import { CutleryIcon, ForkRating } from './ForkRating';
import { Copy, Check, ExternalLink, Sparkles, Navigation, MapPin } from 'lucide-react';

interface CuteTicketProps {
  resena: Resena;
  ratingSymbol?: string;
  onViewOnMap?: (resena: Resena) => void;
}

export const CuteTicket: React.FC<CuteTicketProps> = ({
  resena,
  ratingSymbol = '🍴',
  onViewOnMap
}) => {
  const [copied, setCopied] = useState(false);
  const averageRating = calculateAverageRating(resena.calificaciones);
  const priceDisplay = '$'.repeat(Math.max(1, Math.min(5, resena.precio || 3)));

  // Deterministic fake table and time based on ID length
  const tableNum = (resena.id.charCodeAt(0) % 12) + 1;
  const visitDate = resena.fecha || '24/09/2026';

  // Sello text and styling based on score
  const getStamp = () => {
    if (averageRating >= 4.6) {
      return {
        tag: 'IMPERDIBLE',
        title: 'RECOMENDACIÓN DE LA CASA',
        sub: 'VOLVERÍAMOS MIL VECES',
        color: '#C85A32',
        border: 'border-[#C85A32]/80',
        bg: 'bg-[#FFF2EA]/60'
      };
    }
    if (averageRating >= 4.0) {
      return {
        tag: 'DESTACADO',
        title: 'APROBADO CON HONORES',
        sub: 'GRAN EXPERIENCIA',
        color: '#367643',
        border: 'border-[#367643]/80',
        bg: 'bg-[#EEF7EF]/60'
      };
    }
    return {
      tag: 'VISITADO',
      title: 'BUEN MOMENTO',
      sub: 'SOBRE GUSTOS HAY ALGO ESCRITO',
      color: '#B27B13',
      border: 'border-[#B27B13]/80',
      bg: 'bg-[#FEF9E7]/60'
    };
  };

  const stamp = getStamp();

  const handleCopy = () => {
    const cleanSym = ratingSymbol && !ratingSymbol.startsWith('http') ? ratingSymbol : '🍽️';
    const textReceipt = `🧾 IL CONTO · LUGARCITOS
📍 ${resena.titulo} (${resena.ubicacion || 'Buenos Aires'})
📅 Visita: ${visitDate} · Mesa: ${tableNum.toString().padStart(2, '0')}
--------------------------------
${Object.entries(resena.calificaciones)
  .map(([k, v]) => `• ${k.toUpperCase()}: ${v !== null && v !== undefined && Number(v) > 0 ? Number(v).toFixed(1) + ' ' + cleanSym : 'No probado'}`)
  .join('\n')}
${resena.platoInsignia ? `--------------------------------\n★ QUÉ PEDIR: ${resena.platoInsignia}\n` : ''}--------------------------------
⭐ CALIFICACIÓN: ${averageRating.toFixed(1)} / 5.0 ${cleanSym}
💰 PRECIO: ${priceDisplay}
🏷️ SELLO: ${stamp.title} (${stamp.sub})
--------------------------------
✨ ¡Gracias por sentarse a nuestra mesa!
Lugarcitos · Lugares del bien`;

    navigator.clipboard.writeText(textReceipt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  };

  const googleMapsUrl =
    resena.lat && resena.lng
      ? `https://www.google.com/maps/search/?api=1&query=${resena.lat},${resena.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${resena.titulo} ${resena.ubicacion || 'Buenos Aires'}`
        )}`;

  return (
    <div className="relative my-6 max-w-md mx-auto filter drop-shadow-md">
      {/* Sawtooth / Zigzag Top Edge */}
      <div
        className="w-full h-3.5 bg-[#FFFDF9]"
        style={{
          clipPath:
            'polygon(0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%)'
        }}
      />

      {/* Main Ticket Body */}
      <div className="bg-[#FFFDF9] px-6 sm:px-8 py-5 border-x border-[#F0E6D8] relative text-[#2A2926] font-mono text-xs select-text">
        {/* Subtle Paper Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#181816_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Vintage Stamp Floating in angle */}
        <div
          className={`absolute right-4 top-16 sm:right-6 pointer-events-none transform rotate-[-12deg] z-10 border-2 border-dashed ${stamp.border} ${stamp.bg} px-3 py-1.5 rounded-md text-center shadow-xs backdrop-blur-[0.5px]`}
          style={{ color: stamp.color }}
        >
          <div className="text-[9px] font-black uppercase tracking-[2px]">{stamp.tag}</div>
          <div className="text-[11px] font-black tracking-wider leading-tight">{stamp.title}</div>
          <div className="text-[8px] font-bold tracking-widest opacity-90 mt-0.5">{stamp.sub}</div>
        </div>

        {/* Receipt Header */}
        <div className="text-center space-y-1 mb-4">
          <div className="flex items-center justify-center gap-1.5 text-[#C85A32] font-sans font-bold text-[10px] uppercase tracking-[3px]">
            <Sparkles className="w-3 h-3" />
            Il Conto
            <Sparkles className="w-3 h-3" />
          </div>
          <h4 className="font-serif-title text-2xl text-[#181816] tracking-tight pt-1">
            {resena.titulo}
          </h4>
          <p className="text-[11px] text-[#737373] max-w-xs mx-auto truncate">
            {resena.ubicacion || 'Buenos Aires, Argentina'}
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C827A] pt-1">
            <span>FECHA: {visitDate}</span>
            <span>·</span>
            <span>MESA: {tableNum.toString().padStart(2, '0')}</span>
            <span>·</span>
            <span>MOZO: La Buena Vida</span>
          </div>
        </div>

        {/* Plato Insignia (Qué pedir sí o sí) */}
        {resena.platoInsignia && (
          <div className="mb-3 px-3 py-2 bg-[#FFF2EA] border border-dashed border-[#FED7C2] rounded text-left">
            <span className="font-bold uppercase tracking-widest text-[9px] text-[#C85A32] block">
              ★ Qué pedir sí o sí:
            </span>
            <span className="text-[11px] font-bold text-[#181816] leading-tight block mt-0.5">
              {resena.platoInsignia}
            </span>
          </div>
        )}

        {/* Dashed Line */}
        <div className="border-b border-dashed border-[#D4C5B5] my-3.5" />

        {/* Column Headers */}
        <div className="flex justify-between items-center text-[10px] font-bold text-[#8C827A] uppercase tracking-wider mb-2">
          <span>Rubro Calificado</span>
          <span>Puntuación</span>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-1.5 py-1">
          {Object.entries(resena.calificaciones).map(([categoria, valor]) => {
            const isOmitted = valor === null || valor === undefined || Number(valor) <= 0;
            return (
              <div key={categoria} className="flex justify-between items-center">
                <span className="uppercase text-[#4A4742] tracking-wide flex items-center gap-1">
                  <span className="text-[#C85A32] text-[10px]">›</span>
                  {categoria}
                </span>
                <div className="flex-1 mx-2 border-b border-dotted border-[#E5DACD] h-3" />
                {isOmitted ? (
                  <span className="text-[10px] text-stone-400 italic">No probado</span>
                ) : (
                  <span className="font-bold text-[#181816] flex items-center gap-1.5">
                    {Number(valor).toFixed(1)} <CutleryIcon size={13} color="#C85A32" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Dashed Line */}
        <div className="border-b border-dashed border-[#D4C5B5] my-3.5" />

        {/* Subtotals & Totals */}
        <div className="space-y-1.5 py-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="uppercase text-[#737373]">Nivel de Precio:</span>
            <span className="font-bold text-[#B27B13] tracking-widest text-xs">{priceDisplay}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="uppercase text-[#737373]">Sonrisas del Salón:</span>
            <span className="font-bold text-[#367643]">100% Inclusivas</span>
          </div>
          <div className="flex justify-between items-center pt-2 text-sm font-bold text-[#181816] border-t border-[#E5DACD]">
            <span className="uppercase tracking-wider font-sans">CALIFICACIÓN TOTAL:</span>
            <div className="flex items-center gap-2">
              <ForkRating score={averageRating} size={15} showNumber={false} />
              <span className="text-xl font-serif-title text-[#C85A32]">
                {averageRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Dashed Line */}
        <div className="border-b border-dashed border-[#D4C5B5] my-4" />

        {/* Simulated Barcode */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="flex items-center justify-center gap-[3px] h-9 mx-auto opacity-75">
            <span className="w-1 h-full bg-[#2A2926]" />
            <span className="w-0.5 h-full bg-[#2A2926]" />
            <span className="w-1.5 h-full bg-[#2A2926]" />
            <span className="w-0.5 h-full bg-[#2A2926]" />
            <span className="w-2 h-full bg-[#2A2926]" />
            <span className="w-1 h-full bg-[#2A2926]" />
            <span className="w-0.5 h-full bg-[#2A2926]" />
            <span className="w-1.5 h-full bg-[#2A2926]" />
            <span className="w-2 h-full bg-[#2A2926]" />
            <span className="w-0.5 h-full bg-[#2A2926]" />
            <span className="w-1 h-full bg-[#2A2926]" />
            <span className="w-1.5 h-full bg-[#2A2926]" />
            <span className="w-0.5 h-full bg-[#2A2926]" />
            <span className="w-2 h-full bg-[#2A2926]" />
            <span className="w-1 h-full bg-[#2A2926]" />
            <span className="w-0.5 h-full bg-[#2A2926]" />
            <span className="w-1.5 h-full bg-[#2A2926]" />
            <span className="w-1 h-full bg-[#2A2926]" />
          </div>
          <div className="text-[9px] text-[#8C827A] tracking-[3px]">
            *LUGARCITOS-{resena.id.slice(0, 6).toUpperCase()}*
          </div>
          <p className="font-serif-title italic text-xs text-[#737373] pt-1">
            «¡Gracias por sentarse a nuestra mesa!»
          </p>
        </div>

        {/* Action Buttons: Copiar Comanda + Google Maps + Waze */}
        <div className="mt-5 pt-3 border-t border-dashed border-[#D4C5B5] space-y-2">
          <button
            onClick={handleCopy}
            className={`w-full py-2 px-3 rounded-lg text-[11px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? 'bg-[#367643] text-white'
                : 'bg-[#181816] text-white hover:bg-[#C85A32]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                ¡Comanda copiada!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar la cuenta
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2.5 rounded-lg text-[11px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#FFF2EA] text-[#C85A32] border border-[#FED7C2] hover:bg-[#FED7C2] hover:text-[#181816] transition-all text-center no-underline cursor-pointer"
              title="Abre en Google Maps web o aplicación móvil"
            >
              <MapPin className="w-3.5 h-3.5" />
              Google Maps
            </a>
            <a
              href={`https://waze.com/ul?q=${encodeURIComponent(`${resena.titulo} ${resena.ubicacion || 'Buenos Aires'}`)}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2.5 rounded-lg text-[11px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#EEF7FA] text-[#227090] border border-[#CAE8F2] hover:bg-[#CAE8F2] hover:text-[#181816] transition-all text-center no-underline cursor-pointer"
              title="Navegar directamente con Waze"
            >
              <Navigation className="w-3.5 h-3.5" />
              Waze
            </a>
          </div>
        </div>
      </div>

      {/* Sawtooth / Zigzag Bottom Edge */}
      <div
        className="w-full h-3.5 bg-[#FFFDF9]"
        style={{
          clipPath:
            'polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)'
        }}
      />
    </div>
  );
};
