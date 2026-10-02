import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DATA } from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'lugarcitos-db.json');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

// Ensure database and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Seed initial data if file does not exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve uploaded images statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // API Route: Upload image file directly
  app.post('/api/upload', (req, res) => {
    try {
      const { dataUrl, filename, pin } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'No se envió la imagen' });
      }

      // Security validation with PIN
      if (pin && pin !== '0308') {
        return res.status(401).json({ success: false, error: 'Código de acceso no autorizado' });
      }

      const match = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ success: false, error: 'Formato de imagen inválido' });
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = 'webp';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('svg')) ext = 'svg';

      const safeRandom = Math.random().toString(36).substring(2, 9);
      const safeName = `img_${Date.now()}_${safeRandom}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${safeName}`;
      return res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error('Error al subir imagen al servidor:', err);
      return res.status(500).json({ success: false, error: 'Error procesando la imagen en el servidor' });
    }
  });

  // Clients connected to Server-Sent Events for instant multi-device syncing
  const sseClients = new Set<express.Response>();

  // SSE Route: Real-time updates pushed to all connected browsers and devices
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Keep connection alive with heartbeat every 25s
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  const broadcastStateUpdate = (state: any) => {
    const payload = `event: state_updated\ndata: ${JSON.stringify(state)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  // Helper to read and sanitize existing file
  const readCurrentDb = () => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Error reading current database file:', e);
    }
    return INITIAL_DATA;
  };

  // API Route: Get latest synchronized state
  app.get('/api/data', (_req, res) => {
    try {
      const data = readCurrentDb();
      return res.json({ success: true, data });
    } catch (err) {
      console.error('Error al leer base de datos central:', err);
      return res.status(500).json({ success: false, error: 'Error al leer la base de datos' });
    }
  });

  // API Route: Save state from editor panel
  app.put('/api/data', (req, res) => {
    try {
      const { state, pin } = req.body;
      if (!state) {
        return res.status(400).json({ success: false, error: 'Faltan datos de la aplicación' });
      }

      // Security validation with PIN 0308
      if (pin && pin !== '0308') {
        return res.status(401).json({ success: false, error: 'Código de acceso no autorizado' });
      }

      const existingDb = readCurrentDb();

      // Combined deleted IDs / tombstones so deletions are NEVER resurrected
      const combinedDeletedIds = Array.from(
        new Set([
          ...(existingDb.deletedIds || []),
          ...(state.deletedIds || []),
        ].map((x: any) => String(x).toLowerCase().trim()))
      );

      const isDeleted = (id?: string, name?: string): boolean => {
        const keyId = (id || '').toLowerCase().trim();
        const keyName = (name || '').toLowerCase().trim();
        return (
          (keyId !== '' && combinedDeletedIds.includes(keyId)) ||
          (keyName !== '' && combinedDeletedIds.includes(keyName))
        );
      };

      // Filter out deleted items explicitly
      const sanitizedResenas = (state.resenas || []).filter(
        (r: any) => !isDeleted(r.id, r.titulo)
      );
      const sanitizedRecetas = (state.recetas || []).filter(
        (r: any) => !isDeleted(r.id, r.titulo)
      );
      const sanitizedPendientes = (state.pendientes || []).filter(
        (p: any) => !isDeleted(p.id, p.nombre)
      );

      const now = Date.now();
      const updatedState = {
        ...state,
        resenas: sanitizedResenas,
        recetas: sanitizedRecetas,
        pendientes: sanitizedPendientes,
        deletedIds: combinedDeletedIds,
        timestamp: now,
        updatedAt: new Date(now).toISOString(),
      };

      // Atomic write to prevent file corruption
      const tempFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(updatedState, null, 2), 'utf-8');
      fs.renameSync(tempFile, DATA_FILE);

      // Broadcast immediately to all connected browsers and devices
      broadcastStateUpdate(updatedState);

      return res.json({ success: true, timestamp: now, state: updatedState });
    } catch (err) {
      console.error('Error al guardar en base de datos central:', err);
      return res.status(500).json({ success: false, error: 'Error al persistir cambios' });
    }
  });

  // Server health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distExists = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));

  if (isProd && distExists) {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`> Servidor central Lugarcitos activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err);
});
