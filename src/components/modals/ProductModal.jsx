import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';

export function ProductModal({ isOpen, onClose, initialProduct }) {
  const { upsertCoil, deleteCoil } = useInventory();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = Boolean(initialProduct && initialProduct.id);

  const [form, setForm] = useState({
    id: '',
    name: '',
    brand: 'Chevrolet',
    carModel: '',
    engine: '',
    oem: '',
    type: 'Tipo Lápiz Individual',
    connector: 'Conector 4 Pines',
    price: '29.50',
    oldPrice: '36.00',
    stock: '15',
    warranty: '12 meses',
    badge: 'OEM Spec'
  });

  useEffect(() => {
    if (initialProduct && initialProduct.id) {
      setForm({
        id: initialProduct.id,
        name: initialProduct.name || '',
        brand: initialProduct.brand || 'Chevrolet',
        carModel: initialProduct.carModel || '',
        engine: initialProduct.engine || '',
        oem: initialProduct.oem || '',
        type: initialProduct.type || 'Tipo Lápiz Individual',
        connector: initialProduct.connector || 'Conector 4 Pines',
        price: String(initialProduct.price || '29.50'),
        oldPrice: String(initialProduct.oldPrice || '36.00'),
        stock: String(initialProduct.stock || '15'),
        warranty: initialProduct.warranty || '12 meses',
        badge: initialProduct.badge || 'OEM Spec'
      });
    } else {
      setForm({
        id: `BOB-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        brand: 'Chevrolet',
        carModel: '',
        engine: '',
        oem: '',
        type: 'Tipo Lápiz Individual',
        connector: 'Conector 4 Pines',
        price: '29.50',
        oldPrice: '36.00',
        stock: '15',
        warranty: '12 meses',
        badge: 'OEM Spec'
      });
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    upsertCoil(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <i className={`fa-solid ${isEditing ? 'fa-pen-to-square text-sky-400' : 'fa-database text-brand-500'}`}></i>
          <span>{isEditing ? `Editar Bobina (${form.id})` : 'Insertar Nueva Bobina en Base de Datos'}</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Código / SKU (Único) *
              </label>
              <input 
                type="text" 
                value={form.id}
                onChange={(e) => setForm(prev => ({ ...prev, id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Marca de Auto *
              </label>
              <input 
                type="text" 
                value={form.brand}
                onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Chevrolet, Ford, Toyota..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Nombre Completo de la Bobina *
            </label>
            <input 
              type="text" 
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Bobina de Encendido Chevrolet Captiva 3.2 V6" 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Vehículos / Modelos Compatibles *
              </label>
              <input 
                type="text" 
                value={form.carModel}
                onChange={(e) => setForm(prev => ({ ...prev, carModel: e.target.value }))}
                placeholder="Captiva Sport 3.2L (2008 - 2015)" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Motor / Cilindrada *
              </label>
              <input 
                type="text" 
                value={form.engine}
                onChange={(e) => setForm(prev => ({ ...prev, engine: e.target.value }))}
                placeholder="3.2L V6 / 1.6L E-TEC" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Códigos OEM Equivalentes *
            </label>
            <input 
              type="text" 
              value={form.oem}
              onChange={(e) => setForm(prev => ({ ...prev, oem: e.target.value }))}
              placeholder="12618542 / UF569 / 0221604112" 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tipo Físico de Bobina
              </label>
              <input 
                type="text" 
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                placeholder="Tipo Lápiz Individual (COP)" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Conector Eléctrico
              </label>
              <input 
                type="text" 
                value={form.connector}
                onChange={(e) => setForm(prev => ({ ...prev, connector: e.target.value }))}
                placeholder="Conector 4 Pines Plano" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Precio USD ($) *
              </label>
              <input 
                type="number" 
                step="0.01"
                value={form.price}
                onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Precio Tachado
              </label>
              <input 
                type="number" 
                step="0.01"
                value={form.oldPrice}
                onChange={(e) => setForm(prev => ({ ...prev, oldPrice: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Stock Almacén *
              </label>
              <input 
                type="number" 
                value={form.stock}
                onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Garantía
              </label>
              <input 
                type="text" 
                value={form.warranty}
                onChange={(e) => setForm(prev => ({ ...prev, warranty: e.target.value }))}
                placeholder="12 meses" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Insignia / Etiqueta
              </label>
              <input 
                type="text" 
                value={form.badge}
                onChange={(e) => setForm(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="Más Vendida, Oferta, OEM Spec..." 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800">
            {isEditing ? (
              <button 
                type="button"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 3500);
                    return;
                  }
                  deleteCoil(form.id);
                  onClose();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  confirmDelete 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400' 
                    : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30'
                }`}
              >
                <i className={`fa-solid ${confirmDelete ? 'fa-triangle-exclamation' : 'fa-trash-can'}`}></i>
                <span>{confirmDelete ? '¿Confirmar eliminar?' : 'Eliminar Bobina'}</span>
              </button>
            ) : <div></div>}

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 cursor-pointer"
              >
                {isEditing ? 'Guardar Cambios' : 'Insertar en Base de Datos'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
