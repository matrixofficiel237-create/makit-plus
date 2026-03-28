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
import { useLocalSearchParams, router } from "expo-router";
import Colors from "@/constants/colors";
import { PRODUCTS, CATEGORIES } from "@/data/products";
import { Product, useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import * as Haptics from "expo-haptics";

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const params = useLocalSearchParams<{ categorie?: string }>();
  const [selectedCat, setSelectedCat] = useState(params.categorie ?? "legumes");
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const { addItem, items, count } = useCart();

  const filtered = PRODUCTS.filter(
    (p) =>
      p.categorie === selectedCat &&
      (search === "" || p.nom.toLowerCase().includes(search.toLowerCase()))
  );

  function getCartQty(productId: string) {
    const item = items.find((i) => i.product.id === productId);
    return item?.quantite ?? 0;
  }

  function addCustomItem() {
    if (!customName.trim() || !customPrice.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom et le prix de l'article");
      return;
    }
    const price = parseInt(customPrice, 10);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Erreur", "Prix invalide");
      return;
    }
    const customProduct: Product = {
      id: "custom-" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      nom: customName.trim(),
      categorie: "personnalise",
      prix: price,
      emoji: "📦",
    };
    addItem(customProduct);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCustomName("");
    setCustomPrice("");
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commander</Text>
        {count > 0 && (
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Feather name="shopping-cart" size={20} color={Colors.white} />
            <Text style={styles.cartCount}>{count}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={Colors.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          placeholderTextColor={Colors.gray}
          value={search}
          onChangeText={setSearch}
        />
        {search !== "" && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={18} color={Colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
            onPress={() => {
              setSelectedCat(cat.id);
              setSearch("");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catName, selectedCat === cat.id && styles.catNameActive]}>
              {cat.nom}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      <ScrollView
        style={styles.productsScroll}
        contentContainerStyle={styles.productsContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          </View>
        ) : (
          filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantite={getCartQty(product.id)}
            />
          ))
        )}

        {/* Custom item */}
        <View style={styles.customSection}>
          <View style={styles.customHeader}>
            <Feather name="plus-circle" size={18} color={Colors.primary} />
            <Text style={styles.customTitle}>Ajouter un article personnalisé</Text>
          </View>
          <View style={styles.customForm}>
            <TextInput
              style={styles.customInput}
              placeholder="Nom de l'article"
              placeholderTextColor={Colors.gray}
              value={customName}
              onChangeText={setCustomName}
            />
            <TextInput
              style={[styles.customInput, styles.priceInput]}
              placeholder="Prix (FCFA)"
              placeholderTextColor={Colors.gray}
              value={customPrice}
              onChangeText={setCustomPrice}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.customAddBtn} onPress={addCustomItem}>
              <Feather name="plus" size={18} color={Colors.white} />
              <Text style={styles.customAddText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Platform.OS === "web" ? 110 : 100 }} />
      </ScrollView>

      {/* Cart CTA */}
      {count > 0 && (
        <View style={styles.cartCTA}>
          <TouchableOpacity
            style={styles.cartCTABtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Feather name="shopping-cart" size={20} color={Colors.white} />
            <Text style={styles.cartCTAText}>Voir le panier ({count} articles)</Text>
            <Feather name="arrow-right" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
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
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  categoriesScroll: {
    maxHeight: 80,
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primaryLighter,
    borderColor: Colors.primary,
  },
  catEmoji: {
    fontSize: 18,
  },
  catName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textLight,
    fontFamily: "Inter_600SemiBold",
  },
  catNameActive: {
    color: Colors.primaryDark,
  },
  productsScroll: {
    flex: 1,
  },
  productsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: Colors.textLight,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  customSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primaryLighter,
    borderStyle: "dashed",
    gap: 12,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  customForm: {
    gap: 10,
  },
  customInput: {
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  priceInput: {
    width: "50%",
  },
  customAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  customAddText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  cartCTA: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 100 : 90,
    left: 16,
    right: 16,
  },
  cartCTABtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  cartCTAText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
});
