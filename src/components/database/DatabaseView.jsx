import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { InventoryTable } from './InventoryTable';
import { ApiConnectionPanel } from './ApiConnectionPanel';
import { exportToCSV, exportToSQL, downloadFile } from '../../utils/csvParser';

export function DatabaseView({
  onOpenCreateModal,
  onOpenEditModal,
  onOpenBulkModal,
  onOpenSchemaModal
}) {
  const { coils, dbEngine, changeDbEngine, deleteCoil, clearInventory, restoreSeedData } = useInventory();
  const { requireAdminAuth } = useAuth();

  const engines = [
    { id: 'supabase', label: 'Supabase (PostgreSQL)', icon: 'fa-solid fa-bolt', desc: 'Funciones RPC atómicas y triggers de stock', activeBorder: 'border-emerald-500' },
    { id: 'mongodb', label: 'MongoDB Atlas', icon: 'fa-solid fa-leaf', desc: 'Colecciones NoSQL en formato JSON BSON', activeBorder: 'border-green-500' },
    { id: 'mysql', label: 'MySQL / MariaDB', icon: 'fa-solid fa-database', desc: 'Esquema relacional estándar ACID', activeBorder: 'border-blue-500' },
    { id: 'local', label: 'LocalStorage (Navegador)', icon: 'fa-solid fa-hard-drive', desc: 'Persistencia offline inmediata en el dispositivo', activeBorder: 'border-amber-500' }
  ];

  const handleExport = (format) => {
    if (format === 'csv') {
      const csv = exportToCSV(coils);
      downloadFile(csv, `bobinas_inventario_export_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    } else if (format === 'json') {
      const json = JSON.stringify(coils, null, 2);
      downloadFile(json, `bobinas_inventario_export_${Date.now()}.json`, 'application/json;charset=utf-8;');
    } else if (format === 'sql') {
      const sql = exportToSQL(coils);
      downloadFile(sql, `bobinas_inventario_export_${Date.now()}.sql`, 'application/sql;charset=utf-8;');
    }
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const handleDelete = (id) => {
    deleteCoil(id);
  };

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    clearInventory();
    setConfirmClear(false);
  };

  const handleRestore = () => {
    restoreSeedData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Base de Datos Multi-Motor & Control de Inventario
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conecta tu aplicación a Supabase, MongoDB, MySQL o LocalStorage. Todo cambio se refleja inmediatamente en el Agente IA de WhatsApp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i> Insertar Bobina
          </button>

          <button 
            onClick={onOpenBulkModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <i className="fa-solid fa-file-import text-sky-400"></i> Carga Masiva (CSV / JSON)
          </button>

          <div className="relative group">
            <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer">
              <i className="fa-solid fa-file-export text-emerald-400"></i> Exportar
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-30 hidden group-hover:block">
              <button 
                onClick={() => handleExport('csv')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <i className="fa-solid fa-file-csv text-emerald-400"></i> Formato CSV
              </button>
              <button 
                onClick={() => handleExport('json')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <i className="fa-solid fa-file-code text-amber-400"></i> Formato JSON
              </button>
              <button 
                onClick={() => handleExport('sql')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <i className="fa-solid fa-database text-sky-400"></i> Dump SQL DDL
              </button>
            </div>
          </div>

          <button 
            onClick={onOpenSchemaModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <i className="fa-solid fa-code text-purple-400"></i> Ver Esquemas DDL
          </button>

          <button 
            onClick={handleClearClick}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              confirmClear 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400' 
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50'
            }`}
            title="Borrar todos los productos de la Base de Datos (0 artículos)"
          >
            <i className={`fa-solid ${confirmClear ? 'fa-triangle-exclamation' : 'fa-trash-can'}`}></i>
            <span>{confirmClear ? '¿Confirmar vaciado total? Clic aquí' : 'Vaciar Base de Datos'}</span>
          </button>

          <button 
            onClick={handleRestore}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Restaurar a los productos originales de fábrica"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span className="hidden sm:inline">Restaurar Semilla</span>
          </button>
        </div>
      </div>

      {/* Engine Switcher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {engines.map(eng => {
          const isSelected = dbEngine === eng.id;
          return (
            <div 
              key={eng.id}
              onClick={() => changeDbEngine(eng.id)}
              className={`p-4 rounded-2xl bg-slate-900 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected 
                  ? `${eng.activeBorder} shadow-lg shadow-brand-500/5 bg-slate-850` 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-sm text-brand-400">
                    <i className={eng.icon}></i>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Activo
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{eng.label}</h4>
                <p className="text-[11px] text-slate-400">{eng.desc}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                {isSelected ? 'Sincronizado en tiempo real' : 'Clic para conectar motor'}
              </div>
            </div>
          );
        })}
      </div>

      {/* In-Page API & Database Connection Panel */}
      <ApiConnectionPanel />

      {/* Main Inventory Table */}
      <InventoryTable 
        onEditCoil={onOpenEditModal}
        onDeleteCoil={handleDelete}
      />
    </div>
  );
}
