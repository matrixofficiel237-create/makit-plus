import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { AppState, AppStateStatus } from "react-native";
import { api } from "@/utils/api";
import { useAuth } from "./AuthContext";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotif: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const POLL_MS = 60_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    load();
    startPoll();
    const sub = AppState.addEventListener("change", handleAppState);
    return () => { sub.remove(); stopPoll(); };
  }, [user?.id]);

  function handleAppState(next: AppStateStatus) {
    if (next === "active") { load(); startPoll(); }
    else stopPoll();
  }

  function startPoll() {
    stopPoll();
    timer.current = setInterval(load, POLL_MS);
  }

  function stopPoll() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }

  async function load() {
    if (!user) return;
    try {
      const { notifications: data } = await api.notifications.getByUser(user.id);
      setNotifications(data);
    } catch {}
  }

  async function markRead(id: string) {
    await api.notifications.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    if (!user) return;
    await api.notifications.markAllRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function deleteNotif(id: string) {
    await api.notifications.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteNotif, refresh: load }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
