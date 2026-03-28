import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";
import { useOrders } from "@/context/OrderContext";
import { OrderStatusStepper } from "@/components/OrderStatusBadge";
import * as Haptics from "expo-haptics";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, confirmReception, refreshOrders } = useOrders();

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [])
  );

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commande</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Commande introuvable</Text>
        </View>
      </View>
    );
  }

  function handleConfirmReception() {
    Alert.alert(
      "Confirmer la réception",
      "Avez-vous bien reçu votre commande ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui, j'ai reçu",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await confirmReception(order!.id);
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commande #{order.id.slice(-6).toUpperCase()}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Suivi de commande</Text>
          <OrderStatusStepper statut={order.statut} />
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Articles commandés</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemEmoji}>{item.product.emoji}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.nom}</Text>
                <Text style={styles.itemQty}>x{item.quantite}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {(item.product.prix * item.quantite).toLocaleString()} FCFA
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{order.totalProduits.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>{order.fraisLivraison.toLocaleString()} FCFA</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{order.totalFinal.toLocaleString()} FCFA</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adresse de livraison</Text>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={16} color={Colors.primary} />
            <View>
              <Text style={styles.addressMain}>{order.adresse.quartier}, {order.adresse.rue}</Text>
              {!!order.adresse.description && (
                <Text style={styles.addressDesc}>{order.adresse.description}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paiement</Text>
          <View style={styles.payRow}>
            <Feather
              name={order.paiement === "livraison" ? "dollar-sign" : "smartphone"}
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.payText}>
              {order.paiement === "livraison" ? "Paiement à la livraison" : "Mobile Money"}
            </Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Date de commande</Text>
          <Text style={styles.dateText}>{formatDate(order.date)}</Text>
        </View>

        {/* Confirm Reception button */}
        {order.statut === "en_livraison" && !order.confirmeRecu && (
          <TouchableOpacity style={styles.receivedBtn} onPress={handleConfirmReception}>
            <Feather name="check-circle" size={22} color={Colors.white} />
            <Text style={styles.receivedBtnText}>J'ai reçu ma commande</Text>
          </TouchableOpacity>
        )}

        {order.confirmeRecu && (
          <View style={styles.confirmedBox}>
            <Feather name="check-circle" size={20} color={Colors.primaryDark} />
            <Text style={styles.confirmedText}>Réception confirmée</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemEmoji: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  divider: { height: 1, backgroundColor: Colors.border },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addressMain: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  addressDesc: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  payText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
  dateText: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  receivedBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
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
  receivedBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  confirmedBox: {
    backgroundColor: Colors.primaryLighter,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  confirmedText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryDark,
    fontFamily: "Inter_600SemiBold",
  },
});
