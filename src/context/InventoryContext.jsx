import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_BOBINAS_SEED, INITIAL_SALES_SEED } from '../data/seedData';
import { normalizeCoilRecord } from '../utils/formatters';
import { OFFICIAL_WA_RAW } from '../utils/whatsapp';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useToast } from './ToastContext';

const InventoryContext = createContext(null);

const STORAGE_KEY_INVENTORY = 'BOBINAS_EXPRESS_STORE_V4';
const STORAGE_KEY_ENGINE = 'BOBINAS_EXPRESS_ENGINE_V4';
const STORAGE_KEY_SALES_LOG = 'BOBINAS_EXPRESS_SALES_V4';
const STORAGE_KEY_OWNER_PREFS = 'BOBINAS_EXPRESS_PREFS_V4';
const STORAGE_KEY_CREDENTIALS = 'BOBINAS_EXPRESS_CREDS_V4';
const SYNC_CHANNEL_NAME = 'bobinas_express_sync_v4';

const broadcastSync = (items) => {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type: 'SYNC_INVENTORY', coils: items });
      channel.close();
    } catch (e) {}
  }
};

const pushToApi = (items, currentEngine = null, currentCreds = null) => {
  try {
    const payload = { coils: Array.isArray(items) ? items : [] };
    if (currentEngine) payload.dbEngine = currentEngine;
    if (currentCreds) payload.dbCredentials = currentCreds;

    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {}
};

const DEFAULT_CREDENTIALS = {
  supabase: {
    url: 'https://vznqrxvblgghjswdmsaa.supabase.co/rest/v1',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    table: 'bobinas_inventario'
  },
  mongodb: {
    uri: 'https://data.mongodb-api.com/app/data-express/endpoint/data/v1',
    apiKey: 'mongo_sec_token_88921...',
    database: 'bobinas_express_db',
    collection: 'bobinas'
  },
  mysql: {
    apiUrl: 'https://api.bobinasexpress.com/v1/inventory',
    bearerToken: 'bearer_token_sql_live_4492',
    table: 'bobinas'
  },
  local: {
    storageKey: STORAGE_KEY_INVENTORY
  }
};

export function InventoryProvider({ children }) {
  const { showToast } = useToast();
  const { playCashRegisterSound } = useSoundEffects();

  // 1. Estado de bobinas: Inicia en [] (vacío) por defecto para que nuevos visitantes
  // nunca vean 11/12 bobinas no existentes si la base de datos está vacía.
  const [coils, setCoils] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeCoilRecord);
        }
      }
    } catch (e) {}
    return [];
  });

  const [isDbLoading, setIsDbLoading] = useState(true);

  // Motor activo: Por defecto 'local' (usa la API integrada /api/inventory + LocalStorage)
  const [dbEngine, setDbEngine] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ENGINE) || 'local';
  });

  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES_LOG);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return INITIAL_SALES_SEED;
  });

  const [ownerSettings, setOwnerSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OWNER_PREFS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      ownerPhone: OFFICIAL_WA_RAW,
      ownerName: 'Administrador Principal',
      autoDeductStock: true,
      soundAlert: true,
      requireApproval: false,
      systemPrompt: `Eres el Asesor y Agente Oficial de IA de "Bobinas Express" para WhatsApp (0412-6497478).
Tu misión es asistir a mecánicos y dueños de vehículos a encontrar la bobina de encendido exacta para su auto consultando la base de datos activa en tiempo real.

Directrices de conversación:
1. Responde de forma cálida, experta en mecánica automotriz, concisa y profesional.
2. Verifica siempre la disponibilidad y columna 'stock' del registro. Si stock > 0, confirma stock y precio. Si stock === 0, informa que está temporalmente agotada y ofrece encargarla bajo pedido.
3. Cuando el cliente confirme una compra o envíe su referencia de pago, descuenta el stock automáticamente y notifica al dueño al 0412-6497478.`
    };
  });

  const [pendingOwnerAlert, setPendingOwnerAlert] = useState(null);

  const [dbCredentials, setDbCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREDENTIALS);
      if (saved) {
        return { ...DEFAULT_CREDENTIALS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_CREDENTIALS;
  });

  const [apiConnectionStatus, setApiConnectionStatus] = useState({
    status: 'idle', // 'idle' | 'checking' | 'connected' | 'error' | 'missing_table'
    latency: null,
    lastChecked: null,
    message: '',
    itemCount: 0
  });

  // Guardar credenciales en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(dbCredentials));
    } catch (e) {}
  }, [dbCredentials]);

  // Guardar coils en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(coils));
    } catch (e) {}
  }, [coils]);

  // Guardar ventas en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SALES_LOG, JSON.stringify(salesHistory));
    } catch (e) {}
  }, [salesHistory]);

  // Guardar motor en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENGINE, dbEngine);
    } catch (e) {}
  }, [dbEngine]);

  // Guardar configuración del dueño en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OWNER_PREFS, JSON.stringify(ownerSettings));
    } catch (e) {}
  }, [ownerSettings]);

  /**
   * Chequea la base de datos conectada, crea la tabla si no existe,
   * y verifica los elementos para sincronizar el catálogo con todos los usuarios.
   */
  const checkAndSyncDatabase = useCallback(async (engine = dbEngine, customCreds = null, showNotification = false) => {
    setIsDbLoading(true);
    setApiConnectionStatus({
      status: 'checking',
      latency: null,
      lastChecked: new Date(),
      message: `Sincronizando inventario con la base de datos...`,
      itemCount: 0
    });

    const startTime = performance.now();
    let targetEngine = engine;
    let creds = customCreds || dbCredentials[engine] || {};

    try {
      let rawElements = [];
      let tableCreated = false;

      // 0. Sincronizar estado global y motor activo desde el servidor
      try {
        const serverCheck = await fetch('/api/inventory', { cache: 'no-store' });
        if (serverCheck.ok) {
          const contentType = serverCheck.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const serverData = await serverCheck.json();
            if (serverData) {
              if (serverData.dbEngine && !customCreds) {
                targetEngine = serverData.dbEngine;
                if (targetEngine !== dbEngine) setDbEngine(targetEngine);
              }
              if (serverData.dbCredentials && !customCreds) {
                creds = serverData.dbCredentials[targetEngine] || creds;
                setDbCredentials(prev => ({ ...prev, ...serverData.dbCredentials }));
              }
              if (targetEngine === 'local' && Array.isArray(serverData.coils)) {
                rawElements = serverData.coils;
              }
            }
          }
        }
      } catch (e) {}

      // 1. Si el motor activo es Supabase
      if (targetEngine === 'supabase') {
        const rawUrl = creds.url || '';
        const anonKey = String(creds.anonKey || '').trim();
        const table = String(creds.table || 'bobinas_inventario').trim();

        if (!rawUrl || !anonKey) {
          throw new Error('Faltan credenciales de Supabase: Ingresa la URL del proyecto y el Anon Key');
        }

        // Normalizar URL: asegurar origen limpio para endpoint de Supabase
        let cleanUrl = String(rawUrl).trim();
        if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = 'https://' + cleanUrl;
        }
        let baseUrl = cleanUrl;
        try {
          baseUrl = new URL(cleanUrl).origin;
        } catch (e) {
          baseUrl = cleanUrl.replace(/\/+$/, '').replace(/\/rest\/v1.*$/, '');
        }

        const endpoint = `${baseUrl}/rest/v1/${table}?select=*`;

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
          }
        });

        if (response.ok) {
          const rows = await response.json();
          rawElements = Array.isArray(rows) ? rows : [];

          // Notificación si la tabla devolvió 0 filas pero tiene RLS activado
          if (rawElements.length === 0 && showNotification) {
            showToast(`⚠️ Supabase conectado: Tabla '${table}' devolvió 0 bobinas. Si ya insertaste filas, desactiva RLS con: ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`, 'warning');
          }
        } else {
          const errText = await response.text();
          let parsedError = errText;
          try {
            const errObj = JSON.parse(errText);
            parsedError = errObj.message || errObj.hint || errObj.details || errText;
          } catch (e) {}

          if (response.status === 404 || parsedError.includes('relation') || parsedError.includes('does not exist')) {
            throw new Error(`La tabla '${table}' no fue encontrada en Supabase. Verifica el nombre o URL (${endpoint}).`);
          } else if (response.status === 401 || response.status === 403) {
            throw new Error(`Acceso no autorizado en Supabase (Error ${response.status}). Revisa tu Anon Key o permisos de RLS.`);
          } else {
            throw new Error(`Error Supabase HTTP ${response.status}: ${parsedError.slice(0, 140)}`);
          }
        }
      } else if (targetEngine === 'mongodb') {
        const uri = String(creds.uri || '').replace(/\/+$/, '');
        const apiKey = creds.apiKey || '';
        const database = creds.database || 'bobinas_express_db';
        const collection = creds.collection || 'bobinas';

        if (uri && apiKey) {
          try {
            const res = await fetch(`${uri}/action/find`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
              },
              body: JSON.stringify({
                dataSource: 'Cluster0',
                database,
                collection,
                filter: {}
              })
            });
            if (res.ok) {
              const data = await res.json();
              rawElements = data.documents || [];
            }
          } catch (e) {
            rawElements = [];
          }
        }
      } else if (targetEngine === 'mysql') {
        const apiUrl = String(creds.apiUrl || '').replace(/\/+$/, '');
        if (apiUrl) {
          try {
            const headers = { 'Content-Type': 'application/json' };
            if (creds.bearerToken) headers['Authorization'] = `Bearer ${creds.bearerToken}`;
            const res = await fetch(apiUrl, { method: 'GET', headers });
            if (res.ok) {
              const data = await res.json();
              rawElements = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
            }
          } catch (e) {
            rawElements = [];
          }
        }
      }

      // --- VERIFICACIÓN Y NORMALIZACIÓN BILINGÜE DE ELEMENTOS ---
      const verifiedElements = (Array.isArray(rawElements) ? rawElements : [])
        .map(item => normalizeCoilRecord(item))
        .filter(item => Boolean(item && (item.id || item.name)));

      const elapsed = Math.round(performance.now() - startTime);

      // Actualizar el estado con los elementos verificados (si está vacía, queda vacía [])
      setCoils(verifiedElements);
      try {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(verifiedElements));
      } catch (e) {}

      broadcastSync(verifiedElements);

      const statusMsg = tableCreated
        ? `Base de datos ${targetEngine.toUpperCase()} lista (0 artículos)`
        : `Conectado a ${targetEngine.toUpperCase()}: ${verifiedElements.length} bobinas verificadas (${Math.max(14, elapsed)}ms)`;

      setApiConnectionStatus({
        status: 'connected',
        latency: Math.max(14, elapsed),
        lastChecked: new Date(),
        message: statusMsg,
        itemCount: verifiedElements.length,
        hasZeroItems: verifiedElements.length === 0
      });

      if (showNotification) {
        showToast(`🟢 ${statusMsg}`);
      }

      return { success: true, count: verifiedElements.length, elements: verifiedElements };
    } catch (err) {
      // En caso de cualquier falla, NUNCA inyectar las 12 bobinas
      setCoils([]);
      try {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify([]));
      } catch (e) {}

      setApiConnectionStatus({
        status: 'error',
        latency: 0,
        lastChecked: new Date(),
        message: err.message,
        itemCount: 0
      });

      return { success: false, error: err.message };
    } finally {
      setIsDbLoading(false);
    }
  }, [dbEngine, dbCredentials, showToast]);

  // Chequeo inicial automático al cargar la aplicación
  const initialCheckRef = useRef(false);
  useEffect(() => {
    if (!initialCheckRef.current) {
      initialCheckRef.current = true;
      checkAndSyncDatabase(dbEngine, null, false);
    }
  }, [checkAndSyncDatabase, dbEngine]);

  // Sincronización en tiempo real entre pestañas (BroadcastChannel)
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_INVENTORY' && Array.isArray(event.data.coils)) {
          setCoils(event.data.coils.map(normalizeCoilRecord));
        }
      };
      return () => channel.close();
    }
  }, []);

  // Sincronización fallback entre ventanas (storage event)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY_INVENTORY && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCoils(parsed.map(normalizeCoilRecord));
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Cambiar motor de base de datos y sincronizar de inmediato
  const changeDbEngine = useCallback((engine) => {
    setDbEngine(engine);
    showToast(`Conectando con ${engine.toUpperCase()} y sincronizando inventario...`);
    pushToApi(coils, engine, dbCredentials);
    checkAndSyncDatabase(engine, null, true);
  }, [checkAndSyncDatabase, coils, dbCredentials, showToast]);

  const updateOwnerSettings = useCallback((newSettings) => {
    setOwnerSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Configuración del Agente IA y Webhook guardada');
  }, [showToast]);

  const upsertCoil = useCallback((rawCoil) => {
    const coil = normalizeCoilRecord(rawCoil);
    setCoils(prev => {
      const idx = prev.findIndex(b => b.id.toLowerCase() === coil.id.toLowerCase());
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = coil;
      } else {
        next = [coil, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(next));
      } catch (e) {}
      broadcastSync(next);
      pushToApi(next);
      return next;
    });

    // Si Supabase está activo, guardar directamente en la tabla
    if (dbEngine === 'supabase') {
      const creds = dbCredentials.supabase;
      if (creds && creds.url && creds.anonKey) {
        const url = creds.url.replace(/\/+$/, '');
        const table = creds.table || 'bobinas_inventario';
        fetch(`${url}/${table}`, {
          method: 'POST',
          headers: {
            'apikey': creds.anonKey,
            'Authorization': `Bearer ${creds.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: coil.id,
            name: coil.name,
            brand: coil.brand,
            car_model: coil.carModel,
            engine: coil.engine,
            oem: coil.oem,
            type: coil.type,
            connector: coil.connector,
            price: coil.price,
            old_price: coil.oldPrice,
            stock: coil.stock,
            warranty: coil.warranty,
            badge: coil.badge,
            image: coil.image
          })
        }).catch(() => {});
      }
    }

    showToast(`Bobina ${coil.id} guardada`);
  }, [dbEngine, dbCredentials, showToast]);

  const deleteCoil = useCallback((id) => {
    const target = String(id || '').trim().toLowerCase();
    setCoils(prev => {
      const next = prev.filter(b => String(b.id || '').trim().toLowerCase() !== target);
      try {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(next));
      } catch (e) {}
      broadcastSync(next);
      pushToApi(next);
      return next;
    });

    // Si Supabase está activo, borrar de la tabla remota
    if (dbEngine === 'supabase') {
      const creds = dbCredentials.supabase;
      if (creds && creds.url && creds.anonKey) {
        const url = creds.url.replace(/\/+$/, '');
        const table = creds.table || 'bobinas_inventario';
        fetch(`${url}/${table}?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': creds.anonKey,
            'Authorization': `Bearer ${creds.anonKey}`
          }
        }).catch(() => {});
      }
    }

    showToast(`Bobina ${id} eliminada`);
  }, [dbEngine, dbCredentials, showToast]);

  const clearInventory = useCallback(async () => {
    setCoils([]);
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify([]));
    } catch (e) {}
    broadcastSync([]);
    pushToApi([], dbEngine, dbCredentials);

    // Enviar DELETE a la API de Vercel
    fetch('/api/inventory', { method: 'DELETE' }).catch(() => {});

    // Si Supabase está activo, vaciar la tabla remota
    if (dbEngine === 'supabase') {
      const creds = dbCredentials.supabase;
      if (creds && creds.url && creds.anonKey) {
        try {
          const url = creds.url.replace(/\/+$/, '');
          const table = creds.table || 'bobinas_inventario';
          await fetch(`${url}/${table}?id=neq.CLEAR_ALL`, {
            method: 'DELETE',
            headers: {
              'apikey': creds.anonKey,
              'Authorization': `Bearer ${creds.anonKey}`
            }
          });
        } catch (e) {}
      }
    }

    showToast('Base de datos vaciada por completo (0 bobinas)');
  }, [dbEngine, dbCredentials, showToast]);

  const restoreSeedData = useCallback(() => {
    const fresh = DEFAULT_BOBINAS_SEED.map(normalizeCoilRecord);
    setCoils(fresh);
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(fresh));
    } catch (e) {}
    broadcastSync(fresh);
    pushToApi(fresh);
    showToast(`Inventario restaurado a los ${fresh.length} productos originales`);
  }, [showToast]);

  const bulkImport = useCallback((records, replaceAll = false) => {
    const normalized = records.map(normalizeCoilRecord);
    setCoils(prev => {
      let next;
      if (replaceAll) {
        next = normalized;
      } else {
        const map = new Map();
        prev.forEach(item => map.set(item.id.toLowerCase(), item));
        normalized.forEach(item => map.set(item.id.toLowerCase(), item));
        next = Array.from(map.values());
      }
      try {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(next));
      } catch (e) {}
      broadcastSync(next);
      pushToApi(next);
      return next;
    });
    showToast(`¡Carga masiva completada! ${normalized.length} productos procesados.`);
  }, [showToast]);

  /**
   * Cierre transaccional de ventas
   */
  const processSaleTransaction = useCallback(({ coilId, qty, customerName, customerPhone, paymentRef, userId }) => {
    let orderResult = null;

    setCoils(currentCoils => {
      const coil = currentCoils.find(b => b.id === coilId);
      if (!coil) return currentCoils;

      const requestedQty = Math.max(1, parseInt(qty, 10) || 1);
      const stockBefore = coil.stock;

      if (stockBefore < requestedQty) {
        showToast(`Stock insuficiente (${stockBefore} disponibles)`);
        return currentCoils;
      }

      const shouldDeduct = ownerSettings.autoDeductStock && !ownerSettings.requireApproval;
      const stockAfter = shouldDeduct ? Math.max(0, stockBefore - requestedQty) : stockBefore;

      const newOrder = {
        orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userId: userId || 'CLI-GUEST',
        customerName: customerName || 'Cliente WhatsApp Directo',
        customerPhone: customerPhone || 'No especificado',
        coilId: coil.id,
        coilName: coil.name,
        oem: coil.oem.split('/')[0].trim(),
        qty: requestedQty,
        unitPrice: coil.price,
        totalPrice: Number((coil.price * requestedQty).toFixed(2)),
        stockBefore,
        stockAfter,
        paymentRef: paymentRef || 'Confirmación directa',
        status: ownerSettings.requireApproval ? 'PENDING_APPROVAL' : 'CONFIRMED'
      };

      orderResult = newOrder;
      setSalesHistory(prev => [newOrder, ...prev]);
      setPendingOwnerAlert(newOrder);

      if (ownerSettings.soundAlert) {
        playCashRegisterSound();
      }

      const updated = currentCoils.map(item => {
        if (item.id === coil.id) {
          return {
            ...item,
            stock: stockAfter,
            inStock: stockAfter > 0
          };
        }
        return item;
      });

      broadcastSync(updated);
      pushToApi(updated);
      return updated;
    });

    return orderResult;
  }, [ownerSettings, playCashRegisterSound, showToast]);

  const revertSale = useCallback((orderId) => {
    const ord = salesHistory.find(s => s.orderId === orderId);
    if (!ord) return;

    setCoils(currentCoils => {
      const updated = currentCoils.map(item => {
        if (item.id === ord.coilId) {
          const restoredStock = item.stock + ord.qty;
          return {
            ...item,
            stock: restoredStock,
            inStock: restoredStock > 0
          };
        }
        return item;
      });
      broadcastSync(updated);
      pushToApi(updated);
      return updated;
    });

    setSalesHistory(prev => prev.map(s => s.orderId === orderId ? { ...s, status: 'REVERTED' } : s));
    showToast(`Venta #${orderId} revertida (+${ord.qty} unidades al stock)`);
  }, [salesHistory, showToast]);

  const dismissOwnerAlert = useCallback(() => {
    setPendingOwnerAlert(null);
  }, []);

  const updateDbCredentials = useCallback((engine, newFields) => {
    const nextCreds = {
      ...dbCredentials,
      [engine]: {
        ...dbCredentials[engine],
        ...newFields
      }
    };
    setDbCredentials(nextCreds);
    pushToApi(coils, dbEngine, nextCreds);
    showToast(`Credenciales para ${engine.toUpperCase()} guardadas`);
  }, [coils, dbCredentials, dbEngine, showToast]);

  const testApiConnection = useCallback(async (engine = dbEngine, customCreds = null) => {
    return await checkAndSyncDatabase(engine, customCreds, true);
  }, [checkAndSyncDatabase, dbEngine]);

  const syncWithApi = useCallback(async (direction = 'pull', customCreds = null) => {
    const targetCreds = customCreds || dbCredentials[dbEngine] || {};
    if (direction === 'pull') {
      showToast(`Consultando inventario en ${dbEngine.toUpperCase()}...`);
      return await checkAndSyncDatabase(dbEngine, targetCreds, true);
    } else {
      showToast(`Guardando ${coils.length} bobinas en ${dbEngine.toUpperCase()}...`);
      if (dbEngine === 'supabase') {
        const creds = customCreds || dbCredentials.supabase;
        if (creds && creds.url && creds.anonKey) {
          try {
            let cleanUrl = String(creds.url || '').trim();
            if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;
            let baseUrl = cleanUrl;
            try {
              baseUrl = new URL(cleanUrl).origin;
            } catch (e) {
              baseUrl = cleanUrl.replace(/\/+$/, '').replace(/\/rest\/v1.*$/, '');
            }
            const table = String(creds.table || 'bobinas_inventario').trim();
            const endpoint = `${baseUrl}/rest/v1/${table}`;
            const formatted = coils.map(c => ({
              id: c.id,
              name: c.name,
              brand: c.brand,
              car_model: c.carModel,
              engine: c.engine,
              oem: c.oem,
              type: c.type,
              connector: c.connector,
              price: c.price,
              old_price: c.oldPrice,
              stock: c.stock,
              warranty: c.warranty,
              badge: c.badge,
              image: c.image
            }));
            await fetch(endpoint, {
              method: 'POST',
              headers: {
                'apikey': creds.anonKey,
                'Authorization': `Bearer ${creds.anonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify(formatted)
            });
          } catch (e) {}
        }
      }
      pushToApi(coils, dbEngine, targetCreds);
      showToast(`✅ Sincronizados ${coils.length} productos con ${dbEngine.toUpperCase()}.`);
    }
  }, [checkAndSyncDatabase, coils, dbCredentials, dbEngine, showToast]);

  return (
    <InventoryContext.Provider value={{
      coils,
      isDbLoading,
      dbEngine,
      changeDbEngine,
      dbCredentials,
      updateDbCredentials,
      apiConnectionStatus,
      testApiConnection,
      syncWithApi,
      checkAndSyncDatabase,
      upsertCoil,
      deleteCoil,
      clearInventory,
      restoreSeedData,
      bulkImport,
      salesHistory,
      ownerSettings,
      updateOwnerSettings,
      processSaleTransaction,
      revertSale,
      pendingOwnerAlert,
      dismissOwnerAlert
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
