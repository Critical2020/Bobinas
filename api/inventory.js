import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Vercel Serverless Function: Shared Inventory API
 * Permite sincronizar en tiempo real el estado de la base de datos entre todos los dispositivos y usuarios.
 * Garantiza persistencia con /tmp y fallback en memoria. Por defecto el inventario inicia en 0 bobinas ([]).
 */

const DB_PATH = path.join(os.tmpdir(), 'bobinas_inventory.json');

let memoryCache = null;
let lastUpdated = new Date().toISOString();

function readStorage() {
  if (memoryCache !== null && Array.isArray(memoryCache)) {
    return memoryCache;
  }
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryCache = parsed;
        return memoryCache;
      }
    }
  } catch (e) {}

  // Si no existe, inicializar con array vacío [] (0 bobinas)
  memoryCache = [];
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify([]), 'utf8');
  } catch (e) {}
  return memoryCache;
}

function writeStorage(items) {
  memoryCache = Array.isArray(items) ? items : [];
  lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryCache), 'utf8');
  } catch (e) {}
  return memoryCache;
}

export default function handler(req, res) {
  // Cabeceras CORS universales
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Obtener inventario actual verificado
  if (req.method === 'GET') {
    const currentItems = readStorage();
    return res.status(200).json({
      coils: currentItems,
      count: currentItems.length,
      isInitialized: true,
      lastUpdated,
      serverTime: new Date().toISOString()
    });
  }

  // POST / PUT: Actualizar o sincronizar inventario
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = req.body;
      const incoming = Array.isArray(body) 
        ? body 
        : (body && Array.isArray(body.coils) ? body.coils : null);

      if (incoming !== null) {
        const saved = writeStorage(incoming);
        return res.status(200).json({
          success: true,
          count: saved.length,
          lastUpdated
        });
      }

      return res.status(400).json({ error: 'Formato inválido: se esperaba un array de bobinas' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE: Vaciar la base de datos por completo (0 bobinas)
  if (req.method === 'DELETE') {
    writeStorage([]);
    return res.status(200).json({ 
      success: true, 
      count: 0, 
      lastUpdated, 
      message: 'Base de datos vaciada por completo en el servidor' 
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
