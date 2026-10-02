/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState } from '../types';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw32Iq3EmVB8cCZ4NlQMS4Ym7DI4lvKWmeqVq0CEcMcdCYE-vUcv4aQ9tagODNPDjlMIw/exec';

/**
 * Carga el estado de la aplicación desde Google Apps Script mediante GET y parseo JSON.
 */
export async function loadAppDataFromGAS(): Promise<AppState | null> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as AppState;
  } catch (err) {
    console.warn('No se pudo cargar desde Google Apps Script, usando localStorage:', err);
    return null;
  }
}

/**
 * Guarda el estado completo de la aplicación en Google Apps Script mediante POST
 * utilizando text/plain;charset=utf-8 para evitar CORS preflight y verificando la respuesta JSON.
 */
export async function saveAppDataToGAS(state: AppState): Promise<boolean> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(state),
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return !!json;
  } catch (err) {
    console.error('Error al guardar en Google Apps Script:', err);
    return false;
  }
}
