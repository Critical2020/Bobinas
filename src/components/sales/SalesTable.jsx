import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { buildOwnerAlertUrl } from '../../utils/whatsapp';
import { formatUSD } from '../../utils/formatters';

export function SalesTable() {
  const { salesHistory, revertSale, ownerSettings } = useInventory();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredOrders = salesHistory.filter(ord => {
    if (filter === 'CONFIRMED' && ord.status !== 'CONFIRMED') return false;
    if (filter === 'REVERTED' && ord.status !== 'REVERTED') return false;
    if (filter === 'PENDING' && ord.status !== 'PENDING_APPROVAL') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ord.orderId.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.coilName.toLowerCase().includes(q) ||
        (ord.paymentRef || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleNotifyOwner = (order) => {
    const url = buildOwnerAlertUrl({
      ownerPhone: ownerSettings.ownerPhone,
      order
    });
    window.open(url, '_blank');
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl space-y-4">
      {/* Table Filter Header */}
      <div className="p-4 bg-slate-850 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-list-check text-brand-400"></i>
          <h3 className="text-sm font-bold text-white">Registro de Órdenes y Ventas WhatsApp</h3>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {filteredOrders.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por orden, cliente, bobina..." 
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />

          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">Todas las órdenes</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="PENDING">Pendientes</option>
            <option value="REVERTED">Revertidas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
            <tr>
              <th className="py-3 px-4">Orden</th>
              <th className="py-3 px-4">Fecha / Hora</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Repuesto & OEM</th>
              <th className="py-3 px-4 text-center">Cant.</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Stock DB (Antes ➔ Ahora)</th>
              <th className="py-3 px-4">Pago / Ref</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-8 text-center text-slate-500">
                  No se encontraron ventas con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredOrders.map(ord => (
                <tr key={ord.orderId} className="hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-brand-400">
                    #{ord.orderId}
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {ord.timestamp}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    <div>{ord.customerName}</div>
                    <div className="text-[10px] text-slate-400">{ord.customerPhone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-white font-semibold truncate max-w-xs">{ord.coilName}</div>
                    <div className="text-[10px] font-mono text-slate-400">OEM: {ord.oem}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-white">
                    {ord.qty}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {formatUSD(ord.totalPrice)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                    <span className="text-rose-400">{ord.stockBefore}</span>
                    <span className="text-slate-500 mx-1">➔</span>
                    <span className="text-emerald-400 font-bold">{ord.stockAfter} uds</span>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-300">
                    {ord.paymentRef}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {ord.status === 'CONFIRMED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        CONFIRMADA
                      </span>
                    )}
                    {ord.status === 'REVERTED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        REVERTIDA
                      </span>
                    )}
                    {ord.status === 'PENDING_APPROVAL' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        PENDIENTE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                    <button 
                      onClick={() => handleNotifyOwner(ord)}
                      className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg text-xs transition"
                      title="Reenviar comprobante a WhatsApp del Dueño"
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                    </button>
                    {ord.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => revertSale(ord.orderId)}
                        className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs transition"
                        title="Revertir venta y reintegrar piezas al stock"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
