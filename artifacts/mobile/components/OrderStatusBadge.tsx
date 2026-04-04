import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

type StatusConfig = { label: string; color: string; bg: string };

const STATUS_CONFIG: Record<string, StatusConfig> = {
  en_attente:    { label: "En attente",          color: "#E65100", bg: "#FFF3E0" },
  confirme:      { label: "Confirmé",             color: "#1565C0", bg: "#E3F2FD" },
  achat_en_cours:{ label: "Acheteur au marché",   color: "#1565C0", bg: "#E3F2FD" },
  en_cours:      { label: "En cours",             color: "#6A1B9A", bg: "#F3E5F5" },
  en_livraison:  { label: "En livraison",         color: "#6A1B9A", bg: "#F3E5F5" },
  livre:         { label: "Livré ✓",              color: Colors.primaryDark, bg: Colors.primaryLighter },
  annule:        { label: "Annulé",               color: "#B71C1C", bg: "#FFEBEE" },
};

const FALLBACK: StatusConfig = { label: "En attente", color: "#E65100", bg: "#FFF3E0" };

function getConfig(statut: string): StatusConfig {
  return STATUS_CONFIG[statut] ?? FALLBACK;
}

interface OrderStatusBadgeProps {
  statut: string;
  size?: "sm" | "md";
}

export default function OrderStatusBadge({ statut, size = "md" }: OrderStatusBadgeProps) {
  const config = getConfig(statut);
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === "sm" && styles.sm]}>
      <Text style={[styles.text, { color: config.color }, size === "sm" && styles.smText]}>
        {config.label}
      </Text>
    </View>
  );
}

const STEPPER_STEPS = [
  { keys: ["en_attente"],                   label: "Commande reçue" },
  { keys: ["confirme", "achat_en_cours"],   label: "Confirmée / Achat en cours" },
  { keys: ["en_cours", "en_livraison"],     label: "En livraison" },
  { keys: ["livre"],                        label: "Livré" },
];

export function OrderStatusStepper({ statut }: { statut: string }) {
  const currentIndex = STEPPER_STEPS.findIndex((s) => s.keys.includes(statut));
  const isCancelled = statut === "annule";

  if (isCancelled) {
    return (
      <View style={styles.cancelledBox}>
        <Text style={styles.cancelledText}>❌ Commande annulée</Text>
      </View>
    );
  }

  return (
    <View style={styles.stepper}>
      {STEPPER_STEPS.map((step, i) => {
        const done = currentIndex >= 0 && i <= currentIndex;
        return (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.dot, done && styles.dotDone]}>
                {done && <View style={styles.dotInner} />}
              </View>
              {i < STEPPER_STEPS.length - 1 && (
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
  cancelledBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
  },
  cancelledText: {
    color: "#B71C1C",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
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
