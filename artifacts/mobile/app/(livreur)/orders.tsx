import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders, Order, OrderStatus } from "@/context/OrderContext";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import * as Haptics from "expo-haptics";

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  en_attente: "achat_en_cours",
  achat_en_cours: "en_livraison",
  en_livraison: "livre",
};

const STATUS_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  en_attente: "Commencer l'achat",
  achat_en_cours: "En route pour livrer",
  en_livraison: "Marquer comme Livré",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LivreurOrderCard({
  order,
  onUpdateStatus,
}: {
  order: Order;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}) {
  const nextStatus = STATUS_NEXT[order.statut];
  const actionLabel = STATUS_ACTION_LABEL[order.statut];

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
        </View>
        <OrderStatusBadge statut={order.statut} size="sm" />
      </View>

      {/* Items preview */}
      <View style={styles.itemsPreview}>
        {order.items.slice(0, 4).map((item, i) => (
          <Text key={i} style={styles.itemChip}>
            {item.product.emoji} {item.product.nom} x{item.quantite}
          </Text>
        ))}
        {order.items.length > 4 && (
          <Text style={styles.moreItems}>+{order.items.length - 4} autres</Text>
        )}
      </View>

      {/* Address */}
      <View style={styles.addressRow}>
        <Feather name="map-pin" size={14} color={Colors.primary} />
        <Text style={styles.addressText}>
          {order.adresse.quartier}, {order.adresse.rue}
          {order.adresse.description ? ` — ${order.adresse.description}` : ""}
        </Text>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.paymentMethod}>
          {order.paiement === "livraison" ? "💵 Paiement à la livraison" : "📱 Mobile Money"}
        </Text>
        <Text style={styles.orderTotal}>{order.totalFinal.toLocaleString()} FCFA</Text>
      </View>

      {/* Action button */}
      {nextStatus && actionLabel && (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            order.statut === "en_livraison" && styles.actionBtnGreen,
          ]}
          onPress={() => onUpdateStatus(order.id, nextStatus)}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
          <Feather name="arrow-right" size={16} color={Colors.white} />
        </TouchableOpacity>
      )}
      {order.statut === "livre" && (
        <View style={styles.deliveredBadge}>
          <Feather name="check-circle" size={16} color={Colors.primaryDark} />
          <Text style={styles.deliveredText}>Commande livrée</Text>
        </View>
      )}
    </View>
  );
}

export default function LivreurOrdersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();
  const { getAllOrders, updateOrderStatus, refreshOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }

  async function handleUpdateStatus(orderId: string, newStatus: OrderStatus) {
    Alert.alert(
      "Mettre à jour le statut",
      `Confirmer le changement de statut ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await updateOrderStatus(orderId, newStatus);
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert("Déconnexion", "Se déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const allOrders = getAllOrders();
  const active = allOrders.filter((o) => o.statut !== "livre");
  const completed = allOrders.filter((o) => o.statut === "livre");
  const displayed = activeTab === "active" ? active : completed;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Interface Livreur</Text>
            <Text style={styles.headerSub}>{user?.prenom} {user?.nom}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{active.length}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completed.length}</Text>
          <Text style={styles.statLabel}>Livrées</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{allOrders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            En cours ({active.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.tabActive]}
          onPress={() => setActiveTab("completed")}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}>
            Livrées ({completed.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {displayed.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>
              {activeTab === "active" ? "Aucune commande en cours" : "Aucune commande livrée"}
            </Text>
          </View>
        ) : (
          displayed.map((order) => (
            <LivreurOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: Colors.primaryDark,
    paddingVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textLight,
    fontFamily: "Inter_600SemiBold",
  },
  tabTextActive: { color: Colors.primary },
  content: { padding: 16, gap: 12 },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  itemsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  itemChip: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  moreItems: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    paddingVertical: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.primaryLighter,
    padding: 10,
    borderRadius: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    fontFamily: "Inter_500Medium",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentMethod: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  actionBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnGreen: { backgroundColor: Colors.primary },
  actionBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  deliveredBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryLighter,
    borderRadius: 10,
    paddingVertical: 10,
  },
  deliveredText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryDark,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
});
