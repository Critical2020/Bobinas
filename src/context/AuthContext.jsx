import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const STORAGE_KEY_ADMIN_AUTH = 'AUTOIGNITION_ADMIN_SESSION_V2';
const STORAGE_KEY_DEVICE_CLIENT_ID = 'AUTOIGNITION_PRIVATE_CLIENT_ID_V2';

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [deviceId, setDeviceId] = useState('CLI-LOCAL');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authLockReason, setAuthLockReason] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    // 1. Device ID
    let savedId = localStorage.getItem(STORAGE_KEY_DEVICE_CLIENT_ID);
    if (!savedId) {
      savedId = 'CLI-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem(STORAGE_KEY_DEVICE_CLIENT_ID, savedId);
    }
    setDeviceId(savedId);

    // 2. Admin Auth
    const isAuthed = localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
    setIsAdmin(isAuthed);
  }, []);

  const login = (user, pass) => {
    const cleanUser = String(user || '').trim().toLowerCase();
    const cleanPass = String(pass || '').trim();

    if ((cleanUser === 'admin' || cleanUser === 'dueno') && (cleanPass === '123456' || cleanPass === 'admin123')) {
      setIsAdmin(true);
      try {
        localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
      } catch (e) {}

      showToast('🔓 Sesión de Administrador iniciada: Módulos críticos desbloqueados');
      setAuthModalOpen(false);

      if (typeof pendingAction === 'function') {
        const action = pendingAction;
        setPendingAction(null);
        action();
      }
      return true;
    } else {
      showToast('❌ Contraseña incorrecta');
      return false;
    }
  };

  const logout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    } catch (e) {}
    showToast('🔒 Sesión de Administrador cerrada. Módulos críticos protegidos.');
  };

  const requireAdminAuth = (actionCallback, reason = 'Esta acción modifica datos críticos del sistema y requiere sesión de Administrador.') => {
    if (isAdmin) {
      actionCallback();
      return true;
    }
    setPendingAction(() => actionCallback);
    setAuthLockReason(reason);
    setAuthModalOpen(true);
    return false;
  };

  const openAuthModal = (reason = '') => {
    setAuthLockReason(reason);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setPendingAction(null);
    setAuthLockReason('');
  };

  return (
    <AuthContext.Provider value={{
      isAdmin,
      deviceId,
      login,
      logout,
      requireAdminAuth,
      authModalOpen,
      authLockReason,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
