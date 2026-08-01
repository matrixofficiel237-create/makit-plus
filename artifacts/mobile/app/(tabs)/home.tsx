import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { useCart } from "@/context/CartContext";
import { useNotifications } from "@/context/NotificationsContext";
import NotificationsModal from "@/components/NotificationsModal";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HERO_SLIDES = [
  {
    image: require("@/assets/images/hero1.jpg"),
    title: "Le marché vient\nà vous",
    accent: "avec Makit+",
    desc: "Produits frais du marché livrés rapidement à domicile",
  },
  {
    image: require("@/assets/images/hero2.jpg"),
    title: "Livraison rapide\nà domicile",
    accent: "En moins d'une heure",
    desc: "Nos livreurs sillonnent la ville pour vous servir vite",
  },
  {
    image: require("@/assets/images/hero3.jpg"),
    title: "Poissons & viandes\nultra-frais",
    accent: "Du marché à votre table",
    desc: "Sélectionnés chaque matin directement au marché local",
  },
  {
    image: require("@/assets/images/hero4.jpg"),
    title: "Sans boue,\nsans foule",
    accent: "Restez chez vous",
    desc: "On s'occupe des courses, vous profitez de votre famille",
  },
  {
    image: require("@/assets/images/hero5.jpg"),
    title: "Commandez\nen 3 clics",
    accent: "Simple & rapide",
    desc: "Parcourez les produits et payez par mobile money",
  },
];

type HeroProps = {
  onOrder: () => void;
  onNotifs: () => void;
  onCart: () => void;
  userName: string;
  cartCount: number;
  unreadCount: number;
  topPad: number;
};

function HeroCarousel({ onOrder, onNotifs, onCart, userName, cartCount, unreadCount, topPad }: HeroProps) {
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true })
        .start(() => {
          setIdx((i) => (i + 1) % HERO_SLIDES.length);
          Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[idx];

  return (
    <View style={[heroStyles.wrapper, { overflow: "hidden" }]}>
      {/* Photo layer — fades in/out */}
      <Animated.View style={[heroStyles.photoWrap, { opacity }]}>
        <Image source={slide.image} style={heroStyles.photo} resizeMode="cover" />
      </Animated.View>

      {/* Top-to-bottom gradient (darkens top for header + bottom for text) */}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.65)"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header row — floats at the top of the photo */}
      <View style={[heroStyles.header, { paddingTop: topPad + 10 }]}>
        <View style={heroStyles.headerLeft}>
          <Image source={require("@/assets/images/logo.png")} style={heroStyles.logo} resizeMode="contain" />
          <View>
            <Text style={heroStyles.greeting}>Bonjour,</Text>
            <Text style={heroStyles.userName}>{userName}</Text>
          </View>
        </View>
        <View style={heroStyles.headerRight}>
          <TouchableOpacity style={heroStyles.iconBtn} onPress={onNotifs} activeOpacity={0.8}>
            <Feather name="bell" size={22} color="#FFF" />
            {unreadCount > 0 && (
              <View style={heroStyles.badge}>
                <Text style={heroStyles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={heroStyles.iconBtn} onPress={onCart} activeOpacity={0.8}>
            <Feather name="shopping-cart" size={22} color="#FFF" />
            {cartCount > 0 && (
              <View style={heroStyles.badge}>
                <Text style={heroStyles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Text + CTA — bottom of the photo */}
      <View style={heroStyles.textBlock}>
        <Text style={heroStyles.title}>{slide.title}</Text>
        <Text style={heroStyles.accent}>{slide.accent}</Text>
        <Text style={heroStyles.desc}>{slide.desc}</Text>
        <TouchableOpacity style={heroStyles.btn} onPress={onOrder} activeOpacity={0.85}>
          <Feather name="shopping-bag" size={16} color="#FFF" />
          <Text style={heroStyles.btnText}>Commander maintenant</Text>
        </TouchableOpacity>
      </View>

      {/* Slide dots */}
      <View style={heroStyles.dots}>
        {HERO_SLIDES.map((_, i) => (
          <View key={i} style={[heroStyles.dot, i === idx && heroStyles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 420,
  },
  photoWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
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
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
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
    backgroundColor: "#E53935",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  textBlock: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: "44%",
    gap: 2,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  accent: {
    fontSize: 24,
    fontWeight: "800",
    color: "#5EE85E",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  desc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    lineHeight: 18,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 18,
  },
});


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
  const { unreadCount } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  const orders = user ? getOrdersByUser(user.id) : [];
  const activeOrders = orders.filter((o) => o.statut !== "livre");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <NotificationsModal visible={showNotifs} onClose={() => setShowNotifs(false)} />

      {/* Hero — contient le header + la photo + le texte */}
      <HeroCarousel
        topPad={topPad}
        userName={`${user?.prenom ?? ""} ${user?.nom ?? ""}`}
        cartCount={count}
        unreadCount={unreadCount}
        onNotifs={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNotifs(true); }}
        onCart={() => router.push("/(tabs)/cart")}
        onOrder={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/order"); }}
      />

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
    paddingBottom: 100,
    backgroundColor: Colors.background,
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
