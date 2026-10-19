import React from 'react';

export function CatalogFilters({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  stockFilter,
  onStockFilterChange,
  brands,
  onQuickSearch
}) {
  const quickTags = ['Captiva 3.2', 'Corsa 1.6', 'Aveo 1.6', 'Toyota Corolla', 'Fiesta 1.6', 'Renault 16V', 'Dong Feng 1.6'];

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Search input */}
        <div className="relative md:col-span-2">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por modelo (Captiva, Corsa, Aveo), motor o código OEM..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>

        {/* Dynamic Brand select */}
        <div>
          <select 
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">Todas las marcas ({brands.length})</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Stock Availability */}
        <div>
          <select 
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ALL">Cualquier disponibilidad</option>
            <option value="IN_STOCK">En Stock Inmediato</option>
            <option value="OUT_OF_STOCK">Agotadas (0 unidades)</option>
            <option value="PROMO">Con Oferta Especial</option>
          </select>
        </div>
      </div>

      {/* Quick Search Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/60 text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <i className="fa-solid fa-bolt text-brand-400 text-[10px]"></i> Búsquedas frecuentes:
        </span>
        {quickTags.map(tag => (
          <button 
            key={tag}
            onClick={() => onQuickSearch(tag)}
            className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition text-[11px]"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
