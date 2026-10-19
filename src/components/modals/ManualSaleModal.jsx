import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { formatUSD } from '../../utils/formatters';

export function ManualSaleModal({ isOpen, onClose }) {
  const { coils, processSaleTransaction } = useInventory();
  const { deviceId } = useAuth();

  const [form, setForm] = useState({
    coilId: coils[0]?.id || '',
    qty: 1,
    customerName: '',
    customerPhone: '',
    paymentMethod: 'Pago Móvil Interbancario',
    paymentRef: ''
  });

  if (!isOpen) return null;

  const selectedCoil = coils.find(c => c.id === form.coilId) || coils[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCoil) return;

    processSaleTransaction({
      coilId: selectedCoil.id,
      qty: parseInt(form.qty, 10) || 1,
      customerName: form.customerName.trim() || 'Venta Manual Almacén',
      customerPhone: form.customerPhone.trim() || 'WhatsApp',
      paymentRef: `${form.paymentMethod} (${form.paymentRef.trim() || 'PAGO DIRECTO'})`,
      userId: deviceId
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-cash-register text-emerald-400"></i>
            <span>Registrar Venta Manual / Descuento Directo</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Resta unidades del inventario en vivo y emite confirmación de despacho al teléfono del dueño.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Product Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Seleccionar Bobina *
            </label>
            <select 
              value={form.coilId}
              onChange={(e) => setForm(prev => ({ ...prev, coilId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {coils.map(b => (
                <option key={b.id} value={b.id} disabled={b.stock <= 0}>
                  {b.name} ({formatUSD(b.price)}) - Stock: {b.stock} uds
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Cantidad a Vender *
              </label>
              <input 
                type="number" 
                min={1}
                max={selectedCoil ? selectedCoil.stock : 99}
                value={form.qty}
                onChange={(e) => setForm(prev => ({ ...prev, qty: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Monto Total Estimado
              </label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-400">
                {selectedCoil ? formatUSD(selectedCoil.price * form.qty) : '$0.00'} USD
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Nombre del Cliente
              </label>
              <input 
                type="text" 
                value={form.customerName}
                onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Ej: Taller Mecánico San José" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Teléfono WhatsApp
              </label>
              <input 
                type="text" 
                value={form.customerPhone}
                onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="0414-1234567" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Método de Pago *
              </label>
              <select 
                value={form.paymentMethod}
                onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Pago Móvil Interbancario">Pago Móvil</option>
                <option value="Zelle USD">Zelle USD</option>
                <option value="Binance Pay (USDT)">Binance Pay</option>
                <option value="Efectivo USD en Almacén">Efectivo USD</option>
                <option value="Transferencia Bancaria">Transferencia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Referencia de Pago *
              </label>
              <input 
                type="text" 
                value={form.paymentRef}
                onChange={(e) => setForm(prev => ({ ...prev, paymentRef: e.target.value }))}
                placeholder="REF-894129" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!selectedCoil || selectedCoil.stock <= 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/30"
            >
              Confirmar y Descontar Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
