import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

export default function RegisterScreen() {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    motDePasse: "",
    confirmMotDePasse: "",
    codeParrain: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (!form.nom || !form.prenom || !form.telephone || !form.adresse || !form.motDePasse) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (form.motDePasse !== form.confirmMotDePasse) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (form.motDePasse.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        adresse: form.adresse,
        motDePasse: form.motDePasse,
        codeParrain: form.codeParrain.trim() || undefined,
      });
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.message || "Erreur lors de la création du compte");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Créer un compte</Text>
        </View>

        <Text style={styles.subtitle}>Rejoignez Makit+ pour commander vos produits du marché</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Dupont"
                placeholderTextColor={Colors.gray}
                value={form.nom}
                onChangeText={(v) => update("nom", v)}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean"
                placeholderTextColor={Colors.gray}
                value={form.prenom}
                onChangeText={(v) => update("prenom", v)}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Numéro de téléphone *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 0612345678"
              placeholderTextColor={Colors.gray}
              value={form.telephone}
              onChangeText={(v) => update("telephone", v)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Adresse de livraison *</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre adresse (quartier, rue...)"
              placeholderTextColor={Colors.gray}
              value={form.adresse}
              onChangeText={(v) => update("adresse", v)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 caractères"
              placeholderTextColor={Colors.gray}
              value={form.motDePasse}
              onChangeText={(v) => update("motDePasse", v)}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmer le mot de passe *</Text>
            <TextInput
              style={styles.input}
              placeholder="Répétez le mot de passe"
              placeholderTextColor={Colors.gray}
              value={form.confirmMotDePasse}
              onChangeText={(v) => update("confirmMotDePasse", v)}
              secureTextEntry
            />
          </View>

          {/* Code parrain optionnel */}
          <View style={styles.promoSection}>
            <View style={styles.promoHeader}>
              <Text style={{ fontSize: 18 }}>🎁</Text>
              <Text style={styles.promoTitle}>Vous avez un code parrain ?</Text>
            </View>
            <TextInput
              style={styles.promoInput}
              placeholder="Ex: HENRY123 (optionnel)"
              placeholderTextColor={Colors.gray}
              value={form.codeParrain}
              onChangeText={(v) => update("codeParrain", v.toUpperCase())}
              autoCapitalize="characters"
            />
            <Text style={styles.promoHint}>Entrez le code d'un ami pour lui offrir 1 point</Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text style={styles.loginText}>
              Déjà un compte ? <Text style={styles.loginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.red,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.red,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  form: {
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
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
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  loginLink: {
    alignItems: "center",
    paddingTop: 8,
  },
  loginText: {
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
  loginBold: {
    color: Colors.primary,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  promoSection: {
    backgroundColor: "#F1FDF3",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryDark,
    fontFamily: "Inter_700Bold",
  },
  promoInput: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  promoHint: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: "Inter_400Regular",
  },
});
