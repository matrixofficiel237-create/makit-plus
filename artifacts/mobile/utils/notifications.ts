import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "./api";

// Configuration : les notifs s'affichent même si l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  // Les notifs push ne fonctionnent que sur un vrai appareil
  if (!Device.isDevice) {
    console.log("[Notifs] Simulateur détecté — push token non disponible");
    return null;
  }

  // Vérifier/demander les permissions
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Notifs] Permission refusée");
    return null;
  }

  // Obtenir le token Expo Push
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_REPL_ID || undefined,
  });
  const token = tokenData.data;

  // Paramètres Android (canal de notification)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("makit-default", {
      name: "Makit+ Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
      sound: "default",
    });
  }

  // Sauvegarder le token dans le backend
  try {
    await api.users.savePushToken(userId, token);
    console.log("[Notifs] Token enregistré :", token.slice(0, 30) + "...");
  } catch (e) {
    console.warn("[Notifs] Impossible de sauvegarder le token :", e);
  }

  return token;
}

// Déclencher une notification locale immédiate (sans serveur)
export async function scheduleLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data: {},
    },
    trigger: null, // immédiatement
  });
}
