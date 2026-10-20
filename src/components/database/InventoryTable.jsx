import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { formatUSD } from '../../utils/formatters';

export function InventoryTable({ onEditCoil, onDeleteCoil }) {
  const { coils } = useInventory();
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');

  const brands = Array.from(new Set(coils.map(c => c.brand))).sort();

  const filtered = coils.filter(b => {
    if (brandFilter !== 'ALL' && b.brand !== brandFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.carModel.toLowerCase().includes(q) ||
        b.oem.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl space-y-4">
      {/* Search & Brand Filter Bar */}
      <div className="p-4 bg-slate-850 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-database text-sky-400"></i>
          <h3 className="text-sm font-bold text-white">Inventario de Bobinas en Base de Datos</h3>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {filtered.length} referencias
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por código, auto, OEM..." 
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />

          <select 
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">Todas las marcas</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
            <tr>
              <th className="py-3 px-4">Código / ID</th>
              <th className="py-3 px-4">Marca & Repuesto</th>
              <th className="py-3 px-4">Vehículos Compatibles</th>
              <th className="py-3 px-4">Motor</th>
              <th className="py-3 px-4">Código OEM</th>
              <th className="py-3 px-4">Conector</th>
              <th className="py-3 px-4">Precio</th>
              <th className="py-3 px-4 text-center">Stock Actual</th>
              <th className="py-3 px-4">Garantía</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-8 text-center text-slate-500">
                  No se encontraron bobinas en el inventario.
                </td>
              </tr>
            ) : (
              filtered.map(coil => (
                <tr key={coil.id} className="hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">
                    {coil.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {coil.image ? (
                          <img 
                            src={coil.image} 
                            alt={coil.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-slate-500 text-xs ${coil.image ? 'hidden' : 'flex'}`}>
                          <i className="fa-solid fa-car-battery text-brand-400"></i>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-brand-400 block">{coil.brand}</span>
                        <span className="font-semibold text-white truncate block max-w-xs">{coil.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                    {coil.carModel}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {coil.engine}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                    {coil.oem}
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {coil.connector}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-brand-400 whitespace-nowrap">
                    {formatUSD(coil.price)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      coil.stock > 0 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {coil.stock} uds
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {coil.warranty}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                    <button 
                      onClick={() => onEditCoil(coil)}
                      className="p-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 rounded-lg text-xs transition"
                      title="Editar registro"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button 
                      onClick={() => onDeleteCoil(coil.id)}
                      className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs transition"
                      title="Eliminar registro"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
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
