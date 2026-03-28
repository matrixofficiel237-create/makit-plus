import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import * as Haptics from "expo-haptics";
import ConfirmModal from "@/components/ConfirmModal";

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
  const { user, logout } = useAuth();
  const { getOrdersByUser } = useOrders();
  const [showLogout, setShowLogout] = useState(false);

  const orders = user ? getOrdersByUser(user.id) : [];
  const completed = orders.filter((o) => o.statut === "livre").length;
  const active = orders.filter((o) => o.statut !== "livre").length;

  async function doLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogout(false);
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon profil</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
  content: { padding: 16, gap: 0 },
  avatarSection: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  userPhone: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textLight,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  infoDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 46 },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  menuBadge: {
    backgroundColor: Colors.red,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
  appInfo: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  appVersion: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: "Inter_400Regular",
  },
  appTagline: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
});
