import { Router } from "express";
import { getAllOrders, getOrdersByUser, createOrder, updateOrder, StoredOrder } from "../store";

const router = Router();

router.get("/", (req, res) => {
  const { userId } = req.query as { userId?: string };
  const orders = userId ? getOrdersByUser(userId) : getAllOrders();
  res.json({ orders });
});

router.post("/", (req, res) => {
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
  res.status(201).json({ order });
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const patch = req.body as Partial<StoredOrder>;
  const updated = updateOrder(id, patch);
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order: updated });
});

export default router;
