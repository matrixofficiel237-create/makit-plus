import React, { useCallback, useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, Image, TextInput, ActivityIndicator,
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

const LIVREUR_ID = "livreur-1";
const LIVREUR_PART = 400;
const ENTREPRISE_PART = 350;
const FRAIS_LIVRAISON = 750;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

type Tab = "orders" | "stats" | "equipe";

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, createSubAdmin, getSubAdmins, deleteSubAdmin } = useAuth();
  const { getAllOrders, assignLivreur, updateOrderStatus, refreshOrders } = useOrders();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [showLogout, setShowLogout] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [pendingDeleteSub, setPendingDeleteSub] = useState<string | null>(null);

  // Sub-admin management
  const [subAdmins, setSubAdmins] = useState<User[]>([]);
  const [subForm, setSubForm] = useState({ nom: "", prenom: "", telephone: "", motDePasse: "" });
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");
  const [subSuccess, setSubSuccess] = useState("");

  useFocusEffect(useCallback(() => { refreshOrders(); loadSubAdmins(); }, []));

  async function loadSubAdmins() {
    const list = await getSubAdmins();
    setSubAdmins(list);
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refreshOrders(), loadSubAdmins()]);
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

  async function handleCreateSubAdmin() {
    if (!subForm.nom || !subForm.prenom || !subForm.telephone || !subForm.motDePasse) {
      setSubError("Tous les champs sont requis");
      return;
    }
    if (subForm.motDePasse.length < 4) {
      setSubError("Mot de passe : 4 caractères minimum");
      return;
    }
    setSubLoading(true);
    setSubError("");
    const result = await createSubAdmin(subForm);
    setSubLoading(false);
    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubForm({ nom: "", prenom: "", telephone: "", motDePasse: "" });
      setSubSuccess(`Sous-admin ${result.prenom} ${result.nom} créé !`);
      setTimeout(() => setSubSuccess(""), 3000);
      await loadSubAdmins();
    } else {
      setSubError("Ce numéro de téléphone est déjà utilisé");
    }
  }

  async function confirmDeleteSub() {
    if (!pendingDeleteSub) return;
    await deleteSubAdmin(pendingDeleteSub);
    setPendingDeleteSub(null);
    await loadSubAdmins();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const allOrders = getAllOrders();
  const pending = allOrders.filter((o) => o.statut === "en_attente");
  const inProgress = allOrders.filter((o) => o.statut !== "en_attente" && o.statut !== "livre");
  const delivered = allOrders.filter((o) => o.statut === "livre");

  // Financial breakdown
  const totalCourses = allOrders.reduce((s, o) => s + o.totalProduits, 0);
  const totalTransport = delivered.length * FRAIS_LIVRAISON;
  const totalPartLivreur = delivered.length * LIVREUR_PART;
  const totalPartEntreprise = delivered.length * ENTREPRISE_PART;
  const netEntreprise = delivered.reduce((s, o) => s + o.totalProduits, 0) + totalPartEntreprise;

  // Today
  const todayDelivered = delivered.filter((o) => isToday(o.date));
  const todayNet = todayDelivered.reduce((s, o) => s + o.totalProduits, 0) + todayDelivered.length * ENTREPRISE_PART;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>Administration</Text>
            <Text style={styles.headerSub}>Makit+ · Admin Principal</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowLogout(true)} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {([
          { key: "orders", label: `Commandes (${allOrders.length})` },
          { key: "stats", label: "Finances" },
          { key: "equipe", label: "Équipe" },
        ] as { key: Tab; label: string }[]).map((t) => (
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
        {/* ── COMMANDES ── */}
        {activeTab === "orders" && (
          <>
            {pending.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>⏳ En attente ({pending.length})</Text>
                {pending.map((o) => (
                  <AdminOrderCard key={o.id} order={o}
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
                  <AdminOrderCard key={o.id} order={o}
                    onUpdateStatus={(id, s) => setPendingStatus({ orderId: id, status: s })}
                  />
                ))}
              </>
            )}
            {delivered.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>✅ Livrées ({delivered.length})</Text>
                {delivered.map((o) => (
                  <AdminOrderCard key={o.id} order={o} />
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

        {/* ── FINANCES ── */}
        {activeTab === "stats" && (
          <>
            <View style={styles.financeHeroRow}>
              <View style={[styles.financeHero, { flex: 1 }]}>
                <Text style={styles.financeHeroLabel}>Net entreprise (total)</Text>
                <Text style={styles.financeHeroValue}>{netEntreprise.toLocaleString()} F</Text>
              </View>
              <View style={[styles.financeHero, { flex: 1, backgroundColor: Colors.primaryDark }]}>
                <Text style={styles.financeHeroLabel}>Net aujourd'hui</Text>
                <Text style={styles.financeHeroValue}>{todayNet.toLocaleString()} F</Text>
              </View>
            </View>

            <StatCard label="Commandes totales" value={allOrders.length} color={Colors.primary} icon="shopping-bag" />
            <StatCard label="Livrées" value={delivered.length} color={Colors.primaryDark} icon="check-circle" />
            <StatCard label="En attente" value={pending.length} color={Colors.orange} icon="clock" />

            {/* Décomposition financière */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>💰 Décomposition des revenus</Text>
              <Text style={styles.breakdownSubtitle}>{delivered.length} commande{delivered.length !== 1 ? "s" : ""} livrée{delivered.length !== 1 ? "s" : ""}</Text>

              <View style={styles.bRow}>
                <Text style={styles.bLabel}>Montant courses total</Text>
                <Text style={styles.bValue}>{totalCourses.toLocaleString()} FCFA</Text>
              </View>

              <View style={[styles.bRow, styles.bSeparator]}>
                <Text style={styles.bLabel}>Transport collecté (750 × {delivered.length})</Text>
                <Text style={styles.bValue}>{totalTransport.toLocaleString()} FCFA</Text>
              </View>

              <View style={[styles.bRow, { paddingLeft: 12 }]}>
                <View style={styles.bDot}><Text style={styles.bDotText}>−</Text></View>
                <Text style={[styles.bLabel, { color: Colors.red }]}>Part livreurs (400 × {delivered.length})</Text>
                <Text style={[styles.bValue, { color: Colors.red }]}>− {totalPartLivreur.toLocaleString()} FCFA</Text>
              </View>

              <View style={[styles.bRow, { paddingLeft: 12 }]}>
                <View style={[styles.bDot, { backgroundColor: Colors.primaryLighter }]}><Text style={[styles.bDotText, { color: Colors.primaryDark }]}>+</Text></View>
                <Text style={[styles.bLabel, { color: Colors.primaryDark }]}>Part entreprise transport (350 × {delivered.length})</Text>
                <Text style={[styles.bValue, { color: Colors.primaryDark }]}>{totalPartEntreprise.toLocaleString()} FCFA</Text>
              </View>

              <View style={styles.bTotal}>
                <Text style={styles.bTotalLabel}>= Revenu net entreprise</Text>
                <Text style={styles.bTotalValue}>{netEntreprise.toLocaleString()} FCFA</Text>
              </View>

              <View style={styles.bNote}>
                <Feather name="info" size={13} color={Colors.primary} />
                <Text style={styles.bNoteText}>
                  Net = Montant courses + part transport entreprise (350 FCFA/livraison). Le transport client (750 FCFA) couvre 400 FCFA livreur + 350 FCFA entreprise.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── ÉQUIPE ── */}
        {activeTab === "equipe" && (
          <>
            {/* Créer un sous-admin */}
            <View style={styles.createCard}>
              <View style={styles.createHeader}>
                <Feather name="user-plus" size={18} color={Colors.primary} />
                <Text style={styles.createTitle}>Créer un sous-administrateur</Text>
              </View>
              <Text style={styles.createDesc}>
                Les sous-admins peuvent gérer les commandes, assigner les livreurs et consulter la recette journalière.
              </Text>

              {subError ? <View style={styles.errBox}><Text style={styles.errText}>{subError}</Text></View> : null}
              {subSuccess ? <View style={styles.successBox}><Text style={styles.successText}>{subSuccess}</Text></View> : null}

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Prénom</Text>
                  <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={Colors.gray}
                    value={subForm.prenom} onChangeText={(v) => setSubForm((f) => ({ ...f, prenom: v }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Nom</Text>
                  <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={Colors.gray}
                    value={subForm.nom} onChangeText={(v) => setSubForm((f) => ({ ...f, nom: v }))} />
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Téléphone (identifiant de connexion)</Text>
                <TextInput style={styles.input} placeholder="Ex: 0612345678" placeholderTextColor={Colors.gray}
                  value={subForm.telephone} onChangeText={(v) => setSubForm((f) => ({ ...f, telephone: v }))}
                  keyboardType="phone-pad" />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <TextInput style={styles.input} placeholder="Minimum 4 caractères" placeholderTextColor={Colors.gray}
                  value={subForm.motDePasse} onChangeText={(v) => setSubForm((f) => ({ ...f, motDePasse: v }))}
                  secureTextEntry />
              </View>

              <TouchableOpacity style={[styles.createBtn, subLoading && { opacity: 0.7 }]} onPress={handleCreateSubAdmin} disabled={subLoading}>
                {subLoading ? <ActivityIndicator color={Colors.white} /> : (
                  <>
                    <Feather name="plus" size={18} color={Colors.white} />
                    <Text style={styles.createBtnText}>Créer le sous-admin</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Liste sous-admins */}
            <Text style={styles.sectionTitle}>Sous-administrateurs ({subAdmins.length})</Text>
            {subAdmins.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="users" size={40} color={Colors.border} />
                <Text style={styles.emptyText}>Aucun sous-admin créé pour le moment</Text>
              </View>
            ) : (
              subAdmins.map((sa) => (
                <View key={sa.id} style={styles.subAdminCard}>
                  <View style={styles.subAdminAvatar}>
                    <Text style={styles.subAdminAvatarText}>
                      {sa.prenom.charAt(0).toUpperCase()}{sa.nom.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.subAdminInfo}>
                    <Text style={styles.subAdminName}>{sa.prenom} {sa.nom}</Text>
                    <Text style={styles.subAdminPhone}>📞 {sa.telephone}</Text>
                    <View style={styles.subAdminBadge}>
                      <Text style={styles.subAdminBadgeText}>Sous-administrateur</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => setPendingDeleteSub(sa.id)}>
                    <Feather name="trash-2" size={18} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmModal visible={showLogout} title="Déconnexion" message="Se déconnecter de l'administration ?"
        confirmLabel="Déconnecter" cancelLabel="Annuler" danger onConfirm={doLogout} onCancel={() => setShowLogout(false)} />
      <ConfirmModal visible={!!pendingAssign} title="Assigner le livreur" message="Assigner cette commande au livreur Makit+ ?"
        confirmLabel="Assigner" cancelLabel="Annuler" onConfirm={confirmAssign} onCancel={() => setPendingAssign(null)} />
      <ConfirmModal visible={!!pendingStatus} title="Mettre à jour le statut" message="Confirmer le changement de statut ?"
        confirmLabel="Confirmer" cancelLabel="Annuler" onConfirm={confirmStatus} onCancel={() => setPendingStatus(null)} />
      <ConfirmModal visible={!!pendingDeleteSub} title="Supprimer le sous-admin" message="Cette action est irréversible. Supprimer ce sous-administrateur ?"
        confirmLabel="Supprimer" cancelLabel="Annuler" danger onConfirm={confirmDeleteSub} onCancel={() => setPendingDeleteSub(null)} />
    </View>
  );
}

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  en_attente: "achat_en_cours", achat_en_cours: "en_livraison", en_livraison: "livre",
};
const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  en_attente: "Commencer l'achat", achat_en_cours: "En route", en_livraison: "Marquer livré",
};

function AdminOrderCard({ order, onUpdateStatus, onAssign }: {
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
      <View style={styles.cardFinance}>
        <Text style={styles.cardFinanceText}>
          Courses : {order.totalProduits.toLocaleString()} F  ·  Transport : {order.fraisLivraison} F
          {order.statut === "livre" ? `  ·  Livreur : ${LIVREUR_PART} F  ·  Entreprise : +${ENTREPRISE_PART} F` : ""}
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
  header: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  tabsRow: { flexDirection: "row", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: Colors.textLight, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: Colors.primary },
  content: { padding: 14, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", marginTop: 6 },

  // Finance
  financeHeroRow: { flexDirection: "row", gap: 10 },
  financeHero: { backgroundColor: Colors.primary, borderRadius: 16, padding: 16, alignItems: "center", gap: 6 },
  financeHeroLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", textAlign: "center" },
  financeHeroValue: { fontSize: 20, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  statCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  breakdownCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  breakdownTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  breakdownSubtitle: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: -4 },
  bRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  bSeparator: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 2 },
  bDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFEBEE", alignItems: "center", justifyContent: "center", marginRight: 6 },
  bDotText: { fontSize: 14, fontWeight: "700", color: Colors.red },
  bLabel: { flex: 1, fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  bValue: { fontSize: 13, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  bTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 2, borderTopColor: Colors.primary, paddingTop: 12, marginTop: 4 },
  bTotalLabel: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  bTotalValue: { fontSize: 18, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  bNote: { flexDirection: "row", gap: 8, backgroundColor: Colors.primaryLighter, borderRadius: 10, padding: 10, alignItems: "flex-start" },
  bNoteText: { flex: 1, fontSize: 11, color: Colors.primaryDark, fontFamily: "Inter_400Regular", lineHeight: 16 },

  // Orders/Cards
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardId: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  cardDate: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 1 },
  cardTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  cardAddress: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: Colors.primaryLighter, padding: 8, borderRadius: 8 },
  cardAddressText: { flex: 1, fontSize: 12, color: Colors.primaryDark, fontFamily: "Inter_400Regular" },
  cardItems: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  cardItemsText: { flex: 1, fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  cardFinance: { backgroundColor: Colors.lightGray, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  cardFinanceText: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  assignBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  assignBtnText: { color: Colors.white, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  livreurBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primaryLighter, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  livreurText: { fontSize: 11, color: Colors.primaryDark, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primaryDark, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  statusBtnText: { color: Colors.white, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  // Equipe
  createCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, borderWidth: 1.5, borderColor: Colors.primaryLighter },
  createHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  createTitle: { fontSize: 16, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  createDesc: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular", lineHeight: 20 },
  errBox: { backgroundColor: "#FFEBEE", padding: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.red },
  errText: { color: Colors.red, fontSize: 13, fontFamily: "Inter_400Regular" },
  successBox: { backgroundColor: Colors.primaryLighter, padding: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  successText: { color: Colors.primaryDark, fontSize: 13, fontFamily: "Inter_400Regular" },
  formRow: { flexDirection: "row", gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold", marginBottom: 5 },
  input: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: Colors.text, fontFamily: "Inter_400Regular" },
  createBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  createBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  subAdminCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  subAdminAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLighter, alignItems: "center", justifyContent: "center" },
  subAdminAvatarText: { fontSize: 16, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  subAdminInfo: { flex: 1, gap: 3 },
  subAdminName: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  subAdminPhone: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  subAdminBadge: { backgroundColor: Colors.primaryLighter, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  subAdminBadgeText: { fontSize: 10, color: Colors.primaryDark, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  deleteBtn: { padding: 8 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center" },
});
