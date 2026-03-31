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

const LIVREUR_PART = 400;
const ENTREPRISE_PART = 350;
const FRAIS_LIVRAISON = 750;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function dayKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
type TeamSection = "sous_admin" | "livreur";

const blankForm = { nom: "", prenom: "", telephone: "", motDePasse: "" };

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, createManagedUser, getManagedUsers, deleteManagedUser } = useAuth();
  const { getAllOrders, assignLivreur, updateOrderStatus, refreshOrders } = useOrders();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [teamSection, setTeamSection] = useState<TeamSection>("livreur");
  const [showLogout, setShowLogout] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [availableLivreurs, setAvailableLivreurs] = useState<User[]>([]);
  const [form, setForm] = useState(blankForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useFocusEffect(useCallback(() => { refreshOrders(); loadUsers(); }, []));

  async function loadUsers() {
    const all = await getManagedUsers();
    setManagedUsers(all);
    setAvailableLivreurs(all.filter((u) => u.role === "livreur"));
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refreshOrders(), loadUsers()]);
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
  }

  async function confirmStatus() {
    if (!pendingStatus) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateOrderStatus(pendingStatus.orderId, pendingStatus.status);
    setPendingStatus(null);
  }

  async function handleCreate() {
    if (!form.nom || !form.prenom || !form.telephone || !form.motDePasse) {
      setFormError("Tous les champs sont requis");
      return;
    }
    if (form.motDePasse.length < 4) {
      setFormError("Mot de passe : 4 caractères minimum");
      return;
    }
    setFormLoading(true);
    setFormError("");
    const result = await createManagedUser({ ...form, role: teamSection });
    setFormLoading(false);
    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setForm(blankForm);
      setFormSuccess(`${teamSection === "livreur" ? "Livreur" : "Sous-admin"} ${result.prenom} ${result.nom} créé !`);
      setTimeout(() => setFormSuccess(""), 3000);
      await loadUsers();
    } else {
      setFormError("Ce numéro de téléphone est déjà utilisé");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await deleteManagedUser(pendingDelete);
    setPendingDelete(null);
    await loadUsers();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const allOrders = getAllOrders();
  const pending = allOrders.filter((o) => o.statut === "en_attente");
  const inProgress = allOrders.filter((o) => o.statut !== "en_attente" && o.statut !== "livre");
  const delivered = allOrders.filter((o) => o.statut === "livre");

  // Financial calculations
  const totalCourses = allOrders.reduce((s, o) => s + o.totalProduits, 0);
  const totalPartLivreur = delivered.length * LIVREUR_PART;
  const totalPartEntreprise = delivered.length * ENTREPRISE_PART;
  const netEntreprise = delivered.reduce((s, o) => s + o.totalProduits, 0) + totalPartEntreprise;

  // Group delivered orders by day
  const byDay = delivered.reduce((acc: Record<string, Order[]>, o) => {
    const k = dayKey(o.date);
    if (!acc[k]) acc[k] = [];
    acc[k].push(o);
    return acc;
  }, {});
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  const shownUsers = managedUsers.filter((u) => u.role === teamSection);
  const livreurMap = Object.fromEntries(availableLivreurs.map((l) => [l.id, l]));

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
                  <AdminOrderCard key={o.id} order={o} livreurMap={livreurMap}
                    onUpdateStatus={(id, s) => setPendingStatus({ orderId: id, status: s })}
                    onAssign={() => setPendingAssign(o.id)}
                  />
                ))}
              </>
            )}
            {inProgress.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🚚 En cours ({inProgress.length})</Text>
                {inProgress.map((o) => (
                  <AdminOrderCard key={o.id} order={o} livreurMap={livreurMap}
                    onUpdateStatus={(id, s) => setPendingStatus({ orderId: id, status: s })}
                  />
                ))}
              </>
            )}
            {delivered.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>✅ Livrées ({delivered.length})</Text>
                {delivered.map((o) => (
                  <AdminOrderCard key={o.id} order={o} livreurMap={livreurMap} />
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
            {/* Net total hero */}
            <View style={styles.financeHeroRow}>
              <View style={[styles.financeHero, { flex: 1 }]}>
                <Text style={styles.financeHeroLabel}>Net entreprise (total)</Text>
                <Text style={styles.financeHeroValue}>{netEntreprise.toLocaleString()} F</Text>
              </View>
              <View style={[styles.financeHero, { flex: 1, backgroundColor: Colors.primaryDark }]}>
                <Text style={styles.financeHeroLabel}>Livraisons totales</Text>
                <Text style={styles.financeHeroValue}>{delivered.length}</Text>
              </View>
            </View>

            <StatCard label="Commandes totales" value={allOrders.length} color={Colors.primary} icon="shopping-bag" />
            <StatCard label="Part livreurs (400 × {n})" value={`− ${totalPartLivreur.toLocaleString()} FCFA`} color={Colors.red} icon="user" />
            <StatCard label="Part entreprise (transport)" value={`${totalPartEntreprise.toLocaleString()} FCFA`} color={Colors.primaryDark} icon="truck" />

            {/* Finance globale */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>💰 Récapitulatif global</Text>
              <FinanceLine label="Montant courses" value={`${totalCourses.toLocaleString()} FCFA`} />
              <FinanceLine label={`Transport collecté (750 × ${delivered.length})`} value={`${(delivered.length * FRAIS_LIVRAISON).toLocaleString()} FCFA`} separator />
              <FinanceLine label={`  − Part livreurs (400 × ${delivered.length})`} value={`− ${totalPartLivreur.toLocaleString()} FCFA`} red />
              <FinanceLine label={`  + Part entreprise (350 × ${delivered.length})`} value={`${totalPartEntreprise.toLocaleString()} FCFA`} green />
              <View style={styles.bTotal}>
                <Text style={styles.bTotalLabel}>= Revenu net entreprise</Text>
                <Text style={styles.bTotalValue}>{netEntreprise.toLocaleString()} FCFA</Text>
              </View>
            </View>

            {/* Daily breakdown */}
            <Text style={styles.sectionTitle}>📅 Recettes par journée</Text>
            {sortedDays.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="calendar" size={36} color={Colors.border} />
                <Text style={styles.emptyText}>Aucune livraison pour l'instant</Text>
              </View>
            ) : (
              sortedDays.map((day) => {
                const dayOrders = byDay[day];
                const dayCourses = dayOrders.reduce((s, o) => s + o.totalProduits, 0);
                const dayNet = dayCourses + dayOrders.length * ENTREPRISE_PART;
                const dayLivreur = dayOrders.length * LIVREUR_PART;
                return (
                  <View key={day} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayTitle}>{formatDay(dayOrders[0].date)}</Text>
                      <View style={styles.dayNetBadge}>
                        <Text style={styles.dayNetText}>{dayNet.toLocaleString()} FCFA</Text>
                      </View>
                    </View>
                    <View style={styles.dayStats}>
                      <View style={styles.dayStat}>
                        <Text style={styles.dayStatVal}>{dayOrders.length}</Text>
                        <Text style={styles.dayStatLabel}>Livraisons</Text>
                      </View>
                      <View style={styles.dayStat}>
                        <Text style={styles.dayStatVal}>{dayCourses.toLocaleString()} F</Text>
                        <Text style={styles.dayStatLabel}>Courses</Text>
                      </View>
                      <View style={styles.dayStat}>
                        <Text style={[styles.dayStatVal, { color: Colors.red }]}>− {dayLivreur.toLocaleString()} F</Text>
                        <Text style={styles.dayStatLabel}>Livreurs</Text>
                      </View>
                      <View style={styles.dayStat}>
                        <Text style={[styles.dayStatVal, { color: Colors.primary }]}>{dayNet.toLocaleString()} F</Text>
                        <Text style={styles.dayStatLabel}>Net</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── ÉQUIPE ── */}
        {activeTab === "equipe" && (
          <>
            {/* Team section selector */}
            <View style={styles.teamToggle}>
              <TouchableOpacity style={[styles.teamToggleBtn, teamSection === "livreur" && styles.teamToggleBtnActive]}
                onPress={() => { setTeamSection("livreur"); setForm(blankForm); setFormError(""); setFormSuccess(""); }}>
                <Feather name="truck" size={15} color={teamSection === "livreur" ? Colors.white : Colors.textLight} />
                <Text style={[styles.teamToggleText, teamSection === "livreur" && styles.teamToggleTextActive]}>Livreurs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.teamToggleBtn, teamSection === "sous_admin" && styles.teamToggleBtnActive]}
                onPress={() => { setTeamSection("sous_admin"); setForm(blankForm); setFormError(""); setFormSuccess(""); }}>
                <Feather name="shield" size={15} color={teamSection === "sous_admin" ? Colors.white : Colors.textLight} />
                <Text style={[styles.teamToggleText, teamSection === "sous_admin" && styles.teamToggleTextActive]}>Sous-admins</Text>
              </TouchableOpacity>
            </View>

            {/* Create form */}
            <View style={styles.createCard}>
              <View style={styles.createHeader}>
                <Feather name={teamSection === "livreur" ? "truck" : "user-plus"} size={18} color={Colors.primary} />
                <Text style={styles.createTitle}>
                  {teamSection === "livreur" ? "Ajouter un livreur" : "Créer un sous-administrateur"}
                </Text>
              </View>
              <Text style={styles.createDesc}>
                {teamSection === "livreur"
                  ? "Le livreur peut voir et gérer ses livraisons, et consulter ses gains."
                  : "Le sous-admin peut gérer les commandes, assigner les livreurs et consulter la recette journalière."}
              </Text>

              {formError ? <View style={styles.errBox}><Text style={styles.errText}>{formError}</Text></View> : null}
              {formSuccess ? <View style={styles.successBox}><Text style={styles.successText}>{formSuccess}</Text></View> : null}

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Prénom</Text>
                  <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={Colors.gray}
                    value={form.prenom} onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Nom</Text>
                  <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={Colors.gray}
                    value={form.nom} onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))} />
                </View>
              </View>
              <View>
                <Text style={styles.fieldLabel}>Téléphone (identifiant)</Text>
                <TextInput style={styles.input} placeholder="Ex: 0612345678" placeholderTextColor={Colors.gray}
                  value={form.telephone} onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))}
                  keyboardType="phone-pad" />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <TextInput style={styles.input} placeholder="Minimum 4 caractères" placeholderTextColor={Colors.gray}
                  value={form.motDePasse} onChangeText={(v) => setForm((f) => ({ ...f, motDePasse: v }))}
                  secureTextEntry />
              </View>
              <TouchableOpacity style={[styles.createBtn, formLoading && { opacity: 0.7 }]} onPress={handleCreate} disabled={formLoading}>
                {formLoading ? <ActivityIndicator color={Colors.white} /> : (
                  <>
                    <Feather name="plus" size={18} color={Colors.white} />
                    <Text style={styles.createBtnText}>
                      {teamSection === "livreur" ? "Ajouter le livreur" : "Créer le sous-admin"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* List */}
            <Text style={styles.sectionTitle}>
              {teamSection === "livreur" ? `Livreurs (${shownUsers.length})` : `Sous-admins (${shownUsers.length})`}
            </Text>
            {shownUsers.length === 0 ? (
              <View style={styles.empty}>
                <Feather name={teamSection === "livreur" ? "truck" : "users"} size={40} color={Colors.border} />
                <Text style={styles.emptyText}>
                  {teamSection === "livreur" ? "Aucun livreur créé" : "Aucun sous-admin créé"}
                </Text>
              </View>
            ) : (
              shownUsers.map((u) => (
                <View key={u.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {u.prenom.charAt(0).toUpperCase()}{u.nom.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{u.prenom} {u.nom}</Text>
                    <Text style={styles.memberPhone}>📞 {u.telephone}</Text>
                    <View style={[styles.memberBadge, { backgroundColor: teamSection === "livreur" ? "#E8F5E9" : Colors.primaryLighter }]}>
                      <Text style={styles.memberBadgeText}>{teamSection === "livreur" ? "🚚 Livreur" : "🛡️ Sous-admin"}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => setPendingDelete(u.id)}>
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
      {/* Assign livreur modal */}
      {pendingAssign && (
        <AssignModal
          visible={!!pendingAssign}
          livreurs={availableLivreurs}
          onSelect={(id) => confirmAssign(id)}
          onCancel={() => setPendingAssign(null)}
        />
      )}
      <ConfirmModal visible={!!pendingStatus} title="Mettre à jour le statut" message="Confirmer le changement de statut ?"
        confirmLabel="Confirmer" cancelLabel="Annuler" onConfirm={confirmStatus} onCancel={() => setPendingStatus(null)} />
      <ConfirmModal visible={!!pendingDelete}
        title={`Supprimer ${teamSection === "livreur" ? "le livreur" : "le sous-admin"}`}
        message="Cette action est irréversible."
        confirmLabel="Supprimer" cancelLabel="Annuler" danger
        onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
    </View>
  );
}

function FinanceLine({ label, value, separator, red, green }: { label: string; value: string; separator?: boolean; red?: boolean; green?: boolean }) {
  return (
    <View style={[styles.bRow, separator && styles.bSeparator]}>
      <Text style={[styles.bLabel, red && { color: Colors.red }, green && { color: Colors.primaryDark }]}>{label}</Text>
      <Text style={[styles.bValue, red && { color: Colors.red }, green && { color: Colors.primaryDark }]}>{value}</Text>
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
          <Text style={styles.assignEmpty}>Aucun livreur disponible. Créez-en un dans l'onglet Équipe.</Text>
        ) : (
          livreurs.map((l) => (
            <TouchableOpacity key={l.id} style={styles.assignOption} onPress={() => onSelect(l.id)}>
              <View style={styles.assignAvatar}>
                <Text style={styles.assignAvatarText}>{l.prenom.charAt(0)}{l.nom.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.assignName}>{l.prenom} {l.nom}</Text>
                <Text style={styles.assignPhone}>{l.telephone}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.primary} style={{ marginLeft: "auto" }} />
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

function AdminOrderCard({ order, livreurMap = {}, onUpdateStatus, onAssign }: {
  order: Order; livreurMap?: Record<string, User>;
  onUpdateStatus?: (id: string, s: OrderStatus) => void;
  onAssign?: () => void;
}) {
  const nextStatus = STATUS_NEXT[order.statut];
  const livreur = order.livreurId ? livreurMap[order.livreurId] : null;
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
          Courses : {order.totalProduits.toLocaleString()} F · Transport : {order.fraisLivraison} F
          {order.statut === "livre" ? ` · Livreur : ${LIVREUR_PART} F · Entreprise : +${ENTREPRISE_PART} F` : ""}
        </Text>
      </View>
      <View style={styles.cardActions}>
        {!order.livreurId && onAssign && (
          <TouchableOpacity style={styles.assignBtn} onPress={onAssign}>
            <Feather name="user-plus" size={13} color={Colors.white} />
            <Text style={styles.assignBtnText}>Assigner livreur</Text>
          </TouchableOpacity>
        )}
        {livreur && (
          <View style={styles.livreurBadge}>
            <Feather name="user-check" size={12} color={Colors.primaryDark} />
            <Text style={styles.livreurText}>{livreur.prenom} {livreur.nom}</Text>
          </View>
        )}
        {order.livreurId && !livreur && (
          <View style={styles.livreurBadge}>
            <Feather name="user-check" size={12} color={Colors.primaryDark} />
            <Text style={styles.livreurText}>Livreur assigné</Text>
          </View>
        )}
        {nextStatus && onUpdateStatus && (
          <TouchableOpacity style={styles.statusBtn} onPress={() => onUpdateStatus(order.id, nextStatus)}>
            <Text style={styles.statusBtnText}>{STATUS_LABEL[order.statut]}</Text>
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
  statCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 14, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  breakdownCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  breakdownTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  bRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  bSeparator: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 2 },
  bLabel: { flex: 1, fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  bValue: { fontSize: 13, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  bTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 2, borderTopColor: Colors.primary, paddingTop: 12, marginTop: 4 },
  bTotalLabel: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  bTotalValue: { fontSize: 18, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },

  // Daily cards
  dayCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayTitle: { fontSize: 13, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", flex: 1, textTransform: "capitalize" },
  dayNetBadge: { backgroundColor: Colors.primaryLighter, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dayNetText: { fontSize: 13, fontWeight: "700", color: Colors.primaryDark, fontFamily: "Inter_700Bold" },
  dayStats: { flexDirection: "row", gap: 0 },
  dayStat: { flex: 1, alignItems: "center", gap: 2 },
  dayStatVal: { fontSize: 12, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  dayStatLabel: { fontSize: 10, color: Colors.textLight, fontFamily: "Inter_400Regular" },

  // Orders
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

  // Assign modal
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

  // Team
  teamToggle: { flexDirection: "row", backgroundColor: Colors.lightGray, borderRadius: 14, padding: 4, gap: 4 },
  teamToggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  teamToggleBtnActive: { backgroundColor: Colors.primary },
  teamToggleText: { fontSize: 13, fontWeight: "600", color: Colors.textLight, fontFamily: "Inter_600SemiBold" },
  teamToggleTextActive: { color: Colors.white },
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
  memberCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLighter, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 16, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  memberInfo: { flex: 1, gap: 3 },
  memberName: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  memberPhone: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  memberBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  memberBadgeText: { fontSize: 10, color: Colors.primaryDark, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  deleteBtn: { padding: 8 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center" },
});
