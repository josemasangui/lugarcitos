# Plan: Actualización de URL de Google Apps Script y Build para Netlify

## 1. Objetivos
1. Actualizar `src/services/gasService.ts` con la nueva URL de Google Apps Script proporcionada por el usuario.
2. Actualizar también el artefacto `lugarcitos-standalone.html` con la nueva URL.
3. Comprobar la compilación y generar el bundle listo para Netlify (`npm run build`).

---

## 2. Pasos de Implementación

### A. Actualizar `src/services/gasService.ts`
- Cambiar `GAS_URL` a `https://script.google.com/macros/s/AKfycbw32Iq3EmVB8cCZ4NlQMS4Ym7DI4lvKWmeqVq0CEcMcdCYE-vUcv4aQ9tagODNPDjlMIw/exec`.

### B. Actualizar `lugarcitos-standalone.html`
- Cambiar `GAS_URL` a la nueva URL en el script de React.

### C. Build de producción
- Ejecutar `npm run build` para verificar la salida en `dist/`.

---

## 3. Verificación
1. Compilación exitosa con `compile_applet`.
2. Build sin errores.
