import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/utils/api";
import Colors from "@/constants/colors";

interface AIItem {
  nom: string;
  prix: number;
  emoji: string;
}

interface EditableItem {
  nom: string;
  prix: number;
  emoji: string;
  editedNom: string;
  editedPrix: string;
}

interface HistoryEntry {
  id: string;
  query: string;
  response: string;
  items: AIItem[];
  createdAt: number; // ms timestamp
}

const HISTORY_KEY = "ai_list_history_v1";
const HISTORY_MAX = 5;

async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Silently ignore storage errors
  }
}

async function appendToHistory(
  history: HistoryEntry[],
  query: string,
  response: string,
  items: AIItem[]
): Promise<HistoryEntry[]> {
  const entry: HistoryEntry = {
    id: `${Date.now()}`,
    query: query.trim(),
    response,
    items,
    createdAt: Date.now(),
  };
  // Avoid duplicate of the exact same query as the most recent entry
  const filtered = history.filter(
    (h) => h.query.toLowerCase() !== entry.query.toLowerCase()
  );
  const updated = [entry, ...filtered].slice(0, HISTORY_MAX);
  await saveHistory(updated);
  return updated;
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return "hier";
  return `il y a ${days} jours`;
}

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
  ndolè: "🌿", ndole: "🌿", eru: "🥬", okok: "🌿", kwem: "🌿",
  arachide: "🥜", palmier: "🌴", kanda: "🥩", ekwang: "🥬",
  macabo: "🥔", taro: "🥔", mbongo: "🫙",
  djansan: "🌿", pistache: "🌰", soya: "🍢",
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
  "Je veux faire du ndolé 🥬",
  "Ingrédients pour le poulet DG 🍗",
  "Ingrédients pour le Mbongo Tchobi 🐟",
  "Liste de légumes pour la semaine 🥗",
];

