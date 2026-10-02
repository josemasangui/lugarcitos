import React, { useState, useEffect } from 'react';
import { Resena, Pendiente } from '../types';
import { Dices, Sparkles, X, MapPin, ExternalLink, RotateCcw, Utensils } from 'lucide-react';
import { calculateAverageRating } from '../services/storage';

interface RandomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resenas: Resena[];
  pendientes: Pendiente[];
  onSelectResena: (resena: Resena) => void;
  onSelectPendienteOnMap: (pendiente: Pendiente) => void;
}

interface PoolItem {
  tipo: 'visitado' | 'pendiente';
  resena?: Resena;
  pendiente?: Pendiente;
  titulo: string;
  subtitulo: string;
}

export const RandomPickerModal: React.FC<RandomPickerModalProps> = ({
  isOpen,
  onClose,
  resenas,
  pendientes,
  onSelectResena,
  onSelectPendienteOnMap
}) => {
  const [filterMode, setFilterMode] = useState<'todos' | 'visitados' | 'pendientes'>('todos');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<{
    titulo: string;
    subtitulo: string;
    tipo: 'visitado' | 'pendiente';
  } | null>(null);
  const [winner, setWinner] = useState<PoolItem | null>(null);

  const getEligiblePool = () => {
    const pool: PoolItem[] = [];

    if (filterMode === 'todos' || filterMode === 'visitados') {
      resenas.forEach((r) => {
        pool.push({
          tipo: 'visitado',
          resena: r,
          titulo: r.titulo,
          subtitulo: r.ubicacion || 'Buenos Aires'
        });
      });
    }

    if (filterMode === 'todos' || filterMode === 'pendientes') {
      pendientes.forEach((p) => {
        pool.push({
          tipo: 'pendiente',
          pendiente: p,
          titulo: p.nombre,
          subtitulo: p.direccion || 'Lugar por visitar'
        });
      });
    }

    return pool;
  };

  const handleSpin = () => {
    const pool = getEligiblePool();
    if (pool.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    let counter = 0;
    const totalIterations = 18;
    const intervalTime = 80;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const chosen = pool[randomIndex];
      setCurrentDisplay({
        titulo: chosen.titulo,
        subtitulo: chosen.subtitulo,
        tipo: chosen.tipo
      });

      counter++;
      if (counter >= totalIterations) {
        clearInterval(interval);
        const finalPick = pool[Math.floor(Math.random() * pool.length)];
        setIsSpinning(false);
        setWinner(finalPick);
        setCurrentDisplay(null);
      }
    }, intervalTime);
  };

  // Auto-spin first time modal opens
  useEffect(() => {
    if (isOpen && !winner && !isSpinning) {
      handleSpin();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-[#FED7C2] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative">
        {/* Header with warm pastel touch */}
        <div className="bg-gradient-to-r from-[#FFF2EA] via-[#FAF8F5] to-[#EEF7EF] p-5 border-b border-[#FED7C2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#C85A32] text-white shadow-xs">
              <Dices className="w-5 h-5 animate-spin-slow" />
            </span>
            <div>
              <h3 className="font-serif-title text-xl text-[#181816]">¿Dónde comemos hoy?</h3>
              <p className="text-xs text-[#737373]">La sobremesa elige por vos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#737373] hover:text-[#181816] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Selection Chips */}
        <div className="p-4 bg-white border-b border-[#FED7C2]/60 flex items-center justify-center gap-2 text-xs">
          <button
            onClick={() => setFilterMode('todos')}
            disabled={isSpinning}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
              filterMode === 'todos'
                ? 'bg-[#181816] text-white'
                : 'text-[#737373] hover:bg-[#FFF2EA] hover:text-[#C85A32]'
            }`}
          >
            Cualquiera
          </button>
          <button
            onClick={() => setFilterMode('visitados')}
            disabled={isSpinning}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
              filterMode === 'visitados'
                ? 'bg-[#C85A32] text-white'
                : 'text-[#737373] hover:bg-[#FFF2EA] hover:text-[#C85A32]'
            }`}
          >
            Solo Visitados
          </button>
          <button
            onClick={() => setFilterMode('pendientes')}
            disabled={isSpinning}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
              filterMode === 'pendientes'
                ? 'bg-[#367643] text-white'
                : 'text-[#737373] hover:bg-[#EEF7EF] hover:text-[#367643]'
            }`}
          >
            Solo Pendientes
          </button>
        </div>

        {/* Roulette Display Area */}
        <div className="p-6 text-center">
          {isSpinning && currentDisplay && (
            <div className="py-8 space-y-3 animate-pulse">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[2px] bg-[#FFF2EA] text-[#C85A32] border border-[#FED7C2]">
                Tirando los dados...
              </span>
              <h2 className="font-serif-title text-3xl text-[#181816] px-4 truncate">
                {currentDisplay.titulo}
              </h2>
              <p className="text-xs text-[#737373]">{currentDisplay.subtitulo}</p>
            </div>
          )}

          {!isSpinning && winner && (
            <div className="space-y-4 animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[2px] shadow-xs bg-[#FFF2EA] text-[#C85A32] border border-[#FED7C2]">
                <Sparkles className="w-3.5 h-3.5" />
                ¡El destino culinario ha hablado!
              </div>

              {/* Card preview */}
              <div className="bg-white p-5 rounded-xl border border-[#FED7C2] shadow-sm text-left relative overflow-hidden">
                {winner.tipo === 'visitado' && winner.resena?.fotaPortada && (
                  <div className="h-36 -mx-5 -mt-5 mb-4 overflow-hidden relative">
                    <img
                      src={winner.resena.fotaPortada}
                      alt={winner.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/80 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                      {'$'.repeat(Math.max(1, Math.min(5, winner.resena.precio || 3)))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      winner.tipo === 'visitado'
                        ? 'bg-[#FFF2EA] text-[#C85A32] border border-[#FED7C2]'
                        : 'bg-[#EEF7EF] text-[#367643] border border-[#CFE9D2]'
                    }`}
                  >
                    {winner.tipo === 'visitado' ? 'Lugar Reseñado' : 'Pendiente por Conocer'}
                  </span>
                  {winner.resena && (
                    <span className="font-serif-title font-bold text-base text-[#C85A32]">
                      {calculateAverageRating(winner.resena.calificaciones).toFixed(1)} 🍴
                    </span>
                  )}
                </div>

                <h4 className="font-serif-title text-2xl text-[#181816] mb-1">
                  {winner.titulo}
                </h4>

                <div className="flex items-start gap-1.5 text-xs text-[#737373] mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[#C85A32] flex-shrink-0 mt-0.5" />
                  <span>{winner.subtitulo}</span>
                </div>

                {winner.resena?.resena && (
                  <p className="text-xs text-[#525252] line-clamp-2 italic">
                    «{winner.resena.resena.slice(0, 120)}...»
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {winner.tipo === 'visitado' && winner.resena && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectResena(winner.resena!);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#181816] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#C85A32] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Utensils className="w-4 h-4" />
                    Leer la reseña completa
                  </button>
                )}

                {winner.tipo === 'pendiente' && winner.pendiente && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectPendienteOnMap(winner.pendiente!);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#367643] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#285731] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    Ubicar en el mapa
                  </button>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${winner.titulo} ${winner.subtitulo}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-xl bg-white border border-[#FED7C2] text-[#C85A32] text-xs font-bold uppercase tracking-wider hover:bg-[#FFF2EA] transition-colors flex items-center justify-center gap-2 no-underline text-center cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir en Google Maps
                </a>

                <button
                  onClick={handleSpin}
                  className="w-full py-2 text-xs font-semibold text-[#737373] hover:text-[#181816] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Girar de nuevo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
