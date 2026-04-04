import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth, User } from "@/context/AuthContext";
import { useOrders, Order, OrderStatus } from "@/context/OrderContext";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import ConfirmModal from "@/components/ConfirmModal";
import * as Haptics from "expo-haptics";

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
  const { user, logout, getManagedUsers } = useAuth();
  const { getAllOrders, assignLivreur, updateOrderStatus, refreshOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "recette">("orders");
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useFocusEffect(useCallback(() => {
    refreshOrders();
    getManagedUsers("livreur").then(setLivreurs);
  }, []));

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refreshOrders(), getManagedUsers("livreur").then(setLivreurs)]);
    setRefreshing(false);
  }

  async function doLogout() {
    setShowLogout(false);
    await logout();
    router.replace("/(auth)/login");
  }

  async function confirmAssign(livreurId: string) {
    if (!pendingAssign) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await assignLivreur(pendingAssign, livreurId);
    setPendingAssign(null);
    setShowAssignModal(false);
  }

  async function confirmStatus() {
    if (!pendingStatus) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateOrderStatus(pendingStatus.orderId, pendingStatus.status);
    setPendingStatus(null);
  }

  const allOrders = getAllOrders();
  const pending = allOrders.filter((o) => o.statut === "en_attente");
  const inProgress = allOrders.filter((o) => o.statut !== "en_attente" && o.statut !== "livre" && o.statut !== "annule");
  const delivered = allOrders.filter((o) => o.statut === "livre");

  // Recette journalière
  const todayDelivered = delivered.filter((o) => isToday(o.date));
  const todayRevenueCourses = todayDelivered.reduce((s, o) => s + (o.totalProduits ?? 0), 0);
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
      {pendingAssign && (
        <AssignModal
          visible={!!pendingAssign}
          livreurs={livreurs}
          onSelect={(id) => confirmAssign(id)}
          onCancel={() => setPendingAssign(null)}
        />
      )}
      <ConfirmModal visible={!!pendingStatus} title="Mettre à jour" message="Confirmer le changement de statut ?"
        confirmLabel="Confirmer" cancelLabel="Annuler"
        onConfirm={confirmStatus} onCancel={() => setPendingStatus(null)} />
    </View>
  );
}

function AssignModal({ visible, livreurs, onSelect, onCancel }: {
  visible: boolean; livreurs: User[]; onSelect: (id: string) => void; onCancel: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={styles.assignOverlay}>
      <View style={styles.assignModal}>
        <Text style={styles.assignTitle}>Choisir un livreur</Text>
        {livreurs.length === 0 ? (
          <Text style={styles.assignEmpty}>Aucun livreur disponible. Contactez l'admin principal.</Text>
        ) : (
          livreurs.map((l) => (
            <TouchableOpacity key={l.id} style={styles.assignOption} onPress={() => onSelect(l.id)}>
              <View style={styles.assignAvatar}>
                <Text style={styles.assignAvatarText}>{(l.prenom ?? "?").charAt(0)}{(l.nom ?? "?").charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.assignName}>{l.prenom} {l.nom}</Text>
                <Text style={styles.assignPhone}>{l.telephone}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.primary} style={{ marginLeft: "auto" as any }} />
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.assignCancel} onPress={onCancel}>
          <Text style={styles.assignCancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
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
  const actionLabel = STATUS_LABEL[order.statut] ?? "Avancer";
  const adresse = order.adresse ?? {} as any;
  const totalFinal = order.totalFinal ?? 0;
  const totalProduits = order.totalProduits ?? 0;
  const fraisLivraison = order.fraisLivraison ?? 0;
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardId}>#{(order.id ?? "").slice(-6).toUpperCase()}</Text>
          <Text style={styles.cardDate}>{formatDate(order.date ?? "")}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <OrderStatusBadge statut={order.statut ?? "en_attente"} size="sm" />
          <Text style={styles.cardTotal}>{totalFinal.toLocaleString()} FCFA</Text>
        </View>
      </View>
      <View style={styles.cardAddress}>
        <Feather name="map-pin" size={12} color={Colors.primary} />
        <Text style={styles.cardAddressText}>
          {adresse.quartier ?? "—"}{(adresse.rue || adresse.details) ? `, ${adresse.rue ?? adresse.details}` : ""}
        </Text>
      </View>
      <View style={styles.itemsList}>
        {items.map((item: any, i: number) => {
          const nom = item?.product?.nom ?? item?.nom ?? "Article";
          const prix = item?.product?.prix ?? item?.prix ?? 0;
          const emoji = item?.product?.emoji ?? "🛒";
          const quantite = item?.quantite ?? 1;
          return (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{emoji} {nom} <Text style={styles.itemQty}>×{quantite}</Text></Text>
              <Text style={styles.itemPrice}>{(prix * quantite).toLocaleString()} F</Text>
            </View>
          );
        })}
        <View style={styles.itemDivider} />
        <View style={styles.itemRow}>
          <Text style={styles.itemSubLabel}>Sous-total articles</Text>
          <Text style={styles.itemSubValue}>{totalProduits.toLocaleString()} F</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemSubLabel}>Frais de livraison</Text>
          <Text style={styles.itemSubValue}>{fraisLivraison.toLocaleString()} F</Text>
        </View>
        <View style={[styles.itemRow, styles.itemTotalRow]}>
          <Text style={styles.itemTotalLabel}>Total final</Text>
          <Text style={styles.itemTotalValue}>{totalFinal.toLocaleString()} FCFA</Text>
        </View>
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
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  assignBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  assignBtnText: { color: Colors.white, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  livreurBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primaryLighter, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  livreurText: { fontSize: 11, color: Colors.primaryDark, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primaryDark, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  statusBtnText: { color: Colors.white, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center" },
  assignOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", zIndex: 999 },
  assignModal: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  assignTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 4 },
  assignEmpty: { fontSize: 13, color: Colors.textLight, textAlign: "center", paddingVertical: 20, fontFamily: "Inter_400Regular" },
  assignOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: Colors.background, borderRadius: 12 },
  assignAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLighter, alignItems: "center", justifyContent: "center" },
  assignAvatarText: { fontSize: 15, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  assignName: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  assignPhone: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  assignCancel: { padding: 14, alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4 },
  assignCancelText: { fontSize: 15, color: Colors.red, fontFamily: "Inter_600SemiBold" },
});
