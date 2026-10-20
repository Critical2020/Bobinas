import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { CartProvider } from './context/CartContext';

import { TopNoticeBar } from './components/layout/TopNoticeBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { OwnerNotificationBanner } from './components/common/OwnerNotificationBanner';

import { CatalogView } from './components/catalog/CatalogView';
import { SalesView } from './components/sales/SalesView';
import { DatabaseView } from './components/database/DatabaseView';
import { AdminConfigView } from './components/admin/AdminConfigView';

import { FloatingAIChat } from './components/simulator/FloatingAIChat';

import { CartDrawer } from './components/modals/CartDrawer';
import { AuthModal } from './components/modals/AuthModal';
import { ProductModal } from './components/modals/ProductModal';
import { BulkImportModal } from './components/modals/BulkImportModal';
import { SchemaCodeModal } from './components/modals/SchemaCodeModal';
import { ManualSaleModal } from './components/modals/ManualSaleModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState('catalog');
  
  // Modal states
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [manualSaleModalOpen, setManualSaleModalOpen] = useState(false);

  const { requireAdminAuth } = useAuth();

  const handleOpenCreateProduct = () => {
    requireAdminAuth(
      () => setProductModal({ open: true, product: null }),
      'Insertar nuevas bobinas en la Base de Datos requiere sesión de Administrador.'
    );
  };

  const handleOpenEditProduct = (coil) => {
    requireAdminAuth(
      () => setProductModal({ open: true, product: coil }),
      'Editar bobinas en la Base de Datos requiere sesión de Administrador.'
    );
  };

  const handleOpenBulkModal = () => {
    requireAdminAuth(
      () => setBulkModalOpen(true),
      'La carga masiva por CSV/JSON requiere sesión de Administrador.'
    );
  };

  const handleOpenManualSale = () => {
    requireAdminAuth(
      () => setManualSaleModalOpen(true),
      'Registrar ventas manuales requiere autorización de Administrador.'
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Banner Ribbon */}
      <TopNoticeBar />

      {/* Main App Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'catalog' && (
          <CatalogView
            onNavigateTab={setActiveTab}
            onAskAIAboutCoil={() => {}}
            onEditCoil={handleOpenEditProduct}
          />
        )}

        {activeTab === 'sales' && (
          <SalesView
            onOpenManualSaleModal={handleOpenManualSale}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseView
            onOpenCreateModal={handleOpenCreateProduct}
            onOpenEditModal={handleOpenEditProduct}
            onOpenBulkModal={handleOpenBulkModal}
            onOpenSchemaModal={() => setSchemaModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminConfigView />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Slide-overs */}
      <CartDrawer />
      <AuthModal />
      <ProductModal
        isOpen={productModal.open}
        onClose={() => setProductModal({ open: false, product: null })}
        initialProduct={productModal.product}
      />
      <BulkImportModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />
      <SchemaCodeModal
        isOpen={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
      />
      <ManualSaleModal
        isOpen={manualSaleModalOpen}
        onClose={() => setManualSaleModalOpen(false)}
      />

      {/* Floating Transaction Notification Alert */}
      <OwnerNotificationBanner />

      {/* Floating AI Chat Bubble — bottom-right corner */}
      <FloatingAIChat onTriggerSaleModal={() => setManualSaleModalOpen(true)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <InventoryProvider>
          <CartProvider>
            <MainApp />
          </CartProvider>
        </InventoryProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
