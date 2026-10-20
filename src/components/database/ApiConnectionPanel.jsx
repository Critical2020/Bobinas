import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';

export function ApiConnectionPanel() {
  const { 
    dbEngine, 
    changeDbEngine, 
    dbCredentials, 
    updateDbCredentials, 
    apiConnectionStatus, 
    testApiConnection, 
    syncWithApi, 
    coils 
  } = useInventory();

  const [activeTab, setActiveTab] = useState(dbEngine);
  const [showKey, setShowKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Local state for the inputs of the currently selected tab
  const [formValues, setFormValues] = useState(() => dbCredentials[activeTab] || {});

  // When activeTab or credentials change, update form inputs
  useEffect(() => {
    setActiveTab(dbEngine);
    setFormValues(dbCredentials[dbEngine] || {});
  }, [dbEngine]);

  const handleTabChange = (engineId) => {
    setActiveTab(engineId);
    setFormValues(dbCredentials[engineId] || {});
  };

  const handleInputChange = (field, val) => {
    setFormValues(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateDbCredentials(activeTab, formValues);
  };

  const handleTestPing = async () => {
    updateDbCredentials(activeTab, formValues);
    await testApiConnection(activeTab, formValues);
  };

  const handlePull = async () => {
    setIsSyncing(true);
    updateDbCredentials(activeTab, formValues);
    await syncWithApi('pull', formValues);
    setIsSyncing(false);
  };

  const handlePush = async () => {
    setIsSyncing(true);
    updateDbCredentials(activeTab, formValues);
    await syncWithApi('push', formValues);
    setIsSyncing(false);
  };

  const engines = [
    { id: 'supabase', label: 'Supabase', icon: 'fa-solid fa-bolt', color: 'text-emerald-400' },
    { id: 'mongodb', label: 'MongoDB Atlas', icon: 'fa-solid fa-leaf', color: 'text-green-400' },
    { id: 'mysql', label: 'MySQL / REST API', icon: 'fa-solid fa-database', color: 'text-sky-400' },
    { id: 'local', label: 'LocalStorage', icon: 'fa-solid fa-hard-drive', color: 'text-amber-400' }
  ];

  const approxStorageKb = (JSON.stringify(coils).length / 1024).toFixed(1);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <i className="fa-solid fa-network-wired text-sm"></i>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Conexión de Bases de Datos con API en Vivo</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                REST / RPC / Data API
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Configura tus credenciales y endpoints para sincronizar el catálogo de bobinas en tiempo real.
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {apiConnectionStatus.status === 'checking' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 animate-pulse">
              <i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Verificando conexión...
            </span>
          )}
          {apiConnectionStatus.status === 'connected' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>En Línea ({apiConnectionStatus.latency || 18}ms)</span>
            </span>
          )}
          {apiConnectionStatus.status === 'error' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
              <span>Error de Conexión</span>
            </span>
          )}
          {apiConnectionStatus.status === 'idle' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              <span>Motor Activo: {dbEngine.toUpperCase()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {engines.map(eng => {
          const isActive = activeTab === eng.id;
          const isCurrentlyEngine = dbEngine === eng.id;
          return (
            <button
              key={eng.id}
              type="button"
              onClick={() => handleTabChange(eng.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white border border-brand-500/50 shadow-md'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <i className={`${eng.icon} ${eng.color}`}></i>
              <span>{eng.label}</span>
              {isCurrentlyEngine && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Motor activo"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live Diagnostic Notice */}
      {apiConnectionStatus.message && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
          apiConnectionStatus.status === 'connected' 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
            : apiConnectionStatus.status === 'error'
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            : 'bg-sky-950/40 border-sky-500/30 text-sky-300'
        }`}>
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${
              apiConnectionStatus.status === 'connected' 
                ? 'fa-circle-check text-emerald-400' 
                : apiConnectionStatus.status === 'error'
                ? 'fa-triangle-exclamation text-rose-400'
                : 'fa-spinner fa-spin text-sky-400'
            }`}></i>
            <span className="font-medium">{apiConnectionStatus.message}</span>
          </div>
          {apiConnectionStatus.status === 'connected' && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono shrink-0">
              {coils.length} bobinas verificadas
            </span>
          )}
        </div>
      )}

      {/* Connection Form by Tab */}
      <form onSubmit={handleSave} className="space-y-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        {/* Supabase Tab */}
        {activeTab === 'supabase' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Supabase Project URL / Endpoint REST *
              </label>
              <input
                type="url"
                value={formValues.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://xyzcompany.supabase.co/rest/v1"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    API Key (Anon / Service Role) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    <i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i> {showKey ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={formValues.anonKey || ''}
                  onChange={(e) => handleInputChange('anonKey', e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombre de Tabla en Postgres *
                </label>
                <input
                  type="text"
                  value={formValues.table || ''}
                  onChange={(e) => handleInputChange('table', e.target.value)}
                  placeholder="bobinas_inventario"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            {/* RLS Notice & SQL Helper */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>¿Supabase dice "conectado" pero devuelve 0 artículos?</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  Solución RLS
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Supabase activa <strong className="text-white">Row Level Security (RLS)</strong> por defecto al crear tablas nuevas, bloqueando lecturas anónimas y devolviendo 0 filas.
                Para permitir que la web lea y guarde bobinas, ve a tu proyecto en <strong>Supabase &rarr; SQL Editor &rarr; New Query</strong> y ejecuta:
              </p>
              <div className="relative group">
                <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto select-all">
{`-- Desactivar RLS para permitir lectura y guardado desde la web
ALTER TABLE ${formValues.table || 'bobinas_inventario'} DISABLE ROW LEVEL SECURITY;`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`ALTER TABLE ${formValues.table || 'bobinas_inventario'} DISABLE ROW LEVEL SECURITY;`);
                    alert('¡Comando SQL copiado al portapapeles! Pégalo en el SQL Editor de Supabase y presiona RUN.');
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold rounded shadow transition cursor-pointer flex items-center gap-1"
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>Copiar SQL</span>
                </button>
              </div>
              <details className="text-[10px] text-slate-400 cursor-pointer pt-1">
                <summary className="hover:text-slate-200">¿Prefieres mantener RLS activado con políticas de seguridad? Ver SQL</summary>
                <div className="mt-2 relative">
                  <pre className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-slate-300 overflow-x-auto text-[10px]">
{`CREATE POLICY "Acceso publico lectura" ON public.${formValues.table || 'bobinas_inventario'} FOR SELECT USING (true);
CREATE POLICY "Acceso publico insercion" ON public.${formValues.table || 'bobinas_inventario'} FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso publico actualizacion" ON public.${formValues.table || 'bobinas_inventario'} FOR UPDATE USING (true);`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `CREATE POLICY "Acceso publico lectura" ON public.${formValues.table || 'bobinas_inventario'} FOR SELECT USING (true);\nCREATE POLICY "Acceso publico insercion" ON public.${formValues.table || 'bobinas_inventario'} FOR INSERT WITH CHECK (true);\nCREATE POLICY "Acceso publico actualizacion" ON public.${formValues.table || 'bobinas_inventario'} FOR UPDATE USING (true);`;
                      navigator.clipboard.writeText(sql);
                      alert('¡Políticas SQL copiadas!');
                    }}
                    className="absolute top-2 right-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] border border-slate-700"
                  >
                    Copiar Políticas
                  </button>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* MongoDB Atlas Tab */}
        {activeTab === 'mongodb' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                MongoDB Atlas Data API Endpoint URL *
              </label>
              <input
                type="url"
                value={formValues.uri || ''}
                onChange={(e) => handleInputChange('uri', e.target.value)}
                placeholder="https://data.mongodb-api.com/app/data-express/endpoint/data/v1"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Atlas API Key / Token *
                </label>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={formValues.apiKey || ''}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  placeholder="mongo_sec_token_..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Database
                </label>
                <input
                  type="text"
                  value={formValues.database || ''}
                  onChange={(e) => handleInputChange('database', e.target.value)}
                  placeholder="bobinas_express_db"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Collection
                </label>
                <input
                  type="text"
                  value={formValues.collection || ''}
                  onChange={(e) => handleInputChange('collection', e.target.value)}
                  placeholder="bobinas"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* MySQL / Custom REST API Tab */}
        {activeTab === 'mysql' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                REST API Endpoint / URL del Backend *
              </label>
              <input
                type="url"
                value={formValues.apiUrl || ''}
                onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                placeholder="https://api.bobinasexpress.com/v1/inventory"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Bearer Token de Autorización
                </label>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={formValues.bearerToken || ''}
                  onChange={(e) => handleInputChange('bearerToken', e.target.value)}
                  placeholder="bearer_token_..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tabla SQL / Entidad
                </label>
                <input
                  type="text"
                  value={formValues.table || ''}
                  onChange={(e) => handleInputChange('table', e.target.value)}
                  placeholder="bobinas"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* LocalStorage Tab */}
        {activeTab === 'local' && (
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-white font-semibold flex items-center gap-2">
                <i className="fa-solid fa-hard-drive text-amber-400"></i>
                <span>Almacenamiento Local en Navegador (Indexed / LocalStorage)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Persistencia offline inmediata activa. Capacidad utilizada: <span className="text-brand-400 font-mono font-bold">{approxStorageKb} KB</span> ({coils.length} bobinas).
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Estado: Listo 100% Offline
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {activeTab !== dbEngine && (
              <button
                type="button"
                onClick={() => changeDbEngine(activeTab)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition border border-slate-700"
              >
                <i className="fa-solid fa-check text-emerald-400"></i>
                <span>Activar este Motor</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestPing}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition border border-sky-500/30"
              title="Realizar un ping o prueba de endpoint a la API"
            >
              <i className="fa-solid fa-tower-broadcast"></i>
              <span>Probar Conexión (Ping)</span>
            </button>

            <button
              type="button"
              onClick={handlePull}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition border border-emerald-500/30"
              title="Traer todas las bobinas desde la base de datos remota"
            >
              <i className={`fa-solid fa-cloud-arrow-down ${isSyncing ? 'fa-bounce text-emerald-400' : ''}`}></i>
              <span>{isSyncing ? 'Cargando...' : 'Importar de DB (PULL)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePush}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition border border-amber-500/30"
              title="Subir el inventario actual a la base de datos remota"
            >
              <i className={`fa-solid fa-cloud-arrow-up ${isSyncing ? 'fa-bounce text-amber-400' : ''}`}></i>
              <span>Exportar a DB (PUSH)</span>
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 cursor-pointer transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>Guardar Credenciales</span>
          </button>
        </div>
      </form>
    </div>
  );
}