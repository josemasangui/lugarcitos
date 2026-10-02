import React, { useState, useRef, useEffect } from 'react';
import { Resena } from '../types';
import { calculateAverageRating } from '../services/storage';
import { X, Download, Share2, Sparkles, Check, Loader2, Instagram, Layout, Palette } from 'lucide-react';

export type StoryTheme = 'noche' | 'pergamino' | 'azabache';
export type StoryFormat = 'story' | 'feed';

interface InstagramStoryModalProps {
  resena: Resena;
  ratingSymbol?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InstagramStoryModal: React.FC<InstagramStoryModalProps> = ({
  resena,
  ratingSymbol = '🍴',
  isOpen,
  onClose
}) => {
  const [theme, setTheme] = useState<StoryTheme>('noche');
  const [format, setFormat] = useState<StoryFormat>('story');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const averageRating = calculateAverageRating(resena.calificaciones);
  const precioSimbolo = '$'.repeat(resena.precio || 3);
  const isSquare = format === 'feed';

  /**
   * Genera el lienzo en alta definición:
   * - 9:16 (1080x1920) para Stories
   * - 1:1 (1080x1080) para Feed
   */
  const generateStoryCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = isSquare ? 1080 : 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo inicializar el lienzo gráfico.');

    const width = 1080;
    const height = canvas.height;

    // Colores y paleta según tema
    let bgMain = '#151311';
    let brandColor = '#C85A32';
    let textColor = '#FFFFFF';
    let subtextColor = '#CBB79F';
    let borderLineColor = 'rgba(255, 255, 255, 0.15)';
    let badgeBg = 'rgba(200, 90, 50, 0.25)';
    let badgeText = '#FED7C2';

    if (theme === 'pergamino') {
      bgMain = '#FAF6EE';
      brandColor = '#A34320';
      textColor = '#1E1A17';
      subtextColor = '#5E5247';
      borderLineColor = '#E3D7C5';
      badgeBg = '#EFE4D2';
      badgeText = '#7D3316';
    } else if (theme === 'azabache') {
      bgMain = '#0B0B0C';
      brandColor = '#E5B869';
      textColor = '#F4F4F5';
      subtextColor = '#A1A1AA';
      borderLineColor = 'rgba(255, 255, 255, 0.1)';
      badgeBg = 'rgba(229, 184, 105, 0.18)';
      badgeText = '#F3D293';
    }

    // 1. Fondo base
    if (theme === 'noche') {
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#161412');
      bgGradient.addColorStop(0.4, '#221B16');
      bgGradient.addColorStop(0.8, '#191513');
      bgGradient.addColorStop(1, '#0C0A09');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Halo sutil de luz cálida superior
      const glow = ctx.createRadialGradient(540, 360, 40, 540, 360, 700);
      glow.addColorStop(0, 'rgba(200, 90, 50, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, Math.min(1000, height));
    } else if (theme === 'pergamino') {
      ctx.fillStyle = '#FAF6EE';
      ctx.fillRect(0, 0, width, height);

      // Textura / degradé sutil de papel antiguo
      const paperGrad = ctx.createLinearGradient(0, 0, width, height);
      paperGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      paperGrad.addColorStop(0.5, 'rgba(240, 230, 214, 0.4)');
      paperGrad.addColorStop(1, 'rgba(235, 222, 202, 0.6)');
      ctx.fillStyle = paperGrad;
      ctx.fillRect(0, 0, width, height);

      // Marco fino tradicional
      ctx.strokeStyle = '#D9C8B0';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, width - 60, height - 60);
      ctx.strokeStyle = '#EDE3D2';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, width - 80, height - 80);
    } else {
      // Azabache minimal
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(540, 300, 30, 540, 300, 600);
      glow.addColorStop(0, 'rgba(229, 184, 105, 0.12)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, Math.min(800, height));
    }

    // 2. Encabezado de Marca
    const headerY = isSquare ? 80 : 120;
    ctx.textAlign = 'center';
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 28px "Cinzel", "Playfair Display", Georgia, serif';
    ctx.letterSpacing = '7px';
    ctx.fillText('LUGARCITOS', 540, headerY);

    ctx.fillStyle = subtextColor;
    ctx.font = 'italic 23px "Playfair Display", Georgia, serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('sobre gustos hay algo escrito', 540, headerY + 40);

    // Líneas ornamentales
    ctx.strokeStyle = brandColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(340, headerY + 68);
    ctx.lineTo(740, headerY + 68);
    ctx.stroke();

    // 3. Fotografía de Portada
    const imgY = isSquare ? 200 : 250;
    const imgWidth = 920;
    const imgHeight = isSquare ? 450 : 860;
    const imgX = (width - imgWidth) / 2;

    const fotoPortadaUrl = resena.fotaPortada;
    if (fotoPortadaUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = () => resolve(null);
          img.src = fotoPortadaUrl;
        });

        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 32);
          ctx.clip();

          const scale = Math.max(imgWidth / img.naturalWidth, imgHeight / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = imgX + (imgWidth - drawW) / 2;
          const drawY = imgY + (imgHeight - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Degradé inferior sobre la foto
          if (theme !== 'pergamino') {
            const photoGradient = ctx.createLinearGradient(0, imgY + imgHeight - 250, 0, imgY + imgHeight);
            photoGradient.addColorStop(0, 'rgba(0,0,0,0)');
            photoGradient.addColorStop(1, 'rgba(0,0,0,0.85)');
            ctx.fillStyle = photoGradient;
            ctx.fillRect(imgX, imgY + imgHeight - 250, imgWidth, 250);
          }
          ctx.restore();

          // Marco decorativo exterior
          ctx.strokeStyle = borderLineColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 32);
          ctx.stroke();
        }
      } catch (e) {
        console.warn('Canvas image error:', e);
      }
    } else {
      // Placeholder elegante
      ctx.fillStyle = theme === 'pergamino' ? '#EFE8DC' : '#1C1917';
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 32);
      ctx.fill();

      ctx.fillStyle = brandColor;
      ctx.font = 'bold 120px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(resena.titulo.charAt(0).toUpperCase(), 540, imgY + imgHeight / 2 + 40);
    }

    // Badge "Destacado del Mes" si aplica
    if (resena.destacadoDelMes) {
      const badgeY = imgY + 45;
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.roundRect(imgX + 30, badgeY - 32, 420, 60, 30);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px sans-serif';
      ctx.letterSpacing = '1px';
      ctx.textAlign = 'center';
      ctx.fillText('★ DESTACADO DEL MES', imgX + 240, badgeY + 7);
    }

    // 4. Título del Restaurante
    let currentY = imgY + imgHeight + (isSquare ? 65 : 85);
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.font = `bold ${isSquare ? '52px' : '62px'} "Playfair Display", Georgia, serif`;
    ctx.letterSpacing = '0px';

    const title = resena.titulo;
    if (title.length > 24) {
      const words = title.split(' ');
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      ctx.fillText(line1, 540, currentY);
      currentY += isSquare ? 58 : 72;
      ctx.fillText(line2, 540, currentY);
    } else {
      ctx.fillText(title, 540, currentY);
    }

    // 5. Ubicación y Precio
    currentY += isSquare ? 45 : 55;
    ctx.fillStyle = subtextColor;
    ctx.font = '500 26px sans-serif';
    const locText = `📍 ${resena.ubicacion || 'Buenos Aires'}   ·   ${precioSimbolo}`;
    ctx.fillText(locText, 540, currentY);

    // 6. Sello de Calificación / Tenedores
    currentY += isSquare ? 60 : 75;
    const badgeW = 390;
    const badgeH = 68;
    const badgeX = (width - badgeW) / 2;

    ctx.fillStyle = badgeBg;
    ctx.beginPath();
    ctx.roundRect(badgeX, currentY - 48, badgeW, badgeH, 34);
    ctx.fill();
    ctx.strokeStyle = brandColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = badgeText;
    ctx.font = 'bold 32px sans-serif';
    const forksCount = Math.round(averageRating || 4);
    const forksText = `${ratingSymbol.repeat(forksCount)}  ${averageRating > 0 ? averageRating.toFixed(1) : '5.0'} / 5.0`;
    ctx.fillText(forksText, 540, currentY - 3);

    // 7. Plato Insignia (solo en Stories si entra bien, o en Feed compacto)
    if (resena.platoInsignia && !isSquare) {
      currentY += 95;
      ctx.fillStyle = brandColor;
      ctx.font = 'bold 22px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('★ QUÉ PEDIR SÍ O SÍ ★', 540, currentY);

      currentY += 45;
      ctx.fillStyle = textColor;
      ctx.font = 'italic 30px "Playfair Display", Georgia, serif';
      ctx.fillText(`"${resena.platoInsignia}"`, 540, currentY);
    }

    // 8. Ocasiones recomendadas
    if (resena.ocasion && resena.ocasion.length > 0 && !isSquare) {
      currentY += 80;
      const chips = resena.ocasion.slice(0, 3);
      const text = chips.map((c) => `• ${c}`).join('   ');
      ctx.fillStyle = subtextColor;
      ctx.font = 'bold 22px sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(text, 540, currentY);
    }

    // 9. Pie de Historia
    const footerY = height - (isSquare ? 45 : 75);
    ctx.strokeStyle = borderLineColor;
    ctx.beginPath();
    ctx.moveTo(180, footerY - 40);
    ctx.lineTo(900, footerY - 40);
    ctx.stroke();

    ctx.fillStyle = brandColor;
    ctx.font = 'bold 24px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('LEÉ LA RESEÑA COMPLETA EN LUGARCITOS', 540, footerY);

    if (!isSquare) {
      ctx.fillStyle = subtextColor;
      ctx.font = '19px sans-serif';
      ctx.fillText('Visita recomendada · Reseñas gastronómicas independientes', 540, footerY + 35);
    }

    return canvas;
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateStoryCanvas();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error('No se pudo generar la imagen');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `historia-${format}-${resena.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error al exportar historia:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateStoryCanvas();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) return;

      const file = new File(
        [blob],
        `historia-${resena.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
        { type: 'image/png' }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Reseña de ${resena.titulo} en Lugarcitos`,
          text: `Te comparto la reseña de ${resena.titulo} en Lugarcitos!`
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Aviso al compartir:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clases dinámicas de la tarjeta en vista previa
  const getPreviewClasses = () => {
    if (theme === 'pergamino') {
      return 'bg-[#FAF6EE] text-[#1E1A17] border-[#D9C8B0] shadow-xl';
    }
    if (theme === 'azabache') {
      return 'bg-[#09090B] text-white border-white/10 shadow-2xl';
    }
    // noche (default)
    return 'bg-gradient-to-b from-[#1C1814] via-[#241E19] to-[#0E0C0A] text-white border-white/15 shadow-2xl';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1A1816] text-white rounded-2xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[94vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#141210]">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-[#C85A32]" />
            <h3 className="font-serif text-base font-bold text-white tracking-wide">
              Tarjeta para Instagram Stories
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Style & Format Selectors */}
        <div className="px-5 py-3 border-b border-white/10 bg-[#171412] flex flex-col gap-2.5">
          {/* Format selection */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Layout className="w-3.5 h-3.5" /> Formato:
            </span>
            <div className="flex bg-black/50 p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setFormat('story')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  format === 'story'
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                9:16 Stories
              </button>
              <button
                type="button"
                onClick={() => setFormat('feed')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  format === 'feed'
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                1:1 Feed
              </button>
            </div>
          </div>

          {/* Theme selection */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" /> Estilo:
            </span>
            <div className="flex gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setTheme('noche')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all border cursor-pointer ${
                  theme === 'noche'
                    ? 'bg-[#C85A32]/25 border-[#C85A32] text-[#FED7C2]'
                    : 'bg-black/30 border-white/10 text-stone-400 hover:text-white'
                }`}
              >
                Noche
              </button>
              <button
                type="button"
                onClick={() => setTheme('pergamino')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all border cursor-pointer ${
                  theme === 'pergamino'
                    ? 'bg-[#FAF6EE] text-[#7D3316] border-[#D9C8B0] font-bold'
                    : 'bg-black/30 border-white/10 text-stone-400 hover:text-white'
                }`}
              >
                Pergamino
              </button>
              <button
                type="button"
                onClick={() => setTheme('azabache')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all border cursor-pointer ${
                  theme === 'azabache'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-black/30 border-white/10 text-stone-400 hover:text-white'
                }`}
              >
                Azabache
              </button>
            </div>
          </div>
        </div>

        {/* Story Preview Card */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex justify-center bg-black/40">
          <div
            ref={previewRef}
            className={`w-[260px] sm:w-[280px] ${
              isSquare ? 'aspect-square' : 'aspect-[9/16]'
            } rounded-2xl overflow-hidden relative flex flex-col justify-between p-4 border select-none text-center transition-all duration-300 ${getPreviewClasses()}`}
          >
            {/* Header */}
            <div className="relative z-10 pt-1">
              <span
                className={`font-serif-title tracking-[3px] text-xs font-bold block ${
                  theme === 'pergamino'
                    ? 'text-[#A34320]'
                    : theme === 'azabache'
                    ? 'text-[#E5B869]'
                    : 'text-[#C85A32]'
                }`}
              >
                LUGARCITOS
              </span>
              <span
                className={`font-serif italic text-[10px] ${
                  theme === 'pergamino' ? 'text-[#5E5247]' : 'text-[#CBB79F]'
                }`}
              >
                sobre gustos hay algo escrito
              </span>
              <div
                className={`w-16 h-[1px] mx-auto mt-1 ${
                  theme === 'pergamino'
                    ? 'bg-[#A34320]'
                    : theme === 'azabache'
                    ? 'bg-[#E5B869]'
                    : 'bg-[#C85A32]'
                }`}
              />
            </div>

            {/* Photo with cover vignette */}
            {resena.fotaPortada ? (
              <div
                className={`relative ${
                  isSquare ? 'aspect-[16/9]' : 'aspect-[4/3]'
                } w-full rounded-xl overflow-hidden my-2 border shadow-md ${
                  theme === 'pergamino' ? 'border-[#D9C8B0]' : 'border-white/10'
                }`}
              >
                <img
                  src={resena.fotaPortada}
                  alt={resena.titulo}
                  className="w-full h-full object-cover"
                />
                {theme !== 'pergamino' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                )}
                {resena.destacadoDelMes && (
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] uppercase font-extrabold tracking-wider shadow-sm">
                    ★ Destacado
                  </div>
                )}
                <div className="absolute bottom-1.5 inset-x-2 flex items-center justify-between text-[10px] text-white/90">
                  <span className="font-mono bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs font-bold">
                    {precioSimbolo}
                  </span>
                  <span className="bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs font-bold">
                    {averageRating > 0 ? averageRating.toFixed(1) : '5.0'} ★
                  </span>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] w-full rounded-xl bg-white/5 flex items-center justify-center text-xs opacity-50 my-2">
                Sin foto de portada
              </div>
            )}

            {/* Restaurant Info */}
            <div className="relative z-10 space-y-1">
              <h4 className="font-serif-title text-xl font-bold tracking-tight leading-tight line-clamp-2">
                {resena.titulo}
              </h4>
              <p
                className={`text-[11px] truncate ${
                  theme === 'pergamino' ? 'text-stone-600' : 'text-[#E5D6C5]'
                }`}
              >
                📍 {resena.ubicacion || 'Buenos Aires'}
              </p>

              {/* Rating Stamp */}
              <div
                className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold my-1 border ${
                  theme === 'pergamino'
                    ? 'bg-[#EFE4D2] border-[#D9C8B0] text-[#7D3316]'
                    : theme === 'azabache'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-[#C85A32]/20 border-[#C85A32] text-[#FED7C2]'
                }`}
              >
                <span>{ratingSymbol.repeat(Math.round(averageRating || 4))}</span>
                <span>{averageRating > 0 ? averageRating.toFixed(1) : '5.0'}</span>
              </div>

              {/* Plato Insignia */}
              {resena.platoInsignia && !isSquare && (
                <div
                  className={`rounded-lg p-1.5 mt-1 border ${
                    theme === 'pergamino'
                      ? 'bg-white/60 border-[#D9C8B0]'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider block ${
                      theme === 'pergamino' ? 'text-[#A34320]' : 'text-[#EAC098]'
                    }`}
                  >
                    ★ Plato Insignia
                  </span>
                  <span className="font-serif italic text-xs line-clamp-1">
                    "{resena.platoInsignia}"
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`relative z-10 pt-2 border-t text-[9px] tracking-widest uppercase font-semibold ${
                theme === 'pergamino'
                  ? 'border-[#D9C8B0] text-[#7D3316]'
                  : theme === 'azabache'
                  ? 'border-white/10 text-amber-300'
                  : 'border-white/10 text-[#D4A373]'
              }`}
            >
              Lugarcitos · Diario de Sobremesa
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#141210] border-t border-white/10 space-y-2">
          <div className="flex gap-2.5">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 py-3 px-4 rounded-xl bg-[#C85A32] hover:bg-[#a93a18] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Renderizando tarjeta...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Tarjeta descargada!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Tarjeta (PNG)</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Compartir directo a Instagram u otra app"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-center text-[11px] text-white/50">
            {isSquare
              ? 'Formato cuadrado 1:1 (1080x1080 px) ideal para Feed de Instagram.'
              : 'Formato vertical 9:16 (1080x1920 px) optimizado para Instagram Stories.'}
          </p>
        </div>
      </div>
    </div>
  );
};
