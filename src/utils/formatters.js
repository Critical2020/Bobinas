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
 * Normalizes raw inventory object from user input, CSV, JSON, Supabase, or external DB
 * Soporta nombres de columnas tanto en inglés como en español (snake_case y camelCase)
 */
export function normalizeCoilRecord(raw, existingCoils = []) {
  if (!raw || typeof raw !== 'object') return null;

  // Price / Precio
  const rawPrice = raw.price ?? raw.precio ?? raw.costo ?? raw.valor ?? raw.precio_usd ?? 25;
  const priceVal = parseFloat(rawPrice);
  const safePrice = !isNaN(priceVal) && priceVal >= 0 ? priceVal : 25.00;

  // Old Price / Precio Anterior
  const rawOldPrice = raw.oldPrice ?? raw.old_price ?? raw.precio_anterior ?? raw.precio_lista ?? raw.precio_viejo;
  const oldPriceVal = parseFloat(rawOldPrice);
  const safeOldPrice = !isNaN(oldPriceVal) && oldPriceVal > 0 ? oldPriceVal : Number((safePrice * 1.2).toFixed(2));

  // Stock / Cantidad
  const rawStock = raw.stock ?? raw.cantidad ?? raw.existencia ?? raw.inventario ?? raw.unidades ?? raw.qty ?? 0;
  const stockVal = parseInt(rawStock, 10);
  const safeStock = !isNaN(stockVal) && stockVal >= 0 ? stockVal : 0;

  // ID / Código
  const idVal = String(raw.id ?? raw.ID ?? raw.codigo ?? raw.code ?? raw.id_bobina ?? raw.cod ?? raw._id ?? '').trim();

  // Name / Nombre
  const nameVal = String(raw.name ?? raw.nombre ?? raw.title ?? raw.titulo ?? raw.repuesto ?? raw.producto ?? raw.descripcion ?? '').trim();

  // Brand / Marca
  const brandVal = String(raw.brand ?? raw.marca ?? raw.fabricante ?? 'Chevrolet').trim();

  const safeId = idVal ? idVal : generateAutoCoilId(existingCoils, brandVal);

  // Model / Modelo
  const modelVal = String(raw.carModel ?? raw.car_model ?? raw.modelo ?? raw.aplicacion ?? raw.vehiculo ?? raw.auto ?? 'Multimodelo').trim();

  // Engine / Motor
  const engineVal = String(raw.engine ?? raw.motor ?? raw.cilindrada ?? '1.6L / 2.0L').trim();

  // OEM / Código de Parte
  const oemVal = String(raw.oem ?? raw.codigo_oem ?? raw.oem_code ?? raw.part_number ?? raw.numero_parte ?? 'OEM-STD').trim();

  // Type / Tipo
  const typeVal = String(raw.type ?? raw.tipo ?? 'Tipo Lápiz Individual').trim();

  // Connector / Conector
  const connectorVal = String(raw.connector ?? raw.conector ?? raw.pines ?? 'Conector 4 Pines').trim();

  // Warranty / Garantía
  const warrantyVal = String(raw.warranty ?? raw.garantia ?? '12 meses').trim();

  // Badge / Etiqueta
  const badgeVal = String(raw.badge ?? raw.etiqueta ?? raw.tag ?? 'OEM Spec').trim();

  // Image / Imagen
  const rawImage = String(raw.image ?? raw.imageUrl ?? raw.image_url ?? raw.img ?? raw.foto ?? raw.imagen ?? raw.url_imagen ?? '').trim();

  return {
    id: safeId,
    name: nameVal || 'Bobina de Encendido Automotriz',
    brand: brandVal,
    carModel: modelVal,
    engine: engineVal,
    oem: oemVal,
    type: typeVal,
    connector: connectorVal,
    price: safePrice,
    oldPrice: safeOldPrice,
    stock: safeStock,
    inStock: safeStock > 0,
    warranty: warrantyVal,
    badge: badgeVal,
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
