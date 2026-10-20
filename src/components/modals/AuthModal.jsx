import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function AuthModal() {
  const { authModalOpen, closeAuthModal, login, authLockReason, isAdmin, logout } = useAuth();
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    login(user, pass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Lock Icon & Title */}
        <div className="text-center mb-5">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 text-xl shadow">
            <i className={`fa-solid ${isAdmin ? 'fa-unlock-keyhole text-emerald-400' : 'fa-lock'}`}></i>
          </div>
          <h3 className="text-base font-bold text-white">
            {isAdmin ? 'Sesión de Administrador Activa' : 'Acceso Restringido - Administrador'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin ? 'Tienes acceso ilimitado a modificación de stock y ventas.' : 'Ingresa tus credenciales de dueño para gestionar inventario.'}
          </p>
        </div>

        {/* Lock reason banner */}
        {authLockReason && (
          <div className="mb-4 p-3 bg-brand-500/15 border border-brand-500/30 rounded-xl text-brand-300 text-xs flex items-start gap-2">
            <i className="fa-solid fa-shield-halved text-sm shrink-0 mt-0.5"></i>
            <span>{authLockReason}</span>
          </div>
        )}

        {isAdmin ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <i className="fa-solid fa-circle-check"></i>
              <span>Sesión activa como Dueño / Administrador</span>
            </div>
            <button 
              onClick={() => { logout(); closeAuthModal(); }}
              className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition"
            >
              Cerrar Sesión de Administrador
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Usuario
              </label>
              <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="admin" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Contraseña
              </label>
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Ingresa tu contraseña" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                required
                autoFocus
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition cursor-pointer"
              >
                Desbloquear Módulos
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
