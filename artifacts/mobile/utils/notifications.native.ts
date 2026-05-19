import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
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
    console.warn("[Notifs] Pas un vrai appareil (simulateur) — push désactivé");
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    console.log("[Notifs] Permission actuelle:", existing);
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("[Notifs] Permission après demande:", status);
    }

    if (finalStatus !== "granted") {
      console.warn("[Notifs] Permission refusée — notifications désactivées");
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
      console.log("[Notifs] Canal Android 'makit-default' configuré");
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      "f9b34950-69e5-4f2a-93e1-5b10a62fbad2";

    console.log("[Notifs] Récupération token Expo (projectId:", projectId, ")");
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log("[Notifs] Token obtenu:", token.slice(0, 30) + "...");

    const result = await api.users.savePushToken(userId, token);
    console.log("[Notifs] Token sauvegardé en DB:", result);
    return token;
  } catch (e) {
    console.error("[Notifs] ERREUR enregistrement push:", e);
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
  console.log("[Notifs locales] Déclenchement pour statut:", statut, "commande:", shortId);
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
    console.log("[Notifs locales] Notification envoyée ✅");
  } catch (e) {
    console.error("[Notifs locales] ERREUR:", e);
  }
}
