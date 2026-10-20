import React from 'react';
import { useCart } from '../../context/CartContext';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { buildPreOrderUrl } from '../../utils/whatsapp';
import { formatUSD } from '../../utils/formatters';

export function ChatMessage({ message, onTriggerSaleModal }) {
  const { addToCart } = useCart();
  const { ownerSettings } = useInventory();
  const { isAdmin } = useAuth();
  const isUser = message.sender === 'user';

  const handlePreOrder = (product) => {
    const url = buildPreOrderUrl({
      targetPhone: ownerSettings.ownerPhone,
      product,
      customerName: 'Cliente Chat IA'
    });
    window.open(url, '_blank');
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {isUser ? (
        <div className="relative bg-[#d9fdd3] dark:bg-[#005c4b] dark:text-[#e9edef] rounded-lg rounded-tr-none p-3 shadow max-w-[85%] chat-bubble-tail-out">
          <p className="text-xs sm:text-sm">{message.text}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[9px] text-gray-500 dark:text-gray-300">{message.time}</span>
            <i className="fa-solid fa-check-double text-[10px] text-sky-500"></i>
          </div>
        </div>
      ) : (
        <div className="relative bg-white dark:bg-[#202c33] dark:text-[#e9edef] rounded-lg rounded-tl-none p-3 shadow max-w-[85%] chat-bubble-tail-in">
          <div className="font-semibold text-brand-600 dark:text-brand-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
            <i className="fa-solid fa-microchip"></i> Asesor Bobinas Express AI
          </div>

          {isAdmin && message.badge && (
            <div className="mb-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700">
              <i className="fa-solid fa-database mr-1"></i>{message.badge}
            </div>
          )}

          {/* Render formatted HTML bot response safely */}
          <div 
            className="text-xs sm:text-sm space-y-1.5"
            dangerouslySetInnerHTML={{ __html: message.html }}
          />

          {/* Action buttons if bot referenced a product */}
          {message.product && (
            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
              {message.product.stock > 0 ? (
                <>
                  <button 
                    onClick={() => onTriggerSaleModal(message.product)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
                  >
                    <i className="fa-solid fa-cash-register"></i> Cerrar Venta en WA ({formatUSD(message.product.price)})
                  </button>
                  <button 
                    onClick={() => addToCart(message.product.id)}
                    className="px-2.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1 shadow transition cursor-pointer active:scale-95"
                  >
                    <i className="fa-solid fa-cart-plus"></i> +Carrito
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handlePreOrder(message.product)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
                >
                  <i className="fa-brands fa-whatsapp"></i> Reservar / Encargar Bajo Pedido
                </button>
              )}
            </div>
          )}

          <span className="block text-right text-[9px] text-gray-400 mt-1.5">{message.time}</span>
        </div>
      )}
    </div>
  );
}
