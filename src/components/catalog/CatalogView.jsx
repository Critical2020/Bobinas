import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CoilCard } from './CoilCard';
import { CatalogFilters } from './CatalogFilters';

export function CatalogView({ onNavigateTab, onAskAIAboutCoil, onEditCoil }) {
  const { coils, isDbLoading, dbEngine } = useInventory();
  const { toggleCart } = useCart();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  // Extract unique brands dynamically from active database
  const brands = useMemo(() => {
    const set = new Set();
    coils.forEach(c => {
      if (c.brand) set.add(c.brand.trim());
    });
    return Array.from(set).sort();
  }, [coils]);

  // Filter coils
  const filteredCoils = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return coils.filter(item => {
      const matchesQuery = !q ||
        item.name.toLowerCase().includes(q) ||
        item.carModel.toLowerCase().includes(q) ||
        item.engine.toLowerCase().includes(q) ||
        item.oem.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      const matchesBrand = (selectedBrand === 'ALL') || (item.brand.toLowerCase() === selectedBrand.toLowerCase());

      let matchesStock = true;
      if (stockFilter === 'IN_STOCK') {
        matchesStock = item.stock > 0;
      } else if (stockFilter === 'OUT_OF_STOCK') {
        matchesStock = item.stock <= 0;
      } else if (stockFilter === 'PROMO') {
        matchesStock = item.badge === 'Oferta' || item.price < item.oldPrice;
      }

      return matchesQuery && matchesBrand && matchesStock;
    });
  }, [coils, searchQuery, selectedBrand, stockFilter]);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 border border-slate-700/80 p-5 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <i className="fa-solid fa-circle-check"></i> Stock Conectado en Tiempo Real
            </div>

            {/* Only visible when Admin */}
            {isAdmin && (
              <button 
                onClick={() => onNavigateTab('database')} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold transition cursor-pointer"
              >
                <i className="fa-solid fa-server"></i>
                <span>Gestión de Base de Datos</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bobinas de Encendido <span className="text-brand-500">Originales & OEM</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Especialistas en bobinas tipo Lápiz, Riel múltiple y Módulo para Chevrolet, Ford, Toyota, Hyundai, Nissan, Renault y más. Consulta disponibilidad inmediata o escribe a nuestro <strong>Asesor por WhatsApp</strong>.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button 
              onClick={toggleCart} 
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-500/20 transition cursor-pointer"
            >
              <i className="fa-solid fa-cart-shopping"></i> Ver Mi Carrito y Comprar
            </button>

            <div className="px-4 py-2 bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <i className="fa-brands fa-whatsapp text-base"></i>
              <span>¿Dudas? El asesor IA está en la esquina inferior derecha →</span>
            </div>

            {/* Admin Panel button - ONLY VISIBLE IF IS ADMIN */}
            {isAdmin && (
              <button 
                onClick={() => onNavigateTab('database')} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-red-300 font-semibold rounded-xl text-xs sm:text-sm border border-red-500/40 flex items-center gap-2 transition cursor-pointer"
              >
                <i className="fa-solid fa-sliders"></i> Panel Administrador (Stock / DB)
              </button>
            )}
          </div>
        </div>

        <div className="absolute -right-8 -bottom-10 opacity-20 lg:opacity-30 pointer-events-none text-slate-100">
          <i className="fa-solid fa-car-battery text-[120px] sm:text-[240px]"></i>
        </div>
      </div>

      {/* Search & Filters */}
      <CatalogFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        brands={brands}
        onQuickSearch={(tag) => setSearchQuery(tag)}
      />

      {/* Results Header Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <p className="text-xs text-slate-400">
          Mostrando <strong className="text-white">{filteredCoils.length}</strong> de {coils.length} bobinas registradas
        </p>
      </div>

      {/* Grid of Products or Empty/Loading State */}
      {isDbLoading ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3 animate-fade-in">
          <div className="h-10 w-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-sm font-bold text-white">Consultando base de datos ({dbEngine.toUpperCase()})...</h3>
          <p className="text-xs text-slate-400">Verificando elementos e inventario en tiempo real.</p>
        </div>
      ) : coils.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="h-16 w-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto text-slate-400 text-2xl">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h3 className="text-lg font-bold text-white">Inventario vacío (0 bobinas)</h3>
          <p className="text-xs text-slate-400">
            {isAdmin 
              ? 'Has vaciado los artículos de la Base de Datos. Puedes ingresar nuevas bobinas desde la sección de Base de Datos, importar un archivo CSV o restaurar las referencias de demostración.'
              : 'Actualmente no hay bobinas en el catálogo. Estamos actualizando el inventario en tiempo real. Escríbenos por WhatsApp para consultar existencia de piezas.'}
          </p>
          {isAdmin && (
            <div className="flex justify-center gap-2 pt-2">
              <button 
                onClick={() => onNavigateTab('database')}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <i className="fa-solid fa-database mr-1.5"></i> Gestionar Base de Datos
              </button>
            </div>
          )}
        </div>
      ) : filteredCoils.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredCoils.map(coil => (
            <CoilCard
              key={coil.id}
              coil={coil}
              onAskAI={() => onAskAIAboutCoil(coil)}
              onEditProduct={onEditCoil}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="h-16 w-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto text-slate-400 text-2xl">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 className="text-lg font-bold text-white">No se encontraron bobinas</h3>
          <p className="text-xs text-slate-400">
            No hay productos que coincidan con los filtros aplicados. Intenta buscar por código OEM o marca.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedBrand('ALL'); setStockFilter('ALL'); }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
