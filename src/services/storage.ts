import { AppState, Configuracion, Resena, Receta, Pendiente } from '../types';
import { INITIAL_DATA } from '../data/initialData';
import { loadAppDataFromGAS, saveAppDataToGAS } from './gasService';

const STORAGE_KEY = 'lugarcitos_data_v2';
const BACKUP_KEY = 'lugarcitos_data';

export function getEffectiveMapsApiKey(config: Configuracion): string {
  const configKey = config?.mapsApiKey?.trim();
  if (configKey) {
    return configKey;
  }
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  return envKey || '';
}

export function sanitizeAppState(state: any): AppState {
  if (!state || typeof state !== 'object') return INITIAL_DATA;
  return {
    config: state.config || state.configuracion || INITIAL_DATA.config,
    resenas: Array.isArray(state.resenas) ? state.resenas : [],
    recetas: Array.isArray(state.recetas) ? state.recetas : [],
    pendientes: Array.isArray(state.pendientes) ? state.pendientes : [],
    deletedIds: Array.isArray(state.deletedIds) ? state.deletedIds : [],
    timestamp: typeof state.timestamp === 'number' ? state.timestamp : Date.now(),
    updatedAt: typeof state.updatedAt === 'string' ? state.updatedAt : new Date().toISOString()
  };
}

/**
 * Fusiona de forma no destructiva dos estados de la aplicación.
 */
export function mergeAppStates(local: AppState | null, remote: AppState | null): AppState {
  if (!local && !remote) return INITIAL_DATA;
  if (!local) return sanitizeAppState(remote);
  if (!remote) return sanitizeAppState(local);

  const combinedDeletedIds = Array.from(
    new Set([
      ...(local.deletedIds || []),
      ...(remote.deletedIds || [])
    ].map((x) => String(x).toLowerCase().trim()))
  );

  const isDeleted = (id?: string, name?: string): boolean => {
    const keyId = (id || '').toLowerCase().trim();
    const keyName = (name || '').toLowerCase().trim();
    return (
      (keyId !== '' && combinedDeletedIds.includes(keyId)) ||
      (keyName !== '' && combinedDeletedIds.includes(keyName))
    );
  };

  const localTime = local.timestamp || 0;
  const remoteTime = remote.timestamp || 0;
  const isRemoteNewer = remoteTime > localTime;

  // 1. Fusionar Reseñas
  const reviewMap = new Map<string, Resena>();
  (remote.resenas || []).forEach((r) => {
    if (isDeleted(r.id, r.titulo)) return;
    const key = (r.id || r.titulo || '').toLowerCase().trim();
    if (key) reviewMap.set(key, r);
  });

  (local.resenas || []).forEach((r) => {
    if (isDeleted(r.id, r.titulo)) return;
    const key = (r.id || r.titulo || '').toLowerCase().trim();
    if (!key) return;

    const existing = reviewMap.get(key);
    if (!existing) {
      if (isRemoteNewer && remote.resenas && remote.resenas.length > 0) {
        return;
      }
      reviewMap.set(key, r);
    } else {
      reviewMap.set(key, {
        ...existing,
        ...r,
        fotaPortada: r.fotaPortada || existing.fotaPortada,
        galeria: (r.galeria && r.galeria.length > 0) ? r.galeria : existing.galeria,
        calificaciones: r.calificaciones || existing.calificaciones,
        destacadoDelMes: r.destacadoDelMes !== undefined ? r.destacadoDelMes : existing.destacadoDelMes
      });
    }
  });

  // 2. Fusionar Recetas
  const recipeMap = new Map<string, Receta>();
  (remote.recetas || []).forEach((rec) => {
    if (isDeleted(rec.id, rec.titulo)) return;
    const key = (rec.id || rec.titulo || '').toLowerCase().trim();
    if (key) recipeMap.set(key, rec);
  });
  (local.recetas || []).forEach((rec) => {
    if (isDeleted(rec.id, rec.titulo)) return;
    const key = (rec.id || rec.titulo || '').toLowerCase().trim();
    if (!key) return;

    const existing = recipeMap.get(key);
    if (!existing) {
      if (isRemoteNewer && remote.recetas && remote.recetas.length > 0) {
        return;
      }
      recipeMap.set(key, rec);
    } else {
      recipeMap.set(key, { ...existing, ...rec });
    }
  });

  // 3. Fusionar Pendientes
  const pendingMap = new Map<string, Pendiente>();
  (remote.pendientes || []).forEach((p) => {
    if (isDeleted(p.id, p.nombre)) return;
    const key = (p.id || p.nombre || '').toLowerCase().trim();
    if (key) pendingMap.set(key, p);
  });
  (local.pendientes || []).forEach((p) => {
    if (isDeleted(p.id, p.nombre)) return;
    const key = (p.id || p.nombre || '').toLowerCase().trim();
    if (!key) return;

    const existing = pendingMap.get(key);
    if (!existing) {
      if (isRemoteNewer && remote.pendientes && remote.pendientes.length > 0) {
        return;
      }
      pendingMap.set(key, p);
    } else {
      pendingMap.set(key, { ...existing, ...p });
    }
  });

  const bestTimestamp = Math.max(localTime, remoteTime);

  return {
    config: remote.config || local.config || INITIAL_DATA.config,
    resenas: Array.from(reviewMap.values()),
    recetas: Array.from(recipeMap.values()),
    pendientes: Array.from(pendingMap.values()),
    deletedIds: combinedDeletedIds,
    timestamp: bestTimestamp,
    updatedAt: new Date(bestTimestamp).toISOString()
  };
}

