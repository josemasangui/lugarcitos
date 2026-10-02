import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Resena, Pendiente, Configuracion, MarkerLocation } from '../types';
import { calculateAverageRating, estimateCoordinatesForAddress } from '../services/storage';
import { MapPin, Compass, Layers, UtensilsCrossed, Bookmark } from 'lucide-react';

interface InteractiveMapProps {
  resenas: Resena[];
  pendientes: Pendiente[];
  config: Configuracion;
  onSelectResena?: (resena: Resena) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  resenas,
  pendientes,
  config,
  onSelectResena
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [filtro, setFiltro] = useState<'todos' | 'visitados' | 'pendientes'>('todos');

  // Consolidate all markers
  const allLocations: MarkerLocation[] = [
    ...resenas.map((r, idx) => {
      const coords =
        r.lat && r.lng
          ? { lat: r.lat, lng: r.lng }
          : estimateCoordinatesForAddress(r.ubicacion || r.titulo, idx);
      return {
        id: r.id,
        titulo: r.titulo,
        tipo: 'visitado' as const,
        direccion: r.ubicacion || 'Buenos Aires',
        lat: coords.lat,
        lng: coords.lng,
        rating: calculateAverageRating(r.calificaciones),
        precio: r.precio,
        imagen: r.fotaPortada,
        descripcionBreve: r.resena.slice(0, 110) + '…',
        rawResena: r
      };
    }),
    ...pendientes.map((p, idx) => {
      const coords =
        p.lat && p.lng
          ? { lat: p.lat, lng: p.lng }
          : estimateCoordinatesForAddress(p.direccion || p.nombre, idx + 10);
      return {
        id: p.id,
        titulo: p.nombre,
        tipo: 'pendiente' as const,
        direccion: p.direccion || 'Buenos Aires',
        lat: coords.lat,
        lng: coords.lng,
        descripcionBreve: p.descripcion || 'Lugar pendiente de visita'
      };
    })
  ];

  const filteredLocations = allLocations.filter((item) => {
    if (filtro === 'visitados') return item.tipo === 'visitado';
    if (filtro === 'pendientes') return item.tipo === 'pendiente';
    return true;
  });

