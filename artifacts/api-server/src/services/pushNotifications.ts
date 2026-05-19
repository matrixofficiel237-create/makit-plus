import Expo, { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { getUserPushToken, getAllUsersByRole, createNotification } from "../store";

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
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === "error") {
          console.error("[Push] ERREUR ticket:", ticket.message, "| details:", JSON.stringify((ticket as any).details));
        } else {
          console.log("[Push] Ticket OK, id:", (ticket as any).id);
          // Vérification du receipt après délai
          if ((ticket as any).id) {
            setTimeout(async () => {
              try {
                const receiptIdChunks = expo.chunkPushNotificationReceiptIds([(ticket as any).id]);
                for (const chunk of receiptIdChunks) {
                  const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                  for (const [receiptId, receipt] of Object.entries(receipts)) {
                    if (receipt.status === "error") {
                      console.error("[Push] RECEIPT ERREUR:", receipt.message, "| details:", JSON.stringify((receipt as any).details));
                    } else {
                      console.log("[Push] Receipt OK pour", receiptId);
                    }
                  }
                }
              } catch (e) {
                console.error("[Push] Erreur vérification receipt:", e);
              }
            }, 5000);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Push] Erreur envoi:", err);
  }
}

async function sendToUser(userId: string, payload: NotifPayload) {
  await createNotification({ userId, title: payload.title, body: payload.body, data: payload.data }).catch(() => {});
  const token = await getUserPushToken(userId);
  if (!token) {
    console.warn("[Push] Pas de token pour userId:", userId);
    return;
  }
  console.log("[Push] Envoi à userId:", userId, "token:", token.slice(0, 30) + "...");
  await sendToToken(token, payload);
}

async function sendToRole(role: string, payload: NotifPayload) {
  const users = await getAllUsersByRole(role);
  console.log("[Push] Envoi au rôle:", role, "—", users.length, "utilisateur(s)");
  for (const user of users) {
    await createNotification({ userId: user.id, title: payload.title, body: payload.body, data: payload.data }).catch(() => {});
    if (user.pushToken) {
      console.log("[Push] Envoi à", user.telephone, "token:", user.pushToken.slice(0, 30) + "...");
      await sendToToken(user.pushToken, payload);
    } else {
      console.warn("[Push] Pas de token pour", user.telephone, "(role:", role, ")");
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

  await sendToUser(clientUserId, {
    ...msg,
    data: { orderId },
  });
}

export async function notifyClientConfirmedDelivery(
  orderId: string,
  clientName: string
) {
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
