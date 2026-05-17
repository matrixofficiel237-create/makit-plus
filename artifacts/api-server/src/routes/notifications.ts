import { Router } from "express";
import {
  getNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../store";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) {
    res.status(400).json({ error: "userId requis" });
    return;
  }
  const notifications = await getNotificationsByUser(userId);
  res.json({ notifications });
});

router.patch("/read-all", async (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) {
    res.status(400).json({ error: "userId requis" });
    return;
  }
  await markAllNotificationsRead(userId);
  res.json({ success: true });
});

router.patch("/:id/read", async (req, res) => {
  await markNotificationRead(req.params.id);
  res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
  await deleteNotification(req.params.id);
  res.json({ success: true });
});

export default router;
