import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { useCart } from "@/context/CartContext";
import * as Haptics from "expo-haptics";

const QUICK_CATEGORIES = [
  { id: "legumes", nom: "Légumes", emoji: "🥬" },
  { id: "tomates", nom: "Tomates", emoji: "🍅" },
  { id: "plantain", nom: "Plantain", emoji: "🍌" },
  { id: "poisson", nom: "Poisson", emoji: "🐟" },
  { id: "viande", nom: "Viande", emoji: "🥩" },
  { id: "epices", nom: "Épices", emoji: "🧅" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();
  const { getOrdersByUser } = useOrders();
  const { count } = useCart();

  const orders = user ? getOrdersByUser(user.id) : [];
  const activeOrders = orders.filter((o) => o.statut !== "livre");

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Feather name="shopping-cart" size={22} color={Colors.white} />
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Le marché vient à vous</Text>
          <Text style={styles.heroSubtitle}>avec Makit+</Text>
          <Text style={styles.heroDesc}>
            Produits frais du marché livrés rapidement à domicile
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/order");
            }}
          >
            <Feather name="shopping-bag" size={16} color={Colors.primary} />
            <Text style={styles.heroBtnText}>Commander maintenant</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroEmoji}>🛒</Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Que souhaitez-vous faire ?</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/order")}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLighter }]}>
            <Feather name="shopping-bag" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.actionLabel}>Commander</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/orders")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
            <Feather name="list" size={24} color="#1565C0" />
            {activeOrders.length > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{activeOrders.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionLabel}>Mes commandes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#F3E5F5" }]}>
            <Feather name="user" size={24} color="#6A1B9A" />
          </View>
          <Text style={styles.actionLabel}>Mon profil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
            <Feather name="shopping-cart" size={24} color={Colors.orange} />
            {count > 0 && (
              <View style={[styles.actionBadge, { backgroundColor: Colors.orange }]}>
                <Text style={styles.actionBadgeText}>{count}</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionLabel}>Panier</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Nos catégories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {QUICK_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryChip}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/(tabs)/order",
                params: { categorie: cat.id },
              });
            }}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryName}>{cat.nom}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <View style={styles.activeOrdersSection}>
          <Text style={styles.sectionTitle}>Commandes en cours</Text>
          {activeOrders.slice(0, 2).map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.activeOrderCard}
              onPress={() => router.push({ pathname: "/order-detail", params: { id: order.id } })}
            >
              <View style={styles.activeOrderLeft}>
                <Feather name="clock" size={18} color={Colors.primary} />
                <View>
                  <Text style={styles.activeOrderId}>Commande #{order.id.slice(-6)}</Text>
                  <Text style={styles.activeOrderStatus}>
                    {order.statut === "en_attente" ? "Commande reçue" :
                      order.statut === "achat_en_cours" ? "Acheteur au marché" :
                        "En livraison"}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.gray} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Advantages */}
      <View style={styles.advantagesSection}>
        <Text style={styles.sectionTitle}>Pourquoi Makit+ ?</Text>
        {[
          { icon: "zap", text: "Livraison rapide à domicile", color: Colors.orange },
          { icon: "check-circle", text: "Produits frais du marché", color: Colors.primary },
          { icon: "shield", text: "Sans boue, sans foule", color: "#1565C0" },
          { icon: "clock", text: "Gagnez du temps précieux", color: "#6A1B9A" },
        ].map((item, i) => (
          <View key={i} style={styles.advantageRow}>
            <View style={[styles.advantageIcon, { backgroundColor: item.color + "20" }]}>
              <Feather name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={styles.advantageText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  greeting: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  heroBanner: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroContent: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_600SemiBold",
  },
  heroDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  heroBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  heroEmoji: {
    fontSize: 56,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  actionCard: {
    width: "46%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 80,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  activeOrdersSection: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activeOrderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  activeOrderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeOrderId: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  activeOrderStatus: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_400Regular",
  },
  advantagesSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  advantageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  advantageIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  advantageText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
});
