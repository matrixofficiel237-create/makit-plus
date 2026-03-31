import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { Product, useCart } from "@/context/CartContext";
import * as Haptics from "expo-haptics";

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [nomError, setNomError] = useState(false);
  const { addItem, items, count, updateQuantite, removeItem } = useCart();

  const EMOJIS: Record<string, string> = {
    tomate: "🍅", légume: "🥦", legume: "🥦", poisson: "🐟",
    viande: "🥩", plantain: "🍌", épice: "🧂", epice: "🧂",
    oignon: "🧅", ail: "🧄", piment: "🌶️", huile: "🫙",
    riz: "🍚", haricot: "🫘", igname: "🍠", manioc: "🌿",
    banane: "🍌", orange: "🍊", citron: "🍋", mangue: "🥭",
  };

  function getEmoji(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(EMOJIS)) {
      if (lower.includes(key)) return emoji;
    }
    return "🛍️";
  }

  function addArticle() {
    if (!nom.trim()) {
      setNomError(true);
      return;
    }
    const price = parseFloat(prix.replace(",", "."));
    if (!prix.trim() || isNaN(price) || price <= 0) {
      Alert.alert("Prix invalide", "Entrez un prix valide en FCFA");
      return;
    }
    const qty = parseInt(quantite, 10);
    const customProduct: Product = {
      id: "item-" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      nom: nom.trim(),
      categorie: "courses",
      prix: Math.round(price),
      emoji: getEmoji(nom),
    };
    for (let i = 0; i < (isNaN(qty) || qty < 1 ? 1 : qty); i++) {
      addItem(customProduct);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNom("");
    setPrix("");
    setQuantite("1");
    setNomError(false);
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ma liste de courses</Text>
          <Text style={styles.headerSub}>Ajoutez vos articles avec leur prix</Text>
        </View>
        {count > 0 && (
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Feather name="shopping-cart" size={18} color={Colors.white} />
            <Text style={styles.cartCount}>{count}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Formulaire d'ajout */}
        <View style={styles.addCard}>
          <View style={styles.addCardHeader}>
            <Feather name="plus-circle" size={20} color={Colors.primary} />
            <Text style={styles.addCardTitle}>Ajouter un article</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nom de l'article *</Text>
            <TextInput
              style={[styles.input, nomError && styles.inputError]}
              placeholder="Ex: Tomates, Poulet, Riz..."
              placeholderTextColor={Colors.gray}
              value={nom}
              onChangeText={(v) => { setNom(v); setNomError(false); }}
              returnKeyType="next"
            />
            {nomError && <Text style={styles.errorHint}>Veuillez entrer le nom de l'article</Text>}
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 2 }]}>
              <Text style={styles.fieldLabel}>Prix estimé (FCFA) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 1000"
                placeholderTextColor={Colors.gray}
                value={prix}
                onChangeText={setPrix}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Qté</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantite((q) => String(Math.max(1, parseInt(q || "1", 10) - 1)))}
                >
                  <Feather name="minus" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantite}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantite((q) => String(parseInt(q || "1", 10) + 1))}
                >
                  <Feather name="plus" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={addArticle}>
            <Feather name="plus" size={18} color={Colors.white} />
            <Text style={styles.addBtnText}>Ajouter à la liste</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des articles */}
        {items.length > 0 && (
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Ma liste ({items.length} article{items.length > 1 ? "s" : ""})
              </Text>
              <Text style={styles.listTotal}>
                {items.reduce((s, i) => s + i.product.prix * i.quantite, 0).toLocaleString()} FCFA
              </Text>
            </View>

            {items.map((item) => (
              <View key={item.product.id} style={styles.itemCard}>
                <Text style={styles.itemEmoji}>{item.product.emoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product.nom}</Text>
                  <Text style={styles.itemUnitPrice}>{item.product.prix.toLocaleString()} FCFA/unité</Text>
                  <Text style={styles.itemTotal}>
                    Total : {(item.product.prix * item.quantite).toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.counter}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateQuantite(item.product.id, item.quantite - 1)}
                    >
                      <Feather name="minus" size={12} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.counterText}>{item.quantite}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateQuantite(item.product.id, item.quantite + 1)}
                    >
                      <Feather name="plus" size={12} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      removeItem(item.product.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Feather name="trash-2" size={16} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {items.length === 0 && (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Votre liste est vide</Text>
            <Text style={styles.emptyText}>
              Ajoutez vos articles ci-dessus.{"\n"}Indiquez le nom et le prix estimé de chaque produit.
            </Text>
          </View>
        )}

        <View style={{ height: Platform.OS === "web" ? 120 : 110 }} />
      </ScrollView>

      {/* CTA Panier */}
      {count > 0 && (
        <View style={styles.ctaBar}>
          <View style={styles.ctaSummary}>
            <Text style={styles.ctaCount}>{count} article{count > 1 ? "s" : ""}</Text>
            <Text style={styles.ctaTotal}>
              {items.reduce((s, i) => s + i.product.prix * i.quantite, 0).toLocaleString()} FCFA
            </Text>
          </View>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Text style={styles.ctaBtnText}>Passer la commande</Text>
            <Feather name="arrow-right" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartCount: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  addCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: Colors.primaryLighter,
  },
  addCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  inputError: { borderColor: Colors.red },
  errorHint: {
    fontSize: 12,
    color: Colors.red,
    fontFamily: "Inter_400Regular",
  },
  rowFields: { flexDirection: "row", gap: 12, alignItems: "flex-end" },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primaryLighter,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryDark,
    fontFamily: "Inter_700Bold",
    minWidth: 20,
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  listSection: { gap: 10 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  listTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  itemUnitPrice: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  itemActions: { gap: 8, alignItems: "flex-end" },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLighter,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  counterBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    minWidth: 18,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  deleteBtn: { padding: 4 },
  emptyHint: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  ctaBar: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 90 : 80,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaSummary: { gap: 2 },
  ctaCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
  },
  ctaTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
