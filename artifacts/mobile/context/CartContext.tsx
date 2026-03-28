import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Product {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  emoji: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantite: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantite?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantite: (productId: string, quantite: number) => void;
  clearCart: () => void;
  totalProduits: number;
  fraisLivraison: number;
  totalFinal: number;
  count: number;
}

const FRAIS_LIVRAISON = 750;

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: Product, quantite: number = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantite: i.quantite + quantite }
            : i
        );
      }
      return [...prev, { product, quantite }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQuantite(productId: string, quantite: number) {
    if (quantite <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantite } : i))
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalProduits = items.reduce(
    (sum, i) => sum + i.product.prix * i.quantite,
    0
  );
  const totalFinal = items.length > 0 ? totalProduits + FRAIS_LIVRAISON : 0;
  const count = items.reduce((sum, i) => sum + i.quantite, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantite,
        clearCart,
        totalProduits,
        fraisLivraison: FRAIS_LIVRAISON,
        totalFinal,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
