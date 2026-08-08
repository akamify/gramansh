'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { addCartItem, clearCartItems, fetchCartItems, updateCartItem } from '@/app/lib/apiClient';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  color: string;
  size: string;
  image: string;
  collection: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void;
  isVariantInCart: (id: number, size: string, color?: string) => boolean;
  removeItem: (id: number, size: string, color?: string) => Promise<boolean>;
  updateQty: (id: number, size: string, delta: number, color?: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isHydrating: boolean;
  isSyncing: boolean;
  syncError: string;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeItem = (input: Partial<CartItem> | Record<string, unknown>): CartItem => {
  const source = input as Partial<CartItem> & Record<string, unknown>;
  const id = toNumber(source.id, 0);
  const qty = Math.max(1, Math.floor(toNumber(source.qty, 1)));
  const price = Math.max(0, toNumber(source.price, 0));
  return {
    id,
    name: String(source.name || 'Product'),
    price,
    qty,
    color: source.color == null ? '' : String(source.color),
    size: source.size == null ? '' : String(source.size),
    image: String(source.image || ''),
    collection: String(source.collection || 'CART ITEM'),
  };
};

const mergeByKey = (input: CartItem[]) => {
  const merged = new Map<string, CartItem>();
  input.forEach((item) => {
    const safe = normalizeItem(item);
    const key = `${safe.id}|${safe.color}|${safe.size}|${safe.name}`;
    const prev = merged.get(key);
    if (prev) {
      merged.set(key, { ...prev, qty: prev.qty + safe.qty });
    } else {
      merged.set(key, safe);
    }
  });
  return Array.from(merged.values());
};

const mapBackendItem = (item: Record<string, unknown>): CartItem => ({
  id: toNumber(item.product_id ?? item.id, 0),
  name: String(item.title || item.name || 'Product'),
  price: toNumber(item.price, 0),
  qty: Math.max(1, Math.floor(toNumber(item.qty, 1))),
  color: item.color == null ? '' : String(item.color),
  size: item.size == null ? '' : String(item.size),
  image: String(item.image || ''),
  collection: String(item.collection || 'CART ITEM'),
});

const normalizeServerItems = (serverItems: unknown[]) => {
  return mergeByKey(
    serverItems.map((entry) => mapBackendItem((entry || {}) as Record<string, unknown>)),
  );
};
const readErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const isSameVariant = (item: CartItem, id: number, size: string, color?: string) => {
  if (item.id !== id || item.size !== size) return false;
  if (typeof color === 'undefined') return true;
  return item.color === color;
};

const getInitialCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const saved = window.localStorage.getItem('sr_cart');
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return mergeByKey(parsed.map((entry) => normalizeItem(entry as Record<string, unknown>)));
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const refreshCart = async () => {
    try {
      setSyncError('');
      const serverItems = await fetchCartItems();
      if (Array.isArray(serverItems)) {
        setItems(normalizeServerItems(serverItems));
      }
    } catch {
      setSyncError('Could not sync cart from server.');
    }
  };

  useEffect(() => {
    const localItems = getInitialCartItems();

    fetchCartItems()
      .then((serverItems) => {
        if (Array.isArray(serverItems)) {
          setItems(normalizeServerItems(serverItems));
        }
      })
      .catch(() => {
        if (localItems.length) {
          setItems(localItems);
        }
        setSyncError('Could not sync cart from server.');
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sr_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    const safeItem = normalizeItem(item as Record<string, unknown>);
    if (safeItem.id <= 0) return;

    const exists = items.some((entry) => isSameVariant(entry, safeItem.id, safeItem.size, safeItem.color));
    if (exists) return;

    setIsSyncing(true);
    setSyncError('');

    // Add to local state immediately
    setItems((prev) => [...prev, safeItem]);

    // Try to sync with backend, but don't fail if it doesn't work
    addCartItem({
      product_id: safeItem.id,
      color: safeItem.color,
      size: safeItem.size,
      qty: safeItem.qty,
      price: safeItem.price,
      mrp: safeItem.price,
      title: safeItem.name,
      image: safeItem.image,
    })
      .then((serverItems) => {
        if (Array.isArray(serverItems)) {
          setItems(normalizeServerItems(serverItems));
        }
      })
      .catch((error) => {
        // Roll back local add when backend rejects (e.g. out of stock).
        setItems((prev) =>
          prev.filter((entry) => !isSameVariant(entry, safeItem.id, safeItem.size, safeItem.color))
        );
        setSyncError(readErrorMessage(error, 'Could not add item to cart.'));
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const isVariantInCart = (id: number, size: string, color = '') => {
    if (id <= 0) return false;
    return items.some((item) => isSameVariant(item, id, size, color));
  };

  const removeItem = async (id: number, size: string, color = '') => {
    if (id <= 0) return false;

    setIsSyncing(true);
    setSyncError('');

    try {
      const serverItems = await updateCartItem(id, size, 0, color);
      if (Array.isArray(serverItems)) {
        setItems(normalizeServerItems(serverItems));
      } else {
        setItems((prev) => prev.filter((item) => !isSameVariant(item, id, size, color)));
      }
      return true;
    } catch {
      setSyncError('Could not remove item from cart.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateQty = async (id: number, size: string, delta: number, color = '') => {
    if (id <= 0 || delta === 0) return false;

    const current = items.find((item) => isSameVariant(item, id, size, color));
    if (!current) return false;

    const nextQty = Math.max(1, current.qty + delta);
    if (nextQty === current.qty) return false;
    const previousItems = items;

    setIsSyncing(true);
    setSyncError('');
    setItems((prev) =>
      prev.map((item) => (isSameVariant(item, id, size, color) ? { ...item, qty: nextQty } : item))
    );

    try {
      const serverItems = await updateCartItem(id, size, nextQty, color);
      if (Array.isArray(serverItems)) {
        setItems(normalizeServerItems(serverItems));
      }
      return true;
    } catch (error) {
      setItems(previousItems);
      setSyncError(readErrorMessage(error, 'Could not update quantity.'));
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearCart = async () => {
    const previousItems = items;
    setIsSyncing(true);
    setSyncError('');

    try {
      const serverItems = await clearCartItems();
      if (Array.isArray(serverItems)) {
        setItems(normalizeServerItems(serverItems));
      } else {
        setItems([]);
      }
    } catch {
      setSyncError('Could not clear cart.');
      setItems(previousItems);
    } finally {
      setIsSyncing(false);
    }
  };
  const total = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const itemCount = items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      isVariantInCart,
      removeItem,
      updateQty,
      clearCart,
      refreshCart,
      isHydrating,
      isSyncing,
      syncError,
      total,
      itemCount,
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
