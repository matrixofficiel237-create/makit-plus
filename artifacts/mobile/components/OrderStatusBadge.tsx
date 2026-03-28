import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { OrderStatus } from "@/context/OrderContext";
import Colors from "@/constants/colors";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  en_attente: { label: "Commande reçue", color: "#E65100", bg: "#FFF3E0" },
  achat_en_cours: { label: "Acheteur au marché", color: "#1565C0", bg: "#E3F2FD" },
  en_livraison: { label: "En livraison", color: "#6A1B9A", bg: "#F3E5F5" },
  livre: { label: "Livré", color: Colors.primaryDark, bg: Colors.primaryLighter },
};

interface OrderStatusBadgeProps {
  statut: OrderStatus;
  size?: "sm" | "md";
}

export default function OrderStatusBadge({ statut, size = "md" }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[statut];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === "sm" && styles.sm]}>
      <Text style={[styles.text, { color: config.color }, size === "sm" && styles.smText]}>
        {config.label}
      </Text>
    </View>
  );
}

export function OrderStatusStepper({ statut }: { statut: OrderStatus }) {
  const steps: { key: OrderStatus; label: string }[] = [
    { key: "en_attente", label: "Commande reçue" },
    { key: "achat_en_cours", label: "Acheteur au marché" },
    { key: "en_livraison", label: "En livraison" },
    { key: "livre", label: "Livré" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === statut);

  return (
    <View style={styles.stepper}>
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.dot, done && styles.dotDone]}>
                {done && <View style={styles.dotInner} />}
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.line, i < currentIndex && styles.lineDone]} />
              )}
            </View>
            <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  smText: {
    fontSize: 10,
  },
  stepper: {
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepLeft: {
    alignItems: "center",
    width: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLighter,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  line: {
    width: 2,
    height: 32,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    fontSize: 14,
    color: Colors.textLight,
    paddingTop: 2,
    fontFamily: "Inter_400Regular",
    paddingBottom: 24,
  },
  stepLabelDone: {
    color: Colors.text,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
