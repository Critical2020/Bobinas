import { useState, useCallback } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { getEngineLabel, formatUSD } from '../utils/formatters';

// ─── Stop words — ignoring these helps focus on meaningful search terms ──────
const STOP_WORDS = new Set([
  'hola', 'buenas', 'tardes', 'dias', 'noches', 'tienen', 'tiene', 'tienes',
  'disponible', 'disponibilidad', 'precio', 'cuanto', 'cuesta', 'vale', 'para',
  'una', 'un', 'el', 'la', 'los', 'las', 'de', 'del', 'por', 'favor', 'bobina',
  'bobinas', 'encendido', 'motor', 'con', 'en', 'stock', 'hay', 'busco', 'necesito',
  'amigo', 'que', 'cual', 'es', 'codigo', 'oem', 'quiero', 'comprar', 'confirmo',
  'compra', 'pague', 'pago', 'movil', 'zelle', 'binance', 'ref', 'comprobante',
  'transferencia', 'hice', 'tienes', 'nene', 'hermano', 'bro', 'chamo', 'pana',
  'amig', 'del', 'ese', 'esa', 'mio', 'mia', 'me', 'si', 'no', 'ok', 'dale',
  'puede', 'ser', 'mi', 'su', 'tu', 'yo', 'el', 'y', 'o', 'a', 'lo', 'le'
]);

// ─── Alias / abbreviation dictionary ─────────────────────────────────────────
// Maps common typos, abbreviations and Venezuelan slang to canonical search terms
const ALIASES = {
  // Brands
  'chevy': 'chevrolet', 'chevi': 'chevrolet', 'cheby': 'chevrolet', 'chev': 'chevrolet',
  'opel': 'chevrolet', 'gm': 'chevrolet',
  'toy': 'toyota', 'toyot': 'toyota', 'toyoya': 'toyota', 'toyoyta': 'toyota',
  'ford': 'ford', 'frd': 'ford',
  'nisan': 'nissan', 'nisam': 'nissan', 'nissa': 'nissan', 'nisaan': 'nissan',
  'hundai': 'hyundai', 'hyudai': 'hyundai', 'hiundai': 'hyundai', 'hunday': 'hyundai',
  'reno': 'renault', 'renol': 'renault', 'renault': 'renault', 'renaut': 'renault',
  'vw': 'volkswagen', 'volks': 'volkswagen',
  'mitsu': 'mitsubishi', 'mitsubi': 'mitsubishi',
  'kia': 'kia', 'kiia': 'kia',
  'honda': 'honda', 'onda': 'honda',

  // Models — Chevrolet
  'captiva': 'captiva', 'captiba': 'captiva', 'captivaa': 'captiva', 'cap': 'captiva',
  'aveo': 'aveo', 'abeo': 'aveo', 'aveoo': 'aveo', 'abio': 'aveo',
  'corsa': 'corsa', 'corza': 'corsa', 'corso': 'corsa',
  'cruze': 'cruze', 'cruse': 'cruze', 'cruce': 'cruze',
  'spark': 'spark', 'spart': 'spark', 'espark': 'spark',
  'tracker': 'tracker', 'traker': 'tracker',
  'optra': 'optra', 'optar': 'optra',
  'malibu': 'malibu',
  'equinox': 'equinox',
  'orlando': 'orlando',

  // Toyota
  'corol': 'corolla', 'corola': 'corolla', 'corona': 'corolla', 'corolaa': 'corolla',
  'camri': 'camry', 'camrry': 'camry',
  'yari': 'yaris', 'yars': 'yaris', 'yariz': 'yaris',
  'hilux': 'hilux', 'ilux': 'hilux',
  'prad': 'prado', 'pradoo': 'prado',
  'rav4': 'rav4', 'rav': 'rav4',

  // Ford
  'fiesta': 'fiesta', 'fiesta': 'fiesta', 'fieesta': 'fiesta',
  'focus': 'focus', 'focuss': 'focus', 'focuz': 'focus',
  'ecosport': 'ecosport', 'eco': 'ecosport',
  'fusion': 'fusion',
  'escape': 'escape',
  'explorer': 'explorer',
  'expedition': 'expedition',

  // Nissan
  'sentra': 'sentra', 'sentr': 'sentra', 'ssentra': 'sentra',
  'frontier': 'frontier', 'frontera': 'frontier',
  'pathfinder': 'pathfinder',
  'xtrail': 'x-trail', 'xtrail': 'x-trail', 'xtrai': 'x-trail',
  'altima': 'altima', 'altimma': 'altima',
  'murano': 'murano',

  // Hyundai
  'tucson': 'tucson', 'tuczon': 'tucson', 'tukson': 'tucson',
  'elantra': 'elantra', 'elantra': 'elantra',
  'accent': 'accent', 'acent': 'accent',
  'santa': 'santa fe', 'santafe': 'santa fe',
  'ioniq': 'ioniq',
  'creta': 'creta',

  // Renault
  'logam': 'logan', 'loga': 'logan', 'lagan': 'logan',
  'sandero': 'sandero', 'sanero': 'sandero',
  'duster': 'duster', 'dusteer': 'duster',
  'stepway': 'stepway',
  'megane': 'megane', 'megan': 'megane',

  // Dong Feng / Chinese
  'dong': 'dong feng', 'dongfeng': 'dong feng', 'dfm': 'dong feng',
  'zotye': 'zotye',
  'chery': 'chery', 'cherry': 'chery',
  'jac': 'jac',

  // Common engine sizes (e.g. "1.6" typed as "16" or "uno punto seis")
  '16': '1.6', '18': '1.8', '20': '2.0', '14': '1.4', '24': '2.4', '32': '3.2',
  'v6': 'v6', 'v8': 'v8',
};

