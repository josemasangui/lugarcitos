import React, { useState } from 'react';
import { AppState, Resena, Receta, Pendiente, Configuracion, SobreNosotrosData, FotoItem } from '../types';
import { estimateCoordinatesForAddress, calculateAverageRating } from '../services/storage';
import { ForkRating } from './ForkRating';
import { ImageUploadField } from './ImageUploadField';
import { GalleryManager } from './GalleryManager';
import { TagsInput } from './TagsInput';
import { RichTextEditor } from './RichTextEditor';
import { X, Lock, Plus, Edit2, Trash2, KeyRound, Image as ImageIcon, ShieldCheck, Check, Sparkles, BookOpen, Star, EyeOff, Calendar, Download } from 'lucide-react';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onUpdateState: (newState: AppState) => void;
  initialTab?: 'resenas' | 'recetas' | 'pendientes' | 'sobre-nosotros';
}

const PRESET_OCASIONES = [
  'Almuerzo laboral',
  'Brunch dominical',
  'Merienda o café',
  'Cumpleaños',
  'Cita romántica',
  'Para impresionar',
  'Noche de copas',
  'En solitario',
  'Cena familiar numerosa',
  'Festejo Especial',
  'Sobremesa Larga',
  'Con Amigos',
  'Al Paso',
  'Primera Cita'
];

