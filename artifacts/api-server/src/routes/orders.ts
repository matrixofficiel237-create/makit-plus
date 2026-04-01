import { Router } from "express";
import { getAllOrders, getOrdersByUser, createOrder, updateOrder, deleteOrder, StoredOrder, findUserById } from "../store";
import {
  notifyNewOrder,
  notifyOrderAssigned,
  notifyStatusChange,
} from "../services/pushNotifications";

const router = Router();

router.get("/", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const orders = userId ? getOrdersByUser(userId) : getAllOrders();
  res.json({ orders });
});

router.post("/", async (req, res) => {
  const body = req.body as Omit<StoredOrder, "id" | "date" | "statut">;
  if (!body.userId || !body.items) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const order = createOrder({
    ...body,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    statut: "en_attente",
  });

  // Notifier admin + sous_admin de la nouvelle commande
  const client = findUserById(body.userId);
  const clientName = client ? `${client.prenom} ${client.nom}` : "un client";
  notifyNewOrder(order.id, clientName).catch(() => {});

  res.status(201).json({ order });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const patch = req.body as Partial<StoredOrder>;

  // Récupérer la commande avant mise à jour
  const orders = getAllOrders();
  const existing = orders.find((o) => o.id === id);
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const updated = updateOrder(id, patch);
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Notifier selon le changement de statut ou d'assignation
  if (patch.statut && patch.statut !== existing.statut) {
    // Changement de statut → notifier le client
    notifyStatusChange(updated.userId, updated.id, patch.statut).catch(() => {});
  }

  if (patch.livreurId && patch.livreurId !== existing.livreurId) {
    // Nouvelle assignation → notifier le livreur
    notifyOrderAssigned(patch.livreurId, updated.id).catch(() => {});
  }

  res.json({ order: updated });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const ok = deleteOrder(id);
  if (!ok) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
