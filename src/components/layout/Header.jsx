import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useInventory } from '../../context/InventoryContext';
import { normalizeWaPhone } from '../../utils/whatsapp';

export function Header({ activeTab, setActiveTab }) {
  const { isAdmin, openAuthModal, logout, requireAdminAuth } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const { salesHistory, ownerSettings } = useInventory();

  const handleNavClick = (tabKey) => {
    if (['sales', 'database', 'admin'].includes(tabKey) && !isAdmin) {
      requireAdminAuth(() => setActiveTab(tabKey));
      return;
    }
    setActiveTab(tabKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDirectWhatsApp = () => {
    const phone = normalizeWaPhone(ownerSettings.ownerPhone);
    const text = encodeURIComponent('¡Hola! Me comunico desde la plataforma de Bobinas Express para consultar disponibilidad de repuestos.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <header className="bg-slate-800/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-700/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div 
          className="flex items-center gap-3 shrink-0 cursor-pointer" 
          onClick={() => setActiveTab('catalog')}
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-rose-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
            <i className="fa-solid fa-bolt text-lg"></i>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
              BOBINAS<span className="text-brand-500">EXPRESS</span>
            </span>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
              Especialistas en Encendido
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-700/60 overflow-x-auto max-w-full">
          {/* Always visible for all users */}
          <button 
            onClick={() => handleNavClick('catalog')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <i className="fa-solid fa-car-battery"></i>
            <span>Catálogo</span>
          </button>

          <button 
            onClick={() => handleNavClick('simulator')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap relative cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <i className="fa-brands fa-whatsapp text-emerald-400"></i>
            <span>Agente IA WhatsApp</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {/* Protected Tabs: ONLY VISIBLE WHEN USER IS ADMIN */}
          {isAdmin && (
            <>
              <button 
                onClick={() => handleNavClick('sales')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'sales'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className="fa-solid fa-cash-register text-rose-400"></i>
                <span className="hidden sm:inline">Ventas & Auditoría</span>
                <span className="sm:hidden">Ventas</span>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {salesHistory.length}
                </span>
              </button>

              <button 
                onClick={() => handleNavClick('database')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className="fa-solid fa-database text-sky-400"></i>
                <span className="hidden md:inline">Base de Datos & Stock</span>
                <span className="md:hidden">Stock DB</span>
              </button>

              <button 
                onClick={() => handleNavClick('admin')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className="fa-solid fa-sliders"></i>
                <span className="hidden xl:inline">Configurar IA</span>
              </button>
            </>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Admin Auth Pill Button */}
          {isAdmin ? (
            <button 
              onClick={logout}
              className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Cerrar sesión de Administrador"
            >
              <i className="fa-solid fa-unlock-keyhole text-emerald-400"></i>
              <span className="hidden sm:inline">Admin Activo</span>
            </button>
          ) : (
            <button 
              onClick={() => openAuthModal()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Acceso exclusivo para el Administrador"
            >
              <i className="fa-solid fa-user-shield text-rose-400"></i>
              <span className="hidden sm:inline">Acceso Admin</span>
            </button>
          )}

          {/* WhatsApp Direct - Displays only "WhatsApp" and opens wa.me link */}
          <button 
            onClick={handleOpenDirectWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Abrir chat en WhatsApp"
          >
            <i className="fa-brands fa-whatsapp text-sm"></i>
            <span>WhatsApp</span>
          </button>

          {/* Cart Drawer Trigger */}
          <button 
            onClick={toggleCart}
            className="relative p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl transition shadow flex items-center justify-center cursor-pointer"
            title="Ver Mi Carrito de Compra"
          >
            <i className="fa-solid fa-cart-shopping"></i>
            <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