/**
 * Normalize and expand a raw user query:
 * - Lowercase, strip accents, strip punctuation
 * - Replace aliases and known typos
 * - Remove stop words
 * Returns both the original cleaned string and an array of meaningful tokens.
 */
function normalizeQuery(rawText) {
  // 1. Lowercase + remove accents (é→e, á→a, etc.)
  let text = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .replace(/[¿?¡!.,;:#()\-_\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Apply alias substitutions word by word
  const words = text.split(' ');
  const expanded = words.map(w => ALIASES[w] || w);
  text = expanded.join(' ');

  // 3. Tokenize and filter stop words, keep tokens ≥ 2 chars
  const tokens = text
    .split(' ')
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));

  return { cleanText: text, tokens };
}

/**
 * Levenshtein distance between two strings (for fuzzy matching).
 * Optimized for short tokens.
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Only compare if strings are reasonably similar in length
  if (Math.abs(a.length - b.length) > 4) return 99;

  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

/**
 * Score a single product against a list of search tokens.
 * Returns a numeric score — higher = better match.
 * Scoring rules:
 *   +6  exact substring match on a long token (≥4 chars) in a high-priority field
 *   +3  exact substring match on a short token or in a secondary field
 *   +2  fuzzy match within Levenshtein distance 1
 *   +1  fuzzy match within Levenshtein distance 2
 *    0  no match
 */
function scoreProduct(product, tokens) {
  if (!tokens.length) return 0;

  // Build searchable field groups with different weights
  const highPriorityHaystack = [
    product.name,
    product.brand,
    product.carModel,
    product.engine,
    product.oem,
    product.id,
  ].join(' ').toLowerCase();

  const lowPriorityHaystack = [
    product.type,
    product.connector,
    product.badge,
  ].join(' ').toLowerCase();

  // Pre-tokenize the product's own fields for fuzzy comparison
  const productWords = highPriorityHaystack
    .replace(/[^a-z0-9\s\.]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);

  let totalScore = 0;

  for (const token of tokens) {
    let tokenScore = 0;

    // 1. Exact substring in high-priority fields
    if (highPriorityHaystack.includes(token)) {
      tokenScore = token.length >= 4 ? 6 : 3;
    }
    // 2. Exact substring in low-priority fields
    else if (lowPriorityHaystack.includes(token)) {
      tokenScore = 1;
    }
    // 3. Fuzzy match against product word tokens (only for tokens ≥ 3 chars)
    else if (token.length >= 3) {
      for (const pw of productWords) {
        if (Math.abs(pw.length - token.length) > 3) continue;
        const dist = levenshtein(token, pw);
        if (dist === 1) { tokenScore = Math.max(tokenScore, 2); break; }
        if (dist === 2 && token.length >= 5) { tokenScore = Math.max(tokenScore, 1); }
      }
    }

    totalScore += tokenScore;
  }

  return totalScore;
}

