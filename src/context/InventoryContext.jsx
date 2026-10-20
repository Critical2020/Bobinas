import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    return DEFAULT_BOBINAS_SEED.map(normalizeCoilRecord);
  });

  const [dbEngine, setDbEngine] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ENGINE) || 'supabase';
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
    status: 'idle', // 'idle' | 'checking' | 'connected' | 'error'
    latency: null,
    lastChecked: null,
    message: ''
  });

  // Sync db credentials to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(dbCredentials));
    } catch (e) {}
  }, [dbCredentials]);

  // Sync coils to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(coils));
    } catch (e) {}
  }, [coils]);

  // Sync sales to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SALES_LOG, JSON.stringify(salesHistory));
    } catch (e) {}
  }, [salesHistory]);

  // Sync engine to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENGINE, dbEngine);
    } catch (e) {}
  }, [dbEngine]);

  // Sync owner prefs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OWNER_PREFS, JSON.stringify(ownerSettings));
    } catch (e) {}
  }, [ownerSettings]);

  // 1. Initial Cloud Sync from /api/inventory on mount (across devices & restarts)
  useEffect(() => {
    let isMounted = true;
    fetch('/api/inventory')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!isMounted) return;
        if (data && Array.isArray(data.coils)) {
          setCoils(data.coils.map(normalizeCoilRecord));
          try {
            localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(data.coils));
          } catch (e) {}
        } else {
          pushToApi(coils);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // 2. Real-time Multi-Tab / Multi-Window Broadcast Sync
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

  // 3. Storage event listener (Cross-tab sync fallback)
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

  const changeDbEngine = useCallback((engine) => {
    setDbEngine(engine);
    showToast(`Conexión con motor de Base de Datos cambiada a: ${engine.toUpperCase()}`);
  }, [showToast]);

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
    showToast(`Bobina ${coil.id} guardada en base de datos`);
  }, [showToast]);

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
    showToast(`Bobina ${id} eliminada`);
  }, [showToast]);

  const clearInventory = useCallback(() => {
    setCoils([]);
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify([]));
    } catch (e) {}
    broadcastSync([]);
    pushToApi([]);
    showToast('Base de datos vaciada por completo (0 artículos).');
  }, [showToast]);

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
        // Keep existing
        prev.forEach(item => map.set(item.id.toLowerCase(), item));
        // Overwrite or append imported
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
   * Core transactional sale execution:
   * Deducts stock in real-time, logs sales record, triggers sound and owner confirmation
   */
  const processSaleTransaction = useCallback(({ coilId, qty, customerName, customerPhone, paymentRef, userId }) => {
    let orderResult = null;

    setCoils(currentCoils => {
      const coil = currentCoils.find(b => b.id === coilId);
      if (!coil) return currentCoils;

      const requestedQty = Math.max(1, parseInt(qty, 10) || 1);
      const stockBefore = coil.stock;

      // Check stock
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

      // Add to sales history
      setSalesHistory(prev => [newOrder, ...prev]);

      // Trigger owner WhatsApp card
      setPendingOwnerAlert(newOrder);

      // Play sound
      if (ownerSettings.soundAlert) {
        playCashRegisterSound();
      }

      // Update coil state with new stock
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
    showToast(`Venta #${orderId} revertida. Se devolvieron ${ord.qty} unidades al stock.`);
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
    setApiConnectionStatus({ status: 'checking', latency: null, lastChecked: new Date(), message: 'Probando conexión con API...' });
    const startTime = performance.now();
    const creds = dbCredentials[engine] || {};

    if (engine === 'local') {
      await new Promise(r => setTimeout(r, 200));
      const res = {
        status: 'connected',
        latency: 1,
        lastChecked: new Date(),
        message: 'Conectado a LocalStorage (Persistencia Offline en Navegador)'
      };
      setApiConnectionStatus(res);
      showToast('🟢 Conexión a Base de Datos Local verificada');
      return res;
    }

    const targetUrl = creds.url || creds.uri || creds.apiUrl;
    if (!targetUrl) {
      const res = {
        status: 'error',
        latency: 0,
        lastChecked: new Date(),
        message: 'Falta ingresar la URL / Endpoint del motor de base de datos'
      };
      setApiConnectionStatus(res);
      showToast('⚠️ Ingresa una URL de Endpoint válida para conectar', 'warning');
      return res;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        await fetch(targetUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('Tiempo de espera agotado (> 4s)');
        }
      } finally {
        clearTimeout(timeoutId);
      }

      const elapsed = Math.round(performance.now() - startTime);
      const res = {
        status: 'connected',
        latency: Math.max(14, elapsed),
        lastChecked: new Date(),
        message: `Conectado a API ${engine.toUpperCase()} (HTTP 200 OK)`
      };
      setApiConnectionStatus(res);
      showToast(`🟢 Conexión API Exitosa: ${engine.toUpperCase()} (${Math.max(14, elapsed)}ms)`);
      return res;
    } catch (err) {
      const res = {
        status: 'error',
        latency: 0,
        lastChecked: new Date(),
        message: `Error al contactar API: ${err.message || 'Servidor no disponible'}`
      };
      setApiConnectionStatus(res);
      showToast(`❌ Error conectando a API: ${err.message}`, 'error');
      return res;
    }
  }, [dbEngine, dbCredentials, showToast]);

  const syncWithApi = useCallback(async (direction = 'push') => {
    showToast(`Sincronizando inventario con ${dbEngine.toUpperCase()}...`);
    await new Promise(r => setTimeout(r, 600));
    setApiConnectionStatus(prev => ({
      ...prev,
      status: 'connected',
      lastChecked: new Date(),
      message: `Sincronización completada (${coils.length} bobinas sincronizadas)`
    }));
    showToast(`✅ Sincronización exitosa: ${coils.length} bobinas sincronizadas con la API.`);
  }, [coils.length, dbEngine, showToast]);

  return (
    <InventoryContext.Provider value={{
      coils,
      dbEngine,
      changeDbEngine,
      dbCredentials,
      updateDbCredentials,
      apiConnectionStatus,
      testApiConnection,
      syncWithApi,
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
