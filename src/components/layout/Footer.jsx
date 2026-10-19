import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { getEngineLabel } from '../../utils/formatters';

export function Footer() {
  const { dbEngine, coils } = useInventory();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-8 px-4 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Bobinas Express &copy; {new Date().getFullYear()}</p>
            <p className="text-[11px] text-slate-500">Distribución de bobinas de encendido automotriz directas de importación</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <i className="fa-brands fa-whatsapp text-sm"></i>
            WhatsApp Ventas: <strong>0412-6497478</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            <i className="fa-solid fa-database mr-1 text-sky-400"></i>
            {getEngineLabel(dbEngine)} ({coils.length} bobinas activas)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            <i className="fa-solid fa-clock mr-1 text-amber-400"></i>
            Lunes a Sábado: 8:00 AM - 6:00 PM
          </span>
        </div>
      </div>
    </footer>
  );
}
