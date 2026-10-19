/**
 * Normalizes raw inventory object from user input, CSV, JSON, or DB
 */
export function normalizeCoilRecord(raw) {
  const priceVal = parseFloat(raw.price);
  const safePrice = !isNaN(priceVal) && priceVal >= 0 ? priceVal : 25.00;

  const rawOldPrice = parseFloat(raw.oldPrice || raw.old_price);
  const safeOldPrice = !isNaN(rawOldPrice) && rawOldPrice > 0 ? rawOldPrice : Number((safePrice * 1.2).toFixed(2));

  const stockVal = parseInt(raw.stock, 10);
  const safeStock = !isNaN(stockVal) && stockVal >= 0 ? stockVal : 0;

  const idVal = String(raw.id || '').trim();
  const safeId = idVal ? idVal : `BOB-${Math.floor(100 + Math.random() * 900)}`;

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
    badge: String(raw.badge || 'OEM Spec').trim()
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
