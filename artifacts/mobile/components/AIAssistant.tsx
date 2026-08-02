import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "@/context/CartContext";
import { API_BASE } from "@/utils/api";
import Colors from "@/constants/colors";

interface AIItem {
  nom: string;
  prix: number;
  emoji: string;
}

interface AIResult {
  response: string;
  items: AIItem[];
}

// Génère un emoji à partir du nom si l'IA n'en fournit pas
const EMOJI_MAP: Record<string, string> = {
  tomate: "🍅", légume: "🥦", legume: "🥦", poisson: "🐟",
  viande: "🥩", plantain: "🍌", épice: "🧂", epice: "🧂",
  oignon: "🧅", ail: "🧄", piment: "🌶️", huile: "🫙",
  riz: "🍚", haricot: "🫘", igname: "🍠", manioc: "🌿",
  banane: "🍌", orange: "🍊", citron: "🍋", mangue: "🥭",
  poulet: "🍗", bœuf: "🥩", boeuf: "🥩", porc: "🥩", mouton: "🥩",
  crevette: "🦐", sardine: "🐟", gombo: "🥬", aubergine: "🍆",
  chou: "🥬", épinard: "🥬", courgette: "🥒", gingembre: "🫚",
  sel: "🧂", sucre: "🍬", farine: "🌾", pain: "🍞",
};

function getEmoji(nom: string, provided?: string): string {
  if (provided && provided.trim()) return provided.trim();
  const lower = nom.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return "🛍️";
}

const SUGGESTIONS = [
  "Ingrédients pour une sauce tomate 🍅",
  "Je veux faire du ndolé 🥬",
  "Liste de légumes pour la semaine 🥗",
  "Ingrédients pour le poulet DG 🍗",
];

