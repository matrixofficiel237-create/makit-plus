import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders, Order, OrderStatus } from "@/context/OrderContext";
import { api } from "@/utils/api";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import ConfirmModal from "@/components/ConfirmModal";
import * as Haptics from "expo-haptics";

const LIVREUR_GAIN = 400;

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
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function LivreurOrderCard({ order, client, onUpdateStatus }: {
  order: Order;
  client?: { prenom: string; nom: string; telephone: string; adresse: string } | null;
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

      {client && (
        <View style={styles.clientRow}>
          <Feather name="user" size={13} color={Colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{client.prenom} {client.nom}</Text>
            <Text style={styles.clientPhone}>📞 {client.telephone}</Text>
            {client.adresse ? <Text style={styles.clientAddr}>📍 {client.adresse}</Text> : null}
          </View>
        </View>
      )}

      <View style={styles.itemsList}>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product.emoji} {item.product.nom} <Text style={styles.itemQty}>×{item.quantite}</Text></Text>
            <Text style={styles.itemPrice}>{(item.product.prix * item.quantite).toLocaleString()} F</Text>
          </View>
        ))}
        <View style={styles.itemDivider} />
        <View style={styles.itemRow}>
          <Text style={styles.itemSubLabel}>Sous-total articles</Text>
          <Text style={styles.itemSubValue}>{order.totalProduits.toLocaleString()} F</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemSubLabel}>Frais de livraison</Text>
          <Text style={styles.itemSubValue}>{order.fraisLivraison} F</Text>
        </View>
        <View style={[styles.itemRow, styles.itemTotalRow]}>
          <Text style={styles.itemTotalLabel}>Total final</Text>
          <Text style={styles.itemTotalValue}>{order.totalFinal.toLocaleString()} FCFA</Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Feather name="map-pin" size={14} color={Colors.primary} />
        <Text style={styles.addressText}>
          {order.adresse.quartier}, {order.adresse.rue}
          {order.adresse.description ? ` — ${order.adresse.description}` : ""}
        </Text>
      </View>

      <View style={styles.paymentRow}>
        <Text style={styles.paymentMethod}>
          {order.paiement === "livraison" ? "💵 Paiement à la livraison" : "📱 Mobile Money"}
        </Text>
        {order.statut === "livre" && (
          <View style={styles.gainBadge}>
            <Feather name="dollar-sign" size={13} color={Colors.white} />
            <Text style={styles.gainBadgeText}>+{LIVREUR_GAIN} FCFA</Text>
          </View>
        )}
      </View>

      {nextStatus && actionLabel && (
        <TouchableOpacity
          style={[styles.actionBtn, order.statut === "en_livraison" && styles.actionBtnGreen]}
          onPress={() => onUpdateStatus(order.id, nextStatus)}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
          <Feather name="arrow-right" size={16} color={Colors.white} />
        </TouchableOpacity>
      )}
      {order.statut === "livre" && (
        <View style={styles.deliveredBadge}>
          <Feather name="check-circle" size={16} color={Colors.primaryDark} />
          <Text style={styles.deliveredText}>Commande livrée · Gain encaissé : {LIVREUR_GAIN} FCFA</Text>
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
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "gains">("active");
  const [showLogout, setShowLogout] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [clientMap, setClientMap] = useState<Record<string, any>>({});

  useFocusEffect(useCallback(() => {
    refreshOrders();
    api.users.getAll("client").then(({ users }) => {
      const map: Record<string, any> = {};
      users.forEach((u: any) => { map[u.id] = u; });
      setClientMap(map);
    }).catch(() => {});
  }, []));

  async function onRefresh() {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }

  async function confirmUpdateStatus() {
    if (!pendingStatus) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateOrderStatus(pendingStatus.orderId, pendingStatus.status);
    setPendingStatus(null);
  }

  async function doLogout() {
    setShowLogout(false);
    await logout();
    router.replace("/(auth)/login");
  }

  const allOrders = getAllOrders();
  const active = allOrders.filter((o) => o.statut !== "livre");
  const completed = allOrders.filter((o) => o.statut === "livre");

  // Gains calculations
  const totalGains = completed.length * LIVREUR_GAIN;
  const todayCompleted = completed.filter((o) => isToday(o.date));
  const todayGains = todayCompleted.length * LIVREUR_GAIN;

  const displayed = activeTab === "active" ? active : activeTab === "completed" ? completed : [];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>Interface Livreur</Text>
            <Text style={styles.headerSub}>{user?.prenom} {user?.nom}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowLogout(true)} style={styles.logoutBtn}>
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
          <Text style={styles.statValue}>{totalGains.toLocaleString()}</Text>
          <Text style={styles.statLabel}>FCFA gagnés</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {([
          { key: "active", label: `En cours (${active.length})` },
          { key: "completed", label: `Livrées (${completed.length})` },
          { key: "gains", label: "Mes gains" },
        ] as { key: "active" | "completed" | "gains"; label: string }[]).map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── GAINS TAB ── */}
        {activeTab === "gains" && (
          <>
            <View style={styles.gainsHero}>
              <Feather name="dollar-sign" size={28} color={Colors.white} />
              <Text style={styles.gainsHeroLabel}>Total des gains</Text>
              <Text style={styles.gainsHeroValue}>{totalGains.toLocaleString()} FCFA</Text>
              <Text style={styles.gainsHeroSub}>{completed.length} livraison{completed.length !== 1 ? "s" : ""} effectuée{completed.length !== 1 ? "s" : ""}</Text>
            </View>

            <View style={styles.gainsCard}>
              <Text style={styles.gainsCardTitle}>Aujourd'hui</Text>
              <View style={styles.gainsRow}>
                <View style={styles.gainsRowLeft}>
                  <Feather name="sun" size={16} color={Colors.orange} />
                  <Text style={styles.gainsRowLabel}>Livraisons du jour</Text>
                </View>
                <Text style={styles.gainsRowValue}>{todayCompleted.length}</Text>
              </View>
              <View style={styles.gainsRow}>
                <View style={styles.gainsRowLeft}>
                  <Feather name="trending-up" size={16} color={Colors.primary} />
                  <Text style={styles.gainsRowLabel}>Gains du jour</Text>
                </View>
                <Text style={[styles.gainsRowValue, { color: Colors.primary }]}>{todayGains.toLocaleString()} FCFA</Text>
              </View>
            </View>

            <View style={styles.gainsCard}>
              <Text style={styles.gainsCardTitle}>Total général</Text>
              <View style={styles.gainsRow}>
                <View style={styles.gainsRowLeft}>
                  <Feather name="package" size={16} color={Colors.primaryDark} />
                  <Text style={styles.gainsRowLabel}>Total livraisons</Text>
                </View>
                <Text style={styles.gainsRowValue}>{completed.length}</Text>
              </View>
              <View style={styles.gainsRow}>
                <View style={styles.gainsRowLeft}>
                  <Feather name="dollar-sign" size={16} color={Colors.primaryDark} />
                  <Text style={styles.gainsRowLabel}>Gain par livraison</Text>
                </View>
                <Text style={styles.gainsRowValue}>{LIVREUR_GAIN} FCFA</Text>
              </View>
              <View style={[styles.gainsRow, styles.gainsTotalRow]}>
                <View style={styles.gainsRowLeft}>
                  <Feather name="award" size={16} color={Colors.primary} />
                  <Text style={[styles.gainsRowLabel, { fontWeight: "700", color: Colors.text }]}>Total gagné</Text>
                </View>
                <Text style={[styles.gainsRowValue, { fontSize: 18, color: Colors.primary }]}>{totalGains.toLocaleString()} FCFA</Text>
              </View>
            </View>

            <View style={styles.gainsNote}>
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={styles.gainsNoteText}>
                Vous percevez {LIVREUR_GAIN} FCFA sur les 750 FCFA de frais de livraison pour chaque commande livrée. Les 350 FCFA restants reviennent à Makit+.
              </Text>
            </View>
          </>
        )}

        {/* ── COMMANDES ── */}
        {activeTab !== "gains" && (
          <>
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
                  client={clientMap[order.userId] || null}
                  onUpdateStatus={(id, s) => setPendingStatus({ orderId: id, status: s })}
                />
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmModal visible={showLogout} title="Déconnexion" message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmLabel="Déconnecter" cancelLabel="Annuler" danger onConfirm={doLogout} onCancel={() => setShowLogout(false)} />
      <ConfirmModal visible={!!pendingStatus} title="Mettre à jour le statut" message="Confirmer le changement de statut de cette commande ?"
        confirmLabel="Confirmer" cancelLabel="Annuler" onConfirm={confirmUpdateStatus} onCancel={() => setPendingStatus(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  statsBar: { flexDirection: "row", backgroundColor: Colors.primaryDark, paddingVertical: 10 },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  tabsRow: { flexDirection: "row", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 11, fontWeight: "600", color: Colors.textLight, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: Colors.primary },
  content: { padding: 16, gap: 12 },

  // Order card
  orderCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  orderCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  orderDate: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 2 },
  itemsList: { backgroundColor: Colors.background, borderRadius: 10, padding: 10, gap: 6 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemName: { flex: 1, fontSize: 12, color: Colors.text, fontFamily: "Inter_500Medium" },
  itemQty: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  itemPrice: { fontSize: 12, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold", marginLeft: 8 },
  itemDivider: { borderTopWidth: 1, borderTopColor: Colors.border, marginVertical: 4 },
  itemSubLabel: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  itemSubValue: { fontSize: 11, color: Colors.text, fontFamily: "Inter_500Medium" },
  itemTotalRow: { marginTop: 2 },
  itemTotalLabel: { fontSize: 13, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  itemTotalValue: { fontSize: 13, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  clientRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#E8F5E9", padding: 10, borderRadius: 10 },
  clientName: { fontSize: 13, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  clientPhone: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 2 },
  clientAddr: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 1 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.primaryLighter, padding: 10, borderRadius: 10 },
  addressText: { flex: 1, fontSize: 13, color: Colors.primaryDark, fontFamily: "Inter_500Medium" },
  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paymentMethod: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  gainBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  gainBadgeText: { color: Colors.white, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  actionBtn: { backgroundColor: Colors.orange, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionBtnGreen: { backgroundColor: Colors.primary },
  actionBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  deliveredBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primaryLighter, borderRadius: 10, paddingVertical: 10 },
  deliveredText: { fontSize: 13, fontWeight: "600", color: Colors.primaryDark, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textLight, fontFamily: "Inter_400Regular" },

  // Gains tab
  gainsHero: { backgroundColor: Colors.primary, borderRadius: 20, padding: 24, alignItems: "center", gap: 6 },
  gainsHeroLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" },
  gainsHeroValue: { fontSize: 34, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  gainsHeroSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  gainsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  gainsCardTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  gainsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  gainsRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  gainsRowLabel: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  gainsRowValue: { fontSize: 14, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  gainsTotalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 },
  gainsNote: { flexDirection: "row", gap: 10, backgroundColor: Colors.primaryLighter, borderRadius: 12, padding: 14, alignItems: "flex-start" },
  gainsNoteText: { flex: 1, fontSize: 12, color: Colors.primaryDark, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
