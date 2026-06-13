import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { api } from "@/utils/api";
import * as Haptics from "expo-haptics";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { bottom: TAB_BAR_BOTTOM } = useSafeAreaInsets();
  const { items, removeItem, updateQuantite, clearCart, totalProduits, fraisLivraison, totalFinal } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();

  const scrollRef = useRef<ScrollView>(null);
  const [quartier, setQuartier] = useState("");
  const [rue, setRue] = useState("");
  const [description, setDescription] = useState("");
  const [paiement, setPaiement] = useState<"livraison" | "orange_money" | "momo">("livraison");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ quartier: false, rue: false });
  const [confirmed, setConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  async function handleGetGPS() {
    if (Platform.OS === "web") {
      Alert.alert("GPS non disponible", "Le GPS fonctionne uniquement sur l'application Android.");
      return;
    }
    setGpsLoading(true);
    setGpsSuccess(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Autorisez l'accès à la localisation dans les paramètres de votre téléphone pour utiliser cette fonctionnalité.",
          [{ text: "OK" }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setGpsCoords({ latitude, longitude });

      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (place) {
        const q = place.subregion ?? place.district ?? place.city ?? place.region ?? "";
        const r = place.street ?? place.name ?? "";
        if (q && !quartier) setQuartier(q);
        if (r && !rue) setRue(r);
      }

      setGpsSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (user) {
        api.users.update(user.id, { latitude, longitude }).catch(() => {});
      }
    } catch {
      Alert.alert("Erreur GPS", "Impossible de récupérer votre position. Vérifiez que le GPS est activé.");
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleConfirm() {
    setSubmitError("");
    const newErrors = {
      quartier: !quartier.trim(),
      rue: !rue.trim(),
    };
    setErrors(newErrors);
    if (newErrors.quartier || newErrors.rue) {
      setSubmitError("Veuillez remplir votre adresse de livraison (quartier et rue)");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
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
        adresse: { quartier: quartier.trim(), rue: rue.trim(), description: description.trim() },
        paiement,
        totalProduits,
        fraisLivraison,
        totalFinal,
      });
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmed(true);
    } catch {
      setSubmitError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMobileMoneyPay(type: "orange_money" | "momo") {
    setSubmitError("");
    const newErrors = { quartier: !quartier.trim(), rue: !rue.trim() };
    setErrors(newErrors);
    if (newErrors.quartier || newErrors.rue) {
      setSubmitError("Remplissez d'abord votre adresse (quartier et rue) avant de payer");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!user) { router.replace("/(auth)/login"); return; }

    const code = type === "momo"
      ? `*126*4*227165*${totalFinal}%23`
      : `%23150*46*1283376*${totalFinal}%23`;
    Linking.openURL(`tel:${code}`).catch(() => {});

    setPaiement(type);
    setLoading(true);
    try {
      await createOrder({
        userId: user.id,
        items: [...items],
        adresse: { quartier: quartier.trim(), rue: rue.trim(), description: description.trim() },
        paiement: type,
        totalProduits,
        fraisLivraison,
        totalFinal,
      });
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmed(true);
    } catch {
      setSubmitError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Commande envoyée</Text>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Commande confirmée ! 🎉</Text>
          <Text style={styles.successText}>
            Votre commande a été transmise. Un livreur va prendre en charge vos courses et vous les apporter.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => {
              setConfirmed(false);
              router.replace("/(tabs)/orders");
            }}
          >
            <Feather name="list" size={18} color={Colors.white} />
            <Text style={styles.successBtnText}>Voir mes commandes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successBtnOutline}
            onPress={() => {
              setConfirmed(false);
              router.replace("/(tabs)/order");
            }}
          >
            <Text style={styles.successBtnOutlineText}>Nouvelle commande</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Panier</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 56 }}>🛒</Text>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptySubtitle}>
            Ajoutez vos articles depuis la liste de courses
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)/order")}
          >
            <Feather name="plus" size={18} color={Colors.white} />
            <Text style={styles.shopBtnText}>Créer ma liste de courses</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon panier</Text>
        <Text style={styles.headerSub}>{items.length} article{items.length > 1 ? "s" : ""}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Articles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛍️ Articles commandés</Text>
          {items.map((item) => (
            <View key={item.product.id} style={styles.cartItem}>
              <Text style={styles.itemEmoji}>{item.product.emoji}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product.nom}</Text>
                <Text style={styles.itemPrice}>{(item.product.prix * item.quantite).toLocaleString()} FCFA</Text>
                <Text style={styles.itemUnit}>{item.product.prix.toLocaleString()} FCFA/unité</Text>
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
                <TouchableOpacity onPress={() => removeItem(item.product.id)} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={15} color={Colors.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Récapitulatif */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total courses</Text>
            <Text style={styles.summaryValue}>{totalProduits.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de livraison</Text>
            <Text style={styles.summaryValue}>{fraisLivraison.toLocaleString()} FCFA</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalValue}>{totalFinal.toLocaleString()} FCFA</Text>
          </View>
        </View>

        {/* Adresse */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Adresse de livraison</Text>

          {/* Bouton GPS */}
          <TouchableOpacity
            style={[styles.gpsBtn, gpsSuccess && styles.gpsBtnSuccess]}
            onPress={handleGetGPS}
            disabled={gpsLoading}
            activeOpacity={0.8}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={gpsSuccess ? Colors.primary : Colors.white} />
            ) : (
              <Feather
                name={gpsSuccess ? "check-circle" : "navigation"}
                size={18}
                color={gpsSuccess ? Colors.primary : Colors.white}
              />
            )}
            <Text style={[styles.gpsBtnText, gpsSuccess && styles.gpsBtnTextSuccess]}>
              {gpsLoading
                ? "Localisation en cours..."
                : gpsSuccess
                ? "Position GPS enregistrée ✓"
                : "📡 Utiliser ma position GPS"}
            </Text>
          </TouchableOpacity>

          {gpsSuccess && (
            <View style={styles.gpsInfoBox}>
              <Feather name="info" size={13} color={Colors.primary} />
              <Text style={styles.gpsInfoText}>
                Votre position a été enregistrée. Elle aide l'admin à organiser les livraisons par zone.
              </Text>
            </View>
          )}

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Quartier *</Text>
              <TextInput
                style={[styles.input, errors.quartier && styles.inputError]}
                placeholder="Ex: Akwa, Bonanjo, Bonapriso..."
                placeholderTextColor={Colors.gray}
                value={quartier}
                onChangeText={(v) => { setQuartier(v); setErrors((e) => ({ ...e, quartier: false })); }}
              />
              {errors.quartier && <Text style={styles.errHint}>Champ requis</Text>}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Rue / Avenue *</Text>
              <TextInput
                style={[styles.input, errors.rue && styles.inputError]}
                placeholder="Nom de la rue ou avenue"
                placeholderTextColor={Colors.gray}
                value={rue}
                onChangeText={(v) => { setRue(v); setErrors((e) => ({ ...e, rue: false })); }}
              />
              {errors.rue && <Text style={styles.errHint}>Champ requis</Text>}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description (optionnel)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
                placeholder="Ex: Maison rouge, près de l'école..."
                placeholderTextColor={Colors.gray}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </View>
        </View>

        {/* Paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Mode de paiement</Text>

          <TouchableOpacity
            style={[styles.payOption, paiement === "livraison" && styles.payOptionActive]}
            onPress={() => setPaiement("livraison")}
          >
            <View style={[styles.payIcon, { backgroundColor: paiement === "livraison" ? Colors.primaryLighter : Colors.lightGray }]}>
              <Feather name="dollar-sign" size={22} color={paiement === "livraison" ? Colors.primary : Colors.gray} />
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payName, paiement === "livraison" && { color: Colors.primaryDark }]}>
                Paiement à la livraison
              </Text>
              <Text style={styles.payDesc}>Payez en espèces à la réception</Text>
            </View>
            {paiement === "livraison" && <Feather name="check-circle" size={22} color={Colors.primary} />}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            <Text style={{ fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" }}>OU PAYER MAINTENANT</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
          </View>

          <TouchableOpacity
            style={styles.mobilePayBtn}
            onPress={() => handleMobileMoneyPay("orange_money")}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={[styles.payIcon, { backgroundColor: "#FFF3E0" }]}>
              <Text style={{ fontSize: 22 }}>🟠</Text>
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payName, { color: "#E65100" }]}>Payer avec Orange Money</Text>
              <Text style={styles.payDesc}>Ouvre le composeur + confirme la commande</Text>
            </View>
            <Feather name="phone-call" size={20} color="#FF6D00" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mtnPayBtn}
            onPress={() => handleMobileMoneyPay("momo")}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={[styles.payIcon, { backgroundColor: "#FFFDE7" }]}>
              <Text style={{ fontSize: 22 }}>📱</Text>
            </View>
            <View style={styles.payInfo}>
              <Text style={[styles.payName, { color: "#F57F17" }]}>Payer avec MTN MoMo</Text>
              <Text style={styles.payDesc}>Ouvre le composeur + confirme la commande</Text>
            </View>
            <Feather name="phone-call" size={20} color="#FFC107" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bouton Confirmer */}
      <View style={styles.confirmBar}>
        {submitError ? (
          <View style={styles.submitErrorBox}>
            <Feather name="alert-circle" size={15} color={Colors.red} />
            <Text style={styles.submitError}>{submitError}</Text>
          </View>
        ) : null}
        <View style={styles.confirmBarTop}>
          <Text style={styles.confirmBarLabel}>Total</Text>
          <Text style={styles.confirmBarTotal}>{totalFinal.toLocaleString()} FCFA</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={22} color={Colors.white} />
              <Text style={styles.confirmBtnText}>Confirmer la commande</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ height: TAB_BAR_BOTTOM }} />
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
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
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
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  itemPrice: { fontSize: 14, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  itemUnit: { fontSize: 11, color: Colors.textLight, fontFamily: "Inter_400Regular" },
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
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  totalValue: { fontSize: 18, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },

  // GPS button
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  gpsBtnSuccess: {
    backgroundColor: Colors.primaryLighter,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  gpsBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  gpsBtnTextSuccess: {
    color: Colors.primary,
  },
  gpsInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.primaryLighter,
    borderRadius: 10,
    padding: 10,
  },
  gpsInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
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
  errHint: { fontSize: 12, color: Colors.red, fontFamily: "Inter_400Regular" },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  payOptionActive: { borderColor: Colors.primary },
  mobilePayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF8F0",
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: "#FF6D00",
  },
  mtnPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFDF0",
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: "#FFC107",
  },
  payIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  payInfo: { flex: 1 },
  payName: { fontSize: 14, fontWeight: "600", color: Colors.text, fontFamily: "Inter_600SemiBold" },
  payDesc: { fontSize: 12, color: Colors.textLight, fontFamily: "Inter_400Regular", marginTop: 2 },
  confirmBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  submitErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  submitError: {
    flex: 1,
    fontSize: 13,
    color: Colors.red,
    fontFamily: "Inter_500Medium",
  },
  confirmBarTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmBarLabel: { fontSize: 13, color: Colors.textLight, fontFamily: "Inter_400Regular" },
  confirmBarTotal: { fontSize: 20, fontWeight: "700", color: Colors.primary, fontFamily: "Inter_700Bold" },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: Colors.white, fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, fontFamily: "Inter_700Bold" },
  emptySubtitle: { fontSize: 14, color: Colors.textLight, textAlign: "center", fontFamily: "Inter_400Regular" },
  shopBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  shopBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLighter,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  successText: {
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  successBtnOutline: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  successBtnOutlineText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