export const EditorModal: React.FC<EditorModalProps> = ({
  isOpen,
  onClose,
  appState,
  onUpdateState,
  initialTab = 'resenas'
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [customOcasionText, setCustomOcasionText] = useState('');
  const [activeTab, setActiveTab] = useState<'resenas' | 'recetas' | 'pendientes' | 'sobre-nosotros'>(initialTab);

  // Hidden panel state for system configuration (API key and settings)
  const [showHiddenConfig, setShowHiddenConfig] = useState(false);

  // Sub-modal for editing / creating items
  const [editingItemType, setEditingItemType] = useState<'resena' | 'receta' | 'pendiente' | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Forms states
  const [resenaForm, setResenaForm] = useState<Partial<Resena>>({
    titulo: '',
    ubicacion: '',
    resena: '',
    precio: 3,
    fotaPortada: '',
    platoInsignia: '',
    ocasion: [],
    calificaciones: { atencion: 4, comida: 4, bebida: 4, postre: 4, precio: 3, ambiente: 4 }
  });

  const [recetaForm, setRecetaForm] = useState<Partial<Receta>>({
    titulo: '',
    descripcion: '',
    fotaPortada: '',
    tiempo: '30 minutos',
    porciones: '2 personas'
  });

  const [pendienteForm, setPendienteForm] = useState<Partial<Pendiente>>({
    nombre: '',
    direccion: '',
    descripcion: '',
    categoria: ''
  });

  // Sobre Nosotros state
  const [sobreNosotrosForm, setSobreNosotrosForm] = useState<SobreNosotrosData>(
    appState.sobreNosotros || {
      activo: true,
      titulo: 'Sobre Nosotros',
      subtitulo: 'Nuestra Historia en Cada Sobremesa',
      fotoPortada: '',
      texto: '',
      fotos: []
    }
  );
  const [savedSobreNosotrosNotice, setSavedSobreNosotrosNotice] = useState(false);

  // Settings state
  const [apiKeyInput, setApiKeyInput] = useState(appState.config.mapsApiKey || '');
  const [savedKeyNotice, setSavedKeyNotice] = useState(false);

  if (!isOpen) return null;

  // Handle Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === '0308') {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  // --- Reviews Operations ---
  const handleOpenNewResena = () => {
    setEditingItemType('resena');
    setEditingIndex(-1);
    setResenaForm({
      titulo: '',
      ubicacion: '',
      resena: '',
      precio: 3,
      fotaPortada: '',
      platoInsignia: '',
      ocasion: [],
      etiquetas: [],
      galeria: [],
      destacadoDelMes: false,
      fecha: new Date().toISOString().split('T')[0],
      calificaciones: { atencion: 4, comida: 4, bebida: 4, postre: 4, precio: 3, ambiente: 4 }
    });
  };

  const handleEditResena = (index: number) => {
    setEditingItemType('resena');
    setEditingIndex(index);
    const item = appState.resenas[index];
    setResenaForm({
      ...item,
      destacadoDelMes: !!item.destacadoDelMes,
      fecha: item.fecha || new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteResena = (index: number) => {
    const item = appState.resenas[index];
    if (!item) return;

    const next = [...appState.resenas];
    next.splice(index, 1);

    const tombstoneIds = Array.from(
      new Set([
        ...(appState.deletedIds || []),
        item.id,
        item.titulo
      ].filter(Boolean).map((x) => String(x).toLowerCase().trim()))
    );

    onUpdateState({ ...appState, resenas: next, deletedIds: tombstoneIds });
  };

  const handleSaveResena = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resenaForm.titulo || !resenaForm.titulo.trim()) return;

    const coords = estimateCoordinatesForAddress(
      resenaForm.ubicacion || resenaForm.titulo || '',
      editingIndex >= 0 ? editingIndex : appState.resenas.length
    );

    const generatedId =
      resenaForm.id ||
      resenaForm.titulo.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    const completeResena: Resena = {
      id: generatedId,
      titulo: resenaForm.titulo.trim(),
      ubicacion: resenaForm.ubicacion?.trim() || '',
      lat: resenaForm.lat || coords.lat,
      lng: resenaForm.lng || coords.lng,
      resena: resenaForm.resena || '',
      calificaciones: resenaForm.calificaciones || { atencion: 3, comida: 3, bebida: 3, postre: 3, precio: 3, ambiente: 3 },
      precio: resenaForm.precio || 3,
      fotaPortada: resenaForm.fotaPortada || '',
      fecha: resenaForm.fecha || new Date().toISOString().split('T')[0],
      platoInsignia: resenaForm.platoInsignia?.trim() || '',
      ocasion: resenaForm.ocasion || [],
      etiquetas: resenaForm.etiquetas || [],
      galeria: resenaForm.galeria || [],
      destacadoDelMes: !!resenaForm.destacadoDelMes
    };

    const next = [...appState.resenas];
    if (editingIndex >= 0 && editingIndex < next.length) {
      next[editingIndex] = completeResena;
    } else {
      next.unshift(completeResena);
    }

    onUpdateState({ ...appState, resenas: next });
    setEditingItemType(null);
  };

  const handleSaveSobreNosotros = (e?: React.FormEvent, customData?: SobreNosotrosData) => {
    if (e) e.preventDefault();
    const dataToSave = customData || sobreNosotrosForm;
    onUpdateState({
      ...appState,
      sobreNosotros: dataToSave
    });
    setSavedSobreNosotrosNotice(true);
    setTimeout(() => setSavedSobreNosotrosNotice(false), 3000);
  };

  // --- Recipes Operations ---
  const handleOpenNewReceta = () => {
    setEditingItemType('receta');
    setEditingIndex(-1);
    setRecetaForm({
      titulo: '',
      descripcion: '',
      fotaPortada: '',
      tiempo: '25 min',
      porciones: '2 personas',
      etiquetas: [],
      galeria: []
    });
  };

  const handleEditReceta = (index: number) => {
    setEditingItemType('receta');
    setEditingIndex(index);
    setRecetaForm({ ...appState.recetas[index] });
  };

  const handleDeleteReceta = (index: number) => {
    const item = appState.recetas[index];
    if (!item) return;

    const next = [...appState.recetas];
    next.splice(index, 1);

    const tombstoneIds = Array.from(
      new Set([
        ...(appState.deletedIds || []),
        item.id,
        item.titulo
      ].filter(Boolean).map((x) => String(x).toLowerCase().trim()))
    );

    onUpdateState({ ...appState, recetas: next, deletedIds: tombstoneIds });
  };

  const handleSaveReceta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recetaForm.titulo) return;

    const completeReceta: Receta = {
      id: recetaForm.id || recetaForm.titulo.toLowerCase().replace(/\s+/g, '-'),
      titulo: recetaForm.titulo,
      descripcion: recetaForm.descripcion || '',
      fotaPortada: recetaForm.fotaPortada || '',
      tiempo: recetaForm.tiempo || '20 min',
      porciones: recetaForm.porciones || '2 personas',
      etiquetas: recetaForm.etiquetas || [],
      galeria: recetaForm.galeria || []
    };

    const next = [...appState.recetas];
    if (editingIndex >= 0) {
      next[editingIndex] = completeReceta;
    } else {
      next.unshift(completeReceta);
    }

    onUpdateState({ ...appState, recetas: next });
    setEditingItemType(null);
  };

  // --- Bookmarks Operations ---
  const handleOpenNewPendiente = () => {
    setEditingItemType('pendiente');
    setEditingIndex(-1);
    setPendienteForm({
      nombre: '',
      direccion: '',
      descripcion: '',
      categoria: 'Restaurante',
      fotaPortada: '',
      galeria: []
    });
  };

  const handleEditPendiente = (index: number) => {
    setEditingItemType('pendiente');
    setEditingIndex(index);
    setPendienteForm({ ...appState.pendientes[index] });
  };

  const handleDeletePendiente = (index: number) => {
    const item = appState.pendientes[index];
    if (!item) return;

    const next = [...appState.pendientes];
    next.splice(index, 1);

    const tombstoneIds = Array.from(
      new Set([
        ...(appState.deletedIds || []),
        item.id,
        item.nombre
      ].filter(Boolean).map((x) => String(x).toLowerCase().trim()))
    );

    onUpdateState({ ...appState, pendientes: next, deletedIds: tombstoneIds });
  };

  const handleSavePendiente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendienteForm.nombre) return;

    const coords = estimateCoordinatesForAddress(pendienteForm.direccion || pendienteForm.nombre || '', editingIndex >= 0 ? editingIndex + 10 : appState.pendientes.length + 10);

    const completePendiente: Pendiente = {
      id: pendienteForm.id || pendienteForm.nombre.toLowerCase().replace(/\s+/g, '-'),
      nombre: pendienteForm.nombre,
      direccion: pendienteForm.direccion || '',
      lat: pendienteForm.lat || coords.lat,
      lng: pendienteForm.lng || coords.lng,
      descripcion: pendienteForm.descripcion || '',
      categoria: pendienteForm.categoria || '',
      fotaPortada: pendienteForm.fotaPortada || '',
      galeria: pendienteForm.galeria || []
    };

    const next = [...appState.pendientes];
    if (editingIndex >= 0) {
      next[editingIndex] = completePendiente;
    } else {
      next.unshift(completePendiente);
    }

    onUpdateState({ ...appState, pendientes: next });
    setEditingItemType(null);
  };

  // --- Settings (API Key & Logo) ---
  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    const nextConfig: Configuracion = {
      ...appState.config,
      mapsApiKey: trimmed
    };
    onUpdateState({ ...appState, config: nextConfig });
    setSavedKeyNotice(true);
    setTimeout(() => setSavedKeyNotice(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      const nextConfig: Configuracion = {
        ...appState.config,
        logoUrl: result
      };
      onUpdateState({ ...appState, config: nextConfig });
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    const nextConfig: Configuracion = {
      ...appState.config,
      logoUrl: null
    };
    onUpdateState({ ...appState, config: nextConfig });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181816]/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#FAF8F5] border-t-4 border-[#C85A32] rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#181816]/10 bg-white">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#C85A32]" />
            <h2 className="font-serif-title text-2xl text-[#181816]">
              {isAuthenticated ? 'Panel de Editor & Gestión' : 'Acceso al Editor'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#737373] hover:text-[#C85A32] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          /* Password prompt (Strictly without hints) */
          <div className="p-8 max-w-md mx-auto w-full">
            <p className="text-sm text-[#737373] mb-6 text-center">
              Ingresa la contraseña de edición para gestionar los contenidos del sitio.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-2">
                  Contraseña de acceso
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full px-4 py-3 bg-white border border-[#181816]/20 rounded-md text-[#181816] focus:outline-none focus:border-[#C85A32] text-lg text-center tracking-widest font-mono"
                />
                {authError && (
                  <p className="text-xs text-[#9E2A2B] font-bold mt-2 text-center">
                    Contraseña incorrecta. Intenta nuevamente.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-[#737373] border border-[#181816]/15 rounded hover:bg-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#181816] hover:bg-[#C85A32] rounded transition-colors shadow-sm cursor-pointer"
                >
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Panel */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Quick Action Buttons & Cloud Sync Status */}
            <div className="p-4 sm:p-6 bg-[#FAF8F5] border-b border-[#181816]/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleOpenNewResena}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C85A32] hover:bg-[#a93a18] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nueva Reseña
                </button>
                <button
                  onClick={handleOpenNewReceta}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#181816] hover:bg-[#C85A32] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nueva Receta
                </button>
                <button
                  onClick={handleOpenNewPendiente}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#556B2F] hover:bg-[#3d4d22] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nuevo Pendiente
                </button>
              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `lugarcitos-respaldo-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#181816]/20 text-[#181816] hover:text-[#C85A32] hover:border-[#C85A32] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                  title="Descargar copia de seguridad completa en archivo .json"
                >
                  <Download className="w-3.5 h-3.5" /> Copia (.json)
                </button>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF7EF] border border-[#CFE9D2] text-[#367643] text-[11px] font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#367643] animate-pulse" />
                  <span>Nube Sincronizada</span>
                </div>
              </div>
            </div>

            {/* Navigation tabs (Only content tabs are shown; settings are kept in the hidden section) */}
            <div className="flex border-b border-[#181816]/10 bg-white px-6">
              {[
                { id: 'resenas', label: `Reseñas (${appState.resenas.length})` },
                { id: 'recetas', label: `Recetas (${appState.recetas.length})` },
                { id: 'pendientes', label: `Pendientes (${appState.pendientes.length})` },
                { id: 'sobre-nosotros', label: `Sobre Nosotros (${sobreNosotrosForm.activo ? 'Activo' : 'Oculto'})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    setShowHiddenConfig(false);
                  }}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab.id && !showHiddenConfig
                      ? 'border-[#C85A32] text-[#C85A32]'
                      : 'border-transparent text-[#737373] hover:text-[#181816]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {showHiddenConfig ? (
                /* Hidden/Restricted Technical Configuration Panel */
                <div className="space-y-6 max-w-xl mx-auto py-2 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-[#181816]/10">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9E2A2B]">
                      <ShieldCheck className="w-4 h-4" />
                      Panel Restringido: Parámetros Técnicos
                    </div>
                    <button
                      onClick={() => setShowHiddenConfig(false)}
                      className="text-xs text-[#737373] hover:text-[#181816] underline cursor-pointer"
                    >
                      Volver a contenidos
                    </button>
                  </div>

                  {/* Google Maps API Key Config */}
                  <div className="p-5 bg-white rounded-xl border border-[#181816]/10 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C85A32]">
                      <KeyRound className="w-4 h-4" />
                      Google Maps API Key
                    </div>

                    <p className="text-xs text-[#737373] leading-relaxed">
                      Configuración reservada exclusivamente para el administrador técnico. Ingresa la clave de API para la visualización del mapa.
                    </p>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#181816]/20 rounded font-mono text-xs text-[#181816] focus:outline-none focus:border-[#C85A32]"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#737373]">
                        <span>Estado en .env: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Definida en servidor' : 'No definida'}</span>
                        {apiKeyInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setApiKeyInput('');
                              const nextConfig = { ...appState.config, mapsApiKey: '' };
                              onUpdateState({ ...appState, config: nextConfig });
                            }}
                            className="text-[#9E2A2B] hover:underline cursor-pointer"
                          >
                            Limpiar clave guardada
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSaveApiKey}
                        className="px-5 py-2.5 bg-[#181816] hover:bg-[#C85A32] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Guardar Clave
                      </button>

                      {savedKeyNotice && (
                        <span className="text-xs font-bold text-[#556B2F] flex items-center gap-1 animate-fadeIn">
                          <Check className="w-4 h-4" /> Clave actualizada con éxito
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Logo Management */}
                  <div className="p-5 bg-white rounded-xl border border-[#181816]/10 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#181816]">
                      <ImageIcon className="w-4 h-4 text-[#C85A32]" />
                      Logo e Isotipo de Marca
                    </div>

                    <div className="flex items-center gap-4">
                      {appState.config.logoUrl ? (
                        <div className="w-14 h-14 rounded-full border border-[#C85A32] overflow-hidden bg-white flex-shrink-0">
                          <img
                            src={appState.config.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full border border-[#181816]/20 flex items-center justify-center text-xs text-[#737373] bg-[#FAF8F5]">
                          Original
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="inline-block px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-[#181816]/20 hover:border-[#C85A32] rounded cursor-pointer transition-colors">
                          Subir imagen
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {appState.config.logoUrl && (
                          <button
                            onClick={handleResetLogo}
                            className="ml-3 text-xs text-[#9E2A2B] hover:underline cursor-pointer"
                          >
                            Restablecer al original
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'resenas' && (
                    <div className="space-y-2">
                      {appState.resenas.map((resena, idx) => (
                        <div
                          key={resena.id || idx}
                          className="flex items-center justify-between p-3.5 bg-white border border-[#181816]/10 rounded-lg shadow-xs hover:border-[#C85A32]/40"
                        >
                          <div className="truncate mr-4">
                            <span className="font-bold text-sm text-[#181816] block truncate">
                              {resena.titulo}
                            </span>
                            <span className="text-xs text-[#737373] block truncate">
                              {resena.ubicacion} · {'$'.repeat(resena.precio || 3)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEditResena(idx)}
                              className="p-1.5 text-[#181816] hover:text-[#C85A32] rounded hover:bg-[#FAF8F5] cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteResena(idx)}
                              className="p-1.5 text-[#9E2A2B] hover:text-[#7d2122] rounded hover:bg-red-50 cursor-pointer"
                              title="Borrar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'recetas' && (
                    <div className="space-y-2">
                      {appState.recetas.map((receta, idx) => (
                        <div
                          key={receta.id || idx}
                          className="flex items-center justify-between p-3.5 bg-white border border-[#181816]/10 rounded-lg shadow-xs hover:border-[#D4A373]"
                        >
                          <div className="truncate mr-4">
                            <span className="font-bold text-sm text-[#181816] block truncate">
                              {receta.titulo}
                            </span>
                            <span className="text-xs text-[#737373] block truncate">
                              {receta.tiempo || 'Receta'} · {receta.porciones || 'Porciones libres'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEditReceta(idx)}
                              className="p-1.5 text-[#181816] hover:text-[#C85A32] rounded hover:bg-[#FAF8F5] cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReceta(idx)}
                              className="p-1.5 text-[#9E2A2B] hover:text-[#7d2122] rounded hover:bg-red-50 cursor-pointer"
                              title="Borrar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'pendientes' && (
                    <div className="space-y-2">
                      {appState.pendientes.map((pendiente, idx) => (
                        <div
                          key={pendiente.id || idx}
                          className="flex items-center justify-between p-3.5 bg-white border border-[#181816]/10 rounded-lg shadow-xs hover:border-[#556B2F]"
                        >
                          <div className="truncate mr-4">
                            <span className="font-bold text-sm text-[#181816] block truncate">
                              {pendiente.nombre}
                            </span>
                            <span className="text-xs text-[#737373] block truncate">
                              {pendiente.direccion || 'Sin dirección fija'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEditPendiente(idx)}
                              className="p-1.5 text-[#181816] hover:text-[#C85A32] rounded hover:bg-[#FAF8F5] cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePendiente(idx)}
                              className="p-1.5 text-[#9E2A2B] hover:text-[#7d2122] rounded hover:bg-red-50 cursor-pointer"
                              title="Borrar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'sobre-nosotros' && (
                    <form onSubmit={handleSaveSobreNosotros} className="space-y-6 animate-fadeIn">
                      {/* Activation Toggle Card */}
                      <div className="flex items-center justify-between p-4 bg-white border border-[#181816]/10 rounded-xl shadow-xs">
                        <div>
                          <h4 className="font-serif-title text-lg text-[#181816]">Estado de la Sección</h4>
                          <p className="text-xs text-[#737373]">
                            Activa o desactiva la visibilidad de "Sobre Nosotros" en la web cuando tú decidas.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sobreNosotrosForm.activo}
                            onChange={(e) => {
                              const newActivo = e.target.checked;
                              const updated = { ...sobreNosotrosForm, activo: newActivo };
                              setSobreNosotrosForm(updated);
                              handleSaveSobreNosotros(undefined, updated);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#367643]"></div>
                          <span className={`ml-3 text-xs font-bold uppercase tracking-wider ${sobreNosotrosForm.activo ? 'text-[#367643]' : 'text-[#737373]'}`}>
                            {sobreNosotrosForm.activo ? 'Visible en Web (Todos los dispositivos)' : 'Oculto en Todos los Dispositivos'}
                          </span>
                        </label>
                      </div>

                      {/* Text and narrative */}
                      <div className="p-5 bg-white border border-[#181816]/10 rounded-xl shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C85A32]">
                          <BookOpen className="w-4 h-4" />
                          Narrativa & Manifiesto
                        </div>

                        <div>
                          <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                            Título Principal
                          </label>
                          <input
                            type="text"
                            required
                            value={sobreNosotrosForm.titulo}
                            onChange={(e) => setSobreNosotrosForm({ ...sobreNosotrosForm, titulo: e.target.value })}
                            className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                            placeholder="Ej: Sobre Nosotros / Nuestra Historia"
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                            Subtítulo Editorial
                          </label>
                          <input
                            type="text"
                            value={sobreNosotrosForm.subtitulo}
                            onChange={(e) => setSobreNosotrosForm({ ...sobreNosotrosForm, subtitulo: e.target.value })}
                            className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                            placeholder="Ej: Lugarcitos nació de la fascinación por los rincones..."
                          />
                        </div>

                        {/* Image upload for cover banner */}
                        <ImageUploadField
                          label="Foto de Portada Principal (Hero Banner)"
                          value={sobreNosotrosForm.fotoPortada}
                          onChange={(url) => setSobreNosotrosForm({ ...sobreNosotrosForm, fotoPortada: url })}
                          aspectRatio="wide"
                          helpText="Sube la foto panorámica de portada desde tu computadora o celular."
                        />

                        <RichTextEditor
                          label="Texto de la Historia & Manifiesto (Justificado)"
                          value={sobreNosotrosForm.texto}
                          onChange={(val) => setSobreNosotrosForm({ ...sobreNosotrosForm, texto: val })}
                          placeholder="Escribe la historia o manifiesto de Lugarcitos, o pega directamente desde Word (se respetarán negritas, cursivas y viñetas)..."
                          minHeight="180px"
                        />
                      </div>

                      {/* Photo Gallery with Captions */}
                      <div className="p-5 bg-white border border-[#181816]/10 rounded-xl shadow-xs">
                        <GalleryManager
                          label="Galería de Fotos e Historias (hasta 15 fotos con pie de foto)"
                          fotos={sobreNosotrosForm.fotos || []}
                          onChange={(fotos) => setSobreNosotrosForm({ ...sobreNosotrosForm, fotos })}
                          maxPhotos={15}
                        />
                      </div>

                      {/* Save Button */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-[#C85A32] hover:bg-[#a93a18] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Guardar Sobre Nosotros
                        </button>
                        {savedSobreNosotrosNotice && (
                          <span className="text-xs font-bold text-[#367643] flex items-center gap-1 animate-fadeIn">
                            <Check className="w-4 h-4" /> Guardado con éxito
                          </span>
                        )}
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* Footer with discreet system toggle and logout */}
            <div className="p-4 border-t border-[#181816]/10 bg-[#FAF8F5] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#737373]">
                  Sesión de edición activa
                </span>
                <span className="text-[#181816]/10">|</span>
                {/* Discreet and hidden trigger for technical params, accessible only to authenticated editors */}
                <button
                  type="button"
                  onClick={() => setShowHiddenConfig(!showHiddenConfig)}
                  className="text-[10px] text-[#737373]/50 hover:text-[#C85A32] transition-colors cursor-pointer flex items-center gap-1 font-mono tracking-wide"
                  title="Parámetros técnicos del sistema"
                >
                  [• {showHiddenConfig ? 'Cerrar Ajustes Técnicos' : 'Parámetros del Sistema'}]
                </button>
              </div>

              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setPasswordInput('');
                  setShowHiddenConfig(false);
                  onClose();
                }}
                className="text-xs uppercase font-bold tracking-wider text-[#9E2A2B] hover:underline cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Internal Modal for Editing Items */}
      {editingItemType && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] rounded-xl max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto border border-[#181816]/20 shadow-2xl">
            {editingItemType === 'resena' && (
              <form onSubmit={handleSaveResena} className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#181816]/10">
                  <h3 className="font-serif-title text-2xl text-[#181816]">
                    {editingIndex >= 0 ? 'Editar Reseña' : 'Nueva Reseña'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingItemType(null)}
                    className="p-1 text-[#737373] hover:text-[#C85A32]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                      Nombre del Restaurante / Local
                    </label>
                    <input
                      type="text"
                      required
                      value={resenaForm.titulo || ''}
                      onChange={(e) => setResenaForm({ ...resenaForm, titulo: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                      placeholder="Ej: Don Julio"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C85A32]" />
                        Fecha Visita
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setResenaForm({ ...resenaForm, fecha: today });
                        }}
                        className="text-[10px] text-[#C85A32] hover:underline font-bold cursor-pointer"
                        title="Fijar a hoy"
                      >
                        Hoy
                      </button>
                    </div>
                    <input
                      type="date"
                      value={resenaForm.fecha || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setResenaForm({ ...resenaForm, fecha: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-[#181816]/20 rounded text-xs font-bold text-[#181816] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                    Dirección (para ubicación en Google Maps)
                  </label>
                  <input
                    type="text"
                    value={resenaForm.ubicacion || ''}
                    onChange={(e) => setResenaForm({ ...resenaForm, ubicacion: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                    placeholder="Ej: Guatemala 4699, Palermo, Buenos Aires"
                  />
                </div>

                <RichTextEditor
                  label="Texto de la Reseña"
                  value={resenaForm.resena || ''}
                  onChange={(val) => setResenaForm({ ...resenaForm, resena: val })}
                  placeholder="Escribe tus impresiones del lugar o pega directamente desde Word (se respetarán negritas, cursivas y viñetas)..."
                  minHeight="140px"
                />

                {/* Calificaciones con entrada numérica precisa y opción de Omitir / No probado */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200 pb-2">
                    <div>
                      <label className="block text-xs uppercase font-bold tracking-wider text-[#181816]">
                        Puntuación por Categoría (1.0 a 5.0)
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Escribí el número exacto o usá el slider. Podés omitir los ítems que no probaron.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full text-xs font-bold text-amber-900">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>Promedio: {calculateAverageRating(resenaForm.calificaciones)} / 5</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(['atencion', 'comida', 'bebida', 'postre', 'precio', 'ambiente'] as const).map((cat) => {
                      const currentVal = resenaForm.calificaciones?.[cat];
                      const isOmitted = currentVal === null || currentVal === undefined || currentVal <= 0;

                      return (
                        <div
                          key={cat}
                          className={`p-3 rounded-lg border transition-all ${
                            isOmitted
                              ? 'bg-stone-100/70 border-dashed border-stone-300'
                              : 'bg-white border-stone-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="capitalize font-bold text-xs text-[#181816]">{cat}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentCals = resenaForm.calificaciones || {};
                                if (isOmitted) {
                                  // Habilitar con valor por defecto
                                  setResenaForm({
                                    ...resenaForm,
                                    calificaciones: {
                                      ...currentCals,
                                      [cat]: 4.0
                                    }
                                  });
                                } else {
                                  // Omitir (null)
                                  setResenaForm({
                                    ...resenaForm,
                                    calificaciones: {
                                      ...currentCals,
                                      [cat]: null
                                    }
                                  });
                                }
                              }}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                                isOmitted
                                  ? 'text-amber-800 bg-amber-100/70 hover:bg-amber-200'
                                  : 'text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200'
                              }`}
                            >
                              {isOmitted ? '+ Puntuar' : 'Omitir'}
                            </button>
                          </div>

                          {isOmitted ? (
                            <div className="py-2 text-center text-xs text-stone-400 italic">
                              No probado / Omitido
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  step="0.1"
                                  value={currentVal || 4}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setResenaForm({
                                      ...resenaForm,
                                      calificaciones: {
                                        ...(resenaForm.calificaciones || {}),
                                        [cat]: val
                                      }
                                    });
                                  }}
                                  className="w-full accent-[#C85A32] cursor-pointer"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  max="5"
                                  step="0.1"
                                  value={currentVal || 4}
                                  onChange={(e) => {
                                    const num = parseFloat(e.target.value);
                                    if (!isNaN(num)) {
                                      const clamped = Math.min(5, Math.max(1, Math.round(num * 10) / 10));
                                      setResenaForm({
                                        ...resenaForm,
                                        calificaciones: {
                                          ...(resenaForm.calificaciones || {}),
                                          [cat]: clamped
                                        }
                                      });
                                    }
                                  }}
                                  className="w-14 px-1.5 py-1 text-right text-xs font-bold bg-white border border-stone-300 rounded focus:border-[#C85A32] focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Switch Destacado del Mes */}
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <label htmlFor="destacado-switch" className="text-xs uppercase font-extrabold tracking-wider text-amber-900 cursor-pointer">
                        Destacado del Mes · Recomendación del Autor
                      </label>
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-tight">
                      Muestra esta reseña con insignia dorada en la tarjeta, en la ficha y en la portada principal.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      id="destacado-switch"
                      type="checkbox"
                      checked={!!resenaForm.destacadoDelMes}
                      onChange={(e) => setResenaForm({ ...resenaForm, destacadoDelMes: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Price level */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                    Nivel de Precio
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setResenaForm({ ...resenaForm, precio: lvl })}
                        className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${
                          (resenaForm.precio || 3) === lvl
                            ? 'bg-[#C85A32] text-white border-[#C85A32]'
                            : 'bg-white text-[#181816] border-[#181816]/20 hover:border-[#C85A32]'
                        }`}
                      >
                        {'$'.repeat(lvl)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main cover photo upload */}
                <ImageUploadField
                  label="Foto de Portada Principal"
                  value={resenaForm.fotaPortada}
                  onChange={(url) => setResenaForm({ ...resenaForm, fotaPortada: url })}
                  helpText="Sube la foto principal desde tu computadora o celular (JPG, PNG, WEBP, etc.)."
                />

                {/* Custom dynamic tags */}
                <TagsInput
                  label="Etiquetas / Tags Personalizados"
                  tags={resenaForm.etiquetas || []}
                  onChange={(tags) => setResenaForm({ ...resenaForm, etiquetas: tags })}
                  placeholder="Escribe un tag y presiona Enter o Agregar (ej: Pastas Caseras, Terraza)..."
                  suggestions={['Parrilla', 'Pastas', 'Bodegón', 'Cafetería', 'Vinos', 'Terraza', 'Romántico', 'Brunch', 'Carnes', 'Cava']}
                />

                {/* Additional gallery photos with captions */}
                <GalleryManager
                  label="Galería de Fotos Adicionales (hasta 15 fotos con pie de foto explicativo)"
                  fotos={resenaForm.galeria || []}
                  onChange={(galeria) => setResenaForm({ ...resenaForm, galeria })}
                  maxPhotos={15}
                />

                {/* Plato Insignia (Qué pedir sí o sí) */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#C85A32] mb-1">
                    ★ Plato Insignia (Qué pedir sí o sí)
                  </label>
                  <input
                    type="text"
                    value={resenaForm.platoInsignia || ''}
                    onChange={(e) => setResenaForm({ ...resenaForm, platoInsignia: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                    placeholder="Ej: Milanesa de bife de chorizo y Tomates Reliquia"
                  />
                </div>

                {/* Ocasiones recomendadas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase font-bold tracking-wider text-[#181816]">
                      Ocasiones Recomendadas (Mood)
                    </label>
                    <span className="text-[11px] text-[#737373]">
                      {(resenaForm.ocasion || []).length} seleccionadas
                    </span>
                  </div>

                  {/* Chips de Ocasiones Predefinidas */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_OCASIONES.map((oc) => {
                      const isSelected = (resenaForm.ocasion || []).includes(oc);
                      return (
                        <button
                          key={oc}
                          type="button"
                          onClick={() => {
                            const current = resenaForm.ocasion || [];
                            const next = isSelected ? current.filter((x) => x !== oc) : [...current, oc];
                            setResenaForm({ ...resenaForm, ocasion: next });
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#C85A32] text-white border border-[#C85A32] shadow-2xs'
                              : 'bg-white text-[#737373] border border-[#181816]/20 hover:border-[#C85A32]'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {oc}
                        </button>
                      );
                    })}

                    {/* Chips de Ocasiones Personalizadas adicionales */}
                    {(resenaForm.ocasion || [])
                      .filter((oc) => !PRESET_OCASIONES.includes(oc))
                      .map((oc) => (
                        <span
                          key={oc}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#367643] text-white border border-[#367643] shadow-2xs"
                        >
                          <span>✓ {oc}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = (resenaForm.ocasion || []).filter((x) => x !== oc);
                              setResenaForm({ ...resenaForm, ocasion: next });
                            }}
                            className="hover:text-red-200 cursor-pointer ml-0.5"
                            title="Quitar ocasión"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>

                  {/* Input para Ocasión Personalizada Libre */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customOcasionText}
                      onChange={(e) => setCustomOcasionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = customOcasionText.trim();
                          if (val && !(resenaForm.ocasion || []).includes(val)) {
                            setResenaForm({ ...resenaForm, ocasion: [...(resenaForm.ocasion || []), val] });
                            setCustomOcasionText('');
                          }
                        }
                      }}
                      placeholder="Escribir otra ocasión personalizada (ej: After Office, Aniversario)..."
                      className="flex-1 px-3 py-1.5 bg-white border border-[#181816]/20 rounded text-xs text-[#181816] focus:outline-none focus:border-[#C85A32]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customOcasionText.trim();
                        if (val && !(resenaForm.ocasion || []).includes(val)) {
                          setResenaForm({ ...resenaForm, ocasion: [...(resenaForm.ocasion || []), val] });
                          setCustomOcasionText('');
                        }
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 text-[#C85A32] border border-[#C85A32] rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#181816]/10">
                  <button
                    type="button"
                    onClick={() => setEditingItemType(null)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#737373] border border-[#181816]/15 rounded hover:bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#C85A32] hover:bg-[#a93a18] rounded transition-colors shadow-sm"
                  >
                    Guardar Reseña
                  </button>
                </div>
              </form>
            )}

            {editingItemType === 'receta' && (
              <form onSubmit={handleSaveReceta} className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#181816]/10">
                  <h3 className="font-serif-title text-2xl text-[#181816]">
                    {editingIndex >= 0 ? 'Editar Receta' : 'Nueva Receta'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingItemType(null)}
                    className="p-1 text-[#737373] hover:text-[#C85A32]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                    Título del Plato
                  </label>
                  <input
                    type="text"
                    required
                    value={recetaForm.titulo || ''}
                    onChange={(e) => setRecetaForm({ ...recetaForm, titulo: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                    placeholder="Ej: Pasta Cacio e Pepe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                      Tiempo estimado
                    </label>
                    <input
                      type="text"
                      value={recetaForm.tiempo || ''}
                      onChange={(e) => setRecetaForm({ ...recetaForm, tiempo: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                      placeholder="Ej: 25 min"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                      Porciones
                    </label>
                    <input
                      type="text"
                      value={recetaForm.porciones || ''}
                      onChange={(e) => setRecetaForm({ ...recetaForm, porciones: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                      placeholder="Ej: 2 personas"
                    />
                  </div>
                </div>

                <RichTextEditor
                  label="Descripción / Preparación e Ingredientes"
                  value={recetaForm.descripcion || ''}
                  onChange={(val) => setRecetaForm({ ...recetaForm, descripcion: val })}
                  placeholder="Instrucciones, ingredientes (ej: 200 g harina, 2 huevos), notas de cocción o pega desde Word..."
                  minHeight="160px"
                />

                {/* Main cover photo upload */}
                <ImageUploadField
                  label="Foto de Portada Principal"
                  value={recetaForm.fotaPortada}
                  onChange={(url) => setRecetaForm({ ...recetaForm, fotaPortada: url })}
                  helpText="Sube la foto del plato terminado desde tu computadora o celular."
                />

                {/* Custom dynamic tags for recipe */}
                <TagsInput
                  label="Etiquetas / Tags de la Receta"
                  tags={recetaForm.etiquetas || []}
                  onChange={(tags) => setRecetaForm({ ...recetaForm, etiquetas: tags })}
                  placeholder="Escribe un tag y presiona Enter (ej. Fácil, Italiana, Postre)..."
                  suggestions={['Pastas', 'Panadería', 'Salsas', 'Postres', 'Fácil', 'Tradicional', 'Rápida']}
                />

                {/* Additional gallery photos with captions */}
                <GalleryManager
                  label="Galería del Paso a Paso (hasta 15 fotos con pie de foto)"
                  fotos={recetaForm.galeria || []}
                  onChange={(galeria) => setRecetaForm({ ...recetaForm, galeria })}
                  maxPhotos={15}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-[#181816]/10">
                  <button
                    type="button"
                    onClick={() => setEditingItemType(null)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#737373] border border-[#181816]/15 rounded hover:bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#181816] hover:bg-[#C85A32] rounded transition-colors shadow-sm"
                  >
                    Guardar Receta
                  </button>
                </div>
              </form>
            )}

            {editingItemType === 'pendiente' && (
              <form onSubmit={handleSavePendiente} className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#181816]/10">
                  <h3 className="font-serif-title text-2xl text-[#181816]">
                    {editingIndex >= 0 ? 'Editar Pendiente' : 'Nuevo Pendiente'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingItemType(null)}
                    className="p-1 text-[#737373] hover:text-[#C85A32]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                    Nombre del Local
                  </label>
                  <input
                    type="text"
                    required
                    value={pendienteForm.nombre || ''}
                    onChange={(e) => setPendienteForm({ ...pendienteForm, nombre: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                    placeholder="Ej: Corte Comedor"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#181816] mb-1">
                    Dirección (para ubicar en el mapa)
                  </label>
                  <input
                    type="text"
                    value={pendienteForm.direccion || ''}
                    onChange={(e) => setPendienteForm({ ...pendienteForm, direccion: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#181816]/20 rounded text-sm text-[#181816] focus:outline-none focus:border-[#C85A32]"
                    placeholder="Ej: Olazábal 1391, Belgrano, Buenos Aires"
                  />
                </div>

                <RichTextEditor
                  label="Notas / Recomendación del Lugar"
                  value={pendienteForm.descripcion || ''}
                  onChange={(val) => setPendienteForm({ ...pendienteForm, descripcion: val })}
                  placeholder="Quién lo recomendó, platos a probar o pega directamente desde Word..."
                  minHeight="120px"
                />

                {/* Main cover photo upload for bookmark */}
                <ImageUploadField
                  label="Foto Principal del Lugar (Opcional)"
                  value={pendienteForm.fotaPortada}
                  onChange={(url) => setPendienteForm({ ...pendienteForm, fotaPortada: url })}
                  helpText="Sube una foto del frente o plato recomendado desde tu computadora o celular."
                />

                {/* Additional gallery photos with captions for bookmark */}
                <GalleryManager
                  label="Galería de Fotos del Lugar (hasta 15 fotos con pie de foto)"
                  fotos={pendienteForm.galeria || []}
                  onChange={(galeria) => setPendienteForm({ ...pendienteForm, galeria })}
                  maxPhotos={15}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-[#181816]/10">
                  <button
                    type="button"
                    onClick={() => setEditingItemType(null)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#737373] border border-[#181816]/15 rounded hover:bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#556B2F] hover:bg-[#3d4d22] rounded transition-colors shadow-sm"
                  >
                    Guardar Pendiente
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
