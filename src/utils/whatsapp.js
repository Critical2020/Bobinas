export const OFFICIAL_WA_RAW = '04126497478';

/**
 * Normalizes Venezuelan phone numbers to international WhatsApp format (e.g., 04126497478 -> 584126497478)
 */
export function normalizeWaPhone(rawPhone) {
  let digits = String(rawPhone || OFFICIAL_WA_RAW).replace(/[^0-9]/g, '');
  if (!digits) digits = '584126497478';
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '58' + digits.substring(1);
  } else if (digits.length === 10 && (digits.startsWith('412') || digits.startsWith('414') || digits.startsWith('424') || digits.startsWith('416') || digits.startsWith('426'))) {
    digits = '58' + digits;
  }
  return digits;
}

/**
 * Builds direct WhatsApp URL for sending customer cart orders
 */
export function buildCartCheckoutUrl({ targetPhone, clientName, clientPhone, clientCar, clientPayRef, cartItems, totalVal, orderTag }) {
  const phone = normalizeWaPhone(targetPhone);
  const itemsText = cartItems.map(i => `• ${i.qty}x ${i.name} ($${Number(i.price).toFixed(2)})`).join('\n');
  
  const text = `⚡ *NUEVO PEDIDO CONFIRMADO (${orderTag || 'ORD-WA'}) - BOBINAS EXPRESS*\n\n` +
    `👤 *Cliente:* ${clientName} (${clientPhone})\n` +
    `🚗 *Vehículo / Envío:* ${clientCar || 'Por especificar'}\n` +
    `💳 *Referencia / Pago:* ${clientPayRef || 'A coordinar'}\n\n` +
    `📦 *Repuestos Solicitados:*\n${itemsText}\n\n` +
    `💰 *Total:* $${Number(totalVal).toFixed(2)} USD\n\n` +
    `✅ *Stock reservado y verificado en base de datos.*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds direct WhatsApp URL for owner transaction confirmation
 */
export function buildOwnerAlertUrl({ ownerPhone, order }) {
  const phone = normalizeWaPhone(ownerPhone);
  const text = `🔔 *CONFIRMACIÓN DE VENTA - BOBINAS EXPRESS*\n\n` +
    `🧾 *Orden:* #${order.orderId}\n` +
    `👤 *Cliente:* ${order.customerName} (${order.customerPhone})\n` +
    `🔩 *Producto:* ${order.qty}x ${order.coilName} (OEM: ${order.oem})\n` +
    `💵 *Monto Total:* $${Number(order.totalPrice).toFixed(2)} USD\n` +
    `💳 *Pago:* ${order.paymentRef}\n` +
    `📦 *Stock Actualizado en DB:* Antes ${order.stockBefore} uds ➔ *Ahora ${order.stockAfter} uds*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds pre-order WhatsApp message for out-of-stock coils
 */
export function buildPreOrderUrl({ targetPhone, product, customerName }) {
  const phone = normalizeWaPhone(targetPhone);
  const text = `⚡ *SOLICITUD DE ENCARGO / RESERVA BAJO PEDIDO*\n\n` +
    `👤 *Cliente:* ${customerName || 'Cliente WhatsApp'}\n` +
    `• *Pieza solicitada:* ${product.name}\n` +
    `• *Código OEM:* ${product.oem}\n` +
    `• *Modelo / Motor:* ${product.carModel} (${product.engine})\n` +
    `• *Precio de lista:* $${Number(product.price).toFixed(2)} USD\n\n` +
    `Deseo consultar fecha estimada de llegada y condiciones para encargarla al 0412-6497478.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
