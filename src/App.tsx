/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Seccion, Resena, Receta, Pendiente } from './types';
import { loadStoredData, saveStoredData, fetchCentralData, saveCentralData, sanitizeAppState, calculateAverageRating, mergeAppStates, subscribeToCentralEvents } from './services/storage';
import { resolveRoute, pushRoute, getPathForSection, getPathForDetail, getFullUrl } from './services/router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ReviewCard } from './components/ReviewCard';
import { RecipeCard } from './components/RecipeCard';
import { InteractiveMap } from './components/InteractiveMap';
import { DetailView } from './components/DetailView';
import { SobreNosotrosView } from './components/SobreNosotrosView';
import { EditorModal } from './components/EditorModal';
import { RandomPickerModal } from './components/RandomPickerModal';
import { Search, MapPin, ArrowRight, UtensilsCrossed, Share2, Check, Dices, Sparkles, ArrowDownUp } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadStoredData());
  const [seccionActual, setSeccionActual] = useState<Seccion>('inicio');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarrio, setSelectedBarrio] = useState<string>('Todos');
  const [selectedQueBuscas, setSelectedQueBuscas] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'recientes' | 'mejores-notas' | 'alfabetico'>('recientes');
  const [detailItem, setDetailItem] = useState<{
    item: Resena | Receta;
    tipo: 'resena' | 'receta';
  } | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitialTab, setEditorInitialTab] = useState<'resenas' | 'recetas' | 'pendientes' | 'sobre-nosotros'>('resenas');
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);

  // Copy notification for pending items or share links
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Sincronización continua con la base de datos central en Google Apps Script
  useEffect(() => {
    let isMounted = true;

    const syncWithCentralDatabase = async () => {
      const remoteData = await fetchCentralData();
      if (remoteData && isMounted) {
        setAppState((current) => {
          const merged = mergeAppStates(current, remoteData);
          saveStoredData(merged);
          return merged;
        });
      }
    };

    // Consulta inicial
    syncWithCentralDatabase();

    const unsubscribeSSE = subscribeToCentralEvents(() => {});

    // Re-sincronizar cuando la pestaña vuelve a estar visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithCentralDatabase();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Consulta periódica cada 25 segundos
    const interval = setInterval(syncWithCentralDatabase, 25000);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      unsubscribeSSE();
    };
  }, []);

  // Global keyboard shortcut: Ctrl + E or Cmd + E to open Editor discretely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setEditorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize and listen to URL changes (Browser Back / Forward / Direct URL load)
  useEffect(() => {
    const handleUrlChange = () => {
      const resolved = resolveRoute(window.location.pathname, appState);
      setSeccionActual(resolved.seccion);
      setDetailItem(resolved.detailItem);
    };

    // Initial resolve
    handleUrlChange();

    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [appState]);

  // Sync to central cloud database and localStorage on state change
  const handleUpdateState = async (newState: AppState) => {
    setAppState(newState);
    await saveCentralData(newState, '0308');
  };

  const handleSelectSeccion = (sec: Seccion) => {
    setDetailItem(null);
    setSeccionActual(sec);
    const path = getPathForSection(sec);
    pushRoute(path, `Lugarcitos · ${sec.charAt(0).toUpperCase() + sec.slice(1)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDetail = (item: Resena | Receta, tipo: 'resena' | 'receta') => {
    setDetailItem({ item, tipo });
    const path = getPathForDetail(item, tipo);
    pushRoute(path, `${item.titulo} · Lugarcitos`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = (tipo: 'resena' | 'receta') => {
    setDetailItem(null);
    const fallbackSec = tipo === 'resena' ? 'resenas' : 'recetas';
    setSeccionActual(fallbackSec);
    pushRoute(getPathForSection(fallbackSec), `Lugarcitos · ${fallbackSec}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewResenaOnMap = (resena: Resena) => {
    setDetailItem(null);
    setSeccionActual('mapa');
    pushRoute(getPathForSection('mapa'), 'Lugarcitos · El mapa');
  };

  const handleOpenEditorWithTab = (tab: 'resenas' | 'recetas' | 'pendientes') => {
    setEditorInitialTab(tab);
    setEditorOpen(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  // Extract known neighborhoods from reviews and pending places
  const availableBarrios = useMemo(() => {
    const commonList = [
      'Palermo',
      'San Telmo',
      'Recoleta',
      'Villa Crespo',
      'Belgrano',
      'Colegiales',
      'Chacarita',
      'Almagro',
      'Caballito',
      'Microcentro'
    ];
    const corpus = [
      ...appState.resenas.map((r) => r.ubicacion || ''),
      ...appState.pendientes.map((p) => p.direccion || '')
    ]
      .join(' ')
      .toLowerCase();

    const matches = commonList.filter((b) => corpus.includes(b.toLowerCase()));
    return ['Todos', ...matches];
  }, [appState.resenas, appState.pendientes]);

  // Filtered lists for search, neighborhood and occasion
  const queryLower = searchQuery.toLowerCase().trim();

  const filteredResenas = useMemo(() => {
    return appState.resenas
      .filter((r) => {
        const textCorpus = (
          r.titulo + ' ' + (r.ubicacion || '') + ' ' + r.resena + ' ' + (r.platoInsignia || '') + ' ' + (r.etiquetas || []).join(' ') + ' ' + (r.ocasion || []).join(' ')
        ).toLowerCase();

        const matchesQuery = !queryLower || textCorpus.includes(queryLower);
        const matchesBarrio =
          selectedBarrio === 'Todos' ||
          (r.ubicacion || '').toLowerCase().includes(selectedBarrio.toLowerCase());

        let matchesQueBuscas = true;
        if (selectedQueBuscas !== 'todos') {
          const target = selectedQueBuscas.toLowerCase();
          if (target === 'destacado-mes') {
            matchesQueBuscas = !!r.destacadoDelMes;
          } else if (target === 'pet-friendly') {
            matchesQueBuscas = textCorpus.includes('pet friendly') || textCorpus.includes('mascota') || (r.etiquetas || []).some(t => t.toLowerCase().includes('pet'));
          } else if (target === 'sin-tacc') {
            matchesQueBuscas = textCorpus.includes('sin tacc') || textCorpus.includes('tacc') || textCorpus.includes('celiac') || (r.etiquetas || []).some(t => t.toLowerCase().includes('tacc'));
          } else if (target === 'vegano') {
            matchesQueBuscas = textCorpus.includes('vegano') || textCorpus.includes('vegetariano') || (r.etiquetas || []).some(t => t.toLowerCase().includes('vegan'));
          } else if (target === 'aire-libre') {
            matchesQueBuscas = textCorpus.includes('aire libre') || textCorpus.includes('terraza') || textCorpus.includes('patio') || textCorpus.includes('vereda');
          } else if (target === 'almuerzo-laboral') {
            matchesQueBuscas = textCorpus.includes('laboral') || textCorpus.includes('trabajo') || (r.ocasion || []).some(o => o.toLowerCase().includes('laboral'));
          } else if (target === 'brunch') {
            matchesQueBuscas = textCorpus.includes('brunch') || (r.ocasion || []).some(o => o.toLowerCase().includes('brunch'));
          } else if (target === 'merienda') {
            matchesQueBuscas = textCorpus.includes('merienda') || textCorpus.includes('café') || textCorpus.includes('cafe') || (r.ocasion || []).some(o => o.toLowerCase().includes('merienda') || o.toLowerCase().includes('café'));
          } else if (target === 'cumpleanos') {
            matchesQueBuscas = textCorpus.includes('cumple') || textCorpus.includes('festejo') || (r.ocasion || []).some(o => o.toLowerCase().includes('cumple') || o.toLowerCase().includes('festejo'));
          } else if (target === 'cita-romantica') {
            matchesQueBuscas = (r.ocasion || []).some(o => o.toLowerCase().includes('cita') || o.toLowerCase().includes('románt') || o.toLowerCase().includes('impresionar')) || textCorpus.includes('romántico') || textCorpus.includes('impresionar');
          } else if (target === 'copas') {
            matchesQueBuscas = textCorpus.includes('copas') || textCorpus.includes('trago') || textCorpus.includes('bar') || textCorpus.includes('vino') || textCorpus.includes('cocktail') || (r.ocasion || []).some(o => o.toLowerCase().includes('copas'));
          } else if (target === 'solitario') {
            matchesQueBuscas = textCorpus.includes('solitario') || (r.ocasion || []).some(o => o.toLowerCase().includes('solitario'));
          } else if (target === 'cafe') {
            matchesQueBuscas = textCorpus.includes('café') || textCorpus.includes('cafe') || textCorpus.includes('brunch') || textCorpus.includes('cafetería');
          } else if (target === 'parrilla') {
            matchesQueBuscas = textCorpus.includes('parrilla') || textCorpus.includes('carne') || textCorpus.includes('asado');
          } else if (target === 'bodegon') {
            matchesQueBuscas = textCorpus.includes('bodegón') || textCorpus.includes('bodegon') || textCorpus.includes('milanesa') || textCorpus.includes('pasta');
          } else if (target === 'vinos') {
            matchesQueBuscas = textCorpus.includes('vino') || textCorpus.includes('trago') || textCorpus.includes('cava') || textCorpus.includes('cocktail');
          } else if (target === 'primera-cita') {
            matchesQueBuscas = (r.ocasion || []).some(o => o.toLowerCase().includes('cita')) || textCorpus.includes('romántico');
          } else if (target === 'con-amigos') {
            matchesQueBuscas = (r.ocasion || []).some(o => o.toLowerCase().includes('amigos')) || textCorpus.includes('amigos');
          } else if (target === 'familiar') {
            matchesQueBuscas = (r.ocasion || []).some(o => o.toLowerCase().includes('familiar')) || textCorpus.includes('familia');
          }
        }

        return matchesQuery && matchesBarrio && matchesQueBuscas;
      })
      .sort((a, b) => {
        if (sortBy === 'mejores-notas') {
          const scoreA = calculateAverageRating(a.calificaciones);
          const scoreB = calculateAverageRating(b.calificaciones);
          return scoreB - scoreA;
        }
        if (sortBy === 'alfabetico') {
          return a.titulo.localeCompare(b.titulo);
        }
        // 'recientes' (default)
        const dateA = a.fecha || '';
        const dateB = b.fecha || '';
        return dateB.localeCompare(dateA);
      });
  }, [appState.resenas, queryLower, selectedBarrio, selectedQueBuscas, sortBy]);

  const filteredRecetas = useMemo(() => {
    return appState.recetas
      .filter((rec) =>
        (rec.titulo + ' ' + rec.descripcion).toLowerCase().includes(queryLower)
      )
      .sort((a, b) => {
        if (sortBy === 'alfabetico') {
          return a.titulo.localeCompare(b.titulo);
        }
        return 0;
      });
  }, [appState.recetas, queryLower, sortBy]);

  const destacadosDelMes = useMemo(() => {
    return appState.resenas.filter((r) => !!r.destacadoDelMes);
  }, [appState.resenas]);

  const filteredPendientes = appState.pendientes.filter((p) => {
    const matchesQuery = (p.nombre + ' ' + (p.direccion || '') + ' ' + (p.descripcion || '')).toLowerCase().includes(queryLower);
    const matchesBarrio =
      selectedBarrio === 'Todos' ||
      (p.direccion || '').toLowerCase().includes(selectedBarrio.toLowerCase());
    return matchesQuery && matchesBarrio;
  });

  // Palette styles for alternating pastel cards in Pendientes
  const pastelCardStyles = [
    { bg: 'bg-[#FFF9F5]', border: 'border-[#FED7C2]', badgeBg: 'bg-[#FFF2EA]', badgeText: 'text-[#C85A32]' },
    { bg: 'bg-[#F9FCF9]', border: 'border-[#CFE9D2]', badgeBg: 'bg-[#EEF7EF]', badgeText: 'text-[#367643]' },
    { bg: 'bg-[#FFFEFA]', border: 'border-[#FCE6A3]', badgeBg: 'bg-[#FEF9E7]', badgeText: 'text-[#B27B13]' },
    { bg: 'bg-[#FAF8FE]', border: 'border-[#DFD3F4]', badgeBg: 'bg-[#F6F2FC]', badgeText: 'text-[#6E44AF]' },
    { bg: 'bg-[#F9FCFE]', border: 'border-[#CAE8F2]', badgeBg: 'bg-[#EEF7FA]', badgeText: 'text-[#227090]' }
  ];

  // Barra de Filtros Inteligentes: ¿Qué buscás hoy? + Barrio + Ordenar por
  const renderFilterBar = () => (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#FED7C2]/80 shadow-2xs flex flex-wrap items-center gap-3">
      {/* Desplegable: ¿Qué buscás hoy? */}
      <div className="flex-1 min-w-[220px]">
        <label className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A] mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C85A32]" />
          ¿Qué buscás hoy?
        </label>
        <select
          value={selectedQueBuscas}
          onChange={(e) => setSelectedQueBuscas(e.target.value)}
          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#FED7C2] rounded-lg text-xs font-bold text-[#181816] focus:outline-none focus:border-[#C85A32] cursor-pointer"
        >
          <option value="todos">🌟 Todas las opciones gastronómicas</option>
          <option value="destacado-mes">★ Destacados del Mes (Recomendación del Autor)</option>
          <option value="almuerzo-laboral">💼 Almuerzo laboral / De trabajo</option>
          <option value="brunch">🥞 Brunch dominical</option>
          <option value="merienda">☕ Merienda o café</option>
          <option value="cita-romantica">💑 Cita romántica / Para impresionar</option>
          <option value="cumpleanos">🎂 Cumpleaños & Festejos</option>
          <option value="copas">🍸 Noche de copas & Vinos</option>
          <option value="solitario">🧘 En solitario</option>
          <option value="con-amigos">🍻 Salida con Amigos / Sobremesa</option>
          <option value="familiar">👨‍👩‍👧‍👦 Cena familiar numerosa</option>
          <option value="pet-friendly">🐾 Pet Friendly (admiten mascotas)</option>
          <option value="sin-tacc">🌾 Sin TACC / Apto Celíacos</option>
          <option value="vegano">🌱 Vegano / Vegetariano</option>
          <option value="aire-libre">☀️ Mesas al Aire Libre / Terraza</option>
          <option value="parrilla">🥩 Parrillas & Carnes</option>
          <option value="bodegon">🍝 Bodegones & Pastas Caseras</option>
        </select>
      </div>

      {/* Desplegable: Barrio */}
      {availableBarrios.length > 1 && (
        <div className="w-full sm:w-auto min-w-[150px]">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A] mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#C85A32]" />
            Barrio
          </label>
          <select
            value={selectedBarrio}
            onChange={(e) => setSelectedBarrio(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#FED7C2] rounded-lg text-xs font-bold text-[#181816] focus:outline-none focus:border-[#C85A32] cursor-pointer"
          >
            {availableBarrios.map((b) => (
              <option key={b} value={b}>
                {b === 'Todos' ? '📍 Todos los barrios' : `📍 ${b}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Desplegable: Ordenar por */}
      <div className="w-full sm:w-auto min-w-[170px]">
        <label className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A] mb-1 flex items-center gap-1">
          <ArrowDownUp className="w-3 h-3 text-[#C85A32]" />
          Ordenar por
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#FED7C2] rounded-lg text-xs font-bold text-[#181816] focus:outline-none focus:border-[#C85A32] cursor-pointer"
        >
          <option value="recientes">🕒 Más recientes primero</option>
          <option value="mejores-notas">⭐ Mejor puntuación (5.0 a 1.0)</option>
          <option value="alfabetico">🔤 Alfabético (A a Z)</option>
        </select>
      </div>

      {/* Botón limpiar */}
      {(selectedQueBuscas !== 'todos' || selectedBarrio !== 'Todos' || sortBy !== 'recientes') && (
        <button
          onClick={() => {
            setSelectedQueBuscas('todos');
            setSelectedBarrio('Todos');
            setSortBy('recientes');
          }}
          className="self-end px-3 py-2 text-xs font-bold text-stone-500 hover:text-[#C85A32] underline cursor-pointer"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#181816]">
      {/* Editorial Header with Secret 3-Click on Logo and Roulette button */}
      <Header
        seccionActual={seccionActual}
        onSelectSeccion={handleSelectSeccion}
        logoUrl={appState.config.logoUrl}
        nombre={appState.config.nombre}
        onOpenEditor={() => handleOpenEditorWithTab('resenas')}
        onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
        sobreNosotrosActivo={appState.sobreNosotros?.activo ?? false}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-6 py-4">
        {/* If detail view is active, render it */}
        {detailItem ? (
          <DetailView
            item={detailItem.item}
            tipo={detailItem.tipo}
            ratingSymbol={appState.config.ratingSymbol}
            onBack={() => handleBackFromDetail(detailItem.tipo)}
            onViewOnMap={handleViewResenaOnMap}
          />
        ) : (
          <>
            {/* ===== INICIO ===== */}
            {seccionActual === 'inicio' && (
              <div className="space-y-8">
                {/* Hero with lively pastel aura and tight spacing */}
                <section className="py-7 sm:py-10 flex flex-col items-center text-center relative border-b border-[#FED7C2]/70">
                  <div className="absolute top-2 w-48 h-48 bg-gradient-to-tr from-[#FFF2EA] via-[#FEF9E7] to-[#EEF7EF] rounded-full blur-2xl opacity-60 -z-10" />

                  <div className="w-20 h-20 rounded-full border border-[#FED7C2] flex items-center justify-center text-[#C85A32] mb-3 bg-white shadow-md shadow-[#FED7C2]/40 overflow-hidden animate-float">
                    {appState.config.logoUrl ? (
                      <img
                        src={appState.config.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="w-8 h-8 text-[#C85A32]" />
                    )}
                  </div>

                  <h2 className="font-serif-title text-5xl sm:text-7xl md:text-8xl text-[#181816] tracking-tight leading-[0.95] mb-1">
                    {appState.config.nombre}
                  </h2>

                  <div className="relative">
                    <p className="font-serif-title italic text-xl sm:text-3xl text-[#C85A32] leading-tight">
                      sobre gustos hay algo escrito
                    </p>
                    <span className="block w-10 h-[2px] bg-[#FED7C2] mx-auto mt-2" />
                  </div>
                </section>

                {/* Global Search & Roulette Callout with pastel accents */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full max-w-md">
                      <Search className="w-4 h-4 text-[#C85A32] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por local, receta o barrio..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#FED7C2] focus:border-[#C85A32] rounded-lg text-sm text-[#181816] placeholder-[#737373] focus:outline-none shadow-xs transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsRandomPickerOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF2EA] border border-[#FED7C2] text-[#C85A32] hover:bg-[#C85A32] hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                      >
                        <Dices className="w-4 h-4" />
                        ¿Dónde comemos hoy?
                      </button>

                      {searchQuery && (
                        <span className="text-xs uppercase font-bold tracking-wider text-[#367643] bg-[#EEF7EF] px-2.5 py-1 rounded border border-[#CFE9D2]">
                          {filteredResenas.length + filteredRecetas.length} encontrados
                        </span>
                      )}
                    </div>
                  </div>

                  {renderFilterBar()}
                </div>

                {/* Showcase Destacado del Mes / Recomendación del Autor */}
                {destacadosDelMes.length > 0 && selectedQueBuscas === 'todos' && !searchQuery && (
                  <section className="bg-gradient-to-r from-amber-500/10 via-[#FFF9F2] to-orange-500/10 border-2 border-amber-300 rounded-2xl p-5 sm:p-7 shadow-sm relative overflow-hidden animate-fadeIn">
                    <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {destacadosDelMes[0].fotaPortada && (
                        <div
                          onClick={() => handleOpenDetail(destacadosDelMes[0], 'resena')}
                          className="w-full md:w-56 h-48 sm:h-52 rounded-xl overflow-hidden shrink-0 shadow-md border border-amber-200 cursor-pointer group"
                        >
                          <img
                            src={destacadosDelMes[0].fotaPortada}
                            alt={destacadosDelMes[0].titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] uppercase font-extrabold tracking-wider shadow-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Destacado del Mes · Recomendación del Autor</span>
                        </div>
                        <h3
                          onClick={() => handleOpenDetail(destacadosDelMes[0], 'resena')}
                          className="font-serif-title text-2xl sm:text-3xl font-bold text-[#181816] hover:text-[#C85A32] cursor-pointer transition-colors"
                        >
                          {destacadosDelMes[0].titulo}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-2 sm:line-clamp-3 italic font-serif">
                          "{destacadosDelMes[0].platoInsignia ? `Qué pedir sí o sí: ${destacadosDelMes[0].platoInsignia}. ` : ''}
                          {destacadosDelMes[0].resena.slice(0, 180)}..."
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <button
                            onClick={() => handleOpenDetail(destacadosDelMes[0], 'resena')}
                            className="px-4 py-2 bg-[#C85A32] hover:bg-[#a93a18] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Leer Reseña Completa</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Latest Reviews */}
                <section>
                  <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#FED7C2]">
                    <h3 className="text-xs font-bold uppercase tracking-[2px] text-[#181816] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
                      Lo último que probamos
                    </h3>
                    <a
                      href={getPathForSection('resenas')}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectSeccion('resenas');
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-[#C85A32] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Ver todas ({appState.resenas.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResenas.slice(0, 3).map((resena) => (
                      <ReviewCard
                        key={resena.id}
                        resena={resena}
                        ratingSymbol={appState.config.ratingSymbol}
                        onClick={() => handleOpenDetail(resena, 'resena')}
                      />
                    ))}
                  </div>
                </section>

                {/* Latest Recipes */}
                <section>
                  <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#CFE9D2]">
                    <h3 className="text-xs font-bold uppercase tracking-[2px] text-[#181816] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#367643]" />
                      Lo último que cocinamos
                    </h3>
                    <a
                      href={getPathForSection('recetas')}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectSeccion('recetas');
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-[#367643] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Ver recetas ({appState.recetas.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredRecetas.slice(0, 2).map((receta) => (
                      <RecipeCard
                        key={receta.id}
                        receta={receta}
                        onClick={() => handleOpenDetail(receta, 'receta')}
                      />
                    ))}
                  </div>
                </section>

                {/* Call to Map action */}
                <div className="pt-4 pb-2 text-center">
                  <a
                    href={getPathForSection('mapa')}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectSeccion('mapa');
                    }}
                    className="inline-block px-7 py-3 bg-[#181816] hover:bg-[#C85A32] text-white font-bold text-xs uppercase tracking-[2px] rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                  >
                    Ver todas las ubicaciones en el mapa →
                  </a>
                </div>
              </div>
            )}

            {/* ===== RESEÑAS ===== */}
            {seccionActual === 'resenas' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-[#FED7C2] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <h1 className="font-serif-title text-4xl sm:text-6xl text-[#181816] leading-tight mb-1">
                      Reseñas
                    </h1>
                    <p className="text-xs sm:text-sm text-[#737373]">
                      Críticas gastronómicas, notas de salón, vinos y platos destacados.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRandomPickerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF2EA] border border-[#FED7C2] text-[#C85A32] text-xs font-bold uppercase tracking-wider hover:bg-[#C85A32] hover:text-white transition-all cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      Elegir al azar
                    </button>
                    <span className="text-xs uppercase font-bold tracking-wider text-[#C85A32] bg-[#FFF2EA] px-3 py-1 rounded-full border border-[#FED7C2] w-fit">
                      {filteredResenas.length} reseñas
                    </span>
                  </div>
                </div>

                {renderFilterBar()}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResenas.map((resena) => (
                    <ReviewCard
                      key={resena.id}
                      resena={resena}
                      ratingSymbol={appState.config.ratingSymbol}
                      onClick={() => handleOpenDetail(resena, 'resena')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ===== MAPA (OPENSTREETMAP LEAFLET) ===== */}
            {seccionActual === 'mapa' && (
              <div className="space-y-5">
                <div className="pb-3 border-b border-[#FED7C2] flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h1 className="font-serif-title text-4xl sm:text-6xl text-[#181816] leading-tight mb-1">
                      El mapa
                    </h1>
                    <p className="text-xs sm:text-sm text-[#737373]">
                      Explorá visualmente todos los restaurantes reseñados y las coordenadas anotadas por visitar.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRandomPickerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF2EA] border border-[#FED7C2] text-[#C85A32] text-xs font-bold uppercase tracking-wider hover:bg-[#C85A32] hover:text-white transition-all cursor-pointer w-fit"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    ¿Dónde comemos?
                  </button>
                </div>

                <InteractiveMap
                  resenas={appState.resenas}
                  pendientes={appState.pendientes}
                  config={appState.config}
                  onSelectResena={(resena) => handleOpenDetail(resena, 'resena')}
                />
              </div>
            )}

            {/* ===== RECETAS ===== */}
            {seccionActual === 'recetas' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-[#CFE9D2] flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h1 className="font-serif-title text-4xl sm:text-6xl text-[#181816] leading-tight mb-1">
                      Recetas
                    </h1>
                    <p className="text-xs sm:text-sm text-[#737373]">
                      Platos caseros, masas, pastas frescas y secretos aprendidos en casa.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-[#CFE9D2] px-2.5 py-1 rounded-full text-xs shadow-2xs">
                      <ArrowDownUp className="w-3.5 h-3.5 text-[#367643]" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-[#181816] focus:outline-none cursor-pointer"
                      >
                        <option value="recientes">Más recientes</option>
                        <option value="alfabetico">Alfabético (A-Z)</option>
                      </select>
                    </div>
                    <span className="text-xs uppercase font-bold tracking-wider text-[#367643] bg-[#EEF7EF] px-3 py-1 rounded-full border border-[#CFE9D2] w-fit">
                      {filteredRecetas.length} recetas
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRecetas.map((receta) => (
                    <RecipeCard
                      key={receta.id}
                      receta={receta}
                      onClick={() => handleOpenDetail(receta, 'receta')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ===== PENDIENTES ===== */}
            {seccionActual === 'pendientes' && (
              <div className="space-y-6 max-w-4xl">
                <div className="pb-3 border-b border-[#CFE9D2] flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h1 className="font-serif-title text-4xl sm:text-6xl text-[#181816] leading-tight mb-1">
                      Pendientes
                    </h1>
                    <p className="text-xs sm:text-sm text-[#737373]">
                      Lugares recomendados en la lista de espera para visitar próximamente.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsRandomPickerOpen(true)}
                      className="text-xs uppercase font-bold tracking-wider text-[#C85A32] bg-[#FFF2EA] px-3 py-1 rounded-full border border-[#FED7C2] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      Elegir al azar
                    </button>
                    <a
                      href={getPathForSection('mapa')}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectSeccion('mapa');
                      }}
                      className="text-xs uppercase font-bold tracking-wider text-[#367643] hover:underline cursor-pointer"
                    >
                      Ver en el mapa →
                    </a>
                  </div>
                </div>

                {/* Joyful pastel cards for pending items */}
                <div className="space-y-3.5">
                  {filteredPendientes.map((p, idx) => {
                    const style = pastelCardStyles[idx % pastelCardStyles.length];
                    const pendingShareUrl = getFullUrl(`/pendientes#${p.id}`);
                    const googleMapsUrl =
                      p.lat && p.lng
                        ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${p.nombre} ${p.direccion || 'Buenos Aires'}`
                          )}`;

                    return (
                      <div
                        key={p.id}
                        id={p.id}
                        className={`p-5 rounded-xl border ${style.border} ${style.bg} shadow-xs hover:shadow-md transition-all duration-300`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <h3 className="font-serif-title text-2xl text-[#181816]">
                            {p.nombre}
                          </h3>
                          <div className="flex items-center gap-2">
                            {p.categoria && (
                              <span
                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${style.badgeBg} ${style.badgeText} ${style.border}`}
                              >
                                {p.categoria}
                              </span>
                            )}
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-[#737373] hover:text-[#C85A32] hover:bg-white/80 transition-colors"
                              title="Abrir en Google Maps"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => copyToClipboard(pendingShareUrl, p.id)}
                              className="p-1 rounded text-[#737373] hover:text-[#181816] hover:bg-white/80 transition-colors cursor-pointer"
                              title="Copiar link"
                            >
                              {copiedLink === p.id ? (
                                <Check className="w-3.5 h-3.5 text-[#367643]" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {p.direccion && (
                          <div className="flex items-center gap-1.5 text-xs text-[#737373] mb-2">
                            <MapPin className="w-3.5 h-3.5 text-[#C85A32] flex-shrink-0" />
                            <span>{p.direccion}</span>
                          </div>
                        )}

                        <p className="text-xs sm:text-sm text-[#181816]/85 leading-relaxed">
                          {p.descripcion}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== SOBRE NOSOTROS ===== */}
            {seccionActual === 'sobre-nosotros' && (
              <SobreNosotrosView
                data={appState.sobreNosotros}
                onBack={() => handleSelectSeccion('inicio')}
              />
            )}
          </>
        )}
      </main>

      {/* Full Modal Editor for Reviews, Recipes, Bookmarks and Settings */}
      <EditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        appState={appState}
        onUpdateState={handleUpdateState}
        initialTab={editorInitialTab}
      />

      {/* Roulette Modal "¿Dónde comemos hoy?" */}
      <RandomPickerModal
        isOpen={isRandomPickerOpen}
        onClose={() => setIsRandomPickerOpen(false)}
        resenas={appState.resenas}
        pendientes={appState.pendientes}
        onSelectResena={(resena) => handleOpenDetail(resena, 'resena')}
        onSelectPendienteOnMap={(pendiente) => {
          handleSelectSeccion('mapa');
        }}
      />

      {/* Footer with Discreet Key Access to Editor */}
      <Footer
        onSelectSeccion={handleSelectSeccion}
        logoUrl={appState.config.logoUrl}
        nombre={appState.config.nombre}
        slogan={appState.config.slogan}
        onOpenEditor={() => handleOpenEditorWithTab('resenas')}
        sobreNosotrosActivo={appState.sobreNosotros?.activo ?? false}
      />
    </div>
  );
}
