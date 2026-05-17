import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useNotifications, AppNotification } from "@/context/NotificationsContext";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function notifIcon(title: string): { name: string; color: string; bg: string } {
  if (title.includes("livrée") || title.includes("✅")) return { name: "check-circle", color: Colors.primary, bg: "#E8F5E9" };
  if (title.includes("route") || title.includes("🚚")) return { name: "truck", color: "#1565C0", bg: "#E3F2FD" };
  if (title.includes("courses") || title.includes("🛒")) return { name: "shopping-bag", color: "#E65100", bg: "#FFF3E0" };
  if (title.includes("assignée") || title.includes("🛍️")) return { name: "package", color: "#6A1B9A", bg: "#F3E5F5" };
  if (title.includes("annulée") || title.includes("❌")) return { name: "x-circle", color: "#C62828", bg: "#FFEBEE" };
  if (title.includes("nouvelle") || title.includes("📦")) return { name: "bell", color: Colors.primaryDark, bg: Colors.primaryLighter };
  return { name: "bell", color: Colors.primaryDark, bg: Colors.primaryLighter };
}

function NotifItem({ notif, onRead, onDelete }: { notif: AppNotification; onRead: () => void; onDelete: () => void }) {
  const icon = notifIcon(notif.title);
  return (
    <TouchableOpacity
      style={[styles.item, !notif.read && styles.itemUnread]}
      onPress={onRead}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
        <Feather name={icon.name as any} size={18} color={icon.color} />
        {!notif.read && <View style={styles.unreadDot} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, !notif.read && styles.titleUnread]}>{notif.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notif.body}</Text>
        <Text style={styles.time}>{timeAgo(notif.createdAt)}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="x" size={15} color={Colors.textLight} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ visible, onClose }: Props) {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSub}>{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.readAllBtn} onPress={markAllRead}>
                <Feather name="check-square" size={14} color={Colors.primary} />
                <Text style={styles.readAllText}>Tout lire</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySub}>Vous serez notifié des mises à jour de vos commandes ici.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={n => n.id}
            renderItem={({ item }) => (
              <NotifItem
                notif={item}
                onRead={() => markRead(item.id)}
                onDelete={() => deleteNotif(item.id)}
              />
            )}
            contentContainerStyle={{ padding: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: Colors.primary, fontFamily: "Inter_500Medium", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  readAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryLighter,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  readAllText: { fontSize: 12, color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  closeBtn: { padding: 4 },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemUnread: {
    borderColor: Colors.primaryLight,
    backgroundColor: "#F9FFF9",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  title: { fontSize: 14, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  titleUnread: { color: Colors.primaryDark },
  body: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  time: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