// ─── Main hook ────────────────────────────────────────────────────────────────
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
    const rawPrompt = String(userPrompt || '');
    const { cleanText, tokens } = normalizeQuery(rawPrompt);
    const latency = Math.floor(20 + Math.random() * 40);

    // ── Purchase / payment confirmation intent ──────────────────────────────
    const isPurchaseConfirmation =
      cleanText.includes('quiero comprar') ||
      cleanText.includes('confirmo compra') ||
      cleanText.includes('confirmar compra') ||
      cleanText.includes('ya pague') ||
      cleanText.includes('ya pago') ||
      cleanText.includes('hice el pago') ||
      cleanText.includes('comprobante') ||
      cleanText.includes('ref #') ||
      cleanText.includes('ref:') ||
      cleanText.includes('me llevo') ||
      cleanText.includes('la quiero') ||
      cleanText.includes('voy a llevar');

    // ── Score every product against query ────────────────────────────────────
    let bestMatch = null;
    let highestScore = 0;
    let secondMatch = null;
    let secondScore = 0;

    for (const item of coils) {
      const score = scoreProduct(item, tokens);
      if (score > highestScore) {
        secondMatch = bestMatch;
        secondScore = highestScore;
        highestScore = score;
        bestMatch = item;
      } else if (score > secondScore) {
        secondMatch = item;
        secondScore = score;
      }
    }

    // Minimum score threshold to count as a real match (avoids random matches)
    const MIN_SCORE = 2;
    const targetProduct =
      (bestMatch && highestScore >= MIN_SCORE) ? bestMatch : lastInteractedProduct;

    // ── 1. Transactional purchase closing ────────────────────────────────────
    if (isPurchaseConfirmation && targetProduct) {
      if (targetProduct.stock <= 0) {
        logConsoleQuery(`ABORT TX: STOCK=0 [${targetProduct.id}]`, 0, latency);
        return {
          product: targetProduct,
          hasAction: true,
          badge: `[TX ABORTADA] Stock agotado (0 uds)`,
          html: `⚠️ Intenté procesar tu compra de <strong>${targetProduct.name}</strong>, pero figura con <strong>Stock: 0 unidades</strong>.<br><br>¿Deseas encargarla bajo pedido para reservarla en el próximo lote?`
        };
      }

      const qtyMatch = rawPrompt.match(/\b([1-9])\s*(bobina|bobinas|unidades|uds|de)?\b/);
      const requestedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      let detectedMethod = 'Pago Móvil / Transferencia';
      if (cleanText.includes('zelle')) detectedMethod = 'Zelle USD';
      else if (cleanText.includes('binance') || cleanText.includes('usdt')) detectedMethod = 'Binance Pay (USDT)';
      else if (cleanText.includes('efectivo')) detectedMethod = 'Efectivo USD';
      else if (cleanText.includes('pago movil') || cleanText.includes('pago mobil')) detectedMethod = 'Pago Móvil Interbancario';

      const refMatch = rawPrompt.match(/#?([0-9]{4,10})/);
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

    // ── 2. Full catalog / listing request ────────────────────────────────────
    const isCatalogRequest =
      cleanText.includes('inventario') ||
      cleanText.includes('catalogo') ||
      cleanText.includes('todas') ||
      cleanText.includes('todo') ||
      cleanText.includes('que tienen') ||
      cleanText.includes('que bobinas') ||
      cleanText.includes('lista') ||
      (cleanText.includes('tienen') && tokens.length <= 2);

    if (isCatalogRequest) {
      const inStockList = coils.filter(b => b.stock > 0);
      logConsoleQuery('SELECT * FROM bobinas_inventario WHERE stock > 0', inStockList.length, latency);
      const summaryLines = inStockList.slice(0, 8).map(b =>
        `• <strong>${b.name}</strong> — ${b.brand} | ${formatUSD(b.price)} | Stock: <span class="text-emerald-400">${b.stock} uds</span>`
      ).join('<br>');
      const extra = inStockList.length > 8 ? `<br><em>...y ${inStockList.length - 8} referencias más. Dime tu modelo de auto para afinar la búsqueda.</em>` : '';
      return {
        product: null,
        hasAction: false,
        badge: `DB: ${inStockList.length} en stock de ${coils.length} totales`,
        html: `Actualmente disponemos de <strong>${inStockList.length} referencias con stock inmediato</strong>:<br><br>${summaryLines}${extra}<br><br>Indícame tu modelo de vehículo o código OEM para darte todos los detalles y coordinar tu pedido.`
      };
    }

    // ── 3. Product match found ────────────────────────────────────────────────
    if (bestMatch && highestScore >= MIN_SCORE) {
      setLastInteractedProduct(bestMatch);
      logConsoleQuery(
        `SELECT * FROM bobinas_inventario WHERE haystack LIKE '%${tokens.slice(0, 3).join(' ')}%' — score:${highestScore}`,
        1,
        latency
      );

      // If there's a strong second match, mention it too
      const altHint = (secondMatch && secondScore >= MIN_SCORE && secondMatch.id !== bestMatch.id)
        ? `<br>💡 <em>También tenemos disponible la <strong>${secondMatch.name}</strong> (${formatUSD(secondMatch.price)} USD) — escríbeme si deseas verla.</em>`
        : '';

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
💡 <em>Para comprarla ahora mismo y descontarla del stock, haz clic en <strong>"Cerrar Venta en WA"</strong> abajo o responde: <code>"Quiero comprar 1 ref #12345"</code>.</em>${altHint}`
        };
      } else {
        return {
          product: bestMatch,
          hasAction: true,
          badge: `[${getEngineLabel(dbEngine)}] ID: ${bestMatch.id} | STOCK: 0 (AGOTADO)`,
          html: `⚠️ He consultado la base de datos para la <strong>${bestMatch.name}</strong> (OEM: <code>${bestMatch.oem}</code>).<br><br>
En este momento figura con <strong>Stock: 0 unidades (Agotada temporalmente)</strong>.<br>
• <strong>Precio de lista:</strong> ${formatUSD(bestMatch.price)} USD<br><br>
Pulsa el botón de abajo si deseas encargarla bajo pedido para reservártela en el próximo lote.${altHint}`
        };
      }
    }

    // ── 4. Greeting ───────────────────────────────────────────────────────────
    const isGreeting =
      cleanText.includes('hola') ||
      cleanText.includes('buenas') ||
      cleanText.includes('buenos') ||
      cleanText.includes('saludos') ||
      cleanText.includes('buen dia') ||
      cleanText.includes('que tal') ||
      cleanText.includes('como estan') ||
      rawPrompt.trim().length < 8;

    if (isGreeting) {
      logConsoleQuery('PING_SESSION', coils.length, 12);
      return {
        product: null,
        hasAction: false,
        badge: `Conectado a ${getEngineLabel(dbEngine)} (${coils.length} referencias)`,
        html: `¡Hola! 👋 Con gusto te asesoro. Indícame la <strong>marca, modelo de auto, año o código OEM</strong> de la bobina que necesitas y reviso nuestro stock al instante.`
      };
    }

    // ── 5. Not found — suggest closest possible ───────────────────────────────
    // Even if below MIN_SCORE, show the best guess if score > 0
    const searchKeyword = tokens.join(' ') || rawPrompt.trim();
    logConsoleQuery(`SEARCH MISS: '%${searchKeyword}%' (best_score:${highestScore})`, 0, latency);

    const guessHint = (bestMatch && highestScore > 0)
      ? `<br><br>💡 Lo más parecido que tenemos es <strong>${bestMatch.name}</strong> (${formatUSD(bestMatch.price)} USD, stock: ${bestMatch.stock} uds). ¿Es lo que buscas?`
      : '';

    return {
      product: bestMatch && highestScore > 0 ? bestMatch : null,
      hasAction: bestMatch && highestScore > 0,
      badge: `[${getEngineLabel(dbEngine)}] 0 coincidencias para "${searchKeyword}"`,
      html: isAdmin
        ? `Consulté la base de datos para <em>"${rawPrompt}"</em> y no encontré un registro exacto (score: ${highestScore}).<br><br>💡 <em>Tip Admin: Puedes agregarla desde el panel de <strong>"Base de Datos &amp; Stock"</strong> o importarla por CSV.</em>${guessHint}`
        : `No encontramos una coincidencia exacta en catálogo para <em>"${rawPrompt}"</em>.<br><br>Por favor verifica el año, modelo o código OEM, o escríbenos por WhatsApp directamente para que un especialista te atienda.${guessHint}`
    };
  }, [coils, dbEngine, deviceId, isAdmin, lastInteractedProduct, logConsoleQuery, ownerSettings.ownerPhone, processSaleTransaction]);

  return {
    generateResponse,
    consoleLogs,
    clearLogs: () => setConsoleLogs([])
  };
}
