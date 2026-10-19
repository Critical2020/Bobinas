import React from 'react';

export function ChatQuickPrompts({ onSelectPrompt }) {
  const prompts = [
    { label: 'Captiva 3.2', query: '¿Tienen la bobina de Captiva 3.2 V6 disponible?' },
    { label: 'Corsa 1.6', query: '¿Precio y garantía de la bobina de Corsa 1.6?' },
    { label: 'Cierre Venta Aveo', query: 'Quiero comprar 1 bobina de Aveo 1.6, pago móvil ref 982134' },
    { label: 'Consultar Stock General', query: '¿Qué bobinas tienen en stock inmediato?' },
    { label: 'Toyota Corolla', query: '¿Tienen bobina Toyota Corolla 1ZZ-FE?' },
    { label: 'DFSK 1.6', query: '¿Tienen para Dong Feng 1.6?' }
  ];

  return (
    <div className="p-3 bg-slate-900 border-t border-slate-700/60 overflow-x-auto">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
          <i className="fa-solid fa-wand-magic-sparkles text-amber-400 text-[10px]"></i> Consultas rápidas:
        </span>
        {prompts.map(p => (
          <button 
            key={p.label}
            onClick={() => onSelectPrompt(p.query)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition whitespace-nowrap text-[11px] cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
