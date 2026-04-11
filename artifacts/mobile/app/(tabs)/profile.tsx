import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, TextInput, ActivityIndicator, Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import * as Haptics from "expo-haptics";
import ConfirmModal from "@/components/ConfirmModal";
import { api } from "@/utils/api";

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: string;
}

function MenuItem({ icon, label, onPress, color = Colors.text, badge }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + "15" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      {!badge && <Feather name="chevron-right" size={18} color={Colors.gray} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, updateCredentials } = useAuth();
  const { getOrdersByUser } = useOrders();
  const [showLogout, setShowLogout] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  // Change password state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const orders = user ? getOrdersByUser(user.id) : [];
  const completed = orders.filter((o) => o.statut === "livre").length;
  const active = orders.filter((o) => o.statut !== "livre").length;

  // Referral state — always shown, never gated on null
  const [referral, setReferral] = useState<{
    promoCode: string | null;
    points: number;
    availableRewards: number;
    history: any[];
  }>({ promoCode: null, points: 0, availableRewards: 0, history: [] });
  const [referralLoading, setReferralLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const loadReferral = useCallback(async () => {
    if (!user) return;
    setReferralLoading(true);
    try {
      const data = await api.referral.get(user.id);
      setReferral(data);
    } catch {
      // Keep the default state — section still shows with "generate" button
    } finally {
      setReferralLoading(false);
    }
  }, [user]);

  useEffect(() => { loadReferral(); }, [loadReferral]);

  async function handleGenerateCode() {
    if (!user) return;
    setGeneratingCode(true);
    setGenerateError("");
    try {
      const { promoCode } = await api.referral.generate(user.id);
      setReferral(prev => ({ ...prev, promoCode }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setGenerateError("Erreur réseau, réessayez.");
    } finally {
      setGeneratingCode(false);
    }
  }

  async function handleShareCode() {
    if (!referral?.promoCode) return;
    try {
      await Share.share({
        message: `🛍️ Rejoins-moi sur Makit+ ! C'est le service qui livre vos courses du marché à domicile.\n\nUtilise mon code parrain lors de ton inscription pour m'offrir un point :\n\n👉 ${referral.promoCode}\n\nInscris-toi ici : https://market-fresh-delivery--makit4079.replit.app/landing/`,
        title: "Invite un ami sur Makit+",
      });
    } catch {}
  }

  async function doLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogout(false);
    await logout();
    router.replace("/(auth)/login");
  }

  async function handleChangePassword() {
    setPassError("");
    setPassSuccess("");
    if (!currentPass || !newPass || !confirmPass) {
      setPassError("Tous les champs sont requis");
      return;
    }
    if (newPass.length < 4) {
      setPassError("Le nouveau mot de passe doit contenir au moins 4 caractères");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Les mots de passe ne correspondent pas");
      return;
    }
    setPassLoading(true);
    const result = await updateCredentials(currentPass, { newPassword: newPass });
    setPassLoading(false);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPassSuccess("Mot de passe modifié avec succès !");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setTimeout(() => { setShowPassModal(false); setPassSuccess(""); }, 2000);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPassError(result.error || "Erreur réseau");
    }
  }

  function closePassModal() {
    setShowPassModal(false);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    setPassError("");
    setPassSuccess("");
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon profil</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.prenom?.charAt(0)?.toUpperCase() ?? "U"}
              {user?.nom?.charAt(0)?.toUpperCase() ?? ""}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          <Text style={styles.userPhone}>{user?.telephone}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statLabel}>Total commandes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{active}</Text>
              <Text style={styles.statLabel}>En cours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completed}</Text>
              <Text style={styles.statLabel}>Livrées</Text>
            </View>
          </View>
        </View>

        {/* ─── Parrainage section — always shown for clients ─── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>🎁 Parrainage & Récompenses</Text>
            {!referralLoading && (
              <TouchableOpacity onPress={loadReferral}>
                <Feather name="refresh-cw" size={14} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {referralLoading ? (
            <View style={styles.referralLoader}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.referralLoaderText}>Chargement...</Text>
            </View>
          ) : (
            <>
              {/* Points card */}
              <View style={styles.pointsCard}>
                <View style={styles.pointsTop}>
                  <View>
                    <Text style={styles.pointsLabel}>Mes points</Text>
                    <Text style={styles.pointsValue}>{referral.points} <Text style={styles.pointsSub}>/ {Math.ceil(Math.max(referral.points + 1, 10) / 10) * 10} pour la prochaine récompense</Text></Text>
                  </View>
                  {referral.availableRewards > 0 && (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardBadgeText}>🏆 {referral.availableRewards} récompense{referral.availableRewards > 1 ? "s" : ""}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, (referral.points % 10) * 10)}%` as any }]} />
                </View>
                <Text style={styles.pointsHint}>10 points = une course offerte (3 500 FCFA)</Text>
              </View>

              {/* Rewards available */}
              {referral.availableRewards > 0 && (
                <View style={styles.rewardCard}>
                  <Text style={{ fontSize: 32 }}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardTitle}>Récompense disponible !</Text>
                    <Text style={styles.rewardDesc}>Vous avez {referral.availableRewards} course{referral.availableRewards > 1 ? "s" : ""} gratuite{referral.availableRewards > 1 ? "s" : ""} d'une valeur de {referral.availableRewards * 3500} FCFA</Text>
                    <Text style={styles.rewardNote}>Contactez le support pour utiliser votre récompense.</Text>
                  </View>
                </View>
              )}

              {/* Promo code card */}
              {referral.promoCode ? (
                <View style={styles.promoCard}>
                  <View style={styles.promoCardHeader}>
                    <Text style={styles.promoCardTitle}>Mon code promo</Text>
                    <Text style={styles.promoCardHint}>Partagez ce code à vos amis lors de leur inscription</Text>
                  </View>
                  <View style={styles.promoCodeBox}>
                    <Text style={styles.promoCodeText}>{referral.promoCode}</Text>
                  </View>
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode} activeOpacity={0.8}>
                    <Feather name="share-2" size={18} color={Colors.white} />
                    <Text style={styles.shareBtnText}>Partager mon code</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promoCard}>
                  <View style={styles.promoCardHeader}>
                    <Text style={styles.promoCardTitle}>Mon code promo</Text>
                    <Text style={styles.promoCardHint}>Générez votre code et partagez-le — chaque ami inscrit vous rapporte 1 point</Text>
                  </View>
                  {generateError ? (
                    <View style={styles.generateErrBox}>
                      <Text style={styles.generateErrText}>{generateError}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateCode} disabled={generatingCode} activeOpacity={0.8}>
                    {generatingCode ? <ActivityIndicator color={Colors.white} size="small" /> : (
                      <>
                        <Feather name="gift" size={18} color={Colors.white} />
                        <Text style={styles.generateBtnText}>Générer mon code promo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* History */}
              {referral.history.length > 0 && (
                <View style={styles.historyCard}>
                  <Text style={styles.historyTitle}>Historique des filleuls ({referral.history.length})</Text>
                  {referral.history.slice(0, 5).map((h: any, i: number) => (
                    <View key={i} style={styles.historyRow}>
                      <View style={styles.historyDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>{h.referredUserName}</Text>
                        <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleDateString("fr-FR")}</Text>
                      </View>
                      <View style={styles.historyPoints}>
                        <Text style={styles.historyPointsText}>+{h.points} pt</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Infos section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="user" size={16} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nom complet</Text>
                <Text style={styles.infoValue}>{user?.prenom} {user?.nom}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Feather name="phone" size={16} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{user?.telephone}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{user?.adresse || "Non renseigné"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="list"
              label="Mes commandes"
              color={Colors.primary}
              badge={active > 0 ? String(active) : undefined}
              onPress={() => router.push("/(tabs)/orders")}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shopping-bag"
              label="Commander"
              color={Colors.orange}
              onPress={() => router.push("/(tabs)/order")}
            />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="lock"
              label="Changer mon mot de passe"
              color={Colors.primaryDark}
              onPress={() => setShowPassModal(true)}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out"
              label="Se déconnecter"
              color={Colors.red}
              onPress={() => setShowLogout(true)}
            />
          </View>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Makit+</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Le marché vient à vous avec Makit+</Text>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
      </ScrollView>

      {/* Change password modal */}
      {showPassModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer le mot de passe</Text>
              <TouchableOpacity onPress={closePassModal}>
                <Feather name="x" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {passError ? <View style={styles.errBox}><Text style={styles.errText}>{passError}</Text></View> : null}
            {passSuccess ? <View style={styles.successBox}><Text style={styles.successText}>{passSuccess}</Text></View> : null}

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Mot de passe actuel</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Votre mot de passe actuel"
                  placeholderTextColor={Colors.gray}
                  value={currentPass}
                  onChangeText={setCurrentPass}
                  secureTextEntry={!showCur}
                />
                <TouchableOpacity onPress={() => setShowCur((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showCur ? "eye-off" : "eye"} size={18} color={Colors.gray} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Nouveau mot de passe</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Minimum 4 caractères"
                  placeholderTextColor={Colors.gray}
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry={!showNew}
                />
                <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showNew ? "eye-off" : "eye"} size={18} color={Colors.gray} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Répétez le nouveau mot de passe"
                placeholderTextColor={Colors.gray}
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showNew}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, passLoading && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={passLoading}
            >
              {passLoading ? <ActivityIndicator color={Colors.white} /> : (
                <>
                  <Feather name="check" size={18} color={Colors.white} />
                  <Text style={styles.modalBtnText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ConfirmModal
        visible={showLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter de Makit+ ?"
        confirmLabel="Déconnecter"
        cancelLabel="Annuler"
        danger
        onConfirm={doLogout}
        onCancel={() => setShowLogout(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  content: { padding: 16, gap: 0, paddingBottom: 100 },
  avatarSection: { alignItems: "center", backgroundColor: Colors.white, borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "700", color: Colors.white, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 20, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  userPhone: { fontSize: 14, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 16 },
  statsRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16, width: "100%" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center" },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: Colors.textLight, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 },
  infoCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 15, fontWeight: "500", color: Colors.text, fontFamily: "Inter_500Medium", marginTop: 2 },
  infoDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 46 },
  menuCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", fontFamily: "Inter_500Medium" },
  menuBadge: { backgroundColor: Colors.red, borderRadius: 12, minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  menuBadgeText: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
  appInfo: { alignItems: "center", paddingVertical: 24, gap: 4 },
  appName: { fontSize: 18, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  appVersion: { fontSize: 12, color: Colors.gray, fontFamily: "Inter_400Regular" },
  appTagline: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },

  // Modal
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", zIndex: 999 },
  modal: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  modalField: { gap: 6 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  modalInput: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, fontFamily: "Inter_400Regular" },
  passRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingRight: 12 },
  eyeBtn: { padding: 4 },
  modalBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  modalBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  errBox: { backgroundColor: "#FFEBEE", borderLeftWidth: 3, borderLeftColor: Colors.red, padding: 10, borderRadius: 10 },
  errText: { color: Colors.red, fontSize: 13, fontFamily: "Inter_400Regular" },
  successBox: { backgroundColor: Colors.primaryLighter, borderLeftWidth: 3, borderLeftColor: Colors.primary, padding: 10, borderRadius: 10 },
  successText: { color: Colors.primaryDark, fontSize: 13, fontFamily: "Inter_400Regular" },
  // ── Referral styles ──
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  referralLoader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, backgroundColor: Colors.white, borderRadius: 14 },
  referralLoaderText: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  generateErrBox: { backgroundColor: "#FFEBEE", borderRadius: 10, padding: 10 },
  generateErrText: { fontSize: 13, color: Colors.red, fontFamily: "Inter_400Regular" },
  pointsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  pointsTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  pointsLabel: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  pointsValue: { fontSize: 22, fontWeight: "800", color: Colors.text, fontFamily: "Inter_700Bold" },
  pointsSub: { fontSize: 13, fontWeight: "400", color: Colors.textLight, fontFamily: "Inter_400Regular" },
  progressBar: { height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 4 },
  pointsHint: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  rewardBadge: { backgroundColor: "#FFF8E1", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  rewardBadgeText: { fontSize: 12, fontWeight: "700", color: "#F57F17", fontFamily: "Inter_700Bold" },
  rewardCard: { backgroundColor: "#FFFDE7", borderWidth: 1.5, borderColor: "#FDD835", borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  rewardTitle: { fontSize: 15, fontWeight: "700", color: "#5D4037", fontFamily: "Inter_700Bold" },
  rewardDesc: { fontSize: 13, color: "#795548", fontFamily: "Inter_400Regular", marginTop: 2 },
  rewardNote: { fontSize: 11, color: "#8D6E63", fontFamily: "Inter_400Regular", marginTop: 4, fontStyle: "italic" },
  promoCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  promoCardHeader: { gap: 2 },
  promoCardTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  promoCardHint: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  promoCodeBox: { backgroundColor: "#F1FDF3", borderRadius: 12, paddingVertical: 16, paddingHorizontal: 20, alignItems: "center", borderWidth: 1.5, borderColor: Colors.primary, borderStyle: "dashed" },
  promoCodeText: { fontSize: 28, fontWeight: "900", color: Colors.primaryDark, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  shareBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  shareBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  generateBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  generateBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  historyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 8, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  historyTitle: { fontSize: 13, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold", marginBottom: 4 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  historyName: { fontSize: 13, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  historyDate: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  historyPoints: { backgroundColor: Colors.primaryLighter, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  historyPointsText: { fontSize: 12, fontWeight: "700", color: Colors.primaryDark, fontFamily: "Inter_700Bold" },
});
