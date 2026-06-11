import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

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

export function calculerFraisLivraison(totalProduits: number): number {
  if (totalProduits <= 0) return 0;
  if (totalProduits <= 10000) return 750;
  if (totalProduits <= 20000) return 1000;
  if (totalProduits <= 30000) return 1500;
  if (totalProduits <= 50000) return 2000;
  return 3000;
}

export function calculerFraisLivraisonSpecial(totalProduits: number): number {
  if (totalProduits <= 0) return 0;
  if (totalProduits <= 10000) return 1500;
  if (totalProduits <= 20000) return 2000;
  if (totalProduits <= 30000) return 2500;
  if (totalProduits <= 50000) return 3000;
  return 4000;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

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
  const calculer = user?.prixSpecial ? calculerFraisLivraisonSpecial : calculerFraisLivraison;
  const fraisLivraison = items.length > 0 ? calculer(totalProduits) : 0;
  const totalFinal = items.length > 0 ? totalProduits + fraisLivraison : 0;
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
        fraisLivraison,
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
