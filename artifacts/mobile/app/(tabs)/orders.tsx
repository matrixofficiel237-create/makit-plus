import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { Order } from "@/context/OrderContext";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderCardTop}>
        <View>
          <Text style={styles.orderId}>Commande #{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
        </View>
        <Text style={styles.orderTotal}>{order.totalFinal.toLocaleString()} FCFA</Text>
      </View>
      <View style={styles.orderCardBottom}>
        <OrderStatusBadge statut={order.statut} size="sm" />
        <View style={styles.orderItemsCount}>
          <Feather name="package" size={12} color={Colors.textLight} />
          <Text style={styles.orderItemsText}>{order.items.length} article(s)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const { getOrdersByUser, refreshOrders } = useOrders();
  const [refreshing, setRefreshing] = React.useState(false);

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

  const orders = user ? getOrdersByUser(user.id) : [];
  const sorted = [...orders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const active = sorted.filter((o) => o.statut !== "livre");
  const completed = sorted.filter((o) => o.statut === "livre");

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes commandes</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {sorted.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="list" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySubtitle}>
              Vos commandes apparaîtront ici après avoir passé votre première commande
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/(tabs)/order")}
            >
              <Text style={styles.shopBtnText}>Passer une commande</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>En cours ({active.length})</Text>
                {active.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() =>
                      router.push({ pathname: "/order-detail", params: { id: order.id } })
                    }
                  />
                ))}
              </>
            )}
            {completed.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Historique ({completed.length})</Text>
                {completed.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() =>
                      router.push({ pathname: "/order-detail", params: { id: order.id } })
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  content: { padding: 16, gap: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardTop: {
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
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  orderCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderItemsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  orderItemsText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  shopBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  shopBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
