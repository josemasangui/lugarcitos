/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload?key=23d2d3dd60ce56e488ed63a40c36a99c';

/**
 * Redimensiona y comprime una imagen en el cliente para carga ultrarrápida.
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeOptions = {}
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target?.result as string);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Sube una imagen a ImgBB utilizando FormData y retorna la URL pública (data.data.display_url).
 */
export async function uploadImageToCloud(file: File): Promise<string> {
  // 1. Optimizar imagen en el navegador
  const optimizedDataUrl = await optimizeImageFile(file);

  // Convertir dataURL a Blob
  const res = await fetch(optimizedDataUrl);
  const blob = await res.blob();

  // 2. Enviar a ImgBB vía FormData con el campo 'image'
  const formData = new FormData();
  formData.append('image', blob, file.name || 'image.jpg');

  const uploadRes = await fetch(IMGBB_API_URL, {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    throw new Error(`Error al subir la imagen a ImgBB: ${uploadRes.statusText}`);
  }

  const json = await uploadRes.json();
  if (json && json.success && json.data && json.data.display_url) {
    return json.data.display_url;
  }

  throw new Error('Respuesta inválida del servidor de imágenes ImgBB.');
}
