import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { getEngineLabel } from '../../utils/formatters';
import { normalizeWaPhone } from '../../utils/whatsapp';

export function TopNoticeBar() {
  const { dbEngine, coils, ownerSettings } = useInventory();
  const { isAdmin } = useAuth();

  const handleOpenWhatsApp = () => {
    const phone = normalizeWaPhone(ownerSettings.ownerPhone);
    const text = encodeURIComponent('¡Hola! Me comunico desde Bobinas Express para consultar disponibilidad de repuestos.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <aside aria-label="Estado del sistema" className="bg-gradient-to-r from-red-700 via-brand-600 to-red-800 text-xs py-1.5 px-4 text-center font-medium flex flex-wrap items-center justify-center gap-2 text-white shadow-sm">
      <span className="flex h-2 w-2 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
      </span>

      <span>
        ⚡ <strong>Despachos Inmediatos a Todo el País</strong> | Contacto oficial por{' '}
        <button 
          onClick={handleOpenWhatsApp}
          className="underline font-bold hover:text-emerald-200 transition cursor-pointer inline-flex items-center gap-1 ml-0.5"
          title="Abrir chat en WhatsApp"
        >
          <i className="fa-brands fa-whatsapp text-sm"></i>
          <span>WhatsApp</span>
        </button>
      </span>

      {/* Only show DB & Admin Status when user is logged in as Admin */}
      {isAdmin && (
        <>
          <span className="hidden md:inline-flex items-center gap-1.5 bg-black/25 px-2.5 py-0.5 rounded-full text-[11px] text-red-100 border border-white/15">
            <i className="fa-solid fa-database text-[10px] text-emerald-300"></i>
            <span>DB: {getEngineLabel(dbEngine)} ({coils.length} items)</span>
          </span>

          <span className="inline-flex items-center gap-1.5 bg-slate-950/50 px-2.5 py-0.5 rounded-full text-[11px] text-white border border-white/20">
            <i className="fa-solid fa-unlock-keyhole text-emerald-400 text-[10px]"></i>
            <span>🔐 Administrador Activo</span>
          </span>
        </>
      )}
    </aside>
  );
}
