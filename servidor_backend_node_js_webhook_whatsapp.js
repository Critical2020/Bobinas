/**
 * SERVIDOR BACKEND NODE.JS: WEBHOOK OFICIAL DE WHATSAPP + CONECTOR MULTI-DB
 * Teléfono Oficial del Dueño para Confirmaciones: 0412-6497478 (+584126497478)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OWNER_WHATSAPP_NUMBER = process.env.OWNER_WA_PHONE || '584126497478';
const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || 'BOBINAS_AI_SECURE_TOKEN_2026';

// Inicialización de Supabase (PostgreSQL)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// 1. Verificación del Webhook de Meta WhatsApp Cloud API
app.get('/v1/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook de WhatsApp verificado correctamente');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2. Recepción de mensajes de clientes y cierre de ventas automático
app.post('/v1/webhook/whatsapp', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const customerPhone = message.from;
    const customerText = message.text.body.trim();
    const lowerText = customerText.toLowerCase();

    // Detectar si el cliente está enviando confirmación de pago / compra
    const isPurchaseConfirmation =
      lowerText.includes('quiero comprar') ||
      lowerText.includes('confirmo compra') ||
      lowerText.includes('ya pague') ||
      lowerText.includes('ya pagué') ||
      lowerText.includes('pago movil') ||
      lowerText.includes('ref');

    if (supabase) {
      // Buscar bobina mencionada por el cliente
      const { data: coils } = await supabase
        .from('bobinas_inventario')
        .select('*')
        .or(`name.ilike.%${customerText}%,car_model.ilike.%${customerText}%,oem.ilike.%${customerText}%`)
        .limit(1);

      const matchedCoil = coils?.[0];

      if (isPurchaseConfirmation && matchedCoil && matchedCoil.stock > 0) {
        const newStock = Math.max(0, matchedCoil.stock - 1);
        const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

        // 1. Descontar stock en la base de datos
        await supabase
          .from('bobinas_inventario')
          .update({ stock: newStock })
          .eq('id', matchedCoil.id);

        // 2. Registrar la venta en la tabla de órdenes
        await supabase.from('ventas_ordenes').insert([
          {
            order_id: orderId,
            coil_id: matchedCoil.id,
            coil_name: matchedCoil.name,
            oem: matchedCoil.oem,
            customer_name: 'Cliente WhatsApp',
            customer_phone: customerPhone,
            qty: 1,
            unit_price: matchedCoil.price,
            total_price: matchedCoil.price,
            stock_before: matchedCoil.stock,
            stock_after: newStock,
            payment_ref: customerText,
            status: 'CONFIRMED',
            owner_notified_wa: OWNER_WHATSAPP_NUMBER
          }
        ]);

        // 3. Responder al cliente confirmando su compra
        await sendWhatsAppText(
          customerPhone,
          `🎉 *¡COMPRA CONFIRMADA! (#${orderId})*\n\n` +
            `• *Repuesto:* 1x ${matchedCoil.name}\n` +
            `• *Total:* $${matchedCoil.price} USD\n` +
            `• *Stock Restante en Almacén:* ${newStock} uds\n\n` +
            `Ya notificamos a administración (0412-6497478) para despachar tu pedido.`
        );

        // 4. Enviar confirmación inmediata al WhatsApp del dueño (0412-6497478)
        await sendWhatsAppText(
          OWNER_WHATSAPP_NUMBER,
          `🔔 *CONFIRMACIÓN DE VENTA - BOBINAS EXPRESS*\n\n` +
            `🧾 *Orden:* #${orderId}\n` +
            `👤 *Cliente:* +${customerPhone}\n` +
            `🔩 *Bobina:* 1x ${matchedCoil.name} (OEM: ${matchedCoil.oem})\n` +
            `💵 *Monto:* $${matchedCoil.price} USD\n` +
            `📩 *Mensaje/Ref:* ${customerText}\n` +
            `📉 *Stock en DB:* Antes ${matchedCoil.stock} ➔ *Ahora ${newStock} uds*`
        );

        return res.sendStatus(200);
      }

      // Consulta normal de disponibilidad y precio
      if (matchedCoil) {
        const reply =
          matchedCoil.stock > 0
            ? `✅ *¡Disponible en Stock Inmediato!*\n\n` +
              `🔩 *${matchedCoil.name}*\n` +
              `🚗 *Aplicación:* ${matchedCoil.car_model}\n` +
              `⚙️ *Motor:* ${matchedCoil.engine}\n` +
              `💲 *Precio:* $${matchedCoil.price} USD\n` +
              `📦 *Stock verificado:* ${matchedCoil.stock} unidades\n` +
              `🔖 *Código OEM:* ${matchedCoil.oem}\n\n` +
              `Responde con *"Quiero comprar + tu referencia de pago"* para reservarla y descontarla del inventario.`
            : `⚠️ La *${matchedCoil.name}* (OEM: ${matchedCoil.oem}) se encuentra temporalmente con *Stock: 0 unidades*. ¿Deseas encargarla bajo pedido al 0412-6497478?`;

        await sendWhatsAppText(customerPhone, reply);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Error en Webhook WhatsApp:', error);
    return res.sendStatus(500);
  }
});

async function sendWhatsAppText(toPhone, textBody) {
  if (!process.env.WA_PHONE_NUMBER_ID || !process.env.WA_ACCESS_TOKEN) {
    console.log(`[SIMULACIÓN ENVÍO WA -> ${toPhone}]:\n${textBody}\n`);
    return;
  }
  await fetch(`https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone.replace(/[^0-9]/g, ''),
      text: { body: textBody }
    })
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Bobinas Express activo en puerto ${PORT} | WA Dueño: 0412-6497478`);
});