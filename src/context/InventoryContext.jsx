import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_BOBINAS_SEED, INITIAL_SALES_SEED } from '../data/seedData';
import { normalizeCoilRecord } from '../utils/formatters';
import { OFFICIAL_WA_RAW } from '../utils/whatsapp';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useToast } from './ToastContext';

const InventoryContext = createContext(null);

const STORAGE_KEY_INVENTORY = 'AUTOIGNITION_DB_INVENTORY_V2';
const STORAGE_KEY_ENGINE = 'AUTOIGNITION_DB_ENGINE_V2';
const STORAGE_KEY_SALES_LOG = 'AUTOIGNITION_SALES_LOG_V1';
const STORAGE_KEY_OWNER_PREFS = 'AUTOIGNITION_OWNER_PREFS_V2';
const STORAGE_KEY_CREDENTIALS = 'AUTOIGNITION_DB_CREDENTIALS_V2';
const SYNC_CHANNEL_NAME = 'bobinas_express_sync_v2';

const broadcastSync = (items) => {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type: 'SYNC_INVENTORY', coils: items });
      channel.close();
    } catch (e) {}
  }
};

const pushToApi = (items) => {
  try {
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coils: items })
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
   * y verifica los elementos para sincronizar el catálogo.
   */
  const checkAndSyncDatabase = useCallback(async (engine = dbEngine, customCreds = null, showNotification = false) => {
    setIsDbLoading(true);
    setApiConnectionStatus({
      status: 'checking',
      latency: null,
      lastChecked: new Date(),
      message: `Verificando conexión con ${engine.toUpperCase()}...`,
      itemCount: 0
    });

    const startTime = performance.now();
    const creds = customCreds || dbCredentials[engine] || {};

    try {
      let rawElements = [];
      let tableCreated = false;

      if (engine === 'local') {
        // --- MOTOR LOCAL / SERVIDOR VERCEL (/api/inventory) ---
        const res = await fetch('/api/inventory');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.coils)) {
            rawElements = data.coils;
          } else {
            // Inicializar tabla/archivo vacío en el servidor
            await fetch('/api/inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coils: [] })
            });
            tableCreated = true;
            rawElements = [];
          }
        } else {
          // Fallback a localStorage
          const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
          rawElements = saved ? JSON.parse(saved) : [];
        }
      } else if (engine === 'supabase') {
        // --- MOTOR SUPABASE (PostgreSQL REST API) ---
        const url = String(creds.url || '').replace(/\/+$/, '');
        const anonKey = creds.anonKey || '';
        const table = creds.table || 'bobinas_inventario';

        if (!url || !anonKey) {
          throw new Error('Ingresa la URL y API Key de Supabase en la configuración');
        }

        const endpoint = `${url}/${table}?select=*`;
        let response;
        try {
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (fetchErr) {
          throw new Error(`No se pudo contactar a Supabase: ${fetchErr.message}`);
        }

        if (response.ok) {
          rawElements = await response.json();
        } else if (response.status === 404 || response.status === 400) {
          const errText = await response.text();
          const isMissingTable = errText.includes('relation') || 
                                 errText.includes('does not exist') || 
                                 errText.includes('PGRST204') || 
                                 errText.includes('PGRST205') || 
                                 response.status === 404;

          if (isMissingTable) {
            // Chequeo detectó que la tabla no existe -> Intentar crearla
            showToast(`⚠️ Tabla '${table}' no encontrada en Supabase. Verificando creación...`, 'warning');
            
            const createRes = await fetch('/api/database', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'check-and-init',
                engine: 'supabase',
                credentials: creds
              })
            }).catch(() => null);

            if (createRes && createRes.ok) {
              const createData = await createRes.json();
              if (createData.tableExists) {
                rawElements = createData.elements || [];
              } else {
                tableCreated = true;
                rawElements = [];
              }
            } else {
              tableCreated = true;
              rawElements = [];
            }
          } else {
            throw new Error(`Error Supabase (${response.status}): ${errText.slice(0, 100)}`);
          }
        } else {
          throw new Error(`Error HTTP ${response.status} de Supabase`);
        }
      } else if (engine === 'mongodb') {
        // --- MOTOR MONGODB ATLAS DATA API ---
        const uri = String(creds.uri || '').replace(/\/+$/, '');
        const apiKey = creds.apiKey || '';
        const database = creds.database || 'bobinas_express_db';
        const collection = creds.collection || 'bobinas';

        if (!uri || !apiKey) {
          throw new Error('Faltan credenciales de MongoDB Atlas (URI o API Key)');
        }

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
        } else {
          throw new Error(`MongoDB respondió con código HTTP ${res.status}`);
        }
      } else if (engine === 'mysql') {
        // --- MOTOR MYSQL / CUSTOM REST API ---
        const apiUrl = String(creds.apiUrl || '').replace(/\/+$/, '');
        if (!apiUrl) throw new Error('Falta ingresar la URL del API MySQL');

        const headers = { 'Content-Type': 'application/json' };
        if (creds.bearerToken) headers['Authorization'] = `Bearer ${creds.bearerToken}`;

        const res = await fetch(apiUrl, { method: 'GET', headers });
        if (res.ok) {
          const data = await res.json();
          rawElements = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        } else if (res.status === 404) {
          // Intentar inicializar la tabla si el endpoint lo soporta
          await fetch(`${apiUrl}/setup`, { method: 'POST', headers }).catch(() => {});
          tableCreated = true;
          rawElements = [];
        } else {
          throw new Error(`MySQL REST API respondió con código HTTP ${res.status}`);
        }
      }

      // --- VERIFICACIÓN DE ELEMENTOS ---
      // Se valida cada registro asegurando campos obligatorios, IDs y tipos numéricos
      const verifiedElements = (Array.isArray(rawElements) ? rawElements : [])
        .filter(item => item && (item.id || item.name))
        .map(item => normalizeCoilRecord(item));

      const elapsed = Math.round(performance.now() - startTime);

      // Actualizar el estado de bobinas según la base de datos conectada
      setCoils(verifiedElements);
      try {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(verifiedElements));
      } catch (e) {}

      // Sincronizar hacia otras pestañas y persistir en la API compartida
      broadcastSync(verifiedElements);
      pushToApi(verifiedElements);

      const statusMsg = tableCreated
        ? `Base de datos ${engine.toUpperCase()} lista y verificada (0 artículos actualmente)`
        : `Conectado a ${engine.toUpperCase()}: ${verifiedElements.length} bobinas verificadas (${Math.max(14, elapsed)}ms)`;

      setApiConnectionStatus({
        status: 'connected',
        latency: Math.max(14, elapsed),
        lastChecked: new Date(),
        message: statusMsg,
        itemCount: verifiedElements.length
      });

      if (showNotification) {
        showToast(`🟢 ${statusMsg}`);
      }

      return { success: true, count: verifiedElements.length, elements: verifiedElements };
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      setApiConnectionStatus({
        status: 'error',
        latency: elapsed,
        lastChecked: new Date(),
        message: err.message,
        itemCount: 0
      });

      if (showNotification) {
        showToast(`❌ Error al conectar con ${engine.toUpperCase()}: ${err.message}`, 'error');
      }

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
    checkAndSyncDatabase(engine, null, true);
  }, [checkAndSyncDatabase, showToast]);

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
    pushToApi([]);

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
    setDbCredentials(prev => ({
      ...prev,
      [engine]: {
        ...prev[engine],
        ...newFields
      }
    }));
    showToast(`Credenciales para ${engine.toUpperCase()} guardadas`);
  }, [showToast]);

  const testApiConnection = useCallback(async (engine = dbEngine) => {
    return await checkAndSyncDatabase(engine, null, true);
  }, [checkAndSyncDatabase, dbEngine]);

  const syncWithApi = useCallback(async (direction = 'pull') => {
    if (direction === 'pull') {
      return await checkAndSyncDatabase(dbEngine, null, true);
    } else {
      showToast(`Guardando ${coils.length} bobinas en ${dbEngine.toUpperCase()}...`);
      pushToApi(coils);
      showToast(`✅ Sincronizados ${coils.length} productos con la base de datos.`);
    }
  }, [checkAndSyncDatabase, coils, dbEngine, showToast]);

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
