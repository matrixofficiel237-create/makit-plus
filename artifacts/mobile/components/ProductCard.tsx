import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { Product } from "@/context/CartContext";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  cartQuantite?: number;
}

export default function ProductCard({ product, cartQuantite = 0 }: ProductCardProps) {
  const { addItem, updateQuantite } = useCart();

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(product);
  }

  function handleIncrease() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantite(product.id, cartQuantite + 1);
  }

  function handleDecrease() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantite(product.id, cartQuantite - 1);
  }

  return (
    <View style={styles.card}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{product.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.nom}</Text>
        <Text style={styles.price}>{product.prix.toLocaleString()} FCFA</Text>
      </View>
      <View style={styles.actions}>
        {cartQuantite === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Feather name="plus" size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterBtn} onPress={handleDecrease}>
              <Feather name="minus" size={14} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.counterText}>{cartQuantite}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={handleIncrease}>
              <Feather name="plus" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 2,
    marginBottom: 10,
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primaryLighter,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  price: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  actions: {
    alignItems: "flex-end",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLighter,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    minWidth: 20,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
});
