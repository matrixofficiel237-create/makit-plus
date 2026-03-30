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
import OrderStatusBadge from "@/components/OrderStatusBadge";
import ConfirmModal from "@/components/ConfirmModal";
import * as Haptics from "expo-haptics";

const LIVREUR_ID = "livreur-1";
const LIVREUR_PART = 400;
const ENTREPRISE_PART = 350;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function SousAdminDashboard() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();
  const { getAllOrders, assignLivreur, updateOrderStatus, refreshOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "recette">("orders");

  useFocusEffect(useCallback(() => { refreshOrders(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }

  async function doLogout() {
    setShowLogout(false);
    await logout();
    router.replace("/(auth)/login");
  }

  async function confirmAssign() {
    if (!pendingAssign) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await assignLivreur(pendingAssign, LIVREUR_ID);
    setPendingAssign(null);
  }

  async function confirmStatus() {
    if (!pendingStatus) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateOrderStatus(pendingStatus.orderId, pendingStatus.status);
    setPendingStatus(null);
  }

  const allOrders = getAllOrders();
  const pending = allOrders.filter((o) => o.statut === "en_attente");
  const inProgress = allOrders.filter((o) => o.statut !== "en_attente" && o.statut !== "livre");
  const delivered = allOrders.filter((o) => o.statut === "livre");

  // Recette journalière
  const todayDelivered = delivered.filter((o) => isToday(o.date));
  const todayRevenueCourses = todayDelivered.reduce((s, o) => s + o.totalProduits, 0);
  const todayTransport = todayDelivered.length * 750;
  const todayPartLivreur = todayDelivered.length * LIVREUR_PART;
  const todayPartEntreprise = todayDelivered.length * ENTREPRISE_PART;
  const todayNetEntreprise = todayRevenueCourses + todayPartEntreprise;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>Sous-Admin</Text>
            <Text style={styles.headerSub}>{user?.prenom} {user?.nom}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowLogout(true)} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, activeTab === "orders" && styles.tabActive]} onPress={() => setActiveTab("orders")}>
          <Text style={[styles.tabText, activeTab === "orders" && styles.tabTextActive]}>
            Commandes ({allOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "recette" && styles.tabActive]} onPress={() => setActiveTab("recette")}>
          <Text style={[styles.tabText, activeTab === "recette" && styles.tabTextActive]}>
            Recette du jour
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {activeTab === "recette" && (
          <>
            <View style={styles.dateCard}>
              <Feather name="calendar" size={16} color={Colors.primary} />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </Text>
            </View>

            <View style={styles.recetteHero}>
              <Text style={styles.recetteLabel}>Recette nette entreprise</Text>
              <Text style={styles.recetteValue}>{todayNetEntreprise.toLocaleString()} FCFA</Text>
              <Text style={styles.recetteSub}>{todayDelivered.length} livraison{todayDelivered.length !== 1 ? "s" : ""} aujourd'hui</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Détail de la recette</Text>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <Feather name="shopping-bag" size={16} color={Colors.primary} />
                  <Text style={styles.breakdownLabel}>Montant courses</Text>
                </View>
                <Text style={styles.breakdownValue}>{todayRevenueCourses.toLocaleString()} FCFA</Text>
              </View>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <Feather name="truck" size={16} color={Colors.orange} />
                  <Text style={styles.breakdownLabel}>Transport collecté</Text>
                </View>
                <Text style={styles.breakdownValue}>{todayTransport.toLocaleString()} FCFA</Text>
              </View>

              <View style={[styles.breakdownRow, { paddingLeft: 24 }]}>
                <View style={styles.breakdownLeft}>
                  <Feather name="minus" size={14} color={Colors.red} />
                  <Text style={[styles.breakdownLabel, { color: Colors.red }]}>Part livreur (400 × {todayDelivered.length})</Text>
                </View>
                <Text style={[styles.breakdownValue, { color: Colors.red }]}>- {todayPartLivreur.toLocaleString()} FCFA</Text>
              </View>

              <View style={[styles.breakdownRow, { paddingLeft: 24 }]}>
                <View style={styles.breakdownLeft}>
                  <Feather name="plus" size={14} color={Colors.primaryDark} />
                  <Text style={[styles.breakdownLabel, { color: Colors.primaryDark }]}>Part entreprise (350 × {todayDelivered.length})</Text>
                </View>
                <Text style={[styles.breakdownValue, { color: Colors.primaryDark }]}>{todayPartEntreprise.toLocaleString()} FCFA</Text>
              </View>

              <View style={styles.breakdownTotal}>
                <Text style={styles.breakdownTotalLabel}>= Recette nette</Text>
                <Text style={styles.breakdownTotalValue}>{todayNetEntreprise.toLocaleString()} FCFA</Text>
              </View>
            </View>

            {todayDelivered.length === 0 && (
              <View style={styles.empty}>
                <Feather name="moon" size={40} color={Colors.border} />
                <Text style={styles.emptyText}>Aucune livraison aujourd'hui pour l'instant</Text>
              </View>
            )}
          </>
        )}

        {activeTab === "orders" && (
          <>
            {pending.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>⏳ En attente ({pending.length})</Text>
                {pending.map((o) => (
                  <SousAdminOrderCard key={o.id} order={o}
                    onUpdateStatus={(id, s) => setPendingStatus({ orderId: id, status: s })}
                    onAssign={!o.livreurId ? () => setPendingAssign(o.id) : undefined}
                  />
                ))}
              </>
            )}
            {inProgress.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🚚 En cours ({inProgress.length})</Text>
                {inProgress.map((o) => (
                  <SousAdminOrderCard key={o.id} order={o}
                    onUpdateStatus={(id, s) => setPendingStatus({ orderId: id, status: s })}
                  />
                ))}
              </>
            )}
            {delivered.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>✅ Livrées ({delivered.length})</Text>
                {delivered.map((o) => (
                  <SousAdminOrderCard key={o.id} order={o} />
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

      <ConfirmModal visible={showLogout} title="Déconnexion" message="Se déconnecter ?"
        confirmLabel="Déconnecter" cancelLabel="Annuler" danger
        onConfirm={doLogout} onCancel={() => setShowLogout(false)} />
      <ConfirmModal visible={!!pendingAssign} title="Assigner le livreur" message="Assigner cette commande au livreur Makit+ ?"
        confirmLabel="Assigner" cancelLabel="Annuler"
        onConfirm={confirmAssign} onCancel={() => setPendingAssign(null)} />
      <ConfirmModal visible={!!pendingStatus} title="Mettre à jour" message="Confirmer le changement de statut ?"
        confirmLabel="Confirmer" cancelLabel="Annuler"
        onConfirm={confirmStatus} onCancel={() => setPendingStatus(null)} />
    </View>
  );
}

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  en_attente: "achat_en_cours", achat_en_cours: "en_livraison", en_livraison: "livre",
};
const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  en_attente: "Commencer l'achat", achat_en_cours: "En route", en_livraison: "Marquer livré",
};

function SousAdminOrderCard({ order, onUpdateStatus, onAssign }: {
  order: Order;
  onUpdateStatus?: (id: string, s: OrderStatus) => void;
  onAssign?: () => void;
}) {
  const nextStatus = STATUS_NEXT[order.statut];
  const actionLabel = STATUS_LABEL[order.statut];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.cardDate}>{formatDate(order.date)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <OrderStatusBadge statut={order.statut} size="sm" />
          <Text style={styles.cardTotal}>{order.totalFinal.toLocaleString()} FCFA</Text>
        </View>
      </View>
      <View style={styles.cardAddress}>
        <Feather name="map-pin" size={12} color={Colors.primary} />
        <Text style={styles.cardAddressText}>{order.adresse.quartier}, {order.adresse.rue}</Text>
      </View>
      <View style={styles.cardItems}>
        <Feather name="package" size={12} color={Colors.textLight} />
        <Text style={styles.cardItemsText} numberOfLines={1}>
          {order.items.map((i) => `${i.product.nom} ×${i.quantite}`).join(", ")}
        </Text>
      </View>
      <View style={styles.cardActions}>
        {!order.livreurId && onAssign && (
          <TouchableOpacity style={styles.assignBtn} onPress={onAssign}>
            <Feather name="user-plus" size={13} color={Colors.white} />
            <Text style={styles.assignBtnText}>Assigner livreur</Text>
          </TouchableOpacity>
        )}
        {order.livreurId && (
          <View style={styles.livreurBadge}>
            <Feather name="user-check" size={12} color={Colors.primaryDark} />
            <Text style={styles.livreurText}>Livreur assigné</Text>
          </View>
        )}
        {nextStatus && onUpdateStatus && (
          <TouchableOpacity style={styles.statusBtn} onPress={() => onUpdateStatus(order.id, nextStatus)}>
            <Text style={styles.statusBtnText}>{actionLabel}</Text>
            <Feather name="arrow-right" size={13} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  tabsRow: { flexDirection: "row", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: Colors.textLight, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: Colors.primary },
  content: { padding: 14, gap: 10 },
  dateCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primaryLighter, borderRadius: 10, padding: 12 },
  dateText: { fontSize: 14, fontWeight: "600", color: Colors.primaryDark, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  recetteHero: { backgroundColor: Colors.primary, borderRadius: 18, padding: 22, alignItems: "center", gap: 6 },
  recetteLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" },
  recetteValue: { fontSize: 32, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  recetteSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  breakdownCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  breakdownTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", marginBottom: 4 },
  breakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  breakdownLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownLabel: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  breakdownValue: { fontSize: 13, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  breakdownTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1.5, borderTopColor: Colors.primaryLighter, paddingTop: 12, marginTop: 4 },
  breakdownTotalLabel: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  breakdownTotalValue: { fontSize: 18, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", marginTop: 6 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardId: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  cardDate: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 1 },
  cardTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  cardAddress: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: Colors.primaryLighter, padding: 8, borderRadius: 8 },
  cardAddressText: { flex: 1, fontSize: 12, color: Colors.primaryDark, fontFamily: "Inter_400Regular" },
  cardItems: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  cardItemsText: { flex: 1, fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  assignBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  assignBtnText: { color: Colors.white, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  livreurBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primaryLighter, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  livreurText: { fontSize: 11, color: Colors.primaryDark, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primaryDark, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  statusBtnText: { color: Colors.white, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center" },
});