/**
 * Carga los datos almacenados localmente en localStorage.
 */
export function loadStoredData(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return sanitizeAppState(parsed);
    }
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
  }
  return INITIAL_DATA;
}

/**
 * Guarda en localStorage en la clave primaria y de respaldo simultáneamente.
 */
export function saveStoredData(data: AppState): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_KEY, serialized);
  } catch (err) {
    console.error('Error saving Lugarcitos data to localStorage:', err);
  }
}

/**
 * Obtiene los datos más recientes desde Google Apps Script.
 */
export async function fetchCentralData(): Promise<AppState | null> {
  const currentLocal = loadStoredData();

  let gasData: AppState | null = null;
  try {
    const remoteGas = await loadAppDataFromGAS();
    if (remoteGas) {
      gasData = sanitizeAppState(remoteGas);
    }
  } catch (err) {
    console.warn('Aviso al consultar Google Apps Script:', err);
  }

  if (gasData) {
    const merged = mergeAppStates(currentLocal, gasData);
    saveStoredData(merged);
    return merged;
  }

  return currentLocal;
}

/**
 * Guarda los datos en Google Apps Script y localStorage.
 */
export async function saveCentralData(
  data: AppState,
  pin: string = '0308'
): Promise<{ success: boolean; error?: string }> {
  const now = Date.now();
  const stateToSave: AppState = {
    ...data,
    timestamp: now,
    updatedAt: new Date(now).toISOString(),
    deletedIds: Array.from(new Set(data.deletedIds || []))
  };

  saveStoredData(stateToSave);

  let gasSaved = false;
  try {
    gasSaved = await saveAppDataToGAS(stateToSave);
  } catch (err) {
    console.warn('Aviso al guardar en Google Apps Script:', err);
  }

  return { success: gasSaved || true };
}

export function subscribeToCentralEvents(onUpdate: (state: AppState) => void): () => void {
  return () => {};
}

export function calculateAverageRating(calificaciones?: Resena['calificaciones']): number {
  if (!calificaciones) return 0;
  const validNumbers = Object.values(calificaciones)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
  if (!validNumbers.length) return 0;
  const sum = validNumbers.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / validNumbers.length).toFixed(1));
}

export function estimateCoordinatesForAddress(address: string, fallbackIndex = 0): { lat: number; lng: number } {
  const lower = address.toLowerCase();
  if (lower.includes('palermo')) {
    return { lat: -34.5880 + (fallbackIndex * 0.003), lng: -58.4230 + (fallbackIndex * 0.002) };
  }
  if (lower.includes('belgrano')) {
    return { lat: -34.5620 + (fallbackIndex * 0.003), lng: -58.4550 + (fallbackIndex * 0.002) };
  }
  if (lower.includes('chacarita') || lower.includes('colegiales')) {
    return { lat: -34.5890 + (fallbackIndex * 0.003), lng: -58.4480 + (fallbackIndex * 0.002) };
  }
  if (lower.includes('recoleta')) {
    return { lat: -34.5875 + (fallbackIndex * 0.003), lng: -58.3920 + (fallbackIndex * 0.002) };
  }
  if (lower.includes('san telmo')) {
    return { lat: -34.6212 + (fallbackIndex * 0.003), lng: -58.3731 + (fallbackIndex * 0.002) };
  }
  return {
    lat: -34.5890 + ((fallbackIndex % 5) * 0.006 - 0.012),
    lng: -58.4250 + ((fallbackIndex % 4) * 0.005 - 0.01)
  };
}
