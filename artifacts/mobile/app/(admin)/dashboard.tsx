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
import { api } from "@/utils/api";

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

type Tab = "orders" | "stats" | "equipe" | "clients" | "settings";
type TeamSection = "sous_admin" | "livreur";

const blankForm = { nom: "", prenom: "", telephone: "", motDePasse: "" };
const blankCredsForm = { currentPassword: "", newTelephone: "", newPassword: "", confirmPassword: "" };

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, createManagedUser, getManagedUsers, deleteManagedUser, updateCredentials } = useAuth();
  const { getAllOrders, assignLivreur, updateOrderStatus, deleteOrder, refreshOrders } = useOrders();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [teamSection, setTeamSection] = useState<TeamSection>("livreur");
  const [showLogout, setShowLogout] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<string | null>(null);

  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [availableLivreurs, setAvailableLivreurs] = useState<User[]>([]);
  const [form, setForm] = useState(blankForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Settings (credentials)
  const [credsForm, setCredsForm] = useState(blankCredsForm);
  const [credsLoading, setCredsLoading] = useState(false);
  const [credsError, setCredsError] = useState("");
  const [credsSuccess, setCredsSuccess] = useState("");
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Expanded client (to see their orders)
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refreshOrders(); loadUsers(); }, []));

  async function loadUsers() {
    const [all, clientList] = await Promise.all([
      getManagedUsers(),
      getManagedUsers("client"),
    ]);
    setManagedUsers(all);
    setAvailableLivreurs(all.filter((u) => u.role === "livreur"));
    setClients(clientList);
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

  async function confirmDeleteOrder() {
    if (!pendingDeleteOrder) return;
    await deleteOrder(pendingDeleteOrder);
    setPendingDeleteOrder(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSaveCreds() {
    setCredsError("");
    setCredsSuccess("");
    if (!credsForm.currentPassword) {
      setCredsError("Veuillez saisir votre mot de passe actuel");
      return;
    }
    if (!credsForm.newTelephone && !credsForm.newPassword) {
      setCredsError("Saisissez un nouveau numéro et/ou un nouveau mot de passe");
      return;
    }
    if (credsForm.newPassword && credsForm.newPassword.length < 4) {
      setCredsError("Le nouveau mot de passe doit contenir au moins 4 caractères");
      return;
    }
    if (credsForm.newPassword && credsForm.newPassword !== credsForm.confirmPassword) {
      setCredsError("Les mots de passe ne correspondent pas");
      return;
    }
    setCredsLoading(true);
    const patch: any = {};
    if (credsForm.newTelephone.trim()) patch.newTelephone = credsForm.newTelephone.trim();
    if (credsForm.newPassword.trim()) patch.newPassword = credsForm.newPassword.trim();
    const result = await updateCredentials(credsForm.currentPassword, patch);
    setCredsLoading(false);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCredsSuccess("Identifiants mis à jour avec succès !");
      setCredsForm(blankCredsForm);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCredsError(result.error || "Erreur réseau");
    }
  }

  const allOrders = getAllOrders();
  const pending = allOrders.filter((o) => o.statut === "en_attente");
  const inProgress = allOrders.filter((o) => o.statut !== "en_attente" && o.statut !== "livre" && o.statut !== "annule");
  const delivered = allOrders.filter((o) => o.statut === "livre");

  const totalCourses = allOrders.reduce((s, o) => s + (o.totalProduits ?? 0), 0);
  const totalPartLivreur = delivered.length * LIVREUR_PART;
  const totalPartEntreprise = delivered.length * ENTREPRISE_PART;
  const netEntreprise = delivered.reduce((s, o) => s + (o.totalProduits ?? 0), 0) + totalPartEntreprise;

  const byDay = delivered.reduce((acc: Record<string, Order[]>, o) => {
    const k = dayKey(o.date);
    if (!acc[k]) acc[k] = [];
    acc[k].push(o);
    return acc;
  }, {});
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  const shownUsers = managedUsers.filter((u) => u.role === teamSection);
  const livreurMap = Object.fromEntries(availableLivreurs.map((l) => [l.id, l]));
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "orders", label: `Cmd (${allOrders.length})`, icon: "shopping-bag" },
    { key: "stats", label: "Finances", icon: "bar-chart-2" },
    { key: "equipe", label: "Équipe", icon: "users" },
    { key: "clients", label: `Clients (${clients.length})`, icon: "user" },
    { key: "settings", label: "Réglages", icon: "settings" },
  ];

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

      {/* Scrollable tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Feather name={t.icon as any} size={14} color={activeTab === t.key ? Colors.primary : Colors.textLight} />
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
                  <AdminOrderCard key={o.id} order={o} livreurMap={livreurMap} clientMap={clientMap}
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
                  <AdminOrderCard key={o.id} order={o} livreurMap={livreurMap} clientMap={clientMap}
                    onUpdateStatus={(id, s) => setPendingStatus({ orderId: id, status: s })}
                  />
                ))}
              </>
            )}
            {delivered.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>✅ Livrées ({delivered.length})</Text>
                {delivered.map((o) => (
                  <AdminOrderCard key={o.id} order={o} livreurMap={livreurMap} clientMap={clientMap}
                    onDelete={() => setPendingDeleteOrder(o.id)}
                  />
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
                <Text style={styles.financeHeroLabel}>Livraisons totales</Text>
                <Text style={styles.financeHeroValue}>{delivered.length}</Text>
              </View>
            </View>
            <StatCard label="Commandes totales" value={allOrders.length} color={Colors.primary} icon="shopping-bag" />
            <StatCard label={`Part livreurs (400 × ${delivered.length})`} value={`− ${totalPartLivreur.toLocaleString()} FCFA`} color={Colors.red} icon="user" />
            <StatCard label={`Part entreprise (transport, 350 × ${delivered.length})`} value={`${totalPartEntreprise.toLocaleString()} FCFA`} color={Colors.primaryDark} icon="truck" />
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
                      <View style={styles.dayStat}><Text style={styles.dayStatVal}>{dayOrders.length}</Text><Text style={styles.dayStatLabel}>Livraisons</Text></View>
                      <View style={styles.dayStat}><Text style={styles.dayStatVal}>{dayCourses.toLocaleString()} F</Text><Text style={styles.dayStatLabel}>Courses</Text></View>
                      <View style={styles.dayStat}><Text style={[styles.dayStatVal, { color: Colors.red }]}>− {dayLivreur.toLocaleString()} F</Text><Text style={styles.dayStatLabel}>Livreurs</Text></View>
                      <View style={styles.dayStat}><Text style={[styles.dayStatVal, { color: Colors.primary }]}>{dayNet.toLocaleString()} F</Text><Text style={styles.dayStatLabel}>Net</Text></View>
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
            <View style={styles.createCard}>
              <View style={styles.createHeader}>
                <Feather name={teamSection === "livreur" ? "truck" : "user-plus"} size={18} color={Colors.primary} />
                <Text style={styles.createTitle}>{teamSection === "livreur" ? "Ajouter un livreur" : "Créer un sous-administrateur"}</Text>
              </View>
              <Text style={styles.createDesc}>{teamSection === "livreur" ? "Le livreur peut voir et gérer ses livraisons, et consulter ses gains." : "Le sous-admin peut gérer les commandes, assigner les livreurs et consulter la recette journalière."}</Text>
              {formError ? <View style={styles.errBox}><Text style={styles.errText}>{formError}</Text></View> : null}
              {formSuccess ? <View style={styles.successBox}><Text style={styles.successText}>{formSuccess}</Text></View> : null}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Prénom</Text>
                  <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={Colors.gray} value={form.prenom} onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Nom</Text>
                  <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={Colors.gray} value={form.nom} onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))} />
                </View>
              </View>
              <View>
                <Text style={styles.fieldLabel}>Téléphone (identifiant)</Text>
                <TextInput style={styles.input} placeholder="Ex: 0612345678" placeholderTextColor={Colors.gray} value={form.telephone} onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))} keyboardType="phone-pad" />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <TextInput style={styles.input} placeholder="Minimum 4 caractères" placeholderTextColor={Colors.gray} value={form.motDePasse} onChangeText={(v) => setForm((f) => ({ ...f, motDePasse: v }))} secureTextEntry />
              </View>
              <TouchableOpacity style={[styles.createBtn, formLoading && { opacity: 0.7 }]} onPress={handleCreate} disabled={formLoading}>
                {formLoading ? <ActivityIndicator color={Colors.white} /> : (
                  <>
                    <Feather name="plus" size={18} color={Colors.white} />
                    <Text style={styles.createBtnText}>{teamSection === "livreur" ? "Ajouter le livreur" : "Créer le sous-admin"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>{teamSection === "livreur" ? `Livreurs (${shownUsers.length})` : `Sous-admins (${shownUsers.length})`}</Text>
            {shownUsers.length === 0 ? (
              <View style={styles.empty}>
                <Feather name={teamSection === "livreur" ? "truck" : "users"} size={40} color={Colors.border} />
                <Text style={styles.emptyText}>{teamSection === "livreur" ? "Aucun livreur créé" : "Aucun sous-admin créé"}</Text>
              </View>
            ) : (
              shownUsers.map((u) => (
                <View key={u.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{(u.prenom ?? "?").charAt(0).toUpperCase()}{(u.nom ?? "?").charAt(0).toUpperCase()}</Text>
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

        {/* ── CLIENTS ── */}
        {activeTab === "clients" && (
          <>
            <View style={styles.clientsHero}>
              <Feather name="users" size={24} color={Colors.primary} />
              <Text style={styles.clientsHeroText}>{clients.length} client{clients.length !== 1 ? "s" : ""} inscrit{clients.length !== 1 ? "s" : ""}</Text>
            </View>
            {clients.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="user-x" size={48} color={Colors.border} />
                <Text style={styles.emptyText}>Aucun client inscrit pour le moment</Text>
              </View>
            ) : (
              clients.map((c) => {
                const clientOrders = allOrders.filter((o) => o.userId === c.id);
                const isExpanded = expandedClient === c.id;
                return (
                  <View key={c.id} style={styles.clientCard}>
                    <TouchableOpacity style={styles.clientCardHeader} onPress={() => setExpandedClient(isExpanded ? null : c.id)} activeOpacity={0.7}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>{(c.prenom ?? "?").charAt(0).toUpperCase()}{(c.nom ?? "?").charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{c.prenom} {c.nom}</Text>
                        <Text style={styles.clientPhone}>📞 {c.telephone}</Text>
                        {c.adresse ? <Text style={styles.clientAddr}>📍 {c.adresse}</Text> : null}
                      </View>
                      <View style={styles.clientRight}>
                        <View style={styles.clientOrdersBadge}>
                          <Text style={styles.clientOrdersNum}>{clientOrders.length}</Text>
                          <Text style={styles.clientOrdersLabel}>cmd</Text>
                        </View>
                        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textLight} />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.clientOrders}>
                        {clientOrders.length === 0 ? (
                          <Text style={styles.clientNoOrders}>Aucune commande</Text>
                        ) : (
                          clientOrders.map((o) => (
                            <View key={o.id} style={styles.clientOrderRow}>
                              <View style={styles.clientOrderLeft}>
                                <Text style={styles.clientOrderId}>#{o.id.slice(-6).toUpperCase()}</Text>
                                <Text style={styles.clientOrderDate}>{formatDate(o.date)}</Text>
                                <Text style={styles.clientOrderAddr}>{(o.adresse?.quartier ?? "—")}{(o.adresse?.rue || o.adresse?.details) ? `, ${o.adresse?.rue ?? o.adresse?.details}` : ""}</Text>
                                <Text style={styles.clientOrderItems} numberOfLines={1}>{(Array.isArray(o.items) ? o.items : []).map((i: any) => `${i?.product?.nom ?? i?.nom ?? "Article"} ×${i?.quantite ?? 1}`).join(", ")}</Text>
                              </View>
                              <View style={styles.clientOrderRight}>
                                <OrderStatusBadge statut={o.statut} size="sm" />
                                <Text style={styles.clientOrderTotal}>{(o.totalFinal ?? 0).toLocaleString()} F</Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── RÉGLAGES ── */}
        {activeTab === "settings" && (
          <>
            <View style={styles.settingsCard}>
              <View style={styles.settingsCardHeader}>
                <Feather name="user" size={20} color={Colors.primary} />
                <Text style={styles.settingsCardTitle}>Mon compte</Text>
              </View>
              <View style={styles.settingInfoRow}>
                <Text style={styles.settingInfoLabel}>Identifiant actuel</Text>
                <Text style={styles.settingInfoValue}>{user?.telephone}</Text>
              </View>
              <View style={styles.settingInfoRow}>
                <Text style={styles.settingInfoLabel}>Nom</Text>
                <Text style={styles.settingInfoValue}>{user?.prenom} {user?.nom}</Text>
              </View>
            </View>

            <View style={styles.settingsCard}>
              <View style={styles.settingsCardHeader}>
                <Feather name="lock" size={20} color={Colors.primary} />
                <Text style={styles.settingsCardTitle}>Modifier mes identifiants</Text>
              </View>
              <Text style={styles.settingsDesc}>Changez votre numéro de téléphone (identifiant de connexion) et/ou votre mot de passe.</Text>

              {credsError ? <View style={styles.errBox}><Text style={styles.errText}>{credsError}</Text></View> : null}
              {credsSuccess ? <View style={styles.successBox}><Text style={styles.successText}>{credsSuccess}</Text></View> : null}

              <View>
                <Text style={styles.fieldLabel}>Mot de passe actuel *</Text>
                <View style={styles.passRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Votre mot de passe actuel"
                    placeholderTextColor={Colors.gray}
                    value={credsForm.currentPassword}
                    onChangeText={(v) => setCredsForm((f) => ({ ...f, currentPassword: v }))}
                    secureTextEntry={!showCurPass}
                  />
                  <TouchableOpacity onPress={() => setShowCurPass((v) => !v)} style={styles.eyeBtn}>
                    <Feather name={showCurPass ? "eye-off" : "eye"} size={18} color={Colors.gray} />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Nouveau numéro (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Actuel : ${user?.telephone ?? ""}`}
                  placeholderTextColor={Colors.gray}
                  value={credsForm.newTelephone}
                  onChangeText={(v) => setCredsForm((f) => ({ ...f, newTelephone: v }))}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Nouveau mot de passe (optionnel)</Text>
                <View style={styles.passRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Minimum 4 caractères"
                    placeholderTextColor={Colors.gray}
                    value={credsForm.newPassword}
                    onChangeText={(v) => setCredsForm((f) => ({ ...f, newPassword: v }))}
                    secureTextEntry={!showNewPass}
                  />
                  <TouchableOpacity onPress={() => setShowNewPass((v) => !v)} style={styles.eyeBtn}>
                    <Feather name={showNewPass ? "eye-off" : "eye"} size={18} color={Colors.gray} />
                  </TouchableOpacity>
                </View>
              </View>

              {credsForm.newPassword ? (
                <View>
                  <Text style={styles.fieldLabel}>Confirmer le nouveau mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Répétez le nouveau mot de passe"
                    placeholderTextColor={Colors.gray}
                    value={credsForm.confirmPassword}
                    onChangeText={(v) => setCredsForm((f) => ({ ...f, confirmPassword: v }))}
                    secureTextEntry={!showNewPass}
                  />
                </View>
              ) : null}

              <TouchableOpacity style={[styles.createBtn, credsLoading && { opacity: 0.7 }]} onPress={handleSaveCreds} disabled={credsLoading}>
                {credsLoading ? <ActivityIndicator color={Colors.white} /> : (
                  <>
                    <Feather name="save" size={18} color={Colors.white} />
                    <Text style={styles.createBtnText}>Enregistrer les modifications</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmModal visible={showLogout} title="Déconnexion" message="Se déconnecter de l'administration ?"
        confirmLabel="Déconnecter" cancelLabel="Annuler" danger onConfirm={doLogout} onCancel={() => setShowLogout(false)} />
      {pendingAssign && (
        <AssignModal visible={!!pendingAssign} livreurs={availableLivreurs} onSelect={(id) => confirmAssign(id)} onCancel={() => setPendingAssign(null)} />
      )}
      <ConfirmModal visible={!!pendingStatus} title="Mettre à jour le statut" message="Confirmer le changement de statut ?"
        confirmLabel="Confirmer" cancelLabel="Annuler" onConfirm={confirmStatus} onCancel={() => setPendingStatus(null)} />
      <ConfirmModal visible={!!pendingDelete}
        title={`Supprimer ${teamSection === "livreur" ? "le livreur" : "le sous-admin"}`}
        message="Cette action est irréversible."
        confirmLabel="Supprimer" cancelLabel="Annuler" danger
        onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
      <ConfirmModal visible={!!pendingDeleteOrder}
        title="Supprimer la commande"
        message="Confirmer la suppression de cette commande ? Cette action est irréversible."
        confirmLabel="Supprimer" cancelLabel="Annuler" danger
        onConfirm={confirmDeleteOrder} onCancel={() => setPendingDeleteOrder(null)} />
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

function AdminOrderCard({ order, livreurMap = {}, clientMap = {}, onUpdateStatus, onAssign, onDelete }: {
  order: Order; livreurMap?: Record<string, User>; clientMap?: Record<string, User>;
  onUpdateStatus?: (id: string, s: OrderStatus) => void;
  onAssign?: () => void;
  onDelete?: () => void;
}) {
  const nextStatus = STATUS_NEXT[order.statut];
  const livreur = order.livreurId ? livreurMap[order.livreurId] : null;
  const client = clientMap[order.userId];
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
      {client && (
        <View style={styles.cardClient}>
          <Feather name="user" size={12} color={Colors.primaryDark} />
          <Text style={styles.cardClientText}>{client.prenom ?? ""} {client.nom ?? ""} · {client.telephone ?? ""}</Text>
        </View>
      )}
      <View style={styles.cardAddress}>
        <Feather name="map-pin" size={12} color={Colors.primary} />
        <Text style={styles.cardAddressText}>
          {adresse.quartier ?? "—"}{(adresse.rue || adresse.details) ? `, ${adresse.rue ?? adresse.details}` : ""}
          {adresse.description ? ` (${adresse.description})` : ""}
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
        {order.statut === "livre" && (
          <View style={styles.itemRow}>
            <Text style={[styles.itemSubLabel, { color: Colors.red }]}>Part livreur déduite</Text>
            <Text style={[styles.itemSubValue, { color: Colors.red }]}>− {LIVREUR_PART} F</Text>
          </View>
        )}
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
            <Text style={styles.livreurText}>{livreur.prenom ?? ""} {livreur.nom ?? ""}</Text>
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
            <Text style={styles.statusBtnText}>{STATUS_LABEL[order.statut] ?? "Avancer"}</Text>
            <Feather name="arrow-right" size={13} color={Colors.white} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={styles.deleteOrderBtn} onPress={onDelete}>
            <Feather name="trash-2" size={13} color={Colors.red} />
            <Text style={styles.deleteOrderBtnText}>Supprimer</Text>
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

  tabsScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, flexGrow: 0 },
  tabsRow: { flexDirection: "row", paddingHorizontal: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: Colors.textLight, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: Colors.primary },

  content: { padding: 14, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", marginTop: 6 },

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

  dayCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayTitle: { fontSize: 13, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", flex: 1, textTransform: "capitalize" },
  dayNetBadge: { backgroundColor: Colors.primaryLighter, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dayNetText: { fontSize: 13, fontWeight: "700", color: Colors.primaryDark, fontFamily: "Inter_700Bold" },
  dayStats: { flexDirection: "row" },
  dayStat: { flex: 1, alignItems: "center", gap: 2 },
  dayStatVal: { fontSize: 12, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  dayStatLabel: { fontSize: 10, color: Colors.textLight, fontFamily: "Inter_400Regular" },

  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardId: { fontSize: 14, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  cardDate: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 1 },
  cardTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  cardClient: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primaryLighter, padding: 8, borderRadius: 8 },
  cardClientText: { flex: 1, fontSize: 12, color: Colors.primaryDark, fontFamily: "Inter_600SemiBold" },
  cardAddress: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: Colors.background, padding: 8, borderRadius: 8 },
  cardAddressText: { flex: 1, fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
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
  memberPhone: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  memberBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  memberBadgeText: { fontSize: 11, fontWeight: "600", color: Colors.primaryDark, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { padding: 8 },
  deleteOrderBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: Colors.red, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  deleteOrderBtnText: { color: Colors.red, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Clients tab
  clientsHero: { backgroundColor: Colors.primaryLighter, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  clientsHeroText: { fontSize: 16, fontWeight: "700", color: Colors.primaryDark, fontFamily: "Inter_700Bold" },
  clientCard: { backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  clientCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  clientAvatarText: { fontSize: 16, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  clientInfo: { flex: 1, gap: 2 },
  clientName: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  clientPhone: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  clientAddr: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  clientRight: { alignItems: "center", gap: 6 },
  clientOrdersBadge: { alignItems: "center", backgroundColor: Colors.primaryLighter, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  clientOrdersNum: { fontSize: 16, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  clientOrdersLabel: { fontSize: 9, color: Colors.primaryDark, fontFamily: "Inter_400Regular" },
  clientOrders: { borderTopWidth: 1, borderTopColor: Colors.border, padding: 12, gap: 10 },
  clientNoOrders: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
  clientOrderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, backgroundColor: Colors.background, borderRadius: 10, padding: 10 },
  clientOrderLeft: { flex: 1, gap: 2 },
  clientOrderId: { fontSize: 13, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  clientOrderDate: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  clientOrderAddr: { fontSize: 12, color: Colors.primary, fontFamily: "Inter_400Regular" },
  clientOrderItems: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  clientOrderRight: { alignItems: "flex-end", gap: 4 },
  clientOrderTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },

  // Settings tab
  settingsCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  settingsCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  settingsCardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  settingsDesc: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular", lineHeight: 20 },
  settingInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingInfoLabel: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  settingInfoValue: { fontSize: 14, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  passRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 11 },
});
