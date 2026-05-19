import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) {
    console.warn("[Notifs] Pas un vrai appareil — push désactivé");
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("[Notifs] Permission après demande:", status);
    }

    if (finalStatus !== "granted") {
      console.warn("[Notifs] Permission refusée");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("makit-default", {
        name: "Makit+ Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4CAF50",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
      console.log("[Notifs] Canal Android configuré");
    }

    // Token FCM natif (compatible Firebase Admin SDK)
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token = deviceToken.data as string;
    console.log("[Notifs] Token FCM obtenu:", token.slice(0, 30) + "...");

    await api.users.savePushToken(userId, token);
    console.log("[Notifs] Token sauvegardé ✅");
    return token;
  } catch (e) {
    console.error("[Notifs] ERREUR enregistrement:", e);
    return null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirme: {
    title: "✅ Commande confirmée",
    body: "Votre commande a été acceptée et sera bientôt traitée.",
  },
  achat_en_cours: {
    title: "🛒 Courses en cours",
    body: "Votre livreur est au marché et fait vos courses.",
  },
  en_livraison: {
    title: "🚚 Livreur en route !",
    body: "Votre livreur est en chemin, préparez-vous à recevoir votre commande.",
  },
  livre: {
    title: "🎉 Commande livrée !",
    body: "Vous avez reçu votre commande. Bonne dégustation !",
  },
  annule: {
    title: "❌ Commande annulée",
    body: "Votre commande a été annulée. Contactez-nous pour plus d'infos.",
  },
};

export async function notifyLocalStatusChange(
  statut: string,
  orderId: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const msg = STATUS_MESSAGES[statut];
  if (!msg) return;

  const shortId = orderId.slice(-6).toUpperCase();
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body + ` (Commande #${shortId})`,
        sound: "default",
        data: { orderId, statut },
        ...(Platform.OS === "android" ? { channelId: "makit-default" } : {}),
      },
      trigger: null,
    });
    console.log("[Notifs locales] Envoyée pour statut:", statut);
  } catch (e) {
    console.error("[Notifs locales] ERREUR:", e);
  }
}
