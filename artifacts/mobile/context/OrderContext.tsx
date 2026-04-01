import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/utils/api";
import { CartItem } from "./CartContext";

export type OrderStatus = "en_attente" | "achat_en_cours" | "en_livraison" | "livre";

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  adresse: { quartier: string; rue: string; description: string };
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
  deleteOrder: (orderId: string) => Promise<void>;
  getOrdersByUser: (userId: string) => Order[];
  getAllOrders: () => Order[];
  assignLivreur: (orderId: string, livreurId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const { orders: data } = await api.orders.getAll();
      setOrders(data);
    } catch {}
  }

  async function createOrder(orderData: Omit<Order, "id" | "date" | "statut">): Promise<Order> {
    const { order } = await api.orders.create(orderData);
    setOrders((prev) => [order, ...prev]);
    return order;
  }

  async function updateOrderStatus(orderId: string, statut: OrderStatus) {
    const { order } = await api.orders.update(orderId, { statut });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
  }

  async function confirmReception(orderId: string) {
    const { order } = await api.orders.update(orderId, { statut: "livre", confirmeRecu: true });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
  }

  async function assignLivreur(orderId: string, livreurId: string) {
    const { order } = await api.orders.update(orderId, { livreurId });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
  }

  async function deleteOrder(orderId: string) {
    await api.orders.delete(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  async function refreshOrders() { await loadOrders(); }

  function getOrdersByUser(userId: string): Order[] {
    return orders.filter((o) => o.userId === userId);
  }

  function getAllOrders(): Order[] {
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return (
    <OrderContext.Provider value={{ orders, createOrder, updateOrderStatus, confirmReception, deleteOrder, getOrdersByUser, getAllOrders, assignLivreur, refreshOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
}
