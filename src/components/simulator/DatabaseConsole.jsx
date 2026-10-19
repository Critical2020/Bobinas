import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { getEngineLabel } from '../../utils/formatters';

export function DatabaseConsole({ logs, onClearLogs }) {
  const { dbEngine } = useInventory();

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[580px] overflow-hidden shadow-xl">
      {/* Console Header */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-terminal text-sky-400 text-xs"></i>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Consola SQL & Queries en Vivo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {getEngineLabel(dbEngine)}
          </span>
          <button 
            onClick={onClearLogs}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-2 select-text">
        <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800/80">
          // Monitoreo en tiempo real de transacciones y búsquedas ejecutadas por el Agente IA
        </div>

        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-16">
            <i className="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
            <p>Esperando mensajes del chat para consultar la base de datos...</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="p-2 bg-slate-900/60 rounded border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-emerald-400 font-semibold">{log.time}</span>
                <span className="text-amber-300">{log.latency}ms</span>
              </div>
              <div className="text-sky-300 break-all font-medium">
                &gt; {log.query}
              </div>
              <div className="text-slate-400 text-[10px] flex items-center gap-2">
                <span>Resultados: <strong className="text-white">{log.count}</strong> filas</span>
                <span>• Motor: {log.engine}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
