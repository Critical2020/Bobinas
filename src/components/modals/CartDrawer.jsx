import React from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { formatUSD } from '../../utils/formatters';

export function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cart,
    cartSubtotal,
    updateCartQty,
    removeFromCart,
    buyerDraft,
    updateBuyerDraft,
    checkoutViaWhatsApp
  } = useCart();
  const { deviceId } = useAuth();
  const { ownerSettings } = useInventory();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        onClick={closeCart}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <i className="fa-solid fa-cart-shopping text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mi Carrito de Compra</h3>
                <p className="text-[10px] text-slate-400">
                  ID Sesión: <code className="text-brand-400">{deviceId}</code> • WhatsApp: {ownerSettings.ownerPhone}
                </p>
              </div>
            </div>
            <button 
              onClick={closeCart}
              className="text-slate-400 hover:text-white p-2 rounded-lg"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <i className="fa-solid fa-cart-plus text-4xl mb-2 opacity-30"></i>
                <p className="text-sm font-semibold text-slate-300">Tu carrito de compra está vacío</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Agrega las bobinas que necesites desde el catálogo y envía tu pedido a WhatsApp sin crear cuenta.
                </p>
                <button 
                  onClick={closeCart}
                  className="mt-2 text-xs text-brand-400 font-semibold hover:underline"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div 
                  key={item.id} 
                  className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">OEM: {item.oem}</p>
                    <div className="text-xs font-mono font-bold text-brand-400 mt-0.5">
                      {formatUSD(item.price)} c/u
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700">
                      <button 
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-mono text-white font-semibold">{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white text-xs"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout & Buyer Details Section */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              {/* Buyer Form Inputs */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Datos de Contacto y Despacho
                </span>

                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    value={buyerDraft.name}
                    onChange={(e) => updateBuyerDraft({ name: e.target.value })}
                    placeholder="Tu Nombre / Taller *" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  <input 
                    type="text" 
                    value={buyerDraft.phone}
                    onChange={(e) => updateBuyerDraft({ phone: e.target.value })}
                    placeholder="Tu Teléfono WhatsApp *" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    value={buyerDraft.car}
                    onChange={(e) => updateBuyerDraft({ car: e.target.value })}
                    placeholder="Vehículo / Año / Motor" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  <input 
                    type="text" 
                    value={buyerDraft.payRef}
                    onChange={(e) => updateBuyerDraft({ payRef: e.target.value })}
                    placeholder="Ref Pago (Opcional)" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Subtotal & Total */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Total a Cancelar:</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {formatUSD(cartSubtotal)} USD
                </span>
              </div>

              {/* Checkout WhatsApp Action Button */}
              <button 
                onClick={checkoutViaWhatsApp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-700/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-brands fa-whatsapp text-base"></i>
                <span>Enviar Pedido a WhatsApp ({formatUSD(cartSubtotal)})</span>
              </button>

              <p className="text-[10px] text-center text-slate-500">
                Al enviar tu pedido se reserva el stock en sistema y se abre WhatsApp con la orden generada.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
