import { useState, useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { getEngineLabel, formatUSD } from '../utils/formatters';

const STOP_WORDS = [
  'hola', 'buenas', 'tardes', 'dias', 'noches', 'tienen', 'tiene', 'tienes',
  'disponible', 'disponibilidad', 'precio', 'cuanto', 'cuesta', 'vale', 'para',
  'una', 'un', 'el', 'la', 'los', 'las', 'de', 'del', 'por', 'favor', 'bobina',
  'bobinas', 'encendido', 'motor', 'con', 'en', 'stock', 'hay', 'busco', 'necesito',
  'amigo', 'que', 'cual', 'es', 'codigo', 'oem', 'quiero', 'comprar', 'confirmo',
  'compra', 'pague', 'pago', 'movil', 'zelle', 'binance', 'ref', 'comprobante',
  'transferencia', 'hice'
];

export function useAIAgent() {
  const { coils, dbEngine, ownerSettings, processSaleTransaction } = useInventory();
  const { deviceId, isAdmin } = useAuth();
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [lastInteractedProduct, setLastInteractedProduct] = useState(null);

  const logConsoleQuery = useCallback((query, count, latencyMs = 28) => {
    const entry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      query,
      count,
      engine: getEngineLabel(dbEngine),
      latency: latencyMs
    };
    setConsoleLogs(prev => [entry, ...prev.slice(0, 49)]);
  }, [dbEngine]);

  const generateResponse = useCallback((userPrompt) => {
    const cleanPrompt = userPrompt.toLowerCase();
    const latency = Math.floor(20 + Math.random() * 40);

    const tokens = cleanPrompt
      .replace(/[¿?¡!.,;:#()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !STOP_WORDS.includes(w));

    // Detect purchase / payment confirmation intent
    const isPurchaseConfirmation =
      cleanPrompt.includes('quiero comprar') ||
      cleanPrompt.includes('confirmo compra') ||
      cleanPrompt.includes('confirmar compra') ||
      cleanPrompt.includes('ya pague') ||
      cleanPrompt.includes('ya pagué') ||
      cleanPrompt.includes('hice el pago') ||
      cleanPrompt.includes('comprobante') ||
      cleanPrompt.includes('ref #') ||
      cleanPrompt.includes('ref:') ||
      cleanPrompt.includes('me llevo');

    // Score products
    let bestMatch = null;
    let highestScore = 0;

    coils.forEach(item => {
      const haystack = `${item.id} ${item.name} ${item.brand} ${item.carModel} ${item.engine} ${item.oem}`.toLowerCase();
      let score = 0;
      tokens.forEach(tk => {
        if (haystack.includes(tk)) {
          score += (tk.length >= 4 ? 3 : 1);
        }
      });
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    });

    const targetProduct = (bestMatch && highestScore >= 1) ? bestMatch : lastInteractedProduct;

    // 1. Transactional purchase closing
    if (isPurchaseConfirmation && targetProduct) {
      if (targetProduct.stock <= 0) {
        logConsoleQuery(`ABORT TRANSACTION: STOCK 0 [${targetProduct.id}]`, 0, latency);
        return {
          product: targetProduct,
          hasAction: true,
          badge: `[TX ABORTADA] Stock agotado (0 uds)`,
          html: `⚠️ Intenté procesar tu compra de <strong>${targetProduct.name}</strong>, pero figura con <strong>Stock: 0 unidades</strong>.<br><br>¿Deseas encargarla bajo pedido para reservarla en el próximo lote?`
        };
      }

      // Extract requested quantity
      const qtyMatch = cleanPrompt.match(/\b([1-9])\s*(bobina|bobinas|unidades|uds|de)?\b/);
      const requestedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      // Detect payment method
      let detectedMethod = 'Pago Móvil / Transferencia';
      if (cleanPrompt.includes('zelle')) detectedMethod = 'Zelle USD';
      else if (cleanPrompt.includes('binance') || cleanPrompt.includes('usdt')) detectedMethod = 'Binance Pay (USDT)';
      else if (cleanPrompt.includes('efectivo')) detectedMethod = 'Efectivo USD';
      else if (cleanPrompt.includes('pago movil') || cleanPrompt.includes('pago móvil')) detectedMethod = 'Pago Móvil Interbancario';

      // Extract payment reference
      const refMatch = userPrompt.match(/#?([0-9]{4,10})/);
      const detectedRef = refMatch ? `REF-${refMatch[1]}` : `WA-${Math.floor(100000 + Math.random() * 900000)}`;

      const order = processSaleTransaction({
        coilId: targetProduct.id,
        qty: requestedQty,
        customerName: 'Cliente WhatsApp Directo',
        customerPhone: '+58 412-ClienteWA',
        paymentRef: `${detectedMethod} (${detectedRef})`,
        userId: deviceId
      });

      if (!order) {
        return {
          product: targetProduct,
          hasAction: true,
          badge: `[TX ABORTADA] Stock insuficiente`,
          html: `⚠️ No se pudo procesar la compra: la cantidad solicitada supera el stock disponible en almacén (${targetProduct.stock} uds).`
        };
      }

      logConsoleQuery(`TX COMMIT: ORDER #${order.orderId} [${targetProduct.id}] -${requestedQty} UDS`, 1, latency);

      return {
        product: null,
        hasAction: false,
        badge: `[TX COMMIT ${getEngineLabel(dbEngine)}] Orden #${order.orderId} | Stock: ${order.stockBefore} → ${order.stockAfter}`,
        html: `🎉 <strong>¡VENTA REGISTRADA Y CONFIRMADA! (#${order.orderId})</strong><br><br>
        He procesado tu reporte de pago y confirmado tu orden:<br>
        • <strong>Repuesto:</strong> ${order.qty}x ${order.coilName}<br>
        • <strong>Código OEM:</strong> <code>${order.oem}</code><br>
        • <strong>Total Cancelado:</strong> <span class="text-emerald-400 font-extrabold">${formatUSD(order.totalPrice)} USD</span><br>
        • <strong>Método / Ref:</strong> ${order.paymentRef}<br>
        ${isAdmin 
          ? `• <strong>Nuevo Stock en Base de Datos:</strong> De ${order.stockBefore} ➔ <strong>${order.stockAfter} uds</strong><br><br>`
          : `• <strong>Estado del Pedido:</strong> <span class="text-emerald-400 font-bold">Aprobado y en preparación para despacho</span><br><br>`}
        📲 <em>Se ha enviado la confirmación al WhatsApp oficial (${ownerSettings.ownerPhone}) para autorizar la entrega inmediata.</em>`
      };
    }

    // 2. Full catalog overview request
    if (cleanPrompt.includes('inventario') || cleanPrompt.includes('que bobinas tienen') || cleanPrompt.includes('catalogo') || cleanPrompt.includes('todas')) {
      const inStockList = coils.filter(b => b.stock > 0);
      logConsoleQuery('SELECT * FROM bobinas_inventario WHERE stock > 0', inStockList.length, latency);
      const summaryLines = inStockList.slice(0, 6).map(b => `• <strong>${b.name}</strong> (${formatUSD(b.price)} - Stock: ${b.stock})`).join('<br>');
      return {
        product: null,
        hasAction: false,
        badge: `DB Query (${getEngineLabel(dbEngine)}): ${inStockList.length} en stock de ${coils.length} totales`,
        html: `Actualmente disponemos de <strong>${inStockList.length} referencias con stock inmediato</strong>:<br><br>${summaryLines}<br><br>Indícame tu modelo de vehículo o código OEM para darte todos los detalles y coordinar tu pedido.`
      };
    }

    // 3. Product match found in catalog
    if (bestMatch && highestScore >= 1) {
      setLastInteractedProduct(bestMatch);
      logConsoleQuery(`SELECT * FROM bobinas_inventario WHERE id = '${bestMatch.id}'`, 1, latency);

      if (bestMatch.stock > 0) {
        return {
          product: bestMatch,
          hasAction: true,
          badge: `[${getEngineLabel(dbEngine)}] ID: ${bestMatch.id} | Stock: ${bestMatch.stock} uds`,
          html: `✅ ¡Sí, tenemos disponibilidad inmediata en almacén de la <strong>${bestMatch.name}</strong>!<br><br>
          • <strong>Aplicación:</strong> ${bestMatch.carModel}<br>
          • <strong>Motor:</strong> ${bestMatch.engine}<br>
          • <strong>Precio:</strong> <span class="text-brand-400 font-bold">${formatUSD(bestMatch.price)} USD</span><br>
          • <strong>Stock en vivo:</strong> <span class="text-emerald-400 font-bold">${bestMatch.stock} unidades listas para despacho</span><br>
          • <strong>Código OEM:</strong> <code>${bestMatch.oem}</code><br>
          • <strong>Conector / Garantía:</strong> ${bestMatch.connector} (${bestMatch.warranty})<br><br>
          💡 <em>Para comprarla ahora mismo y descontarla del stock, haz clic en <strong>"Cerrar Venta en WA"</strong> abajo o responde: <code>"Quiero comprar 1 ref #12345"</code>.</em>`
        };
      } else {
        return {
          product: bestMatch,
          hasAction: true,
          badge: `[${getEngineLabel(dbEngine)}] ID: ${bestMatch.id} | STOCK: 0 (AGOTADO)`,
          html: `⚠️ He consultado la base de datos para la <strong>${bestMatch.name}</strong> (OEM: <code>${bestMatch.oem}</code>).<br><br>
          En este momento figura con <strong>Stock: 0 unidades (Agotada temporalmente)</strong>.<br>
          • <strong>Precio de lista:</strong> ${formatUSD(bestMatch.price)} USD<br><br>
          Pulsa el botón de abajo si deseas encargarla bajo pedido para reservártela en el próximo lote.`
        };
      }
    }

    // 4. Greeting
    if (cleanPrompt.includes('hola') || cleanPrompt.includes('buenas') || cleanPrompt.includes('buenos') || cleanPrompt.includes('saludos')) {
      logConsoleQuery('PING_SESSION', coils.length, 12);
      return {
        product: null,
        hasAction: false,
        badge: `Conectado a ${getEngineLabel(dbEngine)} (${coils.length} referencias)`,
        html: `¡Hola! 👋 Con gusto te asesoro. Indícame la <strong>marca, modelo de auto, año o código OEM</strong> de la bobina que necesitas y reviso nuestro stock al instante.`
      };
    }

    // 5. Not found in catalog
    const searchKeyword = tokens.join(' ') || cleanPrompt;
    logConsoleQuery(`SELECT * WHERE query LIKE '%${searchKeyword}%'`, 0, latency);
    return {
      product: null,
      hasAction: false,
      badge: `[${getEngineLabel(dbEngine)}] 0 registros para "${searchKeyword}"`,
      html: isAdmin
        ? `Consulté la base de datos para <em>"${userPrompt}"</em> y no encontré un registro exacto.<br><br>💡 <em>Tip de Administrador: Puedes agregarla desde el panel de <strong>"Base de Datos & Stock"</strong> o importarla por CSV.</em>`
        : `No encontramos una coincidencia exacta en catálogo para <em>"${userPrompt}"</em>.<br><br>💡 Por favor verifica el año, modelo o código OEM, o escríbenos por WhatsApp directamente para que un especialista te atienda.`
    };
  }, [coils, dbEngine, deviceId, isAdmin, lastInteractedProduct, logConsoleQuery, ownerSettings.ownerPhone, processSaleTransaction]);

  return {
    generateResponse,
    consoleLogs,
    clearLogs: () => setConsoleLogs([])
  };
}
