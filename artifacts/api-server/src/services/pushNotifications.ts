import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

import { getUserPushToken, getAllUsersByRole, createNotification } from "../store";

// Initialisation Firebase Admin (une seule fois)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[Firebase] Admin SDK initialisé ✅");
  } catch (e) {
    console.error("[Firebase] Erreur initialisation:", e);
  }
}

type NotifPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

async function sendToToken(token: string, payload: NotifPayload) {
  if (!token) return;
  try {
    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      android: {
        notification: {
          channelId: "makit-default",
          sound: "default",
          priority: "high",
          color: "#4CAF50",
        },
        priority: "high",
      },
      data: Object.fromEntries(
        Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
      ),
    };
    const response = await admin.messaging().send(message);
    console.log("[Push] Envoi OK, messageId:", response);
  } catch (err: any) {
    console.error("[Push] ERREUR envoi:", err?.errorInfo?.code ?? err?.message ?? err);
  }
}

async function sendToUser(userId: string, payload: NotifPayload) {
  await createNotification({ userId, title: payload.title, body: payload.body, data: payload.data }).catch(() => {});
  const token = await getUserPushToken(userId);
  if (!token) {
    console.warn("[Push] Pas de token FCM pour userId:", userId);
    return;
  }
  console.log("[Push] Envoi à userId:", userId);
  await sendToToken(token, payload);
}

async function sendToRole(role: string, payload: NotifPayload) {
  const users = await getAllUsersByRole(role);
  console.log("[Push] Envoi au rôle:", role, "—", users.length, "utilisateur(s)");
  for (const user of users) {
    await createNotification({ userId: user.id, title: payload.title, body: payload.body, data: payload.data }).catch(() => {});
    if (user.pushToken) {
      await sendToToken(user.pushToken, payload);
    } else {
      console.warn("[Push] Pas de token pour", user.telephone);
    }
  }
}

export async function notifyNewOrder(orderId: string, clientName: string) {
  const shortId = orderId.slice(-6).toUpperCase();
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
    annule: {
      title: "❌ Commande annulée",
      body: `Votre commande #${shortId} a été annulée. Contactez-nous pour plus d'infos.`,
    },
  };
  const msg = messages[newStatut];
  if (!msg) return;
  await sendToUser(clientUserId, { ...msg, data: { orderId } });
}

export async function notifyClientConfirmedDelivery(orderId: string, clientName: string) {
  const shortId = orderId.slice(-6).toUpperCase();
  await sendToRole("admin", {
    title: "📬 Livraison confirmée",
    body: `${clientName} a confirmé la réception de la commande #${shortId}`,
    data: { orderId },
  });
  await sendToRole("sous_admin", {
    title: "📬 Livraison confirmée",
    body: `${clientName} a confirmé la réception de la commande #${shortId}`,
    data: { orderId },
  });
}
