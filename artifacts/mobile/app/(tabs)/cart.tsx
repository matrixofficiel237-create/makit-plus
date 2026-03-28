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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import * as Haptics from "expo-haptics";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { items, removeItem, updateQuantite, clearCart, totalProduits, fraisLivraison, totalFinal } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();

  const [step, setStep] = useState<"cart" | "address" | "payment">("cart");
  const [adresse, setAdresse] = useState({ quartier: "", rue: "", description: "" });
  const [paiement, setPaiement] = useState<"livraison" | "mobile_money">("livraison");
  const [loading, setLoading] = useState(false);

  async function handleOrder() {
    if (!adresse.quartier || !adresse.rue) {
      Alert.alert("Erreur", "Veuillez remplir le quartier et la rue");
      return;
    }
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    setLoading(true);
    try {
      await createOrder({
        userId: user.id,
        items: [...items],
        adresse,
        paiement,
        totalProduits,
        fraisLivraison,
        totalFinal,
      });
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("cart");
      setAdresse({ quartier: "", rue: "", description: "" });
      router.replace("/(tabs)/orders");
    } catch (e) {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Panier</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptySubtitle}>Ajoutez des produits pour passer une commande</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)/order")}
          >
            <Text style={styles.shopBtnText}>Commencer à commander</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        {step !== "cart" && (
          <TouchableOpacity onPress={() => setStep("cart")} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {step === "cart" ? "Panier" : step === "address" ? "Adresse" : "Paiement"}
        </Text>
      </View>

      {/* Steps indicator */}
      <View style={styles.stepsRow}>
        {["cart", "address", "payment"].map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.stepDot, step === s && styles.stepDotActive, (
              (s === "address" && step === "payment") || (s === "cart" && step !== "cart")
            ) && styles.stepDotDone]}>
              <Text style={styles.stepDotText}>{i + 1}</Text>
            </View>
            {i < 2 && <View style={styles.stepLine} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === "cart" && (
          <>
            <Text style={styles.sectionTitle}>Mes articles</Text>
            {items.map((item) => (
              <View key={item.product.id} style={styles.cartItem}>
                <Text style={styles.itemEmoji}>{item.product.emoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product.nom}</Text>
                  <Text style={styles.itemPrice}>{(item.product.prix * item.quantite).toLocaleString()} FCFA</Text>
                  <Text style={styles.itemUnitPrice}>{item.product.prix.toLocaleString()} FCFA / unité</Text>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.counter}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateQuantite(item.product.id, item.quantite - 1)}
                    >
                      <Feather name="minus" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.counterText}>{item.quantite}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => updateQuantite(item.product.id, item.quantite + 1)}
                    >
                      <Feather name="plus" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(item.product.id)}
                    style={styles.deleteBtn}
                  >
                    <Feather name="trash-2" size={16} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{totalProduits.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de livraison</Text>
                <Text style={styles.summaryValue}>{fraisLivraison.toLocaleString()} FCFA</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{totalFinal.toLocaleString()} FCFA</Text>
              </View>
            </View>
          </>
        )}

        {step === "address" && (
          <>
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Quartier *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Akwa, Bonanjo..."
                placeholderTextColor={Colors.gray}
                value={adresse.quartier}
                onChangeText={(v) => setAdresse((a) => ({ ...a, quartier: v }))}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Rue *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom de la rue"
                placeholderTextColor={Colors.gray}
                value={adresse.rue}
                onChangeText={(v) => setAdresse((a) => ({ ...a, rue: v }))}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Description de la maison</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Maison bleue derrière l'école"
                placeholderTextColor={Colors.gray}
                value={adresse.description}
                onChangeText={(v) => setAdresse((a) => ({ ...a, description: v }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {step === "payment" && (
          <>
            <Text style={styles.sectionTitle}>Mode de paiement</Text>
            <TouchableOpacity
              style={[styles.paymentOption, paiement === "livraison" && styles.paymentOptionActive]}
              onPress={() => setPaiement("livraison")}
            >
              <Feather name="dollar-sign" size={24} color={paiement === "livraison" ? Colors.primary : Colors.gray} />
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentName, paiement === "livraison" && styles.paymentNameActive]}>
                  Paiement à la livraison
                </Text>
                <Text style={styles.paymentDesc}>Payez en cash à la réception</Text>
              </View>
              {paiement === "livraison" && <Feather name="check-circle" size={22} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, paiement === "mobile_money" && styles.paymentOptionActive]}
              onPress={() => setPaiement("mobile_money")}
            >
              <Feather name="smartphone" size={24} color={paiement === "mobile_money" ? Colors.primary : Colors.gray} />
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentName, paiement === "mobile_money" && styles.paymentNameActive]}>
                  Mobile Money
                </Text>
                <Text style={styles.paymentDesc}>Orange Money, MTN Mobile Money</Text>
              </View>
              {paiement === "mobile_money" && <Feather name="check-circle" size={22} color={Colors.primary} />}
            </TouchableOpacity>

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Articles ({items.length})</Text>
                <Text style={styles.summaryValue}>{totalProduits.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Livraison</Text>
                <Text style={styles.summaryValue}>{fraisLivraison.toLocaleString()} FCFA</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <Text style={styles.totalValue}>{totalFinal.toLocaleString()} FCFA</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
        {step === "cart" && (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => setStep("address")}
          >
            <Text style={styles.ctaBtnText}>Choisir l'adresse</Text>
            <Feather name="arrow-right" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
        {step === "address" && (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => {
              if (!adresse.quartier || !adresse.rue) {
                Alert.alert("Champs requis", "Quartier et rue sont obligatoires");
                return;
              }
              setStep("payment");
            }}
          >
            <Text style={styles.ctaBtnText}>Choisir le paiement</Text>
            <Feather name="arrow-right" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
        {step === "payment" && (
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Feather name="check" size={20} color={Colors.white} />
                <Text style={styles.ctaBtnText}>Confirmer la commande</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    gap: 12,
  },
  backBtn: { padding: 2 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: Colors.white,
    gap: 0,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotDone: { backgroundColor: Colors.primaryDark },
  stepDotText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.border },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  cartItem: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemEmoji: { fontSize: 32 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  itemUnitPrice: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  itemActions: { gap: 8, alignItems: "flex-end" },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  deleteBtn: { padding: 4 },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  formGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
  },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 12 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLighter,
  },
  paymentInfo: { flex: 1 },
  paymentName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  paymentNameActive: { color: Colors.primaryDark },
  paymentDesc: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  orderSummary: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  cta: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.7 },
  ctaBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  shopBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  shopBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
