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

const LIVREUR_ID = "livreur-1";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();
  const { getAllOrders, assignLivreur, updateOrderStatus, refreshOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "stats">("orders");

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

  async function handleAssignLivreur(orderId: string) {
    Alert.alert(
      "Assigner le livreur",
      "Assigner cette commande au livreur Makit+ ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Assigner",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await assignLivreur(orderId, LIVREUR_ID);
          },
        },
      ]
    );
  }

  const allOrders = getAllOrders();
  const pending = allOrders.filter((o) => o.statut === "en_attente");
  const active = allOrders.filter((o) => o.statut !== "en_attente" && o.statut !== "livre");
  const delivered = allOrders.filter((o) => o.statut === "livre");
  const totalRevenue = delivered.reduce((sum, o) => sum + o.totalFinal, 0);

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
            <Text style={styles.headerTitle}>Administration</Text>
            <Text style={styles.headerSub}>Makit+ Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "orders" && styles.tabActive]}
          onPress={() => setActiveTab("orders")}
        >
          <Text style={[styles.tabText, activeTab === "orders" && styles.tabTextActive]}>
            Commandes ({allOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "stats" && styles.tabActive]}
          onPress={() => setActiveTab("stats")}
        >
          <Text style={[styles.tabText, activeTab === "stats" && styles.tabTextActive]}>
            Statistiques
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
        {activeTab === "stats" && (
          <>
            <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Total commandes" value={allOrders.length} color={Colors.primary} icon="shopping-bag" />
              <StatCard label="En attente" value={pending.length} color={Colors.orange} icon="clock" />
              <StatCard label="En cours" value={active.length} color="#1565C0" icon="truck" />
              <StatCard label="Livrées" value={delivered.length} color={Colors.primaryDark} icon="check-circle" />
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Revenus totaux (livraisons)</Text>
              <Text style={styles.revenueValue}>{totalRevenue.toLocaleString()} FCFA</Text>
              <Text style={styles.revenueNote}>
                Dont {(delivered.length * 750).toLocaleString()} FCFA en frais de livraison
              </Text>
            </View>
          </>
        )}

        {activeTab === "orders" && (
          <>
            {pending.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>⏳ En attente d'assignation ({pending.length})</Text>
                {pending.map((order) => (
                  <AdminOrderCard
                    key={order.id}
                    order={order}
                    onAssign={() => handleAssignLivreur(order.id)}
                    showAssign={!order.livreurId}
                  />
                ))}
              </>
            )}
            {active.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🚚 En cours ({active.length})</Text>
                {active.map((order) => (
                  <AdminOrderCard key={order.id} order={order} showAssign={false} />
                ))}
              </>
            )}
            {delivered.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>✅ Livrées ({delivered.length})</Text>
                {delivered.map((order) => (
                  <AdminOrderCard key={order.id} order={order} showAssign={false} />
                ))}
              </>
            )}
            {allOrders.length === 0 && (
              <View style={styles.empty}>
                <Feather name="inbox" size={48} color={Colors.border} />
                <Text style={styles.emptyText}>Aucune commande pour le moment</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function AdminOrderCard({
  order,
  onAssign,
  showAssign,
}: {
  order: Order;
  onAssign?: () => void;
  showAssign: boolean;
}) {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
        </View>
        <View style={styles.orderCardRight}>
          <OrderStatusBadge statut={order.statut} size="sm" />
          <Text style={styles.orderTotal}>{order.totalFinal.toLocaleString()} FCFA</Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Feather name="map-pin" size={13} color={Colors.primary} />
        <Text style={styles.addressText}>
          {order.adresse.quartier}, {order.adresse.rue}
          {order.adresse.description ? ` — ${order.adresse.description}` : ""}
        </Text>
      </View>

      <View style={styles.itemsRow}>
        <Feather name="package" size={13} color={Colors.textLight} />
        <Text style={styles.itemsText}>
          {order.items.map((i) => `${i.product.nom} x${i.quantite}`).join(", ")}
        </Text>
      </View>

      <View style={styles.payRow}>
        <Text style={styles.payMethod}>
          {order.paiement === "livraison" ? "💵 À la livraison" : "📱 Mobile Money"}
        </Text>
        {order.livreurId ? (
          <View style={styles.livreurBadge}>
            <Feather name="user-check" size={12} color={Colors.primaryDark} />
            <Text style={styles.livreurText}>Livreur assigné</Text>
          </View>
        ) : (
          showAssign && onAssign && (
            <TouchableOpacity style={styles.assignBtn} onPress={onAssign}>
              <Feather name="user-plus" size={14} color={Colors.white} />
              <Text style={styles.assignBtnText}>Assigner livreur</Text>
            </TouchableOpacity>
          )
        )}
      </View>
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
  content: { padding: 16, gap: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statsGrid: {
    gap: 10,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  revenueCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    gap: 6,
    marginTop: 4,
  },
  revenueLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  revenueNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 8,
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
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  orderCardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.primaryLighter,
    padding: 8,
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    fontFamily: "Inter_400Regular",
  },
  itemsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  itemsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  payMethod: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  livreurBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLighter,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  livreurText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  assignBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
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