export default function AIAssistant() {
  const { addItem } = useCart();
  const { user, aiToken, refreshAiToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [open, setOpen]                   = useState(false);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [aiResponse, setAiResponse]       = useState("");
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [added, setAdded]                 = useState<Set<number>>(new Set());
  const [error, setError]                 = useState("");
  const [successCount, setSuccessCount]   = useState(0);
  const successAnim                       = useRef(new Animated.Value(0)).current;

  // Custom item form
  const [customNom, setCustomNom]   = useState("");
  const [customPrix, setCustomPrix] = useState("");

  // History state
  const [history, setHistory]             = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab]         = useState<"search" | "history">("search");

  // Voice recording state
  const [isRecording, setIsRecording]   = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recordingRef  = useRef<Audio.Recording | null>(null);
  const startingRef   = useRef(false);
  const generationRef = useRef(0);

  const hasResult = aiResponse !== "" || editableItems.length > 0;
  const micBusy   = isRecording || transcribing;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1     = useRef(new Animated.Value(0.3)).current;
  const wave2     = useRef(new Animated.Value(0.5)).current;
  const wave3     = useRef(new Animated.Value(0.4)).current;
  const waveLoop  = useRef<Animated.CompositeAnimation | null>(null);

  // Load history when modal opens
  useEffect(() => {
    if (open) {
      loadHistory().then(setHistory);
    }
  }, [open]);

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

  React.useEffect(() => {
    return () => {
      generationRef.current += 1;
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    };
  }, []);

  /** Stops any active recording, cancels any in-flight start, then closes the sheet. */
  function closeSheet() {
    generationRef.current += 1;
    if (recordingRef.current) {
      const rec = recordingRef.current;
      recordingRef.current = null;
      setIsRecording(false);
      stopWaveAnimation();
      rec.stopAndUnloadAsync().catch(() => {});
    }
    setOpen(false);
  }

  function startWaveAnimation() {
    const makeWave = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 300, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: false }),
        ])
      );
    waveLoop.current = Animated.parallel([
      makeWave(wave1, 0),
      makeWave(wave2, 150),
      makeWave(wave3, 300),
    ]);
    waveLoop.current.start();
  }

  function stopWaveAnimation() {
    waveLoop.current?.stop();
    wave1.setValue(0.3);
    wave2.setValue(0.5);
    wave3.setValue(0.4);
  }

  const handleMicPress = useCallback(async () => {
    if (recordingRef.current) {
      const rec = recordingRef.current;
      recordingRef.current = null;
      setIsRecording(false);
      stopWaveAnimation();

      try {
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (!uri) return;

        setTranscribing(true);
        setError("");

        const formData = new FormData();
        formData.append("audio", {
          uri,
          name: "recording.m4a",
          type: "audio/m4a",
        } as unknown as Blob);

        const buildHeaders = (token: string | null): Record<string, string> => {
          const h: Record<string, string> = {};
          if (user?.id) h["X-User-Id"] = user.id;
          if (token)    h["Authorization"] = `Bearer ${token}`;
          return h;
        };

        let res = await fetch(`${API_BASE}/ai/transcribe`, {
          method: "POST",
          headers: buildHeaders(aiToken),
          body: formData,
        });

        if (res.status === 401) {
          const newToken = await refreshAiToken();
          if (newToken) {
            res = await fetch(`${API_BASE}/ai/transcribe`, {
              method: "POST",
              headers: buildHeaders(newToken),
              body: formData,
            });
          }
        }

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Session expirée. Reconnecte-toi pour utiliser la commande vocale.");
          }
          let serverMsg = "";
          try { serverMsg = (await res.json()).error ?? ""; } catch {}
          throw new Error(serverMsg || `Erreur serveur (${res.status}).`);
        }
        const { text } = await res.json();
        if (text?.trim()) {
          setInput(text.trim());
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "La transcription a échoué. Réessaie.";
        setError(msg);
      } finally {
        setTranscribing(false);
      }
    } else {
      if (startingRef.current) return;
      startingRef.current = true;
      const myGen = generationRef.current;

      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (generationRef.current !== myGen) return;
        if (!granted) {
          setError("Permission micro refusée. Active-la dans les paramètres.");
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        if (generationRef.current !== myGen) return;

        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        if (generationRef.current !== myGen) {
          rec.stopAndUnloadAsync().catch(() => {});
          return;
        }
        await rec.startAsync();
        if (generationRef.current !== myGen) {
          rec.stopAndUnloadAsync().catch(() => {});
          return;
        }

        recordingRef.current = rec;
        setIsRecording(true);
        startWaveAnimation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        if (generationRef.current === myGen) {
          setError("Impossible de démarrer l'enregistrement.");
        }
      } finally {
        startingRef.current = false;
      }
    }
  }, [user, aiToken]);

  function updateItem(index: number, field: "editedNom" | "editedPrix", value: string) {
    setEditableItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function askAI() {
    if (!input.trim()) return;
    setLoading(true);
    setAiResponse("");
    setEditableItems([]);
    setError("");
    setAdded(new Set());
    setActiveTab("search");

    try {
      const res = await fetch(`${API_BASE}/ai/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), userId: user?.id }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data: { response?: string; items?: AIItem[] } = await res.json();

      const items = Array.isArray(data.items) ? data.items : [];
      const response = data.response ?? "Voici ce que je te suggère.";

      setAiResponse(response);
      setEditableItems(
        items.map((item) => ({
          ...item,
          editedNom: item.nom,
          editedPrix: String(item.prix),
        }))
      );

      // Save to history
      const updated = await appendToHistory(history, input.trim(), response, items);
      setHistory(updated);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Je n'arrive pas à répondre pour le moment. Réessaie.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  /** Load a history entry into the result view */
  function loadHistoryEntry(entry: HistoryEntry) {
    setInput(entry.query);
    setAiResponse(entry.response);
    setEditableItems(
      entry.items.map((item) => ({
        ...item,
        editedNom: item.nom,
        editedPrix: String(item.prix),
      }))
    );
    setAdded(new Set());
    setError("");
    setActiveTab("search");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /** Delete a single history entry */
  async function deleteHistoryEntry(id: string) {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    await saveHistory(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function triggerSuccess(count: number) {
    setSuccessCount(count);
    successAnim.setValue(0);
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 7,
    }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleAdd(item: EditableItem, index: number) {
    const nom  = item.editedNom.trim() || item.nom;
    const prix = Math.round(parseFloat(item.editedPrix) || item.prix);
    addItem({
      id: `ai-${Date.now()}-${index}`,
      nom,
      categorie: "courses",
      prix,
      emoji: getEmoji(nom, item.emoji),
    });
    const newAdded = new Set([...added, index]);
    setAdded(newAdded);
    // If every item is now added, show success
    if (newAdded.size >= editableItems.length) {
      triggerSuccess(newAdded.size);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handleAddAll() {
    const total = editableItems.length;
    editableItems.forEach((item, i) => {
      const nom  = item.editedNom.trim() || item.nom;
      const prix = Math.round(parseFloat(item.editedPrix) || item.prix);
      addItem({
        id: `ai-${Date.now()}-${i}`,
        nom,
        categorie: "courses",
        prix,
        emoji: getEmoji(nom, item.emoji),
      });
    });
    setAdded(new Set(editableItems.map((_, i) => i)));
    triggerSuccess(total);
  }

  function handleRemove(index: number) {
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
    setAdded((prev) => {
      const next = new Set<number>();
      prev.forEach((idx) => {
        if (idx < index) next.add(idx);
        else if (idx > index) next.add(idx - 1);
      });
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleAddCustom() {
    const nom  = customNom.trim();
    const prix = Math.round(parseFloat(customPrix) || 0);
    if (!nom || prix <= 0) return;
    setEditableItems((prev) => [
      ...prev,
      { nom, prix, emoji: "", editedNom: nom, editedPrix: String(prix) },
    ]);
    setCustomNom("");
    setCustomPrix("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function reset() {
    setAiResponse("");
    setEditableItems([]);
    setInput("");
    setAdded(new Set());
    setError("");
    setSuccessCount(0);
    setCustomNom("");
    setCustomPrix("");
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
      <Modal visible={open} transparent animationType="slide" onRequestClose={closeSheet}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet} />

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>✨ Assistant Makit+</Text>
                <Text style={styles.sheetSub}>Dis-moi ce que tu veux cuisiner ou acheter</Text>
              </View>
              <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Tab bar — only show when no active result */}
            {!hasResult && !loading && history.length > 0 && (
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "search" && styles.tabActive]}
                  onPress={() => setActiveTab("search")}
                  activeOpacity={0.8}
                >
                  <Feather name="search" size={13} color={activeTab === "search" ? Colors.primary : "#999"} />
                  <Text style={[styles.tabText, activeTab === "search" && styles.tabTextActive]}>
                    Recherche
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "history" && styles.tabActive]}
                  onPress={() => setActiveTab("history")}
                  activeOpacity={0.8}
                >
                  <Feather name="clock" size={13} color={activeTab === "history" ? Colors.primary : "#999"} />
                  <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>
                    Historique
                  </Text>
                  <View style={styles.historyBadge}>
                    <Text style={styles.historyBadgeText}>{history.length}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── History tab ── */}
              {activeTab === "history" && !hasResult && !loading && (
                <View style={styles.historyList}>
                  <Text style={styles.quickTitle}>LISTES RÉCENTES</Text>
                  {history.length === 0 ? (
                    <Text style={styles.emptyText}>Aucune liste sauvegardée pour l'instant.</Text>
                  ) : (
                    history.map((entry) => (
                      <View key={entry.id} style={styles.historyCard}>
                        <TouchableOpacity
                          style={styles.historyCardMain}
                          onPress={() => loadHistoryEntry(entry)}
                          activeOpacity={0.75}
                        >
                          <View style={styles.historyCardTop}>
                            <Text style={styles.historyQuery} numberOfLines={1}>
                              {entry.query}
                            </Text>
                            <Text style={styles.historyDate}>{formatRelativeDate(entry.createdAt)}</Text>
                          </View>
                          <Text style={styles.historyMeta}>
                            {entry.items.length} article{entry.items.length > 1 ? "s" : ""}
                            {entry.items.length > 0
                              ? " · " + entry.items.slice(0, 3).map((i) => getEmoji(i.nom, i.emoji)).join(" ")
                              : ""}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.historyDeleteBtn}
                          onPress={() => deleteHistoryEntry(entry.id)}
                          activeOpacity={0.8}
                        >
                          <Feather name="trash-2" size={14} color="#ccc" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* ── Search tab ── */}
              {activeTab === "search" && (
                <>
                  {/* Suggestions rapides */}
                  {!hasResult && !loading && (
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

                  {/* Transcribing */}
                  {transcribing && (
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.loadingText}>Transcription en cours…</Text>
                    </View>
                  )}

                  {/* Erreur */}
                  {!!error && (
                    <View style={styles.errorBubble}>
                      <Feather name="alert-circle" size={14} color="#e53935" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  {/* Écran succès */}
                  {successCount > 0 && (
                    <Animated.View
                      style={[
                        styles.successWrap,
                        {
                          opacity: successAnim,
                          transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                        },
                      ]}
                    >
                      <View style={styles.successIcon}>
                        <Text style={styles.successEmoji}>🛒</Text>
                      </View>
                      <Text style={styles.successTitle}>
                        {successCount} article{successCount > 1 ? "s" : ""} ajouté{successCount > 1 ? "s" : ""} !
                      </Text>
                      <Text style={styles.successSub}>
                        Ta liste de courses est prête dans le panier.
                      </Text>
                      <TouchableOpacity
                        style={styles.successCartBtn}
                        onPress={() => {
                          setOpen(false);
                          router.push("/(tabs)/cart");
                        }}
                        activeOpacity={0.85}
                      >
                        <Feather name="shopping-cart" size={16} color="#FFF" />
                        <Text style={styles.successCartText}>Voir le panier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.newSearchBtn} onPress={reset}>
                        <Feather name="refresh-cw" size={13} color="#888" />
                        <Text style={styles.newSearchText}>Nouvelle liste</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {/* Résultat */}
                  {hasResult && successCount === 0 && (
                    <View style={styles.resultWrap}>
                      <View style={styles.aiMessageBubble}>
                        <Text style={styles.aiMessageText}>{aiResponse}</Text>
                      </View>

                      {editableItems.length > 0 && (
                        <>
                          <View style={styles.productsHeader}>
                            <View>
                              <Text style={styles.productsTitle}>
                                {editableItems.length} article{editableItems.length > 1 ? "s" : ""}
                              </Text>
                              <Text style={styles.productsHint}>
                                ✏️ Modifie le nom ou le prix avant d'ajouter
                              </Text>
                            </View>
                            <TouchableOpacity onPress={handleAddAll} style={styles.addAllBtn}>
                              <Feather name="shopping-cart" size={13} color="#FFF" />
                              <Text style={styles.addAllText}>Tout ajouter</Text>
                            </TouchableOpacity>
                          </View>

                          {editableItems.map((item, i) => {
                            const isAdded = added.has(i);
                            return (
                              <View key={i} style={[styles.productCard, isAdded && styles.productCardDone]}>
                                <Text style={styles.productEmoji}>
                                  {getEmoji(item.editedNom, item.emoji)}
                                </Text>

                                <View style={styles.productInfo}>
                                  <TextInput
                                    style={[styles.editNom, isAdded && styles.editDone]}
                                    value={item.editedNom}
                                    onChangeText={(v) => updateItem(i, "editedNom", v)}
                                    editable={!isAdded}
                                    selectTextOnFocus
                                    returnKeyType="done"
                                  />
                                  <View style={styles.prixRow}>
                                    <TextInput
                                      style={[styles.editPrix, isAdded && styles.editDone]}
                                      value={item.editedPrix}
                                      onChangeText={(v) => updateItem(i, "editedPrix", v.replace(/[^0-9]/g, ""))}
                                      editable={!isAdded}
                                      keyboardType="numeric"
                                      selectTextOnFocus
                                      returnKeyType="done"
                                    />
                                    <Text style={styles.fcfaLabel}> FCFA</Text>
                                  </View>
                                </View>

                                <View style={styles.cardActions}>
                                  {!isAdded && (
                                    <TouchableOpacity
                                      style={styles.removeBtn}
                                      onPress={() => handleRemove(i)}
                                      activeOpacity={0.8}
                                    >
                                      <Feather name="trash-2" size={14} color="#e53935" />
                                    </TouchableOpacity>
                                  )}
                                  <TouchableOpacity
                                    style={[styles.addBtn, isAdded && styles.addBtnDone]}
                                    onPress={() => !isAdded && handleAdd(item, i)}
                                    activeOpacity={isAdded ? 1 : 0.8}
                                  >
                                    <Feather name={isAdded ? "check" : "plus"} size={16} color="#FFF" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}

                          {/* Ajouter un ingrédient manquant */}
                          <View style={styles.customItemWrap}>
                            <Text style={styles.customItemLabel}>+ Ajouter un ingrédient manquant</Text>
                            <View style={styles.customItemRow}>
                              <TextInput
                                style={styles.customNomInput}
                                value={customNom}
                                onChangeText={setCustomNom}
                                placeholder="Nom de l'ingrédient"
                                placeholderTextColor="#bbb"
                                returnKeyType="next"
                              />
                              <TextInput
                                style={styles.customPrixInput}
                                value={customPrix}
                                onChangeText={(v) => setCustomPrix(v.replace(/[^0-9]/g, ""))}
                                placeholder="Prix"
                                placeholderTextColor="#bbb"
                                keyboardType="numeric"
                                returnKeyType="done"
                                onSubmitEditing={handleAddCustom}
                              />
                              <TouchableOpacity
                                style={[
                                  styles.customAddBtn,
                                  (!customNom.trim() || !customPrix) && styles.customAddBtnDisabled,
                                ]}
                                onPress={handleAddCustom}
                                disabled={!customNom.trim() || !customPrix}
                                activeOpacity={0.8}
                              >
                                <Feather name="plus" size={18} color="#FFF" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <TouchableOpacity style={styles.newSearchBtn} onPress={reset}>
                            <Feather name="refresh-cw" size={13} color="#888" />
                            <Text style={styles.newSearchText}>Nouvelle recherche</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {editableItems.length === 0 && (
                        <Text style={styles.emptyText}>Aucun article trouvé. Essaie d'être plus précis.</Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Barre de saisie */}
            <View style={styles.inputRow}>
              {isRecording && (
                <View style={styles.recordingHint}>
                  <Text style={styles.recordingHintText}>Enregistrement… appuie à nouveau pour terminer</Text>
                </View>
              )}

              <View style={styles.inputControls}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder={isRecording ? "Enregistrement en cours…" : "Ex : Je veux faire du ndolé…"}
                  placeholderTextColor={isRecording ? Colors.primary : "#aaa"}
                  multiline
                  maxLength={200}
                  returnKeyType="send"
                  onSubmitEditing={askAI}
                  editable={!loading && !micBusy}
                />

                <TouchableOpacity
                  style={[styles.micBtn, isRecording && styles.micBtnActive]}
                  onPress={handleMicPress}
                  disabled={loading || transcribing}
                  activeOpacity={0.8}
                >
                  {transcribing ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : isRecording ? (
                    <View style={styles.waveContainer}>
                      <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave1 }] }]} />
                      <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave2 }] }]} />
                      <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave3 }] }]} />
                    </View>
                  ) : (
                    <Feather name="mic" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || loading || micBusy) && styles.sendBtnDisabled]}
                  onPress={askAI}
                  disabled={!input.trim() || loading || micBusy}
                  activeOpacity={0.8}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Feather name="send" size={18} color="#FFF" />
                  }
                </TouchableOpacity>
              </View>
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
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  sheetSub:   { fontSize: 12, color: "#888", marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#eee", alignItems: "center", justifyContent: "center",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#999" },
  tabTextActive: { color: Colors.primary },
  historyBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },
  historyBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFF" },

  scrollArea: { maxHeight: 440 },

  // History list
  historyList: { gap: 8 },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  historyCardMain: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  historyCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  historyQuery: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    flex: 1,
  },
  historyDate: {
    fontSize: 11,
    color: "#bbb",
    flexShrink: 0,
  },
  historyMeta: {
    fontSize: 12,
    color: "#888",
  },
  historyDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#F0F0F0",
  },

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
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
  },
  productsTitle: { fontSize: 13, fontWeight: "700", color: "#333" },
  productsHint:  { fontSize: 11, color: "#999", marginTop: 2 },
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
    borderWidth: 1, borderColor: "transparent",
  },
  productCardDone: {
    borderColor: "#4CAF5040",
    backgroundColor: "#F9FFF9",
  },
  productEmoji: { fontSize: 28 },
  productInfo:  { flex: 1, gap: 4 },

  editNom: {
    fontSize: 14, fontWeight: "700", color: "#111",
    borderBottomWidth: 1, borderBottomColor: Colors.primary + "60",
    paddingVertical: 2, paddingHorizontal: 0,
  },
  prixRow: { flexDirection: "row", alignItems: "center" },
  editPrix: {
    fontSize: 13, color: Colors.primary, fontWeight: "600",
    borderBottomWidth: 1, borderBottomColor: Colors.primary + "40",
    paddingVertical: 1, paddingHorizontal: 0,
    minWidth: 60,
  },
  fcfaLabel: { fontSize: 12, color: "#999" },

  editDone: {
    color: "#aaa",
    borderBottomColor: "transparent",
  },

  cardActions: {
    flexDirection: "column", alignItems: "center", gap: 6,
  },
  removeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#FFEBEE", alignItems: "center", justifyContent: "center",
  },
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

  customItemWrap: {
    borderWidth: 1, borderColor: Colors.primary + "30",
    borderRadius: 16, padding: 12, gap: 8,
    backgroundColor: "#F6FDF6",
  },
  customItemLabel: {
    fontSize: 12, fontWeight: "700", color: Colors.primary,
  },
  customItemRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  customNomInput: {
    flex: 1, backgroundColor: "#FFF", borderRadius: 10,
    borderWidth: 1, borderColor: "#E0E0E0",
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, color: "#111",
  },
  customPrixInput: {
    width: 80, backgroundColor: "#FFF", borderRadius: 10,
    borderWidth: 1, borderColor: "#E0E0E0",
    paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 13, color: "#111", textAlign: "center",
  },
  customAddBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  customAddBtnDisabled: { backgroundColor: "#ccc" },

  emptyText: { textAlign: "center", color: "#999", fontSize: 13, padding: 16 },

  successWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + "18",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  successEmoji: { fontSize: 36 },
  successTitle: {
    fontSize: 22, fontWeight: "800", color: "#111",
    textAlign: "center",
  },
  successSub: {
    fontSize: 14, color: "#888", textAlign: "center",
    lineHeight: 20, paddingHorizontal: 16,
  },
  successCartBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 28, marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  successCartText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

  inputRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  recordingHint: {
    marginBottom: 8,
    alignItems: "center",
  },
  recordingHintText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
  inputControls: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1, backgroundColor: "#F0F0F0", borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: "#111", maxHeight: 100,
  },

  micBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#F0F0F0",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary + "50",
  },
  micBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 20,
  },
  waveBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#FFF",
  },

  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#ccc" },
});
