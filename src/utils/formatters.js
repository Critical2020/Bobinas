/**
 * Generates an automatic, clean sequential or unique product ID
 */
export function generateAutoCoilId(existingCoils = [], brand = '') {
  const brandPrefix = brand ? String(brand).replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() : '';
  const prefix = brandPrefix ? `BOB-${brandPrefix}` : 'BOB';

  // Find max numeric suffix if format is BOB-### or BOB-BRAND-###
  let maxNum = 0;
  if (Array.isArray(existingCoils)) {
    existingCoils.forEach(item => {
      if (!item || !item.id) return;
      const match = String(item.id).match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum && n < 100000) maxNum = n;
      }
    });
  }

  const nextNum = maxNum > 0 ? maxNum + 1 : (existingCoils.length ? existingCoils.length + 1 : 1);
  const padded = String(nextNum).padStart(3, '0');
  const candidateId = `${prefix}-${padded}`;

  // Check if candidate already exists
  const exists = Array.isArray(existingCoils) && existingCoils.some(c => String(c.id).toLowerCase() === candidateId.toLowerCase());
  if (exists) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomSuffix}`;
  }

  return candidateId;
}

/**
 * Normalizes raw inventory object from user input, CSV, JSON, or DB
 */
export function normalizeCoilRecord(raw, existingCoils = []) {
  const priceVal = parseFloat(raw.price);
  const safePrice = !isNaN(priceVal) && priceVal >= 0 ? priceVal : 25.00;

  const rawOldPrice = parseFloat(raw.oldPrice || raw.old_price);
  const safeOldPrice = !isNaN(rawOldPrice) && rawOldPrice > 0 ? rawOldPrice : Number((safePrice * 1.2).toFixed(2));

  const stockVal = parseInt(raw.stock, 10);
  const safeStock = !isNaN(stockVal) && stockVal >= 0 ? stockVal : 0;

  const idVal = String(raw.id || '').trim();
  const safeId = idVal ? idVal : generateAutoCoilId(existingCoils, raw.brand);

  const rawImage = String(raw.image || raw.imageUrl || raw.img || raw.foto || '').trim();

  return {
    id: safeId,
    name: String(raw.name || 'Bobina de Encendido Automotriz').trim(),
    brand: String(raw.brand || 'Chevrolet').trim(),
    carModel: String(raw.carModel || raw.car_model || 'Multimodelo').trim(),
    engine: String(raw.engine || '1.6L / 2.0L').trim(),
    oem: String(raw.oem || 'OEM-STD').trim(),
    type: String(raw.type || 'Tipo Lápiz Individual').trim(),
    connector: String(raw.connector || 'Conector 4 Pines').trim(),
    price: safePrice,
    oldPrice: safeOldPrice,
    stock: safeStock,
    inStock: safeStock > 0,
    warranty: String(raw.warranty || '12 meses').trim(),
    badge: String(raw.badge || 'OEM Spec').trim(),
    image: rawImage
  };
}

/**
 * Maps database engine code to human-readable label
 */
export function getEngineLabel(engine) {
  const map = {
    supabase: 'Supabase (PostgreSQL)',
    mongodb: 'MongoDB Atlas',
    mysql: 'MySQL / MariaDB',
    local: 'LocalStorage DB'
  };
  return map[engine] || 'Supabase (PostgreSQL)';
}

/**
 * Formats price as USD currency string
 */
export function formatUSD(amount) {
  const num = Number(amount) || 0;
  return `$${num.toFixed(2)}`;
}