export default function AIAssistant() {
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();

  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<AIResult | null>(null);
  const [added, setAdded]     = useState<Set<number>>(new Set());
  const [error, setError]     = useState("");
  const pulseAnim             = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  async function askAI() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setAdded(new Set());

    try {
      const res = await fetch(`${API_BASE}/ai/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data: AIResult = await res.json();
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Je n'arrive pas à répondre pour le moment. Réessaie.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(item: AIItem, index: number) {
    addItem({
      id: `ai-${Date.now()}-${index}`,
      nom: item.nom,
      categorie: "courses",
      prix: Math.round(item.prix),
      emoji: getEmoji(item.nom, item.emoji),
    });
    setAdded((prev) => new Set([...prev, index]));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleAddAll() {
    if (!result) return;
    result.items.forEach((item, i) => {
      addItem({
        id: `ai-${Date.now()}-${i}`,
        nom: item.nom,
        categorie: "courses",
        prix: Math.round(item.prix),
        emoji: getEmoji(item.nom, item.emoji),
      });
    });
    setAdded(new Set(result.items.map((_, i) => i)));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function reset() {
    setResult(null);
    setInput("");
    setAdded(new Set());
    setError("");
  }

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: pulseAnim }],
            bottom: (Platform.OS === "ios" ? insets.bottom : 0) + 90,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabInner}
          onPress={() => {
            setOpen(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>✨</Text>
          <Text style={styles.fabLabel}>IA</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>✨ Assistant Makit+</Text>
                <Text style={styles.sheetSub}>Dis-moi ce que tu veux cuisiner ou acheter</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Suggestions rapides */}
              {!result && !loading && (
                <View style={styles.quickWrap}>
                  <Text style={styles.quickTitle}>SUGGESTIONS RAPIDES</Text>
                  <View style={styles.quickGrid}>
                    {SUGGESTIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={styles.quickChip}
                        onPress={() => setInput(s)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.quickChipText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Loading */}
              {loading && (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Je prépare ta liste…</Text>
                </View>
              )}

              {/* Erreur */}
              {!!error && (
                <View style={styles.errorBubble}>
                  <Feather name="alert-circle" size={14} color="#e53935" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Résultat */}
              {result && (
                <View style={styles.resultWrap}>
                  <View style={styles.aiMessageBubble}>
                    <Text style={styles.aiMessageText}>{result.response}</Text>
                  </View>

                  {result.items.length > 0 && (
                    <>
                      <View style={styles.productsHeader}>
                        <Text style={styles.productsTitle}>
                          {result.items.length} article{result.items.length > 1 ? "s" : ""}
                        </Text>
                        <TouchableOpacity onPress={handleAddAll} style={styles.addAllBtn}>
                          <Feather name="shopping-cart" size={13} color="#FFF" />
                          <Text style={styles.addAllText}>Tout ajouter</Text>
                        </TouchableOpacity>
                      </View>

                      {result.items.map((item, i) => {
                        const isAdded = added.has(i);
                        return (
                          <View key={i} style={styles.productCard}>
                            <Text style={styles.productEmoji}>
                              {getEmoji(item.nom, item.emoji)}
                            </Text>
                            <View style={styles.productInfo}>
                              <Text style={styles.productNom}>{item.nom}</Text>
                              <Text style={styles.productPrix}>
                                ~{item.prix.toLocaleString()} FCFA
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={[styles.addBtn, isAdded && styles.addBtnDone]}
                              onPress={() => !isAdded && handleAdd(item, i)}
                              activeOpacity={isAdded ? 1 : 0.8}
                            >
                              <Feather name={isAdded ? "check" : "plus"} size={16} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}

                      <TouchableOpacity style={styles.newSearchBtn} onPress={reset}>
                        <Feather name="refresh-cw" size={13} color="#888" />
                        <Text style={styles.newSearchText}>Nouvelle recherche</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {result.items.length === 0 && (
                    <Text style={styles.emptyText}>Aucun article trouvé. Essaie d'être plus précis.</Text>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Barre de saisie */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ex : Je veux faire du ndolé…"
                placeholderTextColor="#aaa"
                multiline
                maxLength={200}
                returnKeyType="send"
                onSubmitEditing={askAI}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={askAI}
                disabled={!input.trim() || loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Feather name="send" size={18} color="#FFF" />
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    zIndex: 100,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 1,
  },
  fabIcon: { fontSize: 18, lineHeight: 20 },
  fabLabel: { fontSize: 10, fontWeight: "700", color: "#FFF", lineHeight: 12 },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "88%",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#ddd", alignSelf: "center", marginBottom: 12,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#111", fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 12, color: "#888", marginTop: 2, fontFamily: "Inter_400Regular" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#eee", alignItems: "center", justifyContent: "center",
  },

  scrollArea: { maxHeight: 420 },

  quickWrap: { marginBottom: 8 },
  quickTitle: {
    fontSize: 10, color: "#bbb", fontWeight: "700",
    letterSpacing: 1.2, marginBottom: 10,
  },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: {
    backgroundColor: "#F0F9F0",
    borderWidth: 1, borderColor: Colors.primary + "40",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  quickChipText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },

  loadingWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 20, justifyContent: "center",
  },
  loadingText: { fontSize: 13, color: "#888" },

  errorBubble: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFEBEE", borderRadius: 12, padding: 12,
  },
  errorText: { fontSize: 13, color: "#c62828", flex: 1 },

  resultWrap: { gap: 12 },
  aiMessageBubble: {
    backgroundColor: Colors.primary + "18",
    borderRadius: 16, borderBottomLeftRadius: 4, padding: 14,
  },
  aiMessageText: { fontSize: 14, color: "#222", lineHeight: 20 },

  productsHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  productsTitle: { fontSize: 13, fontWeight: "700", color: "#333" },
  addAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  addAllText: { fontSize: 12, fontWeight: "700", color: "#FFF" },

  productCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF", borderRadius: 14, padding: 12, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  productEmoji: { fontSize: 28 },
  productInfo: { flex: 1 },
  productNom: { fontSize: 14, fontWeight: "700", color: "#111", fontFamily: "Inter_700Bold" },
  productPrix: { fontSize: 12, color: "#888", marginTop: 2 },
  addBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  addBtnDone: { backgroundColor: "#4CAF50" },

  newSearchBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "center", paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: "#ddd",
  },
  newSearchText: { fontSize: 12, color: "#888" },

  emptyText: { textAlign: "center", color: "#999", fontSize: 13, padding: 16 },

  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#eee",
  },
  input: {
    flex: 1, backgroundColor: "#F0F0F0", borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: "#111", maxHeight: 100,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#ccc" },
});