  // Create custom SVG DivIcons for Leaflet
  const createCustomIcon = (tipo: 'visitado' | 'pendiente') => {
    const isVisited = tipo === 'visitado';
    const bgColor = isVisited ? '#C85A32' : '#367643';
    const shadowColor = isVisited ? 'rgba(200, 90, 50, 0.4)' : 'rgba(54, 118, 67, 0.4)';

    const svgIcon = isVisited
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="m15 11v11"/><circle cx="8" cy="12" r="3"/><path d="M8 2v7"/><path d="M8 15v7"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`;

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: ${bgColor};
          border: 2.5px solid white;
          border-radius: 50% 50% 50% 4px;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px ${shadowColor};
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
            ${svgIcon}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38]
    });
  };

  // Generate popup HTML content
  const createPopupContent = (loc: MarkerLocation) => {
    const isVisited = loc.tipo === 'visitado';
    const tagBg = isVisited ? '#FFF2EA' : '#EEF7EF';
    const tagBorder = isVisited ? '#FED7C2' : '#CFE9D2';
    const tagText = isVisited ? '#C85A32' : '#367643';
    const label = isVisited ? 'Reseñado' : 'Pendiente';
    const priceDisplay = loc.precio ? '$'.repeat(Math.max(1, Math.min(5, loc.precio))) : '';

    return `
      <div style="font-family: inherit; width: 280px; max-width: 90vw;">
        ${
          loc.imagen
            ? `
            <div style="height: 140px; width: 100%; overflow: hidden; position: relative; background: #FAF8F5;">
              <img src="${loc.imagen}" alt="${loc.titulo}" style="width: 100%; height: 100%; object-fit: cover;" />
              ${
                priceDisplay
                  ? `<span style="position: absolute; top: 8px; right: 8px; background: rgba(24, 24, 22, 0.85); color: white; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">${priceDisplay}</span>`
                  : ''
              }
            </div>
          `
            : `
            <div style="height: 70px; background: linear-gradient(135deg, ${tagBg}, #FAF8F5); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid ${tagBorder};">
              <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: ${tagText};">
                ${loc.titulo}
              </span>
            </div>
          `
        }

        <div style="padding: 14px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
            <span style="background: ${tagBg}; border: 1px solid ${tagBorder}; color: ${tagText}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 2px 8px; border-radius: 4px;">
              ${label}
            </span>
            ${
              loc.rating
                ? `
                <span style="font-size: 12px; font-weight: 800; color: #C85A32; display: flex; align-items: center; gap: 4px;">
                  ${loc.rating.toFixed(1)}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#C85A32" style="display:inline-block; vertical-align:middle;"><path d="M5.2 3.5v4.2c0 1.3 0.8 2.3 1.9 2.5v9.8a0.9 0.9 0 0 0 1.8 0v-9.8c1.1-0.2 1.9-1.2 1.9-2.5V3.5h-1v3.8h-0.8V3.5h-1v3.8h-0.8V3.5H5.2z"/><path d="M14.2 3.5h0.8c2.4 0 3.8 2.2 3.8 5.8v1.7h-1.8v9a0.9 0.9 0 0 1-1.8 0v-16.5c-0.6 0-1 0-1 0z"/></svg>
                </span>
              `
                : ''
            }
          </div>

          <h3 style="font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; line-height: 1.2; margin: 0 0 6px 0; color: #181816;">
            ${loc.titulo}
          </h3>

          <div style="display: flex; align-items: flex-start; gap: 6px; font-size: 11px; color: #737373; margin-bottom: 8px;">
            <span>📍</span>
            <span style="line-height: 1.4;">${loc.direccion}</span>
          </div>

          ${
            loc.descripcionBreve
              ? `
              <p style="font-size: 12px; line-height: 1.5; color: #404040; margin: 0 0 8px 0;">
                ${loc.descripcionBreve}
              </p>
            `
              : ''
          }

          <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
            ${
              isVisited && loc.rawResena
                ? `
                <button
                  class="leaflet-btn-resena"
                  data-id="${loc.id}"
                  style="width: 100%; padding: 8px 12px; background: #181816; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: background 0.2s;"
                  onmouseover="this.style.background='#C85A32'"
                  onmouseout="this.style.background='#181816'"
                >
                  Ver reseña completa →
                </button>
              `
                : ''
            }

            <a
              href="${
                loc.lat && loc.lng
                  ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${loc.titulo} ${loc.direccion}`
                    )}`
              }"
              target="_blank"
              rel="noopener noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 7px 12px; background: #FFF2EA; color: #C85A32; border: 1px solid #FED7C2; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 0.8px; transition: all 0.2s; box-sizing: border-box;"
              onmouseover="this.style.background='#FED7C2'; this.style.color='#181816'"
              onmouseout="this.style.background='#FFF2EA'; this.style.color='#C85A32'"
              title="Abre en Google Maps web o aplicación móvil"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Abrir en Google Maps ↗
            </a>
          </div>
        </div>
      </div>
    `;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initialization if map already exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-34.5888, -58.4239],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // OpenStreetMap official tiles (completely free, open, and without API key or watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19
      }).addTo(map);

      // Handle popup action button clicks
      map.on('popupopen', (e) => {
        const popupElement = e.popup.getElement();
        if (popupElement && onSelectResena) {
          const btn = popupElement.querySelector('.leaflet-btn-resena');
          if (btn) {
            btn.addEventListener('click', () => {
              const resenaId = btn.getAttribute('data-id');
              const match = resenas.find((r) => r.id === resenaId);
              if (match) {
                onSelectResena(match);
              }
            });
          }
        }
      });

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when locations or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerMapRef.current.clear();

    const bounds = L.latLngBounds([]);

    filteredLocations.forEach((loc) => {
      const icon = createCustomIcon(loc.tipo);
      const marker = L.marker([loc.lat, loc.lng], {
        icon,
        title: loc.titulo
      });

      marker.bindPopup(createPopupContent(loc), {
        maxWidth: 320,
        className: 'custom-leaflet-popup'
      });

      marker.addTo(markersLayer);
      markerMapRef.current.set(loc.id, marker);
      bounds.extend([loc.lat, loc.lng]);
    });

    if (filteredLocations.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filteredLocations, config.ratingSymbol]);

  // Handle resetting the view
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map || filteredLocations.length === 0) return;

    const bounds = L.latLngBounds([]);
    filteredLocations.forEach((l) => bounds.extend([l.lat, l.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  // Center on a specific location clicked from the bottom list
  const handleSpotClick = (loc: MarkerLocation) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([loc.lat, loc.lng], 16, {
      duration: 1.2
    });

    const marker = markerMapRef.current.get(loc.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 400);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Filter & Controls Bar with pastel touches */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white border border-[#FED7C2] rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-[1.5px] rounded-lg transition-all cursor-pointer ${
              filtro === 'todos'
                ? 'bg-[#181816] text-white shadow-xs'
                : 'text-[#181816]/70 hover:text-[#C85A32] hover:bg-[#FFF2EA]'
            }`}
          >
            Todos ({allLocations.length})
          </button>
          <button
            onClick={() => setFiltro('visitados')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-[1.5px] rounded-lg transition-all cursor-pointer ${
              filtro === 'visitados'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-[#181816]/70 hover:text-[#C85A32] hover:bg-[#FFF2EA]'
            }`}
          >
            Visitados ({resenas.length})
          </button>
          <button
            onClick={() => setFiltro('pendientes')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-[1.5px] rounded-lg transition-all cursor-pointer ${
              filtro === 'pendientes'
                ? 'bg-[#367643] text-white shadow-xs'
                : 'text-[#181816]/70 hover:text-[#367643] hover:bg-[#EEF7EF]'
            }`}
          >
            Por visitar ({pendientes.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#181816] bg-white border border-[#FED7C2] rounded-lg hover:border-[#C85A32] hover:bg-[#FFF2EA] transition-colors cursor-pointer"
            title="Ajustar vista a todos los puntos"
          >
            <Compass className="w-3.5 h-3.5 text-[#C85A32]" />
            Centrar puntos
          </button>
        </div>
      </div>

      {/* Main Map Box with Leaflet Engine */}
      <div className="relative w-full h-[560px] sm:h-[620px] rounded-xl border border-[#FED7C2] overflow-hidden shadow-md bg-[#f5f2ed]">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Map Legend and Quick Location Cards with Pastel Styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Legend */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#FED7C2] shadow-xs">
          <h4 className="text-xs uppercase font-bold tracking-[2px] text-[#181816] mb-2.5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C85A32]" />
            Leyenda del mapa
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-xs p-2.5 rounded-lg bg-[#FFF9F5] border border-[#FED7C2]">
              <span className="w-3.5 h-3.5 rounded-full bg-[#C85A32] flex-shrink-0 shadow-xs ring-2 ring-white" />
              <div>
                <span className="font-bold text-[#181816] block">Lugares Visitados</span>
                <span className="text-[#737373] text-[11px]">{resenas.length} reseñas registradas</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs p-2.5 rounded-lg bg-[#F9FCF9] border border-[#CFE9D2]">
              <span className="w-3.5 h-3.5 rounded-full bg-[#367643] flex-shrink-0 shadow-xs ring-2 ring-white" />
              <div>
                <span className="font-bold text-[#181816] block">Lugares por Visitar</span>
                <span className="text-[#737373] text-[11px]">{pendientes.length} pendientes anotados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Marked Spots Quick List with Pastel Border */}
        <div className="md:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-[#FED7C2] shadow-xs">
          <h4 className="text-xs uppercase font-bold tracking-[2px] text-[#181816] mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C85A32]" />
              Puntos marcados ({filteredLocations.length})
            </span>
            <span className="text-[10px] text-[#737373]">Clic para ubicar y abrir ficha</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => handleSpotClick(loc)}
                className={`p-2 rounded-lg border transition-all cursor-pointer text-left flex items-start gap-2.5 ${
                  loc.tipo === 'visitado'
                    ? 'border-[#FED7C2]/60 hover:border-[#C85A32] hover:bg-[#FFF2EA]'
                    : 'border-[#CFE9D2]/60 hover:border-[#367643] hover:bg-[#EEF7EF]'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    loc.tipo === 'visitado' ? 'bg-[#C85A32]' : 'bg-[#367643]'
                  }`}
                />
                <div className="overflow-hidden">
                  <div className="font-semibold text-xs text-[#181816] truncate">
                    {loc.titulo}
                  </div>
                  <div className="text-[11px] text-[#737373] truncate">
                    {loc.direccion}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
