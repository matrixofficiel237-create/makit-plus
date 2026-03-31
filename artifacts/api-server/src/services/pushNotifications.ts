import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { getUserPushToken, getAllUsersByRole } from "../store";

const expo = new Expo();

type NotifPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

async function sendToToken(token: string, payload: NotifPayload) {
  if (!Expo.isExpoPushToken(token)) {
    console.warn("[Push] Token invalide :", token);
    return;
  }
  const message: ExpoPushMessage = {
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    channelId: "makit-default",
  };
  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error("[Push] Erreur envoi :", err);
  }
}

async function sendToUser(userId: string, payload: NotifPayload) {
  const token = getUserPushToken(userId);
  if (!token) return;
  await sendToToken(token, payload);
}

async function sendToRole(role: string, payload: NotifPayload) {
  const users = getAllUsersByRole(role);
  for (const user of users) {
    if (user.pushToken) {
      await sendToToken(user.pushToken, payload);
    }
  }
}

// ── Notifications par événement ──────────────────────────

export async function notifyNewOrder(orderId: string, clientName: string) {
  const shortId = orderId.slice(-6).toUpperCase();
  // Notifier admin et sous_admin
  await sendToRole("admin", {
    title: "📦 Nouvelle commande",
    body: `Commande #${shortId} de ${clientName} vient d'arriver`,
    data: { orderId },
  });
  await sendToRole("sous_admin", {
    title: "📦 Nouvelle commande",
    body: `Commande #${shortId} de ${clientName} vient d'arriver`,
    data: { orderId },
  });
}

export async function notifyOrderAssigned(livreurId: string, orderId: string) {
  const shortId = orderId.slice(-6).toUpperCase();
  await sendToUser(livreurId, {
    title: "🛍️ Nouvelle commande assignée",
    body: `La commande #${shortId} vous a été confiée`,
    data: { orderId },
  });
}

export async function notifyStatusChange(
  clientUserId: string,
  orderId: string,
  newStatut: string
) {
  const shortId = orderId.slice(-6).toUpperCase();

  const messages: Record<string, { title: string; body: string }> = {
    achat_en_cours: {
      title: "🛒 Achat en cours",
      body: `Votre livreur fait les courses pour la commande #${shortId}`,
    },
    en_livraison: {
      title: "🚚 En route vers vous !",
      body: `Votre livreur est en chemin pour #${shortId}`,
    },
    livre: {
      title: "✅ Commande livrée !",
      body: `La commande #${shortId} a été livrée. Bonne dégustation 🎉`,
    },
  };

  const msg = messages[newStatut];
  if (!msg) return;

  await sendToUser(clientUserId, {
    ...msg,
    data: { orderId },
  });
}
