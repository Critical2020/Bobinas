import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { buildOwnerAlertUrl } from '../../utils/whatsapp';
import { formatUSD } from '../../utils/formatters';

export function OwnerNotificationBanner() {
  const { pendingOwnerAlert, dismissOwnerAlert, ownerSettings } = useInventory();

  if (!pendingOwnerAlert) return null;

  const handleSendToOwner = () => {
    const url = buildOwnerAlertUrl({
      ownerPhone: ownerSettings.ownerPhone,
      order: pendingOwnerAlert
    });
    window.open(url, '_blank');
    dismissOwnerAlert();
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 max-w-sm w-full animate-bounce-subtle">
      <div className="bg-slate-900/95 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              ¡Nueva Venta Confirmada!
            </span>
          </div>
          <button 
            onClick={dismissOwnerAlert}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 mb-3 text-slate-300">
          <div><strong className="text-white">Orden:</strong> #{pendingOwnerAlert.orderId}</div>
          <div><strong className="text-white">Cliente:</strong> {pendingOwnerAlert.customerName}</div>
          <div><strong className="text-white">Pieza:</strong> {pendingOwnerAlert.qty}x {pendingOwnerAlert.coilName}</div>
          <div><strong className="text-white">Total:</strong> <span className="text-emerald-400 font-bold">{formatUSD(pendingOwnerAlert.totalPrice)} USD</span></div>
          <div><strong className="text-white">Stock en DB:</strong> {pendingOwnerAlert.stockBefore} ➔ <span className="text-emerald-400 font-bold">{pendingOwnerAlert.stockAfter} uds</span></div>
        </div>

        <button 
          onClick={handleSendToOwner}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30 transition"
        >
          <i className="fa-brands fa-whatsapp text-sm"></i>
          Notificar al Dueño ({ownerSettings.ownerPhone})
        </button>
      </div>
    </div>
  );
}
