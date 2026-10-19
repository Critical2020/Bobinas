import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import { useToast } from './ToastContext';
import { buildCartCheckoutUrl } from '../utils/whatsapp';

const CartContext = createContext(null);

const STORAGE_KEY_CARTS = 'AUTOIGNITION_PRIVATE_CARTS_V2';
const STORAGE_KEY_BUYER_DRAFT = 'AUTOIGNITION_BUYER_DRAFT_V2';

export function CartProvider({ children }) {
  const { deviceId } = useAuth();
  const { coils, processSaleTransaction, ownerSettings } = useInventory();
  const { showToast } = useToast();

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [buyerDraft, setBuyerDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUYER_DRAFT);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { name: '', phone: '', car: '', payRef: '' };
  });

  // Load private cart for this device
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[deviceId] && Array.isArray(parsed[deviceId])) {
          setCart(parsed[deviceId]);
        }
      }
    } catch (e) {}
  }, [deviceId]);

  // Persist private cart per device
  const persistCart = useCallback((newCart) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARTS);
      const allCarts = saved ? JSON.parse(saved) : {};
      allCarts[deviceId] = newCart;
      localStorage.setItem(STORAGE_KEY_CARTS, JSON.stringify(allCarts));
    } catch (e) {}
  }, [deviceId]);

  // Persist buyer draft
  const updateBuyerDraft = useCallback((fields) => {
    setBuyerDraft(prev => {
      const next = { ...prev, ...fields };
      try {
        localStorage.setItem(STORAGE_KEY_BUYER_DRAFT, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const addToCart = useCallback((productId, requestedQty = 1) => {
    const product = coils.find(b => b.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      showToast(`La ${product.name} no tiene stock disponible en este momento`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      let nextCart;

      if (existing) {
        if (existing.qty + requestedQty <= product.stock) {
          nextCart = prev.map(item => item.id === productId ? { ...item, qty: item.qty + requestedQty } : item);
          showToast(`Carrito actualizado: ${existing.qty + requestedQty}x ${product.name}`);
        } else {
          showToast(`Límite de stock disponible alcanzado (${product.stock} uds)`);
          return prev;
        }
      } else {
        const item = {
          id: product.id,
          name: product.name,
          price: product.price,
          oem: product.oem.split('/')[0].trim(),
          qty: Math.min(requestedQty, product.stock),
          maxStock: product.stock
        };
        nextCart = [...prev, item];
        showToast(`Añadido a tu carrito: ${product.name}`);
      }

      persistCart(nextCart);
      return nextCart;
    });
  }, [coils, persistCart, showToast]);

  const updateCartQty = useCallback((productId, delta) => {
    setCart(prev => {
      const product = coils.find(b => b.id === productId);
      const currentMax = product ? product.stock : 99;

      const nextCart = prev.map(item => {
        if (item.id === productId) {
          const newQty = item.qty + delta;
          if (newQty > currentMax) {
            showToast(`Stock máximo disponible alcanzado (${currentMax} uds)`);
            return { ...item, qty: currentMax };
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);

      persistCart(nextCart);
      return nextCart;
    });
  }, [coils, persistCart, showToast]);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => {
      const nextCart = prev.filter(item => item.id !== productId);
      persistCart(nextCart);
      return nextCart;
    });
    showToast('Producto eliminado del carrito');
  }, [persistCart, showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
    persistCart([]);
  }, [persistCart]);

  const checkoutViaWhatsApp = useCallback(() => {
    if (cart.length === 0) {
      showToast('Tu carrito está vacío');
      return;
    }

    if (!buyerDraft.name.trim() || !buyerDraft.phone.trim()) {
      showToast('⚠️ Por favor ingresa tu Nombre y Teléfono WhatsApp');
      return;
    }

    // Execute transaction for each item to deduct stock & record sale
    const orderIds = [];
    cart.forEach(item => {
      const res = processSaleTransaction({
        coilId: item.id,
        qty: item.qty,
        customerName: buyerDraft.name.trim(),
        customerPhone: buyerDraft.phone.trim(),
        paymentRef: buyerDraft.payRef.trim() || 'A coordinar por WhatsApp',
        userId: deviceId
      });
      if (res) orderIds.push(res.orderId);
    });

    const totalVal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const orderTag = orderIds.join(', ') || 'ORD-WA';

    const url = buildCartCheckoutUrl({
      targetPhone: ownerSettings.ownerPhone,
      clientName: buyerDraft.name.trim(),
      clientPhone: buyerDraft.phone.trim(),
      clientCar: buyerDraft.car.trim(),
      clientPayRef: buyerDraft.payRef.trim(),
      cartItems: cart,
      totalVal,
      orderTag
    });

    clearCart();
    setIsCartOpen(false);
    window.open(url, '_blank');
  }, [buyerDraft, cart, clearCart, deviceId, ownerSettings.ownerPhone, processSaleTransaction, showToast]);

  const cartCount = cart.reduce((acc, curr) => acc + curr.qty, 0);
  const cartSubtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartSubtotal,
      isCartOpen,
      setIsCartOpen,
      toggleCart: () => setIsCartOpen(prev => !prev),
      closeCart: () => setIsCartOpen(false),
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      buyerDraft,
      updateBuyerDraft,
      checkoutViaWhatsApp
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
