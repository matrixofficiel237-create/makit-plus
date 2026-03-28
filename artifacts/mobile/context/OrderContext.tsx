import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartItem } from "./CartContext";

export type OrderStatus = "en_attente" | "achat_en_cours" | "en_livraison" | "livre";

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  adresse: {
    quartier: string;
    rue: string;
    description: string;
  };
  paiement: "livraison" | "mobile_money";
  statut: OrderStatus;
  totalProduits: number;
  fraisLivraison: number;
  totalFinal: number;
  date: string;
  livreurId?: string;
  confirmeRecu?: boolean;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (order: Omit<Order, "id" | "date" | "statut">) => Promise<Order>;
  updateOrderStatus: (orderId: string, statut: OrderStatus) => Promise<void>;
  confirmReception: (orderId: string) => Promise<void>;
  getOrdersByUser: (userId: string) => Order[];
  getAllOrders: () => Order[];
  assignLivreur: (orderId: string, livreurId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await AsyncStorage.getItem("makit_orders");
      if (data) setOrders(JSON.parse(data));
    } catch (e) {
      // ignore
    }
  }

  async function saveOrders(newOrders: Order[]) {
    await AsyncStorage.setItem("makit_orders", JSON.stringify(newOrders));
    setOrders(newOrders);
  }

  async function createOrder(orderData: Omit<Order, "id" | "date" | "statut">): Promise<Order> {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      statut: "en_attente",
    };
    const updated = [...orders, newOrder];
    await saveOrders(updated);
    return newOrder;
  }

  async function updateOrderStatus(orderId: string, statut: OrderStatus) {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, statut } : o
    );
    await saveOrders(updated);
  }

  async function confirmReception(orderId: string) {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, statut: "livre" as OrderStatus, confirmeRecu: true } : o
    );
    await saveOrders(updated);
  }

  async function assignLivreur(orderId: string, livreurId: string) {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, livreurId } : o
    );
    await saveOrders(updated);
  }

  async function refreshOrders() {
    await loadOrders();
  }

  function getOrdersByUser(userId: string): Order[] {
    return orders.filter((o) => o.userId === userId);
  }

  function getAllOrders(): Order[] {
    return [...orders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        updateOrderStatus,
        confirmReception,
        getOrdersByUser,
        getAllOrders,
        assignLivreur,
        refreshOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
}
