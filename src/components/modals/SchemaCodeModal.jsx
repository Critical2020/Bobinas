import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useInventory } from '../../context/InventoryContext';

export function SchemaCodeModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const { ownerSettings } = useInventory();
  const [activeTab, setActiveTab] = useState('supabase');

  if (!isOpen) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Código copiado al portapapeles');
  };

  const getCodeContent = () => {
    switch (activeTab) {
      case 'supabase':
        return `-- ============================================================
-- 1. SUPABASE / POSTGRESQL DDL + TABLA DE VENTAS Y FUNCIÓN RPC
-- Bobinas Express (Teléfono Dueño: ${ownerSettings.ownerPhone})
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bobinas_inventario (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  car_model TEXT NOT NULL,
  engine TEXT NOT NULL,
  oem TEXT NOT NULL,
  type TEXT DEFAULT 'Tipo Lápiz Individual',
  connector TEXT DEFAULT '4 Pines',
  price NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  old_price NUMERIC(10,2) DEFAULT 32.00,
  stock INTEGER NOT NULL DEFAULT 0,
  warranty TEXT DEFAULT '12 meses',
  badge TEXT DEFAULT 'OEM Spec',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para registrar cada venta cerrada por WhatsApp IA
CREATE TABLE IF NOT EXISTS public.ventas_ordenes (
  order_id TEXT PRIMARY KEY,
  coil_id TEXT REFERENCES public.bobinas_inventario(id),
  customer_name TEXT,
  customer_phone TEXT,
  qty INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  payment_ref TEXT,
  stock_before INTEGER,
  stock_after INTEGER,
  status TEXT DEFAULT 'CONFIRMED',
  owner_notified_wa TEXT DEFAULT '${ownerSettings.ownerPhone}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función Transaccional RPC para descontar stock de forma atómica al vender por WhatsApp
CREATE OR REPLACE FUNCTION public.confirmar_venta_bobina(
  p_order_id TEXT,
  p_coil_id TEXT,
  p_qty INTEGER,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_payment_ref TEXT
) RETURNS JSON AS $$
DECLARE
  v_coil RECORD;
  v_new_stock INTEGER;
BEGIN
  SELECT * INTO v_coil FROM public.bobinas_inventario WHERE id = p_coil_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bobina no encontrada';
  END IF;
  IF v_coil.stock < p_qty THEN
    RAISE EXCEPTION 'Stock insuficiente (% disponibles)', v_coil.stock;
  END IF;

  v_new_stock := v_coil.stock - p_qty;

  UPDATE public.bobinas_inventario
  SET stock = v_new_stock, updated_at = NOW()
  WHERE id = p_coil_id;

  INSERT INTO public.ventas_ordenes (
    order_id, coil_id, customer_name, customer_phone, qty,
    total_price, payment_ref, stock_before, stock_after, status
  ) VALUES (
    p_order_id, p_coil_id, p_customer_name, p_customer_phone, p_qty,
    (v_coil.price * p_qty), p_payment_ref, v_coil.stock, v_new_stock, 'CONFIRMED'
  );

  RETURN json_build_object(
    'success', true,
    'order_id', p_order_id,
    'coil_name', v_coil.name,
    'total_usd', (v_coil.price * p_qty),
    'stock_after', v_new_stock
  );
END;
$$ LANGUAGE plpgsql;`;

      case 'mysql':
        return `-- ============================================================
-- 2. MYSQL / MARIADB DDL SCRIPT COMPLETO
-- Bobinas Express (Teléfono Dueño: ${ownerSettings.ownerPhone})
-- ============================================================
CREATE TABLE IF NOT EXISTS bobinas_inventario (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  brand VARCHAR(60) NOT NULL,
  car_model VARCHAR(180) NOT NULL,
  engine VARCHAR(100) NOT NULL,
  oem VARCHAR(150) NOT NULL,
  type VARCHAR(100) DEFAULT 'Tipo Lápiz Individual',
  connector VARCHAR(80) DEFAULT 'Conector 4 Pines',
  price DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  old_price DECIMAL(10,2) DEFAULT 32.00,
  stock INT NOT NULL DEFAULT 0,
  warranty VARCHAR(40) DEFAULT '12 meses',
  badge VARCHAR(50) DEFAULT 'OEM Spec',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ventas_ordenes (
  order_id VARCHAR(32) PRIMARY KEY,
  coil_id VARCHAR(32) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  payment_ref VARCHAR(120),
  status VARCHAR(30) DEFAULT 'CONFIRMED',
  owner_notified_wa VARCHAR(30) DEFAULT '${ownerSettings.ownerPhone}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coil_id) REFERENCES bobinas_inventario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

      case 'mongodb':
        return `// ============================================================
// 3. MONGODB ATLAS COLECCIÓN BSON / JSON
// Base de Datos: 'bobinas_express' | Colección: 'bobinas_inventario'
// ============================================================
[
  {
    "_id": { "$oid": "664c1234abcd0001" },
    "id": "BOB-CAP32",
    "name": "Bobina de Encendido Chevrolet Captiva 3.2 V6 Alloytec",
    "brand": "Chevrolet",
    "carModel": "Captiva Sport 3.2L V6 (2008 - 2015)",
    "engine": "3.2L V6 24V High Feature",
    "oem": "12618542 / 12590990 / UF569",
    "type": "Tipo Lápiz Individual (COP)",
    "connector": "Conector 4 Pines",
    "price": 32.00,
    "oldPrice": 39.50,
    "stock": 18,
    "inStock": true,
    "warranty": "12 meses",
    "badge": "Más Vendida"
  },
  {
    "_id": { "$oid": "664c1234abcd0002" },
    "id": "BOB-CORSA1416",
    "name": "Bobina de Encendido Chevrolet Corsa 1.4 / 1.6 / Chevy",
    "brand": "Chevrolet",
    "carModel": "Corsa, Chevy C2, Montana, Meriva (1998 - 2012)",
    "engine": "1.4L / 1.6L 8V MPFI",
    "oem": "10450424 / 93230798",
    "type": "Paquete Múltiple 4 Torres",
    "connector": "Conector 4 Pines Plano",
    "price": 34.00,
    "oldPrice": 42.00,
    "stock": 22,
    "inStock": true,
    "warranty": "12 meses",
    "badge": "Original Delphi Spec"
  }
]`;

      case 'nodejs':
        return `// ============================================================
// 4. SERVIDOR NODE.JS EXPRESS: WEBHOOK META WHATSAPP CLOUD API
// Teléfono Dueño para Alertas: ${ownerSettings.ownerPhone}
// ============================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || 'BOBINAS_AI_SECURE_TOKEN_2026';
const OWNER_WA = process.env.OWNER_WA || '${ownerSettings.ownerPhone}';

// 1. Verificación del Webhook por Meta
app.get('/v1/webhook/whatsapp', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  return res.sendStatus(403);
});

app.listen(4000, () => console.log('🚀 Webhook WhatsApp Bobinas Express listo en puerto 4000'));`;
      default:
        return '';
    }
  };

  const currentCode = getCodeContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-code text-purple-400 text-lg"></i>
            <h3 className="text-base font-bold text-white">
              Esquemas de Base de Datos & Webhooks DDL
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'supabase', label: 'Supabase (PostgreSQL)' },
            { id: 'mysql', label: 'MySQL / MariaDB' },
            { id: 'mongodb', label: 'MongoDB Atlas' },
            { id: 'nodejs', label: 'Node.js Webhook Server' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-brand-500 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code display */}
        <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed select-text whitespace-pre">
          {currentCode}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Compatible con PostgreSQL 14+, MySQL 8.0, MongoDB 6+
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => copyToClipboard(currentCode)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <i className="fa-solid fa-copy"></i> Copiar Código
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
