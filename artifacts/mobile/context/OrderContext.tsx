import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { AppState, AppStateStatus } from "react-native";
import { api } from "@/utils/api";
import { CartItem } from "./CartContext";
import { notifyLocalStatusChange } from "@/utils/notifications";

export type OrderStatus = "en_attente" | "confirme" | "achat_en_cours" | "en_cours" | "en_livraison" | "livre" | "annule";

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

const POLL_INTERVAL_MS = 30_000;

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const prevStatuts = useRef<Record<string, OrderStatus>>({});
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadOrders();
    startPolling();

    const sub = AppState.addEventListener("change", handleAppState);
    return () => {
      sub.remove();
      stopPolling();
    };
  }, []);

  function handleAppState(nextState: AppStateStatus) {
    if (nextState === "active") {
      loadOrders();
      startPolling();
    } else {
      stopPolling();
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer.current = setInterval(() => {
      loadOrders();
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  async function loadOrders() {
    try {
      const { orders: data } = await api.orders.getAll();

      const prev = prevStatuts.current;
      const newStatuts: Record<string, OrderStatus> = {};

      for (const order of data as Order[]) {
        newStatuts[order.id] = order.statut;
        const oldStatut = prev[order.id];
        if (oldStatut && oldStatut !== order.statut) {
          notifyLocalStatusChange(order.statut, order.id).catch(() => {});
        }
      }

      prevStatuts.current = newStatuts;
      setOrders(data as Order[]);
    } catch {}
  }

  async function createOrder(orderData: Omit<Order, "id" | "date" | "statut">): Promise<Order> {
    const { order } = await api.orders.create(orderData);
    setOrders((prev) => [order, ...prev]);
    prevStatuts.current[order.id] = order.statut;
    return order;
  }

  async function updateOrderStatus(orderId: string, statut: OrderStatus) {
    const { order } = await api.orders.update(orderId, { statut });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
    prevStatuts.current[orderId] = statut;
  }

  async function confirmReception(orderId: string) {
    const { order } = await api.orders.update(orderId, { statut: "livre", confirmeRecu: true });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
    prevStatuts.current[orderId] = "livre";
  }

  async function assignLivreur(orderId: string, livreurId: string) {
    const { order } = await api.orders.update(orderId, { livreurId });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
  }

  async function deleteOrder(orderId: string) {
    await api.orders.delete(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    delete prevStatuts.current[orderId];
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
