import { Router } from "express";
import { getAllOrders, getOrdersByUser, createOrder, updateOrder, deleteOrder, StoredOrder, findUserById } from "../store";
import {
  notifyNewOrder,
  notifyOrderAssigned,
  notifyStatusChange,
  notifyClientConfirmedDelivery,
} from "../services/pushNotifications";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = req.query as { userId?: string };
  const orders = userId ? await getOrdersByUser(userId) : await getAllOrders();
  res.json({ orders });
});

router.post("/", async (req, res) => {
  const body = req.body as Omit<StoredOrder, "id" | "date" | "statut" | "createdAt">;
  if (!body.userId || !body.items) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const order = await createOrder({
    ...body,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    statut: "en_attente",
  });

  const client = await findUserById(body.userId);
  const clientName = client ? `${client.prenom} ${client.nom}` : "un client";
  notifyNewOrder(order.id, clientName).catch(() => {});

  res.status(201).json({ order });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const patch = req.body as Partial<StoredOrder>;

  const orders = await getAllOrders();
  const existing = orders.find((o) => o.id === id);
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const updated = await updateOrder(id, patch);
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (patch.statut && patch.statut !== existing.statut) {
    notifyStatusChange(updated.userId, updated.id, patch.statut).catch(() => {});
  }

  if (patch.livreurId && patch.livreurId !== existing.livreurId) {
    notifyOrderAssigned(patch.livreurId, updated.id).catch(() => {});
  }

  if (patch.confirmeRecu && !existing.confirmeRecu) {
    const client = await findUserById(updated.userId);
    const clientName = client ? `${client.prenom} ${client.nom}` : "Un client";
    notifyClientConfirmedDelivery(updated.id, clientName).catch(() => {});
  }

  res.json({ order: updated });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const ok = await deleteOrder(id);
  if (!ok) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
