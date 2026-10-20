import React from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatUSD } from '../../utils/formatters';

export function CoilCard({ coil, onAskAI, onEditProduct }) {
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();

  const primaryOem = (coil.oem || '').split('/')[0].trim();

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 hover:border-brand-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-brand-500/10 transition-all duration-300 group">
      <div>
        {/* Badge & Stock Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30">
            {coil.badge || 'OEM Spec'}
          </span>
          <div className={`flex items-center gap-1.5 text-xs ${coil.stock > 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium`}>
            <span className={`h-2 w-2 rounded-full ${coil.stock > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
            <span>{coil.stock > 0 ? `${coil.stock} en stock` : 'Agotado (0)'}</span>
          </div>
        </div>

        {/* Product Visual Header / Image or Icon */}
        <div className="h-40 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/60 flex flex-col items-center justify-center p-2 text-center mb-4 relative overflow-hidden group-hover:border-slate-600 transition">
          {coil.image ? (
            <img 
              src={coil.image} 
              alt={coil.name} 
              className="h-full w-full object-contain drop-shadow group-hover:scale-105 transition duration-300"
              onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className={`h-full w-full flex-col items-center justify-center ${coil.image ? 'hidden' : 'flex'}`}>
            <i className={`fa-solid fa-car-battery text-4xl ${coil.stock > 0 ? 'text-brand-500/80' : 'text-slate-600'} mb-2 group-hover:scale-110 transition duration-300`}></i>
          </div>
          <span className="absolute bottom-1.5 right-2 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700 shadow">
            OEM: {primaryOem}
          </span>
          <span className="absolute top-2 right-2 text-[10px] font-semibold text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/80 shadow">
            <i className="fa-solid fa-shield text-rose-400 mr-1"></i>{coil.warranty || '12 meses'}
          </span>
          <span className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            {coil.id}
          </span>
        </div>

        {/* Titles & Compatibility */}
        <div className="space-y-1 mb-3">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">{coil.brand}</span>
          <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition leading-snug">
            {coil.name}
          </h3>
          <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
            <i className="fa-solid fa-car-side text-slate-400 text-[11px]"></i>
            <span>{coil.carModel}</span>
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <i className="fa-solid fa-gears text-slate-500 text-[11px]"></i>
            <span className="font-mono text-[11px]">{coil.engine}</span>
          </p>
        </div>

        {/* Specs tag pills */}
        <div className="flex flex-wrap gap-1.5 my-3 text-[10px]">
          <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700/60">{coil.connector}</span>
          <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-700/60">{coil.type}</span>
        </div>
      </div>

      {/* Price & Actions Footer */}
      <div className="pt-4 border-t border-slate-700/70 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-extrabold text-white font-mono">{formatUSD(coil.price)}</span>
            <span className="text-xs text-slate-400 line-through ml-1 font-mono">{formatUSD(coil.oldPrice || coil.price * 1.2)}</span>
          </div>

          {/* Only visible when Admin is logged in */}
          {isAdmin && (
            <button 
              onClick={() => onEditProduct(coil)}
              className="text-[11px] text-slate-400 hover:text-sky-400 transition flex items-center gap-1 cursor-pointer" 
              title="Editar en Base de Datos (Solo Admin)"
            >
              <i className="fa-solid fa-lock-open text-emerald-400 text-[9px]"></i> Editar DB
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => addToCart(coil.id)} 
            disabled={coil.stock <= 0}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition ${
              coil.stock > 0 
                ? 'bg-brand-500 hover:bg-brand-600 text-white cursor-pointer active:scale-95' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <i className={`fa-solid ${coil.stock > 0 ? 'fa-cart-plus' : 'fa-ban'}`}></i>
            <span>{coil.stock > 0 ? 'Agregar' : 'Sin Stock'}</span>
          </button>

          <button 
            onClick={() => onAskAI(coil)}
            className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <i className="fa-brands fa-whatsapp text-sm"></i>
            <span>Consultar IA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
