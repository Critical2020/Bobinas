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

export function InventoryProvider({ children }) {
  const { showToast } = useToast();
  const { playCashRegisterSound } = useSoundEffects();

  const [coils, setCoils] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = coil;
        return next;
      } else {
        return [coil, ...prev];
      }
    });
    showToast(`Bobina ${coil.id} guardada en base de datos`);
  }, [showToast]);

  const deleteCoil = useCallback((id) => {
    setCoils(prev => prev.filter(b => b.id !== id));
    showToast(`Bobina ${id} eliminada`);
  }, [showToast]);

  const restoreSeedData = useCallback(() => {
    const fresh = DEFAULT_BOBINAS_SEED.map(normalizeCoilRecord);
    setCoils(fresh);
    showToast(`Inventario restaurado a los ${fresh.length} productos originales`);
  }, [showToast]);

  const bulkImport = useCallback((records, replaceAll = false) => {
    const normalized = records.map(normalizeCoilRecord);
    setCoils(prev => {
      if (replaceAll) {
        return normalized;
      }
      const map = new Map();
      // Keep existing
      prev.forEach(item => map.set(item.id.toLowerCase(), item));
      // Overwrite or append imported
      normalized.forEach(item => map.set(item.id.toLowerCase(), item));
      return Array.from(map.values());
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
      return currentCoils.map(item => {
        if (item.id === coil.id) {
          return {
            ...item,
            stock: stockAfter,
            inStock: stockAfter > 0
          };
        }
        return item;
      });
    });

    return orderResult;
  }, [ownerSettings, playCashRegisterSound, showToast]);

  const revertSale = useCallback((orderId) => {
    const ord = salesHistory.find(s => s.orderId === orderId);
    if (!ord) return;

    setCoils(currentCoils => {
      return currentCoils.map(item => {
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
    });

    setSalesHistory(prev => prev.map(s => s.orderId === orderId ? { ...s, status: 'REVERTED' } : s));
    showToast(`Venta #${orderId} revertida. Se devolvieron ${ord.qty} unidades al stock.`);
  }, [salesHistory, showToast]);

  const dismissOwnerAlert = useCallback(() => {
    setPendingOwnerAlert(null);
  }, []);

  return (
    <InventoryContext.Provider value={{
      coils,
      dbEngine,
      changeDbEngine,
      upsertCoil,
      deleteCoil,
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
